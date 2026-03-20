import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ArrowLeft, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getOfferTypeLabel } from "@/lib/offerTypes";

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  generating: "Генерация...",
  quiz_generated: "Тест сгенерирован",
  generating_images: "Генерация изображений...",
  ready: "Готово",
  error: "Ошибка",
};

const statusVariant = (s: string) => {
  if (s === "ready") return "default" as const;
  if (s === "error") return "destructive" as const;
  return "secondary" as const;
};

export default function OfferTypeDetail() {
  const { programId, offerType } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isDiagnosticType = offerType === "diagnostic";

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*").eq("id", programId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: diagnosticItems, isLoading: isDiagnosticsLoading } = useQuery({
    queryKey: ["diagnostics_for_program", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostics")
        .select("id, name, status, created_at, description, offer_id")
        .eq("program_id", programId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isDiagnosticType,
  });

  const { data: offers, isLoading: isOffersLoading } = useQuery({
    queryKey: ["offers", programId, offerType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, offer_tags(tag_id, tags(id, name))")
        .eq("program_id", programId!)
        .eq("offer_type", offerType! as any)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isDiagnosticType,
  });

  const isLoading = isDiagnosticType ? isDiagnosticsLoading : isOffersLoading;

  const deleteDiagnosticMutation = useMutation({
    mutationFn: async ({ diagId, offerId }: { diagId: string; offerId: string | null }) => {
      const { error } = await supabase.from("diagnostics").delete().eq("id", diagId);
      if (error) throw error;
      if (offerId) {
        await supabase.from("offers").delete().eq("id", offerId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostics_for_program", programId] });
      setArchiveOpen(false);
      setArchivingId(null);
      toast.success("Диагностика удалена");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setArchivingId(id);
    setArchiveOpen(true);
  };

  const typeLabel = getOfferTypeLabel(offerType ?? "");
  const archivingDiagnostic = isDiagnosticType
    ? diagnosticItems?.find((d) => d.id === archivingId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/programs/${programId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{typeLabel}</h1>
          <p className="text-muted-foreground">{program?.title}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : isDiagnosticType ? (
        !diagnosticItems?.length ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Нет диагностик. Создайте их в разделе «Подготовка офферов».
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg divide-y">
            {diagnosticItems.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  if (d.offer_id) {
                    navigate(`/programs/${programId}/offers/diagnostic/${d.offer_id}`);
                  } else {
                    toast.error("У этой диагностики нет привязанного оффера");
                  }
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{d.name}</div>
                  {d.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{d.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
                  <Badge variant={statusVariant(d.status)}>
                    {statusLabels[d.status] || d.status}
                  </Badge>
                  <span>{new Date(d.created_at).toLocaleDateString("ru-RU")}</span>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => openArchive(d.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        !offers?.length ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Нет офферов. Создайте их в разделе «Подготовка офферов».
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg divide-y">
            {offers?.map((o: any) => (
              <div
                key={o.id}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/programs/${programId}/offers/${offerType}/${o.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {o.image_url && (
                    <img src={o.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium">{o.title}</div>
                    {o.offer_tags?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {o.offer_tags.map((ot: any) => (
                          <Badge key={ot.tag_id} variant="secondary" className="text-xs">
                            {ot.tags?.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
                  <span>{new Date(o.created_at).toLocaleDateString("ru-RU")}</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Delete diagnostic confirmation */}
      {isDiagnosticType && (
        <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить диагностику?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Диагностика будет удалена навсегда.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!archivingId) return;
                  deleteDiagnosticMutation.mutate({
                    diagId: archivingId,
                    offerId: archivingDiagnostic?.offer_id ?? null,
                  });
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
