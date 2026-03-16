import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  FolderSearch, Play, ChevronDown, ChevronRight, FileText,
  Copy, CheckCircle2, XCircle, Loader2, Clock, Download, Mic,
} from "lucide-react";
import { ElapsedTime } from "@/components/case/ElapsedTime";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "В очереди", variant: "secondary" },
  processing: { label: "Обработка", variant: "default" },
  completed: { label: "Готово", variant: "outline" },
  error: { label: "Ошибка", variant: "destructive" },
  downloading: { label: "Скачивание...", variant: "default" },
  transcribing: { label: "Транскрибация...", variant: "default" },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  processing: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4 text-primary" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
  downloading: <Download className="h-4 w-4 animate-pulse" />,
  transcribing: <Mic className="h-4 w-4 animate-pulse" />,
};

export default function CaseManagement() {
  const [folderUrl, setFolderUrl] = useState("");
  const [openJobs, setOpenJobs] = useState<Set<string>>(new Set());
  const [transcriptDialog, setTranscriptDialog] = useState<{ name: string; text: string } | null>(null);
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
    const done = files.filter((f) => f.status === "completed" || f.status === "error").length;
    return { total: files.length, done, percent: Math.round((done / files.length) * 100) };
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Текст скопирован");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Управление кейсами</h1>
        <p className="text-muted-foreground">
          Транскрибация видео из публичных папок Яндекс.Диска
        </p>
      </div>

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
                      const isActive = file.status === "downloading" || file.status === "transcribing";
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
                              {isActive && (file as any).status_updated_at && (
                                <ElapsedTime since={(file as any).status_updated_at} />
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
                          {file.status === "completed" && file.transcript_text && (
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
    </div>
  );
}
