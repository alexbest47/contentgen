import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Building2,
  Tag,
  Target,
  Megaphone,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  MousePointerClick,
  MessageSquare,
  RefreshCw,
  Volume2,
} from "lucide-react";

const emailTypeBadge: Record<string, string> = {
  "продающее": "bg-red-100 text-red-800",
  "контентное": "bg-blue-100 text-blue-800",
  "анонс": "bg-purple-100 text-purple-800",
  "дайджест": "bg-cyan-100 text-cyan-800",
  "напоминание": "bg-orange-100 text-orange-800",
  "приветственное": "bg-green-100 text-green-800",
  "транзакционное": "bg-gray-100 text-gray-800",
  "другое": "bg-gray-100 text-gray-800",
};

export default function CompetitorEmailDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: email, isLoading } = useQuery({
    queryKey: ["competitor-email", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitor_emails")
        .select("*, competitors(name, website)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: analysis } = useQuery({
    queryKey: ["competitor-email-analysis", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitor_email_analyses")
        .select("*")
        .eq("email_id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const reanalyzeMutation = useMutation({
    mutationFn: async () => {
      // Delete existing analysis
      await supabase
        .from("competitor_email_analyses")
        .delete()
        .eq("email_id", id);

      // Update status
      await supabase
        .from("competitor_emails")
        .update({ status: "fetched", error_message: null })
        .eq("id", id);

      // Enqueue new analysis task
      const { error } = await supabase.functions.invoke("enqueue-task", {
        body: {
          function_name: "analyze-competitor-email",
          payload: { email_id: id },
          display_title: `Переанализ: ${email?.subject?.substring(0, 50)}`,
          lane: "claude",
          task_type: "competitor",
          target_url: `/competitor-emails/${id}`,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitor-email", id] });
      queryClient.invalidateQueries({ queryKey: ["competitor-email-analysis", id] });
      toast.success("Задача на переанализ добавлена в очередь");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="p-6">
        <p className="text-red-500">Письмо не найдено</p>
      </div>
    );
  }

  const competitor = email.competitors as any;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/competitor-emails")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{email.subject}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {email.from_address}
              </span>
              {competitor?.name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {competitor.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(email.received_at)}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => reanalyzeMutation.mutate()}
          disabled={reanalyzeMutation.isPending || email.status === "analyzing"}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {analysis ? "Переанализировать" : "Анализировать"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Original email */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Оригинал письма</CardTitle>
          </CardHeader>
          <CardContent>
            {email.html_body ? (
              <div
                className="prose prose-sm max-w-none overflow-auto max-h-[600px] border rounded-lg p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: email.html_body }}
              />
            ) : email.text_body ? (
              <pre className="whitespace-pre-wrap text-sm max-h-[600px] overflow-auto border rounded-lg p-4 bg-muted/30">
                {email.text_body}
              </pre>
            ) : (
              <p className="text-muted-foreground">Тело письма не загружено</p>
            )}
          </CardContent>
        </Card>

        {/* Right: Analysis */}
        <div className="space-y-4">
          {email.status === "analyzing" && (
            <Card>
              <CardContent className="py-8 text-center">
                <Sparkles className="h-8 w-8 mx-auto text-yellow-500 animate-pulse mb-2" />
                <p className="text-muted-foreground">Идёт анализ письма...</p>
              </CardContent>
            </Card>
          )}

          {email.status === "error" && (
            <Card className="border-red-200">
              <CardContent className="py-4">
                <p className="text-red-600 text-sm">
                  Ошибка: {email.error_message}
                </p>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <>
              {/* Type & Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Тип и резюме
                    </CardTitle>
                    {analysis.email_type && (
                      <Badge
                        className={
                          emailTypeBadge[analysis.email_type] ||
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {analysis.email_type}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{analysis.summary}</p>
                  {analysis.tone && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Volume2 className="h-3 w-3" />
                      Тональность: {analysis.tone}
                    </div>
                  )}
                  {analysis.target_audience && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Target className="h-3 w-3" />
                      Аудитория: {analysis.target_audience}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Offers */}
              {analysis.offers?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Офферы ({analysis.offers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.offers.map((o: any, i: number) => (
                      <div
                        key={i}
                        className="border rounded-lg p-3 space-y-1 text-sm"
                      >
                        <p className="font-medium">{o.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {o.price && (
                            <Badge variant="outline">{o.price}</Badge>
                          )}
                          {o.discount && (
                            <Badge className="bg-green-100 text-green-800">
                              {o.discount}
                            </Badge>
                          )}
                          {o.deadline && (
                            <Badge className="bg-orange-100 text-orange-800">
                              {o.deadline}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Products */}
              {analysis.products?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Продукты ({analysis.products.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.products.map((p: any, i: number) => (
                      <div key={i} className="border rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{p.name}</p>
                          {p.type && (
                            <Badge variant="secondary" className="text-xs">
                              {p.type}
                            </Badge>
                          )}
                        </div>
                        {p.description && (
                          <p className="text-muted-foreground mt-1">
                            {p.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Promotions */}
              {analysis.promotions?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      Акции ({analysis.promotions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.promotions.map((p: any, i: number) => (
                      <div key={i} className="border rounded-lg p-3 text-sm">
                        <Badge variant="secondary" className="mb-1">
                          {p.type}
                        </Badge>
                        <p>{p.description}</p>
                        {p.conditions && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Условия: {p.conditions}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* CTA */}
              {analysis.cta_list?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4" />
                      CTA ({analysis.cta_list.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.cta_list.map((cta: string, i: number) => (
                        <Badge key={i} variant="outline">
                          {cta}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Urgency Triggers */}
              {analysis.urgency_triggers?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Триггеры срочности
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {analysis.urgency_triggers.map(
                        (t: string, i: number) => (
                          <li key={i}>{t}</li>
                        )
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Key Messages */}
              {analysis.key_messages?.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Ключевые сообщения
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {analysis.key_messages.map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
