import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Copy, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function EmailBuilderList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: letters, isLoading } = useQuery({
    queryKey: ["email_letters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_letters")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: klassika } = await supabase
        .from("color_schemes")
        .select("id")
        .eq("name", "Классика")
        .eq("is_active", true)
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from("email_letters")
        .insert({
          created_by: user!.id,
          title: "Новое письмо",
          selected_color_scheme_id: klassika?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      navigate(`/email-builder/${data.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (letterId: string) => {
      const original = letters?.find((l) => l.id === letterId);
      if (!original) throw new Error("Письмо не найдено");
      const { data: newLetter, error } = await supabase
        .from("email_letters")
        .insert({
          created_by: user!.id,
          title: `${original.title} (копия)`,
          subject: original.subject,
          preheader: original.preheader,
          selected_color_scheme_id: original.selected_color_scheme_id,
          status: "draft",
        })
        .select("id")
        .single();
      if (error) throw error;
      // Copy blocks
      const { data: blocks } = await supabase
        .from("email_letter_blocks")
        .select("*")
        .eq("letter_id", letterId)
        .order("sort_order");
      if (blocks && blocks.length > 0) {
        const newBlocks = blocks.map((b) => ({
          letter_id: newLetter.id,
          block_type: b.block_type,
          sort_order: b.sort_order,
          config: b.config,
          generated_html: b.generated_html,
          banner_image_prompt: b.banner_image_prompt,
          banner_image_url: b.banner_image_url,
        }));
        await supabase.from("email_letter_blocks").insert(newBlocks);
      }
      return newLetter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_letters"] });
      toast.success("Письмо дублировано");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_letters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_letters"] });
      toast.success("Письмо удалено");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Конструктор писем</h1>
          <p className="text-muted-foreground">Создавайте и редактируйте email-рассылки</p>
        </div>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Новое письмо
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
        </div>
      ) : !letters?.length ? (
        <div className="py-12 text-center text-muted-foreground border rounded-lg">
          Нет писем. Создайте первое!
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Тема</TableHead>
              <TableHead>Обновлено</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {letters.map((letter) => (
              <TableRow key={letter.id}>
                <TableCell className="font-medium">{letter.title || "Без названия"}</TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {letter.subject || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(letter.updated_at), "d MMM yyyy, HH:mm", { locale: ru })}
                </TableCell>
                <TableCell>
                  <Badge variant={letter.status === "ready" ? "default" : "secondary"}>
                    {letter.status === "ready" ? "Готово" : "Черновик"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/email-builder/${letter.id}`)}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicateMutation.mutate(letter.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(letter.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
