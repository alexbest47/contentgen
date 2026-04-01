import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Talentsy KB configuration (public Supabase project — anon key is in frontend JS)
// ---------------------------------------------------------------------------
const KB_SUPABASE_URL = "https://lbpebpdmerhvbefrbgbv.supabase.co";
const KB_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxicGVicGRtZXJodmJlZnJiZ2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzY3ODUsImV4cCI6MjA5MDQ1Mjc4NX0.N-P4Axx-GKrlcCraeDVUOh3TDre-JLEZHX4IQw3u5Xo";

// ---------------------------------------------------------------------------
// TipTap / ProseMirror JSON → plain text
// ---------------------------------------------------------------------------
function tiptapToText(node: any): string {
  if (!node) return "";

  // Text leaf node
  if (node.type === "text") return node.text ?? "";

  // Hard break → newline
  if (node.type === "hardBreak") return "\n";

  // Recurse into children
  const children: string = (node.content ?? [])
    .map((child: any) => tiptapToText(child))
    .join("");

  // Block-level nodes get a trailing newline
  const blockTypes = new Set([
    "paragraph",
    "heading",
    "blockquote",
    "listItem",
    "codeBlock",
    "horizontalRule",
  ]);

  if (blockTypes.has(node.type)) return children + "\n";

  // Bullet / ordered lists — just pass through
  if (node.type === "bulletList" || node.type === "orderedList") return children;

  // Top-level doc
  if (node.type === "doc") return children;

  // Fallback: return children as-is
  return children;
}

// ---------------------------------------------------------------------------
// Detect URL type
// ---------------------------------------------------------------------------
type UrlType =
  | { kind: "google_docs"; docId: string }
  | { kind: "talentsy_kb"; token: string };

function detectUrl(url: string): UrlType {
  // Google Docs: https://docs.google.com/document/d/{id}/...
  const gdocMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (gdocMatch) return { kind: "google_docs", docId: gdocMatch[1] };

  // Talentsy KB: any domain + /share/tk_{token}
  // Works with: talentsy-kb.vercel.app, kb.talentsy.ru, etc.
  const kbMatch = url.match(/\/share\/(tk_[a-zA-Z0-9_]+)/);
  if (kbMatch) return { kind: "talentsy_kb", token: kbMatch[1] };

  throw new Error(
    "Unsupported URL format. Supported: Google Docs (docs.google.com/document/d/...) and Talentsy KB (.../share/tk_...)"
  );
}

// ---------------------------------------------------------------------------
// Fetch from Google Docs
// ---------------------------------------------------------------------------
async function fetchGoogleDoc(docId: string): Promise<string> {
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
  const response = await fetch(exportUrl);
  if (!response.ok) {
    const errText = await response.text();
    console.error("Google Docs fetch error:", response.status, errText);
    throw new Error(
      `Failed to fetch Google Doc (status ${response.status}). Make sure the document is shared publicly.`
    );
  }
  return response.text();
}

// ---------------------------------------------------------------------------
// Fetch from Talentsy KB
// ---------------------------------------------------------------------------
async function fetchTalentsyKB(token: string): Promise<string> {
  const apiUrl =
    `${KB_SUPABASE_URL}/rest/v1/documents?select=title,content&share_token=eq.${token}&access=eq.external`;

  const response = await fetch(apiUrl, {
    headers: {
      apikey: KB_ANON_KEY,
      Authorization: `Bearer ${KB_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Talentsy KB fetch error:", response.status, errText);
    throw new Error(
      `Failed to fetch Talentsy KB document (status ${response.status}).`
    );
  }

  const rows = await response.json();
  if (!rows || rows.length === 0) {
    throw new Error("Document not found or not shared publicly.");
  }

  const doc = rows[0];
  const content = doc.content;

  if (!content) {
    throw new Error("Document has no content.");
  }

  // content is a TipTap/ProseMirror JSON document
  const plainText = tiptapToText(content).trim();

  if (!plainText) {
    throw new Error("Document content is empty after parsing.");
  }

  return plainText;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("url is required");

    const parsed = detectUrl(url);
    let text: string;

    switch (parsed.kind) {
      case "google_docs":
        console.log("Fetching Google Doc:", parsed.docId);
        text = await fetchGoogleDoc(parsed.docId);
        break;
      case "talentsy_kb":
        console.log("Fetching Talentsy KB:", parsed.token);
        text = await fetchTalentsyKB(parsed.token);
        break;
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-google-doc error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
