import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * inbound-competitor-email
 *
 * Receives Resend webhook (email.received), verifies signature,
 * fetches full email body via Resend API, stores in competitor_emails,
 * auto-matches competitor, enqueues analysis task.
 */

// --- Svix webhook signature verification ---
async function verifyWebhook(
  rawBody: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Check timestamp (reject if older than 5 minutes)
  const ts = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) return false;

  // Decode secret (strip "whsec_" prefix, base64 decode)
  const secretBytes = Uint8Array.from(
    atob(secret.replace("whsec_", "")),
    (c) => c.charCodeAt(0)
  );

  const msg = `${svixId}.${svixTimestamp}.${rawBody}`;
  const msgBytes = new TextEncoder().encode(msg);

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBytes = await crypto.subtle.sign("HMAC", key, msgBytes);
  const expected = `v1,${btoa(String.fromCharCode(...new Uint8Array(sigBytes)))}`;

  // Svix may send multiple signatures separated by space
  const signatures = svixSignature.split(" ");
  return signatures.some((sig) => sig === expected);
}

// --- Extract email address from "Name <email>" format ---
function extractEmail(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : raw.toLowerCase().trim();
}

serve(async (req) => {
  // No CORS needed for webhook — only Resend calls this
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();

  // 1. Verify webhook signature
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (webhookSecret) {
    const valid = await verifyWebhook(rawBody, req.headers, webhookSecret);
    if (!valid) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log("Webhook received:", payload.type, payload.data?.subject);

  if (payload.type !== "email.received") {
    // Acknowledge but ignore non-inbound events
    return new Response(JSON.stringify({ ok: true, skipped: payload.type }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const emailData = payload.data;
  const fromAddress = extractEmail(emailData.from || "");
  const toAddress = emailData.to?.[0] || "";
  const subject = emailData.subject || "(без темы)";
  const resendEmailId = emailData.email_id;

  try {
    // 2. Fetch full email body via Resend Receiving API
    //    Webhook payload only contains metadata (from, to, subject, email_id, etc.)
    //    The actual HTML/text body must be fetched separately
    let htmlBody: string | null = null;
    let textBody: string | null = null;

    if (resendEmailId) {
      console.log("Fetching email body from Resend Receiving API for:", resendEmailId);
      try {
        const emailRes = await fetch(
          `https://api.resend.com/emails/receiving/${resendEmailId}`,
          { headers: { Authorization: `Bearer ${resendApiKey}` } }
        );
        if (emailRes.ok) {
          const fullEmail = await emailRes.json();
          htmlBody = fullEmail.html || null;
          textBody = fullEmail.text || null;
          console.log("Resend Receiving API success — html:", htmlBody?.length || 0, "text:", textBody?.length || 0);
        } else {
          const errText = await emailRes.text();
          console.error("Resend Receiving API error:", emailRes.status, errText);
        }
      } catch (fetchErr) {
        console.error("Resend Receiving API fetch failed:", fetchErr);
      }
    } else {
      console.warn("No resend email_id in webhook payload, cannot fetch body");
    }

    // 3. Auto-match competitor by sender email
    const { data: competitors } = await supabase
      .from("competitors")
      .select("id, sender_emails")
      .eq("is_active", true);

    let competitorId: string | null = null;
    if (competitors) {
      for (const c of competitors) {
        if (
          c.sender_emails?.some(
            (e: string) => e.toLowerCase() === fromAddress
          )
        ) {
          competitorId = c.id;
          break;
        }
      }
    }

    // 4. Store email in DB
    const { data: inserted, error: insertError } = await supabase
      .from("competitor_emails")
      .insert({
        competitor_id: competitorId,
        resend_email_id: resendEmailId,
        from_address: fromAddress,
        to_address: toAddress,
        subject,
        html_body: htmlBody,
        text_body: textBody,
        headers: emailData.headers || {},
        status: (htmlBody || textBody) ? "fetched" : "new",
        received_at: emailData.created_at || new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Stored competitor email:", inserted.id);

    // 5. Email saved — user will trigger analysis manually from UI

    return new Response(
      JSON.stringify({ ok: true, email_id: inserted.id, competitor_id: competitorId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Inbound email error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
