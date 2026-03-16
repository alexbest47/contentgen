import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  FolderSearch, Play, ChevronDown, ChevronRight, FileText,
  Copy, CheckCircle2, XCircle, Loader2, Clock, Download, Mic,
  BrainCircuit, Eye, Trash2, SkipForward,
} from "lucide-react";
import { ElapsedTime } from "@/components/case/ElapsedTime";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "В очереди", variant: "secondary" },
  processing: { label: "Обработка", variant: "default" },
  completed: { label: "Готово", variant: "outline" },
  error: { label: "Ошибка", variant: "destructive" },
  downloading: { label: "Скачивание...", variant: "default" },
  transcribing: { label: "Транскрибация...", variant: "default" },
  classifying: { label: "Классификация...", variant: "default" },
  classified: { label: "Классифицировано", variant: "outline" },
  skipped: { label: "Пропущен (дубль)", variant: "secondary" },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  processing: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4 text-primary" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
  downloading: <Download className="h-4 w-4 animate-pulse" />,
  transcribing: <Mic className="h-4 w-4 animate-pulse" />,
  classifying: <BrainCircuit className="h-4 w-4 animate-pulse" />,
  classified: <CheckCircle2 className="h-4 w-4 text-primary" />,
  skipped: <SkipForward className="h-4 w-4 text-muted-foreground" />,
};

export default function CaseManagement() {
  const [folderUrl, setFolderUrl] = useState("");
  const [openJobs, setOpenJobs] = useState<Set<string>>(new Set());
  const [transcriptDialog, setTranscriptDialog] = useState<{ name: string; text: string } | null>(null);
  const [jsonDialog, setJsonDialog] = useState<{ name: string; json: any } | null>(null);
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["case-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: allFiles } = useQuery({
    queryKey: ["case-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_files")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: classifications } = useQuery({
    queryKey: ["case-classifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_classifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string;
        file_id: string;
        job_id: string;
        file_name: string;
        source_url: string | null;
        classification_json: any;
        created_at: string;
      }>;
    },
    refetchInterval: 5000,
  });

  const startMutation = useMutation({
    mutationFn: async (url: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/scan-case-folder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ folder_url: url }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Failed to start scan");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Сканирование запущено. Найдено файлов: ${data.files_found}`);
      setFolderUrl("");
      queryClient.invalidateQueries({ queryKey: ["case-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["case-files"] });
    },
    onError: (err: Error) => {
      toast.error(`Ошибка: ${err.message}`);
    },
  });

  const toggleJob = (jobId: string) => {
    setOpenJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const getJobFiles = (jobId: string) =>
    allFiles?.filter((f) => f.job_id === jobId) ?? [];

  const getJobProgress = (jobId: string) => {
    const files = getJobFiles(jobId);
    if (files.length === 0) return { total: 0, done: 0, percent: 0 };
    const done = files.filter((f) => ["classified", "completed", "error", "skipped"].includes(f.status)).length;
    return { total: files.length, done, percent: Math.round((done / files.length) * 100) };
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Текст скопирован");
  };

  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from("case_jobs").delete().eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Задание удалено");
      queryClient.invalidateQueries({ queryKey: ["case-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["case-files"] });
      queryClient.invalidateQueries({ queryKey: ["case-classifications"] });
    },
    onError: (err: Error) => toast.error(`Ошибка удаления: ${err.message}`),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Управление кейсами</h1>
        <p className="text-muted-foreground">
          Транскрибация и классификация видео из публичных папок Яндекс.Диска
        </p>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Задачи</TabsTrigger>
          <TabsTrigger value="results">
            Результаты классификации
            {classifications && classifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">{classifications.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderSearch className="h-5 w-5" />
                  Новая задача
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Вставьте публичную ссылку на папку Яндекс.Диска"
                    value={folderUrl}
                    onChange={(e) => setFolderUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => startMutation.mutate(folderUrl)}
                    disabled={!folderUrl.trim() || startMutation.isPending}
                  >
                    {startMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Начать обработку
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Задачи</h2>

              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
                </div>
              )}

              {jobs?.length === 0 && !isLoading && (
                <p className="text-muted-foreground">Задач пока нет</p>
              )}

              {jobs?.map((job) => {
                const progress = getJobProgress(job.id);
                const files = getJobFiles(job.id);
                const isOpen = openJobs.has(job.id);
                const statusInfo = STATUS_MAP[job.status] ?? STATUS_MAP.pending;

                return (
                  <Card key={job.id}>
                    <Collapsible open={isOpen} onOpenChange={() => toggleJob(job.id)}>
                      <CollapsibleTrigger className="w-full">
                        <CardContent className="flex items-center gap-4 py-4">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          )}
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium truncate">{job.folder_url}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(job.created_at).toLocaleString("ru-RU")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {progress.total > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {progress.done}/{progress.total}
                              </span>
                            )}
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Удалить задание?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Будут удалены все файлы и результаты классификации этого задания. Это действие необратимо.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(job.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-6 pb-4 space-y-3">
                          {job.error_message && (
                            <p className="text-sm text-destructive">{job.error_message}</p>
                          )}

                          {progress.total > 0 && (
                            <Progress value={progress.percent} className="h-2" />
                          )}

                          {files.length === 0 && (
                            <p className="text-sm text-muted-foreground">Файлы ещё не загружены</p>
                          )}

                          {files.map((file) => {
                            const fStatus = STATUS_MAP[file.status] ?? STATUS_MAP.pending;
                            const isActive = file.status === "downloading" || file.status === "transcribing" || file.status === "classifying";
                            return (
                              <div
                                key={file.id}
                                className="flex items-center gap-3 rounded-md border p-3"
                              >
                                {STATUS_ICON[file.status] ?? STATUS_ICON.pending}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.file_name}</p>
                                  {file.error_message && (
                                    <p className="text-xs text-destructive truncate">
                                      {file.error_message}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2">
                                    {file.file_size != null && (
                                      <p className="text-xs text-muted-foreground">
                                        {(file.file_size / 1024 / 1024).toFixed(1)} МБ
                                      </p>
                                    )}
                                    {isActive && file.status_updated_at && (
                                      <ElapsedTime since={file.status_updated_at} />
                                    )}
                                  </div>
                                </div>
                                {isActive ? (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                                      <div className="h-full w-full bg-primary animate-pulse rounded-full" />
                                    </div>
                                    <Badge variant={fStatus.variant}>{fStatus.label}</Badge>
                                  </div>
                                ) : (
                                  <Badge variant={fStatus.variant} className="shrink-0">
                                    {fStatus.label}
                                  </Badge>
                                )}
                                {(file.status === "completed" || file.status === "classified") && file.transcript_text && (
                                  <div className="flex gap-1 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTranscriptDialog({
                                          name: file.file_name,
                                          text: file.transcript_text!,
                                        });
                                      }}
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyText(file.transcript_text!);
                                      }}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardContent className="pt-6">
              {!classifications || classifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Результатов классификации пока нет
                </p>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Файл</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Студент</TableHead>
                        <TableHead>Продукты</TableHead>
                        <TableHead>Тон</TableHead>
                        <TableHead>Качество</TableHead>
                        <TableHead>Теги</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classifications.map((c) => {
                        const j = c.classification_json || {};
                        return (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div className="max-w-[200px]">
                                {c.source_url ? (
                                  <a
                                    href={c.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-primary hover:underline truncate block"
                                  >
                                    {c.file_name}
                                  </a>
                                ) : (
                                  <span className="text-sm font-medium truncate block">{c.file_name}</span>
                                )}
                                {j.summary && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {j.summary}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {j.video_type && (
                                <Badge variant="outline">{j.video_type}</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {j.student_name || "—"}
                                {j.student_age && <span className="text-muted-foreground">, {j.student_age}</span>}
                              </div>
                              {j.student_background && (
                                <p className="text-xs text-muted-foreground">{j.student_background}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[180px]">
                                {(j.products || []).map((p: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{j.emotional_tone || "—"}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{j.content_quality || "—"}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {(j.tags || []).slice(0, 5).map((t: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {t}
                                  </Badge>
                                ))}
                                {(j.tags || []).length > 5 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{j.tags.length - 5}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(c.created_at).toLocaleDateString("ru-RU")}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setJsonDialog({ name: c.file_name, json: j })}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transcript dialog */}
      <Dialog open={!!transcriptDialog} onOpenChange={() => setTranscriptDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {transcriptDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => transcriptDialog && copyText(transcriptDialog.text)}
            >
              <Copy className="h-4 w-4" /> Копировать текст
            </Button>
            <div className="whitespace-pre-wrap text-sm leading-relaxed rounded-md bg-muted p-4">
              {transcriptDialog?.text}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Classification JSON dialog */}
      <Dialog open={!!jsonDialog} onOpenChange={() => setJsonDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              Классификация: {jsonDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => jsonDialog && copyText(JSON.stringify(jsonDialog.json, null, 2))}
            >
              <Copy className="h-4 w-4" /> Копировать JSON
            </Button>
            {jsonDialog?.json && (
              <div className="space-y-4">
                {jsonDialog.json.quote && (
                  <blockquote className="border-l-4 border-primary pl-4 italic text-sm">
                    «{jsonDialog.json.quote}»
                  </blockquote>
                )}
                {jsonDialog.json.before_after && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">До</p>
                      <p className="text-sm">{jsonDialog.json.before_after.before || "—"}</p>
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">После</p>
                      <p className="text-sm">{jsonDialog.json.before_after.after || "—"}</p>
                    </div>
                  </div>
                )}
                {jsonDialog.json.key_insights && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Ключевые инсайты</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {jsonDialog.json.key_insights.map((insight: string, i: number) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {jsonDialog.json.recommended_use && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Рекомендовано для</p>
                    <div className="flex flex-wrap gap-1">
                      {jsonDialog.json.recommended_use.map((u: string, i: number) => (
                        <Badge key={i} variant="secondary">{u}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <details>
                  <summary className="text-xs text-muted-foreground cursor-pointer">Полный JSON</summary>
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed rounded-md bg-muted p-4 mt-2">
                    {JSON.stringify(jsonDialog.json, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
