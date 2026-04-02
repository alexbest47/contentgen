import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

export default function Tags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { data: tags, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("tags")
        .insert({ name: name.trim(), created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setNewTag("");
      toast.success("Тег создан");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("tags").update({ name: name.trim() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setEditingId(null);
      toast.success("Тег обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Тег удалён");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) createMutation.mutate(newTag);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Теги аудитории</h1>
        <p className="text-muted-foreground">Управление тегами аудитории для программ</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Новый тег..."
          required
        />
        <Button type="submit" disabled={createMutation.isPending || !newTag.trim()}>
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </form>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : tags?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Нет тегов. Создайте первый!
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags?.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-sm py-1.5 px-3 gap-1.5"
            >
              {editingId === tag.id ? (
                <input
                  autoFocus
                  className="bg-transparent border-none outline-none w-20 text-sm"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editingName.trim()) {
                      updateMutation.mutate({ id: tag.id, name: editingName });
                    } else if (e.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                  onBlur={() => {
                    if (editingName.trim() && editingName.trim() !== tag.name) {
                      updateMutation.mutate({ id: tag.id, name: editingName });
                    } else {
                      setEditingId(null);
                    }
                  }}
                />
              ) : (
                <span
                  className="cursor-pointer"
                  onDoubleClick={() => {
                    setEditingId(tag.id);
                    setEditingName(tag.name);
                  }}
                >
                  {tag.name}
                </span>
              )}
              <button
                onClick={() => deleteMutation.mutate(tag.id)}
                className="hover:text-destructive transition-colors"
                disabled={deleteMutation.isPending}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
