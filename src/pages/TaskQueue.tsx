import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, RotateCcw, Trash2, XCircle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_by: string;
  lane: string;
  status: string;
  function_name: string;
  payload: any;
  result: any;
  error_message: string | null;
  display_title: string;
  priority: number;
  target_url: string | null;
  task_type: string;
}

const statusLabels: Record<string, string> = {
  pending: "В очереди",
  processing: "Выполняется",
  completed: "Завершено",
  error: "Ошибка",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

const taskTypeLabels: Record<string, string> = {
  landing: "Лендинг",
  letter: "Письмо",
  content: "Контент",
  bot_message: "Сообщение в бот",
};

const taskTypeColors: Record<string, string> = {
  landing: "bg-purple-100 text-purple-800",
  letter: "bg-cyan-100 text-cyan-800",
  content: "bg-orange-100 text-orange-800",
  post: "bg-orange-100 text-orange-800",
  carousel: "bg-pink-100 text-pink-800",
  bot_message: "bg-indigo-100 text-indigo-800",
};

function extractProjectId(targetUrl: string | null): string | null {
  if (!targetUrl) return null;
  const m = targetUrl.match(/\/projects\/([0-9a-f-]{36})/i);
  return m ? m[1] : null;
}

function getDisplayType(
  task: { task_type: string; display_title: string | null; target_url: string | null },
  projectFormats: Record<string, string | null>
): { key: string; label: string } {
  if (task.task_type === "bot_message") {
    return { key: "bot_message", label: "Сообщение в бот" };
  }
  if (task.task_type === "content") {
    const t = task.display_title ?? "";
    if (/^Бот/i.test(t)) return { key: "bot_message", label: "Сообщение в бот" };
    if (/карусел/i.test(t)) return { key: "carousel", label: "Карусель" };
    if (/\bпост/i.test(t)) return { key: "post", label: "Пост" };
    const pid = extractProjectId(task.target_url);
    const fmt = pid ? projectFormats[pid] : null;
    if (fmt === "carousel") return { key: "carousel", label: "Карусель" };
    if (fmt === "post") return { key: "post", label: "Пост" };
    return { key: "content", label: "Контент" };
  }
  return { key: task.task_type, label: taskTypeLabels[task.task_type] ?? task.task_type };
}

const PAGE_SIZE = 20;

export default function TaskQueue() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectFormats, setProjectFormats] = useState<Record<string, string | null>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [laneFilter, setLaneFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // RLS handles per-user filtering on the DB side.
  // Admins see all tasks, regular users see only their own.
  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) {
      if (isFirstLoad.current) setInitialLoading(true);
      else setIsRefreshing(true);
    }

    let query = supabase
      .from("task_queue")
      .select("id, created_at, started_at, completed_at, created_by, lane, status, function_name, error_message, display_title, priority, target_url, task_type", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (laneFilter !== "all") {
      query = query.eq("lane", laneFilter);
    }
    if (typeFilter !== "all") {
      query = query.eq("task_type", typeFilter);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error("task_queue fetch error:", error);
      toast.error("Ошибка загрузки очереди задач");
      if (isFirstLoad.current) {
        setInitialLoading(false);
        isFirstLoad.current = false;
      }
      setIsRefreshing(false);
      return;
    }
    const taskList = (data as Task[]) || [];
    setTasks(taskList);
    setTotalCount(count ?? 0);

    const projectIds = Array.from(
      new Set(
        taskList
          .filter((t) => t.task_type === "content")
          .map((t) => extractProjectId(t.target_url))
          .filter((x): x is string => !!x)
      )
    );
    if (projectIds.length > 0) {
      const { data: projData } = await supabase
        .from("projects")
        .select("id, content_format")
        .in("id", projectIds);
      const map: Record<string, string | null> = {};
      (projData || []).forEach((p: any) => {
        map[p.id] = p.content_format ?? null;
      });
      setProjectFormats((prev) => ({ ...prev, ...map }));
    }

    if (isFirstLoad.current) {
      setInitialLoading(false);
      isFirstLoad.current = false;
    }
    setIsRefreshing(false);
  }, [page, statusFilter, laneFilter, typeFilter]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, laneFilter, typeFilter]);

  // Fetch on page/filter change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Realtime with debounce
  useEffect(() => {
    const channel = supabase
      .channel("task_queue_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_queue" },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            fetchTasks(true);
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const handleRefresh = () => {
    fetchTasks();
    if (tasks.some(t => t.status === "pending" || t.status === "processing")) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      fetch(`${supabaseUrl}/functions/v1/process-queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ trigger: true }),
      }).catch(() => {});
    }
  };

  const handleRetry = async (taskId: string) => {
    const { error } = await supabase
      .from("task_queue")
      .update({
        status: "pending",
        started_at: null,
        completed_at: null,
        error_message: null,
      })
      .eq("id", taskId);

    if (error) {
      toast.error("Ошибка повтора задачи");
      return;
    }

    toast.success("Задача возвращена в очередь");

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/process-queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ trigger: true }),
    }).catch(() => {});
  };

  const handleDelete = async (taskId: string) => {
    const { error } = await supabase.from("task_queue").delete().eq("id", taskId);
    if (error) {
      toast.error("Ошибка удаления");
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setTotalCount((c) => Math.max(0, c - 1));
    }
  };

  const handleClearQueue = async () => {
    const { error } = await supabase
      .from("task_queue")
      .delete()
      .in("status", ["completed", "error"]);

    if (error) {
      toast.error("Ошибка очистки очереди");
    } else {
      toast.success("Очередь очищена");
      fetchTasks();
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd MMM HH:mm:ss", { locale: ru });
  };

  const formatSec = (sec: number) => {
    if (sec < 60) return `${sec}с`;
    return `${Math.floor(sec / 60)}м ${sec % 60}с`;
  };

  const getDuration = (task: Task) => {
    if (task.status === "pending") {
      const sec = Math.round((Date.now() - new Date(task.created_at).getTime()) / 1000);
      return `ожидает ${formatSec(sec)}`;
    }
    if (!task.started_at) return "—";
    const end = task.completed_at ? new Date(task.completed_at) : new Date();
    const start = new Date(task.started_at);
    const sec = Math.round((end.getTime() - start.getTime()) / 1000);
    return formatSec(sec);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Очередь задач</h1>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <XCircle className="h-4 w-4 mr-2" />
                Очистить очередь
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Очистить очередь?</AlertDialogTitle>
                <AlertDialogDescription>
                  Будут удалены все завершённые задачи и задачи с ошибками. Задачи в обработке и в ожидании останутся.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearQueue} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Очистить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Обновить
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="pending">В очереди</TabsTrigger>
            <TabsTrigger value="processing">Выполняются</TabsTrigger>
            <TabsTrigger value="completed">Завершено</TabsTrigger>
            <TabsTrigger value="error">Ошибки</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={laneFilter} onValueChange={setLaneFilter}>
          <TabsList>
            <TabsTrigger value="all">Все линии</TabsTrigger>
            <TabsTrigger value="claude">Claude</TabsTrigger>
            <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all">Все типы</TabsTrigger>
            <TabsTrigger value="landing">Лендинг</TabsTrigger>
            <TabsTrigger value="letter">Письмо</TabsTrigger>
            <TabsTrigger value="content">Контент</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Задача</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Линия</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Создано</TableHead>
              <TableHead>Длительность</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Нет задач
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="font-medium">
                      {task.target_url ? (
                        <a
                          href="#"
                          className="hover:underline text-primary cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            const emailMatch = task.target_url!.match(/\/email-builder\/(.+)/);
                            if (emailMatch) {
                              queryClient.removeQueries({ queryKey: ["email_letter", emailMatch[1]] });
                              queryClient.removeQueries({ queryKey: ["email_letter_blocks", emailMatch[1]] });
                            }
                            if (task.target_url === "/banner-library") {
                              queryClient.invalidateQueries({ queryKey: ["banners"] });
                            }
                            navigate(task.target_url!);
                          }}
                        >
                          {task.display_title}
                        </a>
                      ) : (
                        task.display_title
                      )}
                    </div>
                    {task.error_message && (
                      <div className="text-xs text-destructive mt-1 max-w-md truncate">
                        {task.error_message}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const dt = getDisplayType(task, projectFormats);
                      return (
                        <Badge className={taskTypeColors[dt.key] || "bg-gray-100 text-gray-800"}>
                          {dt.label}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.lane}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[task.status] || ""}>
                      {statusLabels[task.status] || task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatTime(task.created_at)}</TableCell>
                  <TableCell className="text-sm">{getDuration(task)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {task.status === "error" && (
                        <Button size="icon" variant="ghost" onClick={() => handleRetry(task.id)} title="Повторить">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {(task.status === "completed" || task.status === "error") && (
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(task.id)} title="Удалить">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`e-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      isActive={item === page}
                      onClick={() => setPage(item as number)}
                      className="cursor-pointer"
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
