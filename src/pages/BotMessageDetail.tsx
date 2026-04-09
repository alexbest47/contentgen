import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, ImagePlus, RefreshCw, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

function statusBadge(status: string) {
  switch (status) {
    case "ready":
      return <Badge variant="default">Готово</Badge>;
    case "processing":
      return <Badge variant="outline">Выполняется</Badge>;
    case "error":
      return <Badge variant="destructive">Ошибка</Badge>;
    default:
      return <Badge variant="secondary">В очереди</Badge>;
  }
}

export default function BotMessageDetail() {
  const { chainId, messageId } = useParams<{ chainId: string; messageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueue } = useTaskQueue();

  const { data: msg, isLoading } = useQuery({
    queryKey: ["bot_chain_message", messageId],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_chain_messages" as any)
        .select("*")
        .eq("id", messageId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!messageId,
  });

  const handleGenerateImage = async () => {
    if (!msg?.imagen_prompt) {
      toast.error("Нет imagen_prompt — сначала сгенерируйте текст");
      return;
    }
    await enqueue({
      functionName: "generate-bot-message",
      payload: { generate_image: true, message_id: msg.id },
      displayTitle: `Бот — Картинка для сообщения ${msg.step_order}`,
      lane: "openrouter",
      targetUrl: `/bot-chains/${chainId}/messages/${msg.id}`,
      taskType: "content",
    });
    queryClient.invalidateQueries({ queryKey: ["bot_chain_message", messageId] });
  };

  const handleRegenerateText = async () => {
    if (!msg) return;
    await supabase
      .from("bot_chain_messages" as any)
      .update({ status: "pending", error_message: null })
      .eq("id", msg.id);
    await enqueue({
      functionName: "generate-bot-message",
      payload: { message_id: msg.id },
      displayTitle: `Бот — Сообщение ${msg.step_order}: ${msg.title}`,
      lane: "claude",
      targetUrl: `/bot-chains/${chainId}/messages/${msg.id}`,
      taskType: "content",
    });
    queryClient.invalidateQueries({ queryKey: ["bot_chain_message", messageId] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
      </div>
    );
  }

  if (!msg) {
    return <div className="py-12 text-center text-muted-foreground">Сообщение не найдено</div>;
  }

  const parsed = msg.generated_json || {};
  const buttons: any[] = parsed.buttons || [];
  const poll: any = parsed.poll_spec || null;
  const videoBrief: any = parsed.video_case_brief || null;
  const chatCta: any = parsed.chat_cta || null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/bot-chains/${chainId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Сообщение {msg.step_order} · {msg.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            {statusBadge(msg.status)}
            <span className="text-sm text-muted-foreground">{msg.prompt_slug}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRegenerateText}>
            <RefreshCw className="h-3 w-3 mr-1" /> Перегенерировать текст
          </Button>
          {msg.imagen_prompt && (
            <Button size="sm" onClick={handleGenerateImage}>
              <ImagePlus className="h-3 w-3 mr-1" /> {msg.image_url ? "Перегенерировать" : "Сгенерировать"} изображение
            </Button>
          )}
        </div>
      </div>

      {msg.error_message && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-destructive whitespace-pre-wrap">{msg.error_message}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Текст сообщения</CardTitle>
            </CardHeader>
            <CardContent>
              {msg.message_text ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message_text}</p>
              ) : (
                <p className="text-muted-foreground text-sm">Текст ещё не сгенерирован</p>
              )}
            </CardContent>
          </Card>

          {buttons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Кнопки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {buttons.map((b: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">{b.label}</Badge>
                    {b.url_from && <span className="text-xs text-muted-foreground">→ {b.url_from}</span>}
                    {b.action && <span className="text-xs text-muted-foreground">action: {b.action}</span>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {poll && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Опрос</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium text-sm">{poll.question}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {(poll.options || []).map((o: string, i: number) => (
                    <li key={i}>• {o}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {chatCta && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chat CTA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{chatCta.prompt}</p>
                {chatCta.expected_replies?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Ожидаемые ответы: {chatCta.expected_replies.join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {videoBrief && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Бриф на видео-кейс</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Длительность:</span> {videoBrief.duration}</p>
                <p><span className="text-muted-foreground">Архетип:</span> {videoBrief.archetype}</p>
                <p><span className="text-muted-foreground">Тон:</span> {videoBrief.tone}</p>
                {videoBrief.interview_questions?.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <p className="font-medium">Вопросы интервью:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      {videoBrief.interview_questions.map((q: string, i: number) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ol>
                  </>
                )}
                {videoBrief.required_facts?.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <p className="font-medium">Обязательные факты:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {videoBrief.required_facts.map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Изображение</CardTitle>
            </CardHeader>
            <CardContent>
              {msg.image_url ? (
                <div className="space-y-2">
                  <img src={msg.image_url} alt="" className="w-full rounded border" />
                  <p className="text-xs text-muted-foreground">{msg.image_size || "—"}</p>
                </div>
              ) : (
                <div className="aspect-square rounded border bg-muted flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <ImageIcon className="h-8 w-8" />
                  <p className="text-xs text-center px-2">
                    {msg.imagen_prompt ? "Нажми «Сгенерировать изображение»" : "Нет imagen_prompt"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {msg.imagen_prompt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Imagen-промпт</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {msg.imagen_prompt}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
