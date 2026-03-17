import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function ImportTxtButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const { data, error } = await supabase.functions.invoke("import-prompts-txt", {
        body: { text },
      });

      if (error) throw error;

      const updated = data.updated?.length ?? 0;
      const notFound = data.notFound?.length ?? 0;

      queryClient.invalidateQueries({ queryKey: ["prompts"] });

      toast.success(`Импорт завершён: ${updated} обновлено`, {
        description: notFound > 0
          ? `Не найдено: ${notFound}`
          : undefined,
      });

      if (notFound > 0) {
        console.log("Not found sections:", data.notFound);
      }
    } catch (err: any) {
      toast.error("Ошибка импорта", { description: err.message });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".txt"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {loading ? "Импорт..." : "Импорт TXT"}
      </Button>
    </>
  );
}
