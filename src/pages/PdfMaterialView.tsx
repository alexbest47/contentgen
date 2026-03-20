import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import { useRef, useCallback } from "react";

async function embedImagesInHtml(html: string, imageUrl?: string | null): Promise<string> {
  if (!imageUrl) return html;
  try {
    const resp = await fetch(imageUrl);
    if (!resp.ok) return html;
    const blob = await resp.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    return html.split(imageUrl).join(base64);
  } catch {
    return html;
  }
}

const printFixCss = `<style>
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
body { padding: 32px 48px; box-sizing: border-box; }
.cover { page-break-after: avoid !important; max-height: 100vh !important; overflow: hidden !important; padding: 32px 48px !important; box-sizing: border-box !important; }
body > .cover:first-child { margin: -32px -48px; width: calc(100% + 96px); }
@media print { body { margin: 0; padding: 32px 48px; } .cover { page-break-after: avoid !important; } body > .cover:first-child { margin: -32px -48px; width: calc(100% + 96px); } }
</style>`;

function injectPrintStyles(html: string): string {
  if (html.includes("</head>")) {
    return html.replace("</head>", printFixCss + "</head>");
  }
  return printFixCss + html;
}

function downloadHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PdfMaterialView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);

  const { data: material, isLoading } = useQuery({
    queryKey: ["pdf_material", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_materials")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleDownloadLanding = useCallback(async () => {
    if (!material) return;
    let html = material.landing_html || "";
    if (material.background_image_url) {
      html = html
        .replace(/BACKGROUND_IMAGE_URL/g, material.background_image_url)
        .replace(/CHARACTER_IMAGE_URL/g, material.background_image_url);
    }
    // Embed background image as base64 for offline viewing
    const finalHtml = await embedImagesInHtml(html, material.background_image_url);
    downloadHtml(finalHtml, `${material.title || "landing"}-landing.html`);
  }, [material]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!material) {
    return <div className="text-center py-12 text-muted-foreground">Материал не найден</div>;
  }

  const landingScrollFix = `<style>html, body { overflow: auto !important; height: auto !important; }</style>`;
  let landingHtml = material.landing_html || "";
  if (material.background_image_url) {
    landingHtml = landingHtml
      .replace(/BACKGROUND_IMAGE_URL/g, material.background_image_url)
      .replace(/CHARACTER_IMAGE_URL/g, material.background_image_url);
  }
  landingHtml = landingScrollFix + landingHtml;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/pdf-materials")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Назад
        </Button>
        <h1 className="text-xl font-bold flex-1">{material.title}</h1>
      </div>

      <Tabs defaultValue="landing" className="w-full">
        <TabsList>
          <TabsTrigger value="landing">Лендинг</TabsTrigger>
          <TabsTrigger value="pdf">PDF-материал</TabsTrigger>
        </TabsList>

        <TabsContent value="landing" className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadLanding}
            >
              <Download className="mr-1 h-4 w-4" /> Экспорт HTML лендинга
            </Button>
          </div>
          <iframe
            srcDoc={landingHtml}
            className="w-full border rounded-md"
            style={{ height: "80vh" }}
            title="Landing Preview"
          />
        </TabsContent>

        <TabsContent value="pdf" className="space-y-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => pdfIframeRef.current?.contentWindow?.print()}
            >
              <Printer className="mr-1 h-4 w-4" /> Скачать PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadHtml(injectPrintStyles(material.html_content || ""), `${material.title || "material"}.html`)}
            >
              <Download className="mr-1 h-4 w-4" /> Экспорт HTML
            </Button>
          </div>
          <iframe
            ref={pdfIframeRef}
            srcDoc={injectPrintStyles(material.html_content || "")}
            className="w-full border rounded-md"
            style={{ minHeight: "80vh" }}
            title="PDF Preview"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
