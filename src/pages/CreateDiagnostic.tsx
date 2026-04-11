import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/offer/ImageUploadField";
import { uploadOfferImage } from "@/lib/uploadOfferImage";

export default function CreateDiagnostic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [programId, setProgramId] = useState(searchParams.get("programId") || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [docUrl, setDocUrl] = useState("");
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: programs } = useQuery({
    queryKey: ["paid_programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*").order("title");
      if (error) throw error;
      return data;
    },
  });


  const { data: testPrompts } = useQuery({
    queryKey: ["prompts", "test_generation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("category", "test_generation")
        .eq("is_active", true)
        .order("step_order");
      if (error) throw error;
      return data;
    },
  });


  const handleSave = async () => {
    if (!programId) { toast.error("Выберите программу"); return; }
    if (!title.trim()) { toast.error("Укажите название"); return; }
    if (!description.trim()) { toast.error("Укажите описание"); return; }
    if (!imageFile) { toast.error("Загрузите изображение"); return; }
    if (!docUrl.trim()) { toast.error("Укажите ссылку на описание"); return; }

    setSaving(true);
    try {
      const imageUrl = await uploadOfferImage(imageFile, user!.id);

      const { data: diag, error: diagErr } = await supabase
        .from("diagnostics")
        .insert({
          program_id: programId,
          name: title,
          description,
          doc_url: docUrl || null,
          prompt_id: null,
          status: "draft",
          created_by: user!.id,
          image_url: imageUrl,
        } as any)
        .select("id")
        .single();

      if (diagErr) throw new Error(diagErr.message);
      const newDiagId = (diag as any).id;

      const { data: offer } = await supabase
        .from("offers")
        .insert({
          program_id: programId,
          offer_type: "diagnostic" as any,
          title,
          description,
          doc_url: docUrl || null,
          created_by: user!.id,
          image_url: imageUrl,
        } as any)
        .select("id")
        .single();

      if (offer) {
        await supabase
          .from("diagnostics")
          .update({ offer_id: offer.id } as any)
          .eq("id", newDiagId);
      }

      toast.success("Диагностика создана");
      navigate(`/diagnostics/${newDiagId}`);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error("Ошибка при сохранении: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Создать диагностику</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новая диагностика</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Программа</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите программу" />
                </SelectTrigger>
                <SelectContent>
                  {programs?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название диагностики" required />
            </div>

            <div className="space-y-2">
              <Label>Описание *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание диагностики"
                required
              />
            </div>

            <ImageUploadField imageFile={imageFile} setImageFile={setImageFile} />

            <div className="space-y-2">
              <Label>Ссылка на описание</Label>
              <Input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="Google Doc или Talentsy KB ссылка" required />
              <p className="text-xs text-muted-foreground">Поддерживаются ссылки на Google Docs и Talentsy KB (talentsy-kb.vercel.app/share/tk_...)</p>
            </div>


            {testPrompts && testPrompts.length > 0 ? (
              <div className="space-y-2">
                <Label>Промпты для генерации ({testPrompts.length} шаг{testPrompts.length > 1 ? "а" : ""})</Label>
                <div className="space-y-1">
                  {testPrompts.map((p, i) => (
                    <p key={p.id} className="text-sm text-muted-foreground">
                      Шаг {i + 1}: {p.name}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Нет активных промптов категории «Генерация теста».
              </p>
            )}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Создать
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
