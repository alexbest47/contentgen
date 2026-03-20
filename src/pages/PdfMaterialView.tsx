import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { useRef } from "react";

export default function PdfMaterialView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!material) {
    return <div className="text-center py-12 text-muted-foreground">Материал не найден</div>;
  }

  const iframeSrc = `data:text/html;charset=utf-8,${encodeURIComponent(material.html_content || "")}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/pdf-materials")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Назад
        </Button>
        <h1 className="text-xl font-bold flex-1">{material.title}</h1>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Скачать PDF
        </Button>
      </div>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className="w-full border rounded-md"
        style={{ minHeight: "80vh" }}
        title="PDF Preview"
      />
    </div>
  );
}
