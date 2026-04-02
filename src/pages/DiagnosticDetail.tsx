import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Copy, Download, Play, Plus, Save, Square,
} from "lucide-react";
import { toast } from "sonner";

interface GenerationStep {
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}

const ACTIVE_STATUSES = ["generating", "quiz_generated", "generating_card_prompt", "card_prompt_generated", "generating_images", "images_pending", "images_done"];

export default function DiagnosticDetail() {
  const { diagnosticId } = useParams<{ diagnosticId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Draft editing state
  const [editName, setEditName] = useState("");
  const [editDocUrl, setEditDocUrl] = useState("");
  const [editProgramId, setEditProgramId] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [draftInitialized, setDraftInitialized] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [stopping, setStopping] = useState(false);

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
    setEditDocUrl((diagnostic as any).doc_url || "");
    setEditProgramId(diagnostic.program_id || "");
    setEditTags((diagnostic.audience_tags as string[]) || []);
    setDraftInitialized(true);
  }

  // Derive steps from diagnostic status
  // Steps 2a (card prompt) and 2b (images) now run in parallel
  const updateStepsFromStatus = useCallback((status: string, progress: any, cardPrompt?: string | null) => {
    const s: GenerationStep[] = [
      { label: "Генерация структуры теста", status: "pending" },
      { label: "Генерация промпта карты", status: "pending" },
      { label: "Создание изображений", status: "pending" },
      { label: "Готово", status: "pending" },
    ];

    if (status === "generating") {
      s[0].status = "active";
    } else if (status === "quiz_generated") {
      s[0].status = "done";
      s[1].status = "active";
      s[2].status = "active";
    } else if (status === "generating_card_prompt") {
      s[0].status = "done";
      s[1].status = "active";
      s[2].status = "active";
    } else if (status === "card_prompt_generated" || status === "images_pending" || status === "generating_images") {
      s[0].status = "done";
      // Card prompt: done if already saved, otherwise still active (parallel)
      s[1].status = cardPrompt ? "done" : "active";
      s[2].status = "active";
      if (progress?.total_images) {
        const done = progress.completed_images || 0;
        s[2].detail = `${done} из ${progress.total_images}`;
      }
    } else if (status === "images_done") {
      // Images finished but card prompt still generating
      s[0].status = "done";
      s[1].status = cardPrompt ? "done" : "active";
      s[2].status = "done";
      if (progress?.failed_images > 0) {
        s[2].detail = `${progress.failed_images} не удалось`;
      }
      if (cardPrompt) {
        s[3].status = "done";
      }
    } else if (status === "ready") {
      s[0].status = "done";
      s[1].status = cardPrompt ? "done" : "active";
      s[2].status = "done";
      if (progress?.failed_images > 0) {
        s[2].detail = `${progress.failed_images} не удалось`;
      }
      s[3].status = "done";
    } else if (status === "error") {
      const isStopped = progress?.error === "Остановлено пользователем";
      const stoppedAt = progress?.stopped_at;

      if (stoppedAt === "generating" || (!stoppedAt && !progress?.total_images)) {
        s[0].status = "error";
        s[0].detail = isStopped ? "Остановлено" : undefined;
      } else if (stoppedAt === "quiz_generated" || stoppedAt === "generating_card_prompt") {
        s[0].status = "done";
        s[1].status = "error";
        s[1].detail = isStopped ? "Остановлено" : undefined;
      } else {
        s[0].status = "done";
        s[1].status = cardPrompt ? "done" : "error";
        s[2].status = "error";
        if (progress?.total_images) {
          const done = progress.completed_images || 0;
          s[2].detail = isStopped
            ? `Остановлено (${done} из ${progress.total_images})`
            : `${done} из ${progress.total_images}`;
        } else {
          s[2].detail = isStopped ? "Остановлено" : undefined;
        }
      }
    }

    setSteps(s);
  }, []);

  // Polling logic — only monitors status, no frontend image generation
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      const { data } = await supabase
        .from("diagnostics")
        .select("status, generation_progress, quiz_json, card_prompt")
        .eq("id", diagnosticId!)
        .single();

      if (!data) return;

      const progress = data.generation_progress as any;
      updateStepsFromStatus(data.status, progress, (data as any).card_prompt);

      // Update React Query cache
      queryClient.setQueryData(["diagnostic", diagnosticId], (old: any) =>
        old ? {
          ...old,
          status: data.status,
          generation_progress: data.generation_progress,
          quiz_json: data.quiz_json,
          card_prompt: (data as any).card_prompt,
        } : old
      );

      // Stop polling when pipeline finishes
      if (!ACTIVE_STATUSES.includes(data.status)) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        queryClient.invalidateQueries({ queryKey: ["diagnostic", diagnosticId] });
        if (data.status === "ready") {
          toast.success("Диагностика сгенерирована!");
        } else if (data.status === "error") {
          toast.error("Ошибка при генерации");
        }
      }
    }, 5000);
  }, [diagnosticId, queryClient, updateStepsFromStatus]);

  // Auto-start polling if status is active on page load
  useEffect(() => {
    if (!diagnostic) return;
    const progress = diagnostic.generation_progress as any;

    if (ACTIVE_STATUSES.includes(diagnostic.status)) {
      updateStepsFromStatus(diagnostic.status, progress, diagnostic.card_prompt);
      startPolling();
    } else if (diagnostic.status === "error") {
      updateStepsFromStatus(diagnostic.status, progress, diagnostic.card_prompt);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [diagnostic?.status]);

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
          doc_url: editDocUrl || null,
          program_id: editProgramId,
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

  const handleGenerate = async () => {
    if (!diagnostic || isGenerating) return;

    await supabase
      .from("diagnostics")
      .update({ status: "generating", generation_progress: null, quiz_json: null, card_prompt: null, thank_you_json: null } as any)
      .eq("id", diagnostic.id);

    updateStepsFromStatus("generating", null);

    const { data, error } = await supabase.functions.invoke("enqueue-task", {
      body: {
        function_name: "run-diagnostic-pipeline",
        payload: {
          diagnostic_id: diagnostic.id,
          program_id: diagnostic.program_id,
          name: diagnostic.name,
          description: "",
          audience_tags: diagnostic.audience_tags || [],
        },
        display_title: `Диагностика: ${diagnostic.name}`,
        lane: "claude",
        target_url: `/diagnostics/${diagnostic.id}`,
      },
    });

    if (error) {
      toast.error("Не удалось добавить в очередь");
      return;
    }

    toast.success("Задача добавлена в очередь");
    startPolling();
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      const { data: current } = await supabase
        .from("diagnostics")
        .select("status, generation_progress")
        .eq("id", diagnosticId!)
        .single();
      const currentProgress = current?.generation_progress as any;
      
      const newProgress: any = {
        error: "Остановлено пользователем",
        stopped_at: current?.status || "generating",
      };
      if (currentProgress?.total_images) {
        newProgress.total_images = currentProgress.total_images;
        newProgress.completed_images = currentProgress.completed_images || 0;
      }

      await supabase
        .from("diagnostics")
        .update({ status: "error", generation_progress: newProgress } as any)
        .eq("id", diagnosticId!);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      updateStepsFromStatus("error", newProgress);
      queryClient.invalidateQueries({ queryKey: ["diagnostic", diagnosticId] });
      toast.info("Генерация остановлена");
    } finally {
      setStopping(false);
    }
  };

  const quizJson = diagnostic?.quiz_json;
  const cardPrompt = (diagnostic as any)?.card_prompt;

  // Retry only image generation for stuck diagnostics
  const handleRetryImages = async () => {
    if (!diagnostic || !quizJson) return;

    // Extract placeholders from quiz_json
    const quizString = JSON.stringify(quizJson);
    const placeholderRegex = /\{\{IMAGE:PROMPT=([\s\S]*?)\}\}/g;
    const placeholders: string[] = [];
    let m;
    while ((m = placeholderRegex.exec(quizString)) !== null) {
      placeholders.push(m[1]);
    }

    if (placeholders.length === 0) {
      toast.info("Нет изображений для генерации");
      return;
    }

    // Update status to generating_images
    await supabase
      .from("diagnostics")
      .update({
        status: "generating_images",
        generation_progress: { total_images: placeholders.length, completed_images: 0 },
      } as any)
      .eq("id", diagnostic.id);

    updateStepsFromStatus("generating_images", { total_images: placeholders.length, completed_images: 0 }, cardPrompt);

    // Trigger image chain
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    fetch(`https://${projectId}.supabase.co/functions/v1/process-diagnostic-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        diagnostic_id: diagnostic.id,
        image_index: 0,
        placeholders,
      }),
    }).catch((e) => console.error("Retry image chain failed:", e));

    startPolling();
    toast.info(`Запущена генерация ${placeholders.length} изображений`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} скопирован`);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
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

  const isReady = diagnostic.status === "ready" && (quizJson || cardPrompt);
  const isDraft = diagnostic.status === "draft";
  const isGenerating = ACTIVE_STATUSES.includes(diagnostic.status);
  const isError = diagnostic.status === "error";
  const progress = diagnostic.generation_progress as any;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/diagnostics")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex-1">{isDraft ? editName || diagnostic.name : diagnostic.name}</h1>
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
              <Label>Ссылка на Google Doc</Label>
              <Input value={editDocUrl} onChange={(e) => setEditDocUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
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
              <p className="text-sm text-muted-foreground">Нет активных промптов категории «Генерация теста».</p>
            )}

            <div className="flex gap-3">
              <Button onClick={handleSaveDraft} disabled={savingDraft}>
                {savingDraft ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить изменения
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating} variant="secondary">
                <Play className="h-4 w-4 mr-2" />
                Сгенерировать
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-draft info table */}
      {!isDraft && !isGenerating && (
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
                <Button onClick={handleGenerate} size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  {isReady ? "Перегенерировать" : "Сгенерировать"}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}

      {/* Generation progress */}
      {steps.length > 0 && (isGenerating || steps.some(s => s.status !== "pending")) && (
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

            {/* Progress bar for images */}
            {progress?.total_images > 0 && isGenerating && (
              <div className="pt-2">
                <Progress
                  value={((progress.completed_images || 0) / progress.total_images) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.completed_images || 0} из {progress.total_images} изображений
                </p>
              </div>
            )}

            {isGenerating && (
              <Button variant="destructive" size="sm" onClick={handleStop} disabled={stopping}>
                {stopping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Square className="h-4 w-4 mr-2" />}
                Остановить
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {isError && (
        <Card className={progress?.error === "Остановлено пользователем" ? "border-muted-foreground/30 bg-muted/30" : "border-destructive/50 bg-destructive/5"}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-3">
              {progress?.error === "Остановлено пользователем" ? (
                <Square className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm">{progress?.error || "Неизвестная ошибка"}</p>
                {typeof progress?.error === "string" && progress.error.includes("кредитов") && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Пополните баланс OpenRouter и попробуйте снова.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleGenerate}>
                <Play className="h-4 w-4 mr-2" />
                {progress?.error === "Остановлено пользователем" ? "Перезапустить" : "Попробовать снова"}
              </Button>
              {quizJson && (progress?.completed_images === 0 || !progress?.completed_images) && (
                <Button variant="outline" size="sm" onClick={handleRetryImages}>
                  <Play className="h-4 w-4 mr-2" />
                  Только изображения
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed images warning */}
      {isReady && progress?.failed_images > 0 && (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
            <p className="text-sm">
              {progress.failed_images} изображени{progress.failed_images === 1 ? "е" : progress.failed_images < 5 ? "я" : "й"} не удалось сгенерировать.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Block 1: Quiz JSON */}
      {quizJson && (
        <Card>
          <CardHeader>
            <CardTitle>JSON теста</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="bg-muted p-4 rounded-md text-xs max-h-96 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(quizJson, null, 2)}
            </pre>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => copyToClipboard(JSON.stringify(quizJson, null, 2), "JSON теста")} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Скопировать
              </Button>
              <Button onClick={() => downloadFile(JSON.stringify(quizJson, null, 2), "quiz.json")} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Скачать JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Block 2: Diagnostic Card Prompt */}
      {cardPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>Промпт диагностической карты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="bg-muted p-4 rounded-md text-xs max-h-96 overflow-auto whitespace-pre-wrap">
              {cardPrompt}
            </pre>
            <div className="flex gap-2">
              <Button onClick={() => copyToClipboard(cardPrompt, "Промпт")} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Скопировать
              </Button>
              <Button onClick={() => downloadFile(cardPrompt, "card-prompt.json")} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Скачать JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isReady && (
        <Button onClick={() => navigate("/create-diagnostic")}>
          <Plus className="h-4 w-4 mr-2" />
          Создать ещё
        </Button>
      )}
    </div>
  );
}
