import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Globe,
  Mail,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";

interface Competitor {
  id: string;
  name: string;
  website: string | null;
  description: string;
  sender_emails: string[];
  is_active: boolean;
  created_at: string;
}

interface CompetitorForm {
  name: string;
  website: string;
  description: string;
  sender_emails: string;
  is_active: boolean;
}

const emptyForm: CompetitorForm = {
  name: "",
  website: "",
  description: "",
  sender_emails: "",
  is_active: true,
};

export default function CompetitorList() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editCompetitor, setEditCompetitor] = useState<Competitor | null>(null);
  const [deleteCompetitor, setDeleteCompetitor] = useState<Competitor | null>(null);
  const [form, setForm] = useState<CompetitorForm>(emptyForm);

  const { data: competitors = [], isLoading } = useQuery({
    queryKey: ["competitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Competitor[];
    },
  });

  // Email count per competitor
  const { data: emailCounts = {} } = useQuery({
    queryKey: ["competitor-email-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitor_emails")
        .select("competitor_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((e: any) => {
        if (e.competitor_id) {
          counts[e.competitor_id] = (counts[e.competitor_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string; form: CompetitorForm }) => {
      const emails = data.form.sender_emails
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const row = {
        name: data.form.name,
        website: data.form.website || null,
        description: data.form.description,
        sender_emails: emails,
        is_active: data.form.is_active,
      };

      if (data.id) {
        const { error } = await supabase
          .from("competitors")
          .update(row)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("competitors").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      toast.success(editCompetitor ? "Конкурент обновлён" : "Конкурент добавлен");
      setAddOpen(false);
      setEditCompetitor(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competitors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      toast.success("Конкурент удалён");
      setDeleteCompetitor(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (c: Competitor) => {
    setForm({
      name: c.name,
      website: c.website || "",
      description: c.description,
      sender_emails: c.sender_emails.join(", "),
      is_active: c.is_active,
    });
    setEditCompetitor(c);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setAddOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Укажите название конкурента");
      return;
    }
    saveMutation.mutate({ id: editCompetitor?.id, form });
  };

  const formDialog = (
    <Dialog
      open={addOpen || !!editCompetitor}
      onOpenChange={(open) => {
        if (!open) {
          setAddOpen(false);
          setEditCompetitor(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editCompetitor ? "Редактировать конкурента" : "Добавить конкурента"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium">Название *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Skillbox, Нетология, GeekBrains..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Сайт</label>
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://skillbox.ru"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Описание</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Краткое описание конкурента"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Email-адреса отправителей (через запятую)
            </label>
            <Input
              value={form.sender_emails}
              onChange={(e) => setForm({ ...form, sender_emails: e.target.value })}
              placeholder="newsletter@skillbox.ru, info@skillbox.ru"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Письма с этих адресов будут автоматически привязаны к конкуренту
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              id="is_active"
            />
            <label htmlFor="is_active" className="text-sm">
              Активен (отслеживать рассылки)
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                setEditCompetitor(null);
              }}
            >
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Анализ конкурентов</h1>
          <p className="text-muted-foreground">
            Справочник конкурентов для автоматического сбора и анализа рассылок
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить конкурента
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Конкуренты ({competitors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Загрузка...</p>
          ) : competitors.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Нет добавленных конкурентов. Нажмите «Добавить конкурента», чтобы начать.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Сайт</TableHead>
                  <TableHead>Email отправителей</TableHead>
                  <TableHead>Писем</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-[100px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      {c.website ? (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          {c.website.replace(/https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.sender_emails.map((email) => (
                          <Badge
                            key={email}
                            variant="secondary"
                            className="text-xs"
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            {email}
                          </Badge>
                        ))}
                        {c.sender_emails.length === 0 && (
                          <span className="text-muted-foreground text-xs">
                            Не указаны
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {emailCounts[c.id] || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.is_active ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Eye className="h-3 w-3 mr-1" />
                          Активен
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Неактивен
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteCompetitor(c)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Инструкция по подключению
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            1. Подпишитесь на рассылки конкурентов, используя адрес{" "}
            <code className="bg-muted px-1 py-0.5 rounded">
              competitors@contentgen.talentsy.ru
            </code>
          </p>
          <p>
            2. Или настройте в Gmail автопересылку писем конкурентов на этот
            адрес
          </p>
          <p>
            3. Добавьте конкурента и укажите email-адреса отправителей — письма
            привяжутся автоматически
          </p>
          <p>
            4. Каждое входящее письмо автоматически анализируется Claude и
            раскладывается в структурированный JSON
          </p>
        </CardContent>
      </Card>

      {formDialog}

      <AlertDialog
        open={!!deleteCompetitor}
        onOpenChange={(open) => !open && setDeleteCompetitor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить конкурента?</AlertDialogTitle>
            <AlertDialogDescription>
              Конкурент «{deleteCompetitor?.name}» будет удалён. Письма
              останутся, но потеряют привязку.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteCompetitor && deleteMutation.mutate(deleteCompetitor.id)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
