import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Search,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Play,
  Trash2,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "Новое", color: "bg-gray-100 text-gray-800", icon: Clock },
  fetching: { label: "Загрузка", color: "bg-blue-100 text-blue-800", icon: Loader2 },
  fetched: { label: "Загружено", color: "bg-blue-100 text-blue-800", icon: Clock },
  analyzing: { label: "Анализ", color: "bg-yellow-100 text-yellow-800", icon: Sparkles },
  analyzed: { label: "Проанализировано", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  error: { label: "Ошибка", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

const emailTypeLabels: Record<string, string> = {
  "продающее": "Продающее",
  "контентное": "Контентное",
  "анонс": "Анонс",
  "дайджест": "Дайджест",
  "напоминание": "Напоминание",
  "приветственное": "Приветственное",
  "транзакционное": "Транзакционное",
  "другое": "Другое",
};

export default function CompetitorEmails() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [competitorFilter, setCompetitorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["competitor-emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitor_emails")
        .select("*, competitors(name)")
        .order("received_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ["competitor-email-analyses-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitor_email_analyses")
        .select("email_id, email_type, summary");
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const analysisMap = new Map(analyses.map((a: any) => [a.email_id, a]));
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (email: any) => {
      // Delete existing analysis if re-analyzing
      await supabase
        .from("competitor_email_analyses")
        .delete()
        .eq("email_id", email.id);

      // Reset status
      await supabase
        .from("competitor_emails")
        .update({ status: "fetched", error_message: null })
        .eq("id", email.id);

      // Enqueue analysis task
      const { error } = await supabase.functions.invoke("enqueue-task", {
        body: {
          function_name: "analyze-competitor-email",
          payload: { email_id: email.id },
          display_title: `Анализ: ${email.subject?.substring(0, 50)}`,
          lane: "claude",
          task_type: "competitor",
          target_url: `/competitor-emails/${email.id}`,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitor-emails"] });
      queryClient.invalidateQueries({ queryKey: ["competitor-email-analyses-list"] });
      toast.success("Задача на анализ добавлена в очередь");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (emailId: string) => {
      // Delete analysis first (FK constraint)
      await supabase
        .from("competitor_email_analyses")
        .delete()
        .eq("email_id", emailId);

      // Delete related tasks from queue
      await supabase
        .from("task_queue")
        .delete()
        .eq("function_name", "analyze-competitor-email")
        .filter("payload->>email_id", "eq", emailId);

      // Delete the email itself
      const { error } = await supabase
        .from("competitor_emails")
        .delete()
        .eq("id", emailId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitor-emails"] });
      queryClient.invalidateQueries({ queryKey: ["competitor-email-analyses-list"] });
      toast.success("Письмо удалено");
    },
    onError: (e: any) => toast.error(`Ошибка удаления: ${e.message}`),
  });

  // Build unique competitor names from emails for the filter dropdown
  const uniqueCompetitorNames = [...new Set(
    emails
      .map((e: any) => e.competitor_name || (e.competitors as any)?.name)
      .filter(Boolean)
  )].sort() as string[];

  const filtered = emails.filter((e: any) => {
    if (competitorFilter !== "all") {
      const name = e.competitor_name || (e.competitors as any)?.name;
      if (name !== competitorFilter) return false;
    }
    if (typeFilter !== "all") {
      const a = analysisMap.get(e.id);
      if (!a || a.email_type !== typeFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        e.subject?.toLowerCase().includes(q) ||
        e.from_address?.toLowerCase().includes(q) ||
        e.competitor_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Письма конкурентов</h1>
          <p className="text-muted-foreground">
            Все входящие письма с автоматическим анализом
          </p>
        </div>
        <Badge variant="outline" className="text-base">
          {filtered.length} из {emails.length}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по теме, отправителю..."
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={competitorFilter} onValueChange={setCompetitorFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Конкурент" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все конкуренты</SelectItem>
                {uniqueCompetitorNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Тип письма" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {Object.entries(emailTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-muted-foreground py-12 text-center">Загрузка...</p>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {emails.length === 0
                  ? "Писем пока нет. Подпишитесь на рассылки конкурентов, используя адрес competitors@contentgen.talentsy.ru"
                  : "Нет писем, подходящих под фильтры"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Дата</TableHead>
                  <TableHead className="w-[150px]">Конкурент</TableHead>
                  <TableHead>Тема</TableHead>
                  <TableHead className="w-[140px]">Тип</TableHead>
                  <TableHead className="w-[150px]">Статус</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((email: any) => {
                  const analysis = analysisMap.get(email.id);
                  const sc = statusConfig[email.status] || statusConfig.new;
                  const StatusIcon = sc.icon;

                  return (
                    <TableRow
                      key={email.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/competitor-emails/${email.id}`)}
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(email.received_at)}
                      </TableCell>
                      <TableCell>
                        <div>
                          {(email.competitor_name || (email.competitors as any)?.name) ? (
                            <>
                              <div className="font-medium text-sm">
                                {email.competitor_name || (email.competitors as any)?.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {email.from_address}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {email.from_address}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium line-clamp-1">
                            {email.subject}
                          </p>
                          {analysis?.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {analysis.summary}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {analysis?.email_type && (
                          <Badge variant="secondary" className="text-xs">
                            {emailTypeLabels[analysis.email_type] || analysis.email_type}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${sc.color} text-xs`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {email.status !== "analyzed" && email.status !== "analyzing" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              disabled={analyzeMutation.isPending || email.status === "analyzing"}
                              onClick={(e) => {
                                e.stopPropagation();
                                analyzeMutation.mutate(email);
                              }}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Анализ
                            </Button>
                          ) : (
                            <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={deleteMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Удалить это письмо и его анализ?")) {
                                deleteMutation.mutate(email.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
