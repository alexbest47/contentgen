import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Copy, Download, Play, Plus,
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

  const { data: imagePrompts } = useQuery({
    queryKey: ["prompts", "image_prompts_for_diagnostic"],
    queryFn: async () => {
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

    const promptId = diagnostic.prompt_id;
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
      // Update status to generating
      await supabase
        .from("diagnostics")
        .update({ status: "generating" } as any)
        .eq("id", diagnostic.id);

      // Step 1: Generate quiz JSON
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

      // Step 2: Generate images
      updateStep(1, { status: "active", detail: `0 из ${placeholders.length}` });

      let currentJson = JSON.stringify(quizJson);
      let failed = 0;

      // Get first image prompt template if available
      const imageTemplate = imagePrompts?.[0]?.user_prompt_template;

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

      // Step 3: Assemble
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
  const isGeneratingStatus = diagnostic.status === "generating";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{diagnostic.name}</h1>
        <Badge variant={isReady ? "default" : "secondary"} className="ml-2">
          {diagnostic.status}
        </Badge>
      </div>

      {/* Info table */}
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
