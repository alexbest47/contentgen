import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination";
import { ru } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";

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

export default function TaskQueue() {
  const { isAdmin } = useAuth();
  const { enqueue } = useTaskQueue();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  const paginatedTasks = tasks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchTasks = async () => {
    setLoading(true);
    let query = supabase
      .from("task_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    setPage(1);
    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setTasks((data as Task[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("task_queue_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_queue" },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const handleRetry = async (task: Task) => {
    await enqueue({
      functionName: task.function_name,
      payload: task.payload,
      displayTitle: task.display_title,
      lane: task.lane as "claude" | "openrouter",
    });
  };

  const handleDelete = async (taskId: string) => {
    const { error } = await supabase.from("task_queue").delete().eq("id", taskId);
    if (error) {
      toast.error("Ошибка удаления");
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "dd MMM HH:mm:ss", { locale: ru });
  };

  const getDuration = (task: Task) => {
    if (!task.started_at) return "—";
    const end = task.completed_at ? new Date(task.completed_at) : new Date();
    const start = new Date(task.started_at);
    const sec = Math.round((end.getTime() - start.getTime()) / 1000);
    if (sec < 60) return `${sec}с`;
    return `${Math.floor(sec / 60)}м ${sec % 60}с`;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Очередь задач</h1>
        <Button variant="outline" size="sm" onClick={fetchTasks}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="pending">В очереди</TabsTrigger>
          <TabsTrigger value="processing">Выполняются</TabsTrigger>
          <TabsTrigger value="completed">Завершено</TabsTrigger>
          <TabsTrigger value="error">Ошибки</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Задача</TableHead>
              <TableHead>Линия</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Создано</TableHead>
              <TableHead>Длительность</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                            // Invalidate cached data so the target page fetches fresh
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
                        <Button size="icon" variant="ghost" onClick={() => handleRetry(task)} title="Повторить">
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
    </div>
  );
}
