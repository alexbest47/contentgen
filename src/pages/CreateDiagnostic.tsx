import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateDiagnostic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [programId, setProgramId] = useState(searchParams.get("programId") || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [promptId, setPromptId] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: programs } = useQuery({
    queryKey: ["paid_programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*").order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: allTags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
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

  const effectivePromptId = promptId || testPrompts?.[0]?.id || "";

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    if (!programId) {
      toast.error("Выберите программу");
      return;
    }
    if (!title.trim()) {
      toast.error("Укажите название");
      return;
    }

    setSaving(true);
    try {
      const tagNames = (allTags || [])
        .filter((t) => selectedTags.includes(t.id))
        .map((t) => t.name);

      // Create diagnostic record with draft status
      const { data: diag, error: diagErr } = await supabase
        .from("diagnostics")
        .insert({
          program_id: programId,
          name: title,
          description: description || null,
          audience_tags: tagNames,
          prompt_id: effectivePromptId || null,
          status: "draft",
          created_by: user!.id,
        } as any)
        .select("id")
        .single();

      if (diagErr) throw new Error(diagErr.message);
      const newDiagId = (diag as any).id;

      // Create offer
      const { data: offer } = await supabase
        .from("offers")
        .insert({
          program_id: programId,
          offer_type: "diagnostic" as any,
          title,
          description: description || null,
          created_by: user!.id,
        })
        .select("id")
        .single();

      // Link offer to diagnostic
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
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
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
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название диагностики"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Подробное описание..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Теги аудитории</Label>
              {allTags && allTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Нет тегов.{" "}
                  <a href="/tags" className="underline text-primary">
                    Создать теги
                  </a>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Промпт для генерации</Label>
              {testPrompts && testPrompts.length > 0 ? (
                <Select value={effectivePromptId} onValueChange={setPromptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите промпт" />
                  </SelectTrigger>
                  <SelectContent>
                    {testPrompts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Нет активных промптов категории «Генерация теста».
                </p>
              )}
            </div>

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
