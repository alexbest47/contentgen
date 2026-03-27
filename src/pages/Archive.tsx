import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RotateCcw, Trash2, Archive as ArchiveIcon } from "lucide-react";
import { toast } from "sonner";
import { getOfferTypeLabel } from "@/lib/offerTypes";

export default function ArchivePage() {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: offers, isLoading } = useQuery({
    queryKey: ["archived-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, paid_programs(title)")
        .eq("is_archived", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from("offers")
        .update({ is_archived: false } as any)
        .eq("id", offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Оффер восстановлен");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (offerId: string) => {
      // Delete related tags first
      await supabase.from("offer_tags").delete().eq("offer_id", offerId);
      const { error } = await supabase.from("offers").delete().eq("id", offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-offers"] });
      setDeleteOpen(false);
      setDeletingId(null);
      toast.success("Оффер удалён навсегда");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openDelete = (offerId: string) => {
    setDeletingId(offerId);
    setDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ArchiveIcon className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Архив</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : !offers?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Архив пуст
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg divide-y">
          {offers.map((o: any) => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{o.title}</div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{(o.paid_programs as any)?.title}</span>
                  <span>·</span>
                  <span>{getOfferTypeLabel(o.offer_type)}</span>
                </div>
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
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate(o.id)} disabled={restoreMutation.isPending}>
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Восстановить
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDelete(o.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить навсегда?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Оффер и все связанные теги будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
