import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * analyze-competitor-email
 *
 * Called by process-queue. Takes a competitor email,
 * loads the prompt from DB (competitor-email-analysis),
 * sends to Claude for structured analysis,
 * stores the result in competitor_email_analyses.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let emailId: string | undefined;

  try {
    const body = await req.json();
    emailId = body.email_id;

    if (!emailId) {
      return new Response(JSON.stringify({ error: "email_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch email from DB
    const { data: email, error: fetchError } = await supabase
      .from("competitor_emails")
      .select("*, competitors(name)")
      .eq("id", emailId)
      .single();

    if (fetchError || !email) {
      throw new Error(`Email not found: ${emailId}`);
    }

    // Update status
    await supabase
      .from("competitor_emails")
      .update({ status: "analyzing" })
      .eq("id", emailId);

    // 2. If email body is missing, try to fetch it from Resend API
    let htmlBody = email.html_body;
    let textBody = email.text_body;

    if (!htmlBody && !textBody && email.resend_email_id && resendApiKey) {
      console.log("Email body missing, fetching from Resend API...");
      const emailRes = await fetch(
        `https://api.resend.com/emails/${email.resend_email_id}`,
        { headers: { Authorization: `Bearer ${resendApiKey}` } }
      );

      if (emailRes.ok) {
        const fullEmail = await emailRes.json();
        htmlBody = fullEmail.html || null;
        textBody = fullEmail.text || null;

        // Update the email record with fetched body
        if (htmlBody || textBody) {
          await supabase
            .from("competitor_emails")
            .update({
              html_body: htmlBody,
              text_body: textBody,
              status: "analyzing",
            })
            .eq("id", emailId);
          console.log("Fetched and stored email body, html length:", htmlBody?.length || 0);
        }
      } else {
        console.error("Failed to fetch email body:", emailRes.status);
      }
    }

    // 3. Prepare email text for analysis
    const emailText = textBody || stripHtmlTags(htmlBody || "");

    if (!emailText || emailText.length < 20) {
      await supabase
        .from("competitor_emails")
        .update({ status: "error", error_message: "Пустое тело письма — попробуйте переанализировать позже" })
        .eq("id", emailId);

      return new Response(JSON.stringify({ error: "Empty email body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Load prompt from DB
    const { data: promptRecord } = await supabase
      .from("prompts")
      .select("system_prompt, user_prompt_template, model")
      .eq("slug", "competitor-email-analysis")
      .eq("is_active", true)
      .single();

    const competitorName = email.competitors?.name || "Неизвестный";

    let systemPrompt: string;
    let userMessage: string;
    let model: string;

    if (promptRecord) {
      systemPrompt = promptRecord.system_prompt;
      model = promptRecord.model || "claude-sonnet-4-20250514";

      // Replace placeholders in user_prompt_template
      userMessage = (promptRecord.user_prompt_template || "")
        .replace("{{competitor_name}}", competitorName)
        .replace("{{from_address}}", email.from_address)
        .replace("{{subject}}", email.subject)
        .replace("{{received_at}}", email.received_at)
        .replace("{{email_text}}", emailText.substring(0, 15000));
    } else {
      // Fallback if prompt not found in DB
      console.warn("Prompt not found in DB, using hardcoded fallback");
      model = "claude-sonnet-4-20250514";
      systemPrompt = `Ты — аналитик конкурентных рассылок. Проанализируй email и верни JSON с полями: competitor_name, email_type, summary, offers[], target_audience, tone, key_messages[]. Каждый оффер: type, name, description, cta_text, price, discount, deadline, urgency_trigger. Верни ТОЛЬКО валидный JSON.`;
      userMessage = `Конкурент: ${competitorName}\nОтправитель: ${email.from_address}\nТема: ${email.subject}\n\nТекст:\n${emailText.substring(0, 15000)}`;
    }

    // 5. Send to Claude for analysis
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: userMessage }],
        system: systemPrompt,
      }),
    });

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text();
      throw new Error(`Claude API error ${claudeRes.status}: ${errBody}`);
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text || "";

    // 6. Parse JSON from Claude response
    let analysis: any;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1].trim());
      } else {
        const braceMatch = rawText.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          analysis = JSON.parse(braceMatch[0]);
        } else {
          throw new Error("Could not parse JSON from Claude response");
        }
      }
    }

    // 7. Store analysis in DB
    const { error: analysisError } = await supabase
      .from("competitor_email_analyses")
      .insert({
        email_id: emailId,
        email_type: analysis.email_type || null,
        summary: analysis.summary || null,
        offers: analysis.offers || [],
        products: analysis.products || [],
        promotions: analysis.promotions || [],
        cta_list: analysis.cta_list || [],
        urgency_triggers: analysis.urgency_triggers || [],
        target_audience: analysis.target_audience || null,
        tone: analysis.tone || null,
        key_messages: analysis.key_messages || [],
        raw_analysis: analysis,
      });

    if (analysisError) {
      throw new Error(`Analysis insert error: ${analysisError.message}`);
    }

    // 8. Update email status + competitor name from analysis
    const updates: any = { status: "analyzed" };

    // If competitor wasn't matched but Claude identified one, try to auto-match
    if (!email.competitor_id && analysis.competitor_name) {
      const { data: matchedCompetitor } = await supabase
        .from("competitors")
        .select("id")
        .ilike("name", `%${analysis.competitor_name}%`)
        .limit(1)
        .maybeSingle();

      if (matchedCompetitor) {
        updates.competitor_id = matchedCompetitor.id;
      }
    }

    await supabase
      .from("competitor_emails")
      .update(updates)
      .eq("id", emailId);

    console.log("Analysis complete for email:", emailId);

    return new Response(
      JSON.stringify({ success: true, email_id: emailId, email_type: analysis.email_type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Analysis error:", e);

    if (emailId) {
      await supabase
        .from("competitor_emails")
        .update({ status: "error", error_message: e.message })
        .eq("id", emailId);
    }

    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
