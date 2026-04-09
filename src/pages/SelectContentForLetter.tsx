import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type LeadMagnetRow = {
  id: string;
  letter_id: string;
  content_type: string;
  title: string;
  payload: any;
  sort_order: number;
};

export default function SelectContentForLetter() {
  const { letterId } = useParams<{ letterId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("pending");
  const [items, setItems] = useState<LeadMagnetRow[]>([]);
  const [letterTitle, setLetterTitle] = useState<string>("");
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (!letterId) return;
    let cancelled = false;

    const tick = async () => {
      const { data: letter } = await supabase
        .from("email_letters")
        .select("title, content_options_status, content_source_id")
        .eq("id", letterId)
        .single();
      if (cancelled || !letter) return;
      setLetterTitle((letter as any).title || "");
      const st = (letter as any).content_options_status || "pending";
      setStatus(st);
      if ((letter as any).content_source_id) {
        navigate(`/email-builder/${letterId}`, { replace: true });
        return;
      }
      if (st === "ready") {
        const { data: rows } = await supabase
          .from("email_letter_lead_magnets" as any)
          .select("*")
          .eq("letter_id", letterId)
          .order("sort_order", { ascending: true });
        if (!cancelled) setItems((rows as any) || []);
      }
    };

    tick();
    const iv = setInterval(() => {
      if (status !== "ready" && status !== "error") tick();
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [letterId, status, navigate]);

  const handlePick = async (row: LeadMagnetRow) => {
    if (!letterId) return;
    setSelecting(row.id);
    try {
      const { error } = await supabase
        .from("email_letters")
        .update({
          content_source_id: row.id,
          letter_theme_title: row.title,
        } as any)
        .eq("id", letterId);
      if (error) throw error;
      navigate(`/email-builder/${letterId}`);
    } catch (e: any) {
      toast.error(e.message);
      setSelecting(null);
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate("/email-builder")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> К списку писем
      </Button>
      <h1 className="text-2xl font-semibold mb-1">Выберите вариант для письма</h1>
      <p className="text-sm text-muted-foreground mb-6">{letterTitle}</p>

      {status !== "ready" && status !== "error" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Генерируем варианты…
        </div>
      )}

      {status === "error" && (
        <div className="text-sm text-destructive py-12 text-center">
          Не удалось сгенерировать варианты. Попробуйте создать письмо заново.
        </div>
      )}

      {status === "ready" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((row) => (
            <Card
              key={row.id}
              className="p-5 cursor-pointer hover:border-primary transition"
              onClick={() => !selecting && handlePick(row)}
            >
              <div className="font-medium mb-2">{row.title}</div>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                {Object.entries(row.payload || {})
                  .filter(([k]) => k !== "title")
                  .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
                  .join("\n")}
              </div>
              {selecting === row.id && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Открываем…
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
