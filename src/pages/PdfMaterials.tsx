import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Eye, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CreatePdfWizard } from "@/components/pdf/CreatePdfWizard";
import { useNavigate } from "react-router-dom";

export default function PdfMaterials() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: materials, isLoading } = useQuery({
    queryKey: ["pdf_materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdf_materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pdf_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf_materials"] });
      toast.success("Материал удалён");
      setDeleteId(null);
    },
    onError: () => toast.error("Ошибка удаления"),
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["pdf_materials"] });
    toast.success("PDF-материал сгенерирован!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Подготовка PDF</h1>
          <p className="text-muted-foreground">Создание полезных PDF-материалов с лендингом для скачивания</p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Создать PDF
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !materials?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          Нет PDF-материалов. Создайте первый.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Программа</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell>{m.material_type}</TableCell>
                <TableCell>{m.program_name}</TableCell>
                <TableCell>
                  <Badge variant={m.status === "ready" ? "default" : m.status === "error" ? "destructive" : "secondary"}>
                    {m.status === "ready" ? "Готово" : m.status === "error" ? "Ошибка" : "Генерация..."}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(m.created_at), "dd.MM.yyyy")}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {m.status === "ready" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Просмотр"
                        onClick={() => navigate(`/pdf-materials/${m.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Удалить"
                      onClick={() => setDeleteId(m.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CreatePdfWizard open={wizardOpen} onOpenChange={setWizardOpen} onSuccess={handleSuccess} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить материал?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
