import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Copy, Download, Plus } from "lucide-react";
import { toast } from "sonner";

type ViewState = "form" | "generating" | "result" | "error";

interface GenerationStep {
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}

export default function CreateDiagnostic() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [programId, setProgramId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [promptId, setPromptId] = useState("");
  const [imagePromptId, setImagePromptId] = useState("");

  // Generation state
  const [viewState, setViewState] = useState<ViewState>("form");
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [resultJson, setResultJson] = useState<any>(null);
  const [diagnosticId, setDiagnosticId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Queries
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

  const { data: imagePrompts } = useQuery({
    queryKey: ["prompts", "image_prompts_for_diagnostic"],
    queryFn: async () => {
      // Look for image-related prompts that could serve as imagen template
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .in("category", ["image_carousel", "image_post"])
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Auto-select first prompt
  const effectivePromptId = promptId || testPrompts?.[0]?.id || "";

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
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
    if (!programId) {
      toast.error("Выберите программу");
      return;
    }
    if (!effectivePromptId) {
      toast.error("Не найден активный промпт для генерации теста. Перейдите в Управление промптами и активируйте нужный промпт.");
      return;
    }

    const tagNames = (allTags || [])
      .filter((t) => selectedTags.includes(t.id))
      .map((t) => t.name);

    // Initialize steps
    setSteps([
      { label: "Генерация структуры теста", status: "pending" },
      { label: "Создание изображений", status: "pending" },
      { label: "Сборка финального файла", status: "pending" },
      { label: "Готово", status: "pending" },
    ]);
    setViewState("generating");
    setFailedImages(0);
    setErrorMessage("");

    try {
      // Step 0: Create diagnostic record
      const { data: diag, error: diagErr } = await supabase
        .from("diagnostics")
        .insert({
          program_id: programId,
          name: title,
          description: description || null,
          audience_tags: tagNames,
          prompt_id: effectivePromptId,
          status: "generating",
          created_by: user!.id,
        } as any)
        .select("id")
        .single();

      if (diagErr) throw new Error(diagErr.message);
      const newDiagId = (diag as any).id;
      setDiagnosticId(newDiagId);

      // Also create offer
      await supabase.from("offers").insert({
        program_id: programId,
        offer_type: "diagnostic" as any,
        title,
        description: description || null,
        created_by: user!.id,
      });

      if (selectedTags.length > 0 && diag) {
        // Save tags to offer_tags if needed (skip for now, offer created above)
      }

      // Step 1: Generate quiz JSON
      updateStep(0, { status: "active" });

      const { data: quizData, error: quizErr } = await supabase.functions.invoke(
        "generate-diagnostic",
        {
          body: {
            diagnostic_id: newDiagId,
            program_id: programId,
            name: title,
            description: description || "",
            audience_tags: tagNames,
            prompt_id: effectivePromptId,
          },
        }
      );

      if (quizErr || quizData?.error) {
        throw new Error(quizData?.error || quizErr?.message || "Ошибка генерации");
      }

      updateStep(0, { status: "done" });

      const quizJson = quizData.quiz_json;
      const placeholders: string[] = quizData.image_placeholders || [];

      // Step 2: Generate images
      updateStep(1, { status: "active", detail: `0 из ${placeholders.length}` });

      let currentJson = JSON.stringify(quizJson);
      let failed = 0;

      // Get image prompt template if selected
      let imageTemplate: string | undefined;
      if (imagePromptId) {
        const selectedImagePrompt = imagePrompts?.find((p) => p.id === imagePromptId);
        imageTemplate = selectedImagePrompt?.user_prompt_template;
      }

      for (let i = 0; i < placeholders.length; i++) {
        updateStep(1, {
          status: "active",
          detail: `${i + 1} из ${placeholders.length}`,
        });

        try {
          const { data: imgData, error: imgErr } = await supabase.functions.invoke(
            "generate-diagnostic-images",
            {
              body: {
                diagnostic_id: newDiagId,
                image_description: placeholders[i],
                placeholder_index: i,
                image_prompt_template: imageTemplate,
              },
            }
          );

          if (imgErr || imgData?.error) {
            console.error("Image error:", imgData?.error || imgErr);
            failed++;
            continue;
          }

          if (imgData?.image_url) {
            // Replace this specific placeholder in JSON
            const placeholder = `{{IMAGE:${placeholders[i]}}}`;
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

      // Step 3: Assemble final JSON
      updateStep(2, { status: "active" });

      // Replace any remaining placeholders with null
      currentJson = currentJson.replace(/\{\{IMAGE:[^}]+\}\}/g, "null");
      const finalJson = JSON.parse(currentJson);

      // Save to database
      await supabase
        .from("diagnostics")
        .update({ quiz_json: finalJson, status: "ready" } as any)
        .eq("id", newDiagId);

      updateStep(2, { status: "done" });
      updateStep(3, { status: "done" });

      setResultJson(finalJson);
      setViewState("result");
      toast.success("Диагностика успешно создана!");
    } catch (err: any) {
      console.error("Generation error:", err);
      setErrorMessage(err.message || "Неизвестная ошибка");
      setViewState("error");
      toast.error("Ошибка при генерации: " + (err.message || ""));
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(resultJson, null, 2));
    toast.success("JSON скопирован в буфер обмена");
  };

  const downloadJson = () => {
    const slug = title.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "_").replace(/_+$/, "");
    const blob = new Blob([JSON.stringify(resultJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "diagnostic"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setViewState("form");
    setTitle("");
    setDescription("");
    setSelectedTags([]);
    setResultJson(null);
    setDiagnosticId(null);
    setSteps([]);
    setFailedImages(0);
    setErrorMessage("");
  };

  // ===== RENDER =====

  if (viewState === "generating") {
    const totalSteps = steps.length;
    const doneCount = steps.filter((s) => s.status === "done").length;
    const progress = Math.round((doneCount / totalSteps) * 100);

    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">Генерация диагностики</h1>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <Progress value={progress} className="h-3" />
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  {step.status === "done" ? (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  ) : step.status === "active" ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                  ) : step.status === "error" ? (
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0" />
                  )}
                  <span
                    className={
                      step.status === "active"
                        ? "font-medium text-foreground"
                        : step.status === "done"
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60"
                    }
                  >
                    Шаг {i + 1} из {totalSteps} — {step.label}
                    {step.detail && ` (${step.detail})`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">Ошибка генерации</h1>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Не удалось сгенерировать тест</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleGenerate}>Попробовать ещё раз</Button>
              <Button variant="outline" onClick={resetForm}>
                Вернуться к форме
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewState === "result") {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Диагностика создана</h1>
        </div>

        {failedImages > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="pt-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-sm">
                {failedImages} изображени{failedImages === 1 ? "е" : failedImages < 5 ? "я" : "й"} не
                удалось сгенерировать — вы можете добавить их вручную.
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
              {JSON.stringify(resultJson, null, 2)}
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
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Создать ещё
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== FORM VIEW =====
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
              handleGenerate();
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
                <Select
                  value={effectivePromptId}
                  onValueChange={setPromptId}
                >
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
                <p className="text-sm text-destructive">
                  Не найден активный промпт для генерации теста.{" "}
                  <a href="/prompts" className="underline">
                    Перейдите в Управление промптами
                  </a>{" "}
                  и активируйте нужный промпт.
                </p>
              )}
            </div>

            {imagePrompts && imagePrompts.length > 0 && (
              <div className="space-y-2">
                <Label>Промпт для изображений (опционально)</Label>
                <Select value={imagePromptId} onValueChange={setImagePromptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Без дополнительного шаблона" />
                  </SelectTrigger>
                  <SelectContent>
                    {imagePrompts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!effectivePromptId}
            >
              Создать
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
