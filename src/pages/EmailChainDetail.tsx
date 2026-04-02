import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, RefreshCw, Loader2 } from "lucide-react";

const GROUP_LABELS: Record<string, string> = {
  before: "До вебинара",
  webinar_day: "День вебинара",
  after: "После вебинара",
};
const GROUP_ORDER = ["before", "webinar_day", "after"];

function statusBadge(status: string) {
  switch (status) {
    case "ready": return <Badge variant="default">Готово</Badge>;
    case "processing": return <Badge variant="outline">Выполняется</Badge>;
    case "error": return <Badge variant="destructive">Ошибка</Badge>;
    default: return <Badge variant="secondary">В очереди</Badge>;
  }
}

export default function EmailChainDetail() {
  const { chainId } = useParams<{ chainId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueue } = useTaskQueue();

  const { data: chain, isLoading } = useQuery({
    queryKey: ["email_chain", chainId],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_chains" as any)
        .select("*, email_chain_templates(name, letters_config)")
        .eq("id", chainId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!chainId,
  });

  const { data: chainLetters } = useQuery({
    queryKey: ["email_chain_letters", chainId],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_chain_letters" as any)
        .select("*, email_letters(status, subject, title)")
        .eq("chain_id", chainId!)
        .order("sort_order");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!chainId,
  });

  const handleRegenerate = async (cl: any) => {
    await supabase.from("email_letters" as any).update({ status: "draft" }).eq("id", cl.letter_id);
    await supabase.from("email_chain_letters" as any).update({ status: "pending" }).eq("id", cl.id);
    await enqueue({
      functionName: "generate-email-letter",
      payload: { letter_id: cl.letter_id, chain_letter_slug: cl.slug },
      displayTitle: `Цепочка: ${cl.group_name} — Письмо ${cl.letter_number}`,
      lane: "claude",
      targetUrl: `/email-builder/${cl.letter_id}`,
    });
    queryClient.invalidateQueries({ queryKey: ["email_chain_letters", chainId] });
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

  const lettersConfig: any[] = chain.email_chain_templates?.letters_config || [];
  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    label: GROUP_LABELS[g] || g,
    letters: (chainLetters || [])
      .filter((cl: any) => cl.group_name === g)
      .sort((a: any, b: any) => a.sort_order - b.sort_order),
  })).filter((g) => g.letters.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/email-chains")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{chain.title || "Цепочка"}</h1>
          <p className="text-muted-foreground text-sm">
            {chain.email_chain_templates?.name}
          </p>
        </div>
      </div>

      {grouped.map((group) => (
        <div key={group.group} className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{group.label}</h2>
          <div className="space-y-2">
            {group.letters.map((cl: any) => {
              const letterStatus = cl.email_letters?.status || cl.status;
              const config = lettersConfig.find((c: any) => c.number === cl.letter_number);
              return (
                <Card key={cl.id}>
                  <CardContent className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex flex-col items-center min-w-[60px]">
                        <span className="text-xs text-muted-foreground">{config?.day || `#${cl.letter_number}`}</span>
                        <span className="font-semibold text-sm">Письмо {cl.letter_number}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{config?.title || cl.slug}</p>
                        {cl.email_letters?.subject && (
                          <p className="text-xs text-muted-foreground truncate">{cl.email_letters.subject}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge(letterStatus)}
                      {letterStatus === "error" && (
                        <Button variant="outline" size="sm" onClick={() => handleRegenerate(cl)}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Перегенерировать
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/email-builder/${cl.letter_id}`)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
