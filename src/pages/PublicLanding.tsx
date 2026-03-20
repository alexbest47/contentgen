import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function PublicLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error: err } = await supabase
        .from("pdf_materials")
        .select("landing_html, background_image_url, html_content, landing_headline, title")
        .eq("landing_slug", slug)
        .single();
      if (err || !data) {
        setError(true);
        setLoading(false);
        return;
      }
      let landingHtml = data.landing_html || "";
      if (data.background_image_url) {
        landingHtml = landingHtml.replace(/BACKGROUND_IMAGE_URL/g, data.background_image_url);
      }
      setHtml(landingHtml);
      setTitle(data.title || "");
      setHtmlContent(data.html_content || "");
      setLoading(false);
    })();
  }, [slug]);

  // Attach download handler after rendering
  useEffect(() => {
    if (!html || !htmlContent) return;
    const timer = setTimeout(() => {
      const btn = document.getElementById("download-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          const blob = new Blob([htmlContent], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${title || "material"}.html`;
          a.click();
          URL.revokeObjectURL(url);
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [html, htmlContent, title]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !html) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Страница не найдена
      </div>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
