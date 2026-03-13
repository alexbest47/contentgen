import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Copy, Download, Play, Plus, Save,
} from "lucide-react";
import { toast } from "sonner";

interface GenerationStep {
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}

export default function DiagnosticDetail() {
  const { diagnosticId } = useParams<{ diagnosticId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [generating, setGenerating] = useState(false);
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [failedImages, setFailedImages] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  // Draft editing state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editProgramId, setEditProgramId] = useState("");
  const [editPromptId, setEditPromptId] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [draftInitialized, setDraftInitialized] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const { data: diagnostic, isLoading } = useQuery({
    queryKey: ["diagnostic", diagnosticId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostics")
        .select("*")
        .eq("id", diagnosticId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!diagnosticId,
  });

  // Initialize draft edit fields once
  if (diagnostic && diagnostic.status === "draft" && !draftInitialized) {
    setEditName(diagnostic.name || "");
    setEditDescription(diagnostic.description || "");
    setEditProgramId(diagnostic.program_id || "");
    setEditPromptId(diagnostic.prompt_id || "");
    setEditTags((diagnostic.audience_tags as string[]) || []);
    setDraftInitialized(true);
  }

  const { data: program } = useQuery({
    queryKey: ["program", diagnostic?.program_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paid_programs")
        .select("title")
        .eq("id", diagnostic!.program_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!diagnostic?.program_id,
  });

  const { data: programs } = useQuery({
    queryKey: ["paid_programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*").order("title");
      if (error) throw error;
      return data;
    },
    enabled: diagnostic?.status === "draft",
  });

  const { data: allTags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: diagnostic?.status === "draft",
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
    enabled: diagnostic?.status === "draft",
  });


  const toggleTag = (tagName: string) => {
    setEditTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleSaveDraft = async () => {
    if (!editName.trim()) {
      toast.error("Укажите название");
      return;
    }
    if (!editProgramId) {
      toast.error("Выберите программу");
      return;
    }
    setSavingDraft(true);
    try {
      const { error } = await supabase
        .from("diagnostics")
        .update({
          name: editName.trim(),
          description: editDescription || null,
          program_id: editProgramId,
          prompt_id: editPromptId || null,
          audience_tags: editTags,
        } as any)
        .eq("id", diagnosticId!);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["diagnostic", diagnosticId] });
      queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
      toast.success("Изменения сохранены");
    } catch (err: any) {
      toast.error("Ошибка: " + (err.message || ""));
    } finally {
      setSavingDraft(false);
    }
  };

  const updateStep = useCallback(
    (index: number, update: Partial<GenerationStep>) => {
      setSteps((prev) =>
        prev.map((s, i) => (i === index ? { ...s, ...update } : s))
      );
    },
    []
  );

  const handleGenerate = async () => {
    if (!diagnostic) return;

    const promptId = diagnostic.status === "draft" ? (editPromptId || diagnostic.prompt_id) : diagnostic.prompt_id;
    if (!promptId) {
      toast.error("Не задан промпт для генерации");
      return;
    }

    setSteps([
      { label: "Генерация структуры теста", status: "pending" },
      { label: "Создание изображений", status: "pending" },
      { label: "Сборка финального файла", status: "pending" },
      { label: "Готово", status: "pending" },
    ]);
    setGenerating(true);
    setFailedImages(0);
    setErrorMessage("");
    setShowError(false);

    try {
      await supabase
        .from("diagnostics")
        .update({ status: "generating" } as any)
        .eq("id", diagnostic.id);

      updateStep(0, { status: "active" });

      const { data: quizData, error: quizErr } = await supabase.functions.invoke(
        "generate-diagnostic",
        {
          body: {
            diagnostic_id: diagnostic.id,
            program_id: diagnostic.program_id,
            name: diagnostic.name,
            description: diagnostic.description || "",
            audience_tags: diagnostic.audience_tags || [],
            prompt_id: promptId,
          },
        }
      );

      if (quizErr || quizData?.error) {
        throw new Error(quizData?.error || quizErr?.message || "Ошибка генерации");
      }

      updateStep(0, { status: "done" });

      const quizJson = quizData.quiz_json;
      const placeholders: string[] = quizData.image_placeholders || [];

      updateStep(1, { status: "active", detail: `0 из ${placeholders.length}` });

      let currentJson = JSON.stringify(quizJson);
      let failed = 0;

      for (let i = 0; i < placeholders.length; i++) {
        updateStep(1, { status: "active", detail: `${i + 1} из ${placeholders.length}` });

        try {
          const { data: imgData, error: imgErr } = await supabase.functions.invoke(
            "generate-diagnostic-images",
            {
              body: {
                diagnostic_id: diagnostic.id,
                image_description: placeholders[i],
                placeholder_index: i,
              },
            }
          );

          if (imgErr || imgData?.error) {
            console.error("Image error:", imgData?.error || imgErr);
            failed++;
            continue;
          }

          if (imgData?.image_url) {
            const placeholder = `{{IMAGE:PROMPT=${placeholders[i]}}}`;
            currentJson = currentJson.split(placeholder).join(imgData.image_url);
          } else {
            failed++;
          }
        } catch (e) {
          console.error("Image generation error:", e);
          failed++;
        }
      }

      updateStep(1, { status: "done", detail: failed > 0 ? `${failed} не удалось` : undefined });
      setFailedImages(failed);

      updateStep(2, { status: "active" });

      currentJson = currentJson.replace(/\{\{IMAGE:[^}]+\}\}/g, "null");
      const finalJson = JSON.parse(currentJson);

      await supabase
        .from("diagnostics")
        .update({ quiz_json: finalJson, status: "ready" } as any)
        .eq("id", diagnostic.id);

      updateStep(2, { status: "done" });
      updateStep(3, { status: "done" });

      queryClient.invalidateQueries({ queryKey: ["diagnostic", diagnosticId] });
      toast.success("Диагностика сгенерирована!");
    } catch (err: any) {
      console.error("Generation error:", err);
      setErrorMessage(err.message || "Неизвестная ошибка");
      setShowError(true);

      await supabase
        .from("diagnostics")
        .update({ status: "error" } as any)
        .eq("id", diagnostic.id);

      toast.error("Ошибка при генерации");
    } finally {
      setGenerating(false);
    }
  };

  const quizJson = diagnostic?.quiz_json;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(quizJson, null, 2));
    toast.success("JSON скопирован");
  };

  const downloadJson = () => {
    const slug = (diagnostic?.name || "diagnostic").toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "_").replace(/_+$/, "");
    const blob = new Blob([JSON.stringify(quizJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!diagnostic) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Диагностика не найдена</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Назад</Button>
      </div>
    );
  }

  const isReady = diagnostic.status === "ready" && quizJson;
  const isDraft = diagnostic.status === "draft";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/diagnostics")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{isDraft ? editName || diagnostic.name : diagnostic.name}</h1>
        <Badge variant={isReady ? "default" : "secondary"} className="ml-2">
          {diagnostic.status}
        </Badge>
      </div>

      {/* Draft edit form */}
      {isDraft && (
        <Card>
          <CardHeader>
            <CardTitle>Редактировать черновик</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Программа</Label>
              <Select value={editProgramId} onValueChange={setEditProgramId}>
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
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Название диагностики" />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Подробное описание..." className="min-h-[100px]" />
            </div>

            <div className="space-y-2">
              <Label>Теги аудитории</Label>
              {allTags && allTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={editTags.includes(tag.name) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Нет тегов.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Промпт для генерации</Label>
              {testPrompts && testPrompts.length > 0 ? (
                <Select value={editPromptId || testPrompts[0]?.id || ""} onValueChange={setEditPromptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите промпт" />
                  </SelectTrigger>
                  <SelectContent>
                    {testPrompts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">Нет активных промптов категории «Генерация теста».</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSaveDraft} disabled={savingDraft}>
                {savingDraft ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить изменения
              </Button>
              <Button onClick={handleGenerate} disabled={generating} variant="secondary">
                <Play className="h-4 w-4 mr-2" />
                Сгенерировать
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-draft info table */}
      {!isDraft && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Программа</TableHead>
              <TableHead>Название диагностики</TableHead>
              <TableHead className="text-right">Действие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">{program?.title || "—"}</TableCell>
              <TableCell>{diagnostic.name}</TableCell>
              <TableCell className="text-right">
                {!generating && !showError && (
                  <Button onClick={handleGenerate} size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    {isReady ? "Перегенерировать" : "Сгенерировать"}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}

      {/* Generation progress */}
      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Прогресс генерации</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {step.status === "pending" && (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                {step.status === "active" && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                )}
                {step.status === "done" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                )}
                {step.status === "error" && (
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                )}
                <span className={step.status === "pending" ? "text-muted-foreground" : ""}>
                  {step.label}
                </span>
                {step.detail && (
                  <span className="text-sm text-muted-foreground">({step.detail})</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {showError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm">{errorMessage || "Неизвестная ошибка"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerate}>
              <Play className="h-4 w-4 mr-2" />
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {isReady && (
        <>
          {failedImages > 0 && (
            <Card className="border-accent/50 bg-accent/5">
              <CardContent className="pt-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
                <p className="text-sm">
                  {failedImages} изображени{failedImages === 1 ? "е" : failedImages < 5 ? "я" : "й"} не удалось сгенерировать.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Результат</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="bg-muted p-4 rounded-md text-xs max-h-96 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(quizJson, null, 2)}
              </pre>
              <div className="flex flex-wrap gap-3">
                <Button onClick={copyJson} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Скопировать JSON
                </Button>
                <Button onClick={downloadJson} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать JSON
                </Button>
                <Button onClick={() => navigate("/create-diagnostic")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать ещё
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
