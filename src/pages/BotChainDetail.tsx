import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, RefreshCw, Loader2, ImageIcon, ImagePlus } from "lucide-react";

const CHANNEL_LABELS: Record<string, string> = {
  bot_webinar_before: "До вебинара",
  bot_webinar_after: "После вебинара",
  bot_warming: "Прогрев после заявки",
};
const CHANNEL_ORDER = ["bot_webinar_before", "bot_webinar_after", "bot_warming"];

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

export default function BotChainDetail() {
  const { chainId } = useParams<{ chainId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueue } = useTaskQueue();

  const { data: chain, isLoading } = useQuery({
    queryKey: ["bot_chain", chainId],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_chains" as any)
        .select("*")
        .eq("id", chainId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!chainId,
  });

  const { data: messages } = useQuery({
    queryKey: ["bot_chain_messages", chainId],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bot_chain_messages" as any)
        .select("*")
        .eq("chain_id", chainId!)
        .order("step_order");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!chainId,
  });

  const handleRegenerateText = async (msg: any) => {
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
      taskType: "bot_message",
    });
    queryClient.invalidateQueries({ queryKey: ["bot_chain_messages", chainId] });
  };

  const handleGenerateImage = async (msg: any) => {
    if (!msg.imagen_prompt) return;
    await enqueue({
      functionName: "generate-bot-message",
      payload: { generate_image: true, message_id: msg.id },
      displayTitle: `Бот — Картинка для сообщения ${msg.step_order}`,
      lane: "openrouter",
      targetUrl: `/bot-chains/${chainId}/messages/${msg.id}`,
      taskType: "bot_message",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
      </div>
    );
  }

  if (!chain) {
    return <div className="py-12 text-center text-muted-foreground">Цепочка не найдена</div>;
  }

  const grouped = CHANNEL_ORDER.map((ch) => ({
    channel: ch,
    label: CHANNEL_LABELS[ch] || ch,
    items: (messages || [])
      .filter((m: any) => m.channel === ch)
      .sort((a: any, b: any) => a.step_order - b.step_order),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/email-chains")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{chain.title || "Бот-цепочка"}</h1>
          <p className="text-muted-foreground text-sm">
            {chain.template_slug === "bot-webinar-before-after"
              ? "До и после вебинара"
              : chain.template_slug === "bot-warming-after-application"
                ? "Прогрев после заявки"
                : chain.template_slug}
          </p>
        </div>
      </div>

      {grouped.map((group) => (
        <div key={group.channel} className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{group.label}</h2>
          <div className="space-y-2">
            {group.items.map((msg: any) => (
              <Card key={msg.id}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex flex-col items-center min-w-[60px]">
                      <span className="text-xs text-muted-foreground">#{msg.step_order}</span>
                      <span className="font-semibold text-sm">Сообщ.</span>
                    </div>
                    <div className="min-w-0 flex items-center gap-3">
                      {msg.image_url ? (
                        <img src={msg.image_url} alt="" className="w-12 h-12 rounded object-cover border" />
                      ) : (
                        <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{msg.title || msg.prompt_slug}</p>
                        {msg.message_text && (
                          <p className="text-xs text-muted-foreground truncate max-w-md">{msg.message_text.substring(0, 140)}</p>
                        )}
                        {msg.error_message && (
                          <p className="text-xs text-destructive truncate max-w-md">{msg.error_message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(msg.status)}
                    {msg.status === "ready" && msg.imagen_prompt && !msg.image_url && (
                      <Button variant="outline" size="sm" onClick={() => handleGenerateImage(msg)}>
                        <ImagePlus className="h-3 w-3 mr-1" /> Картинка
                      </Button>
                    )}
                    {msg.status === "error" && (
                      <Button variant="outline" size="sm" onClick={() => handleRegenerateText(msg)}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Перегенерировать
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/bot-chains/${chainId}/messages/${msg.id}`)}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
