import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("url is required");

    // Extract document ID from various Google Docs URL formats
    const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) throw new Error("Invalid Google Docs URL");

    const docId = match[1];
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    const response = await fetch(exportUrl);
    if (!response.ok) {
      const errText = await response.text();
      console.error("Google Docs fetch error:", response.status, errText);
      throw new Error(`Failed to fetch document (status ${response.status}). Make sure the document is shared publicly.`);
    }

    const text = await response.text();

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-google-doc error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
