import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getOfferTypeLabel } from "@/lib/offerTypes";

export default function OfferTypeDetail() {
  const { programId, offerType } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*").eq("id", programId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers", programId, offerType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*, offer_tags(tag_id, tags(id, name))")
        .eq("program_id", programId!)
        .eq("offer_type", offerType!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allTags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: offer, error } = await supabase
        .from("offers")
        .insert({
          program_id: programId!,
          offer_type: offerType!,
          title,
          description: description || null,
          doc_url: docUrl || null,
          created_by: user!.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map((tag_id) => ({
          offer_id: offer.id,
          tag_id,
        }));
        const { error: tagErr } = await supabase.from("offer_tags").insert(tagInserts);
        if (tagErr) throw tagErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", programId, offerType] });
      setOpen(false);
      setTitle("");
      setDescription("");
      setDocUrl("");
      setSelectedTags([]);
      toast.success("Оффер создан");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const typeLabel = getOfferTypeLabel(offerType ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/programs/${programId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{typeLabel}</h1>
          <p className="text-muted-foreground">{program?.title}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Создать оффер</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новый оффер — {typeLabel}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название оффера" required />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Подробное описание..." className="min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <Label>Ссылка на Google Doc</Label>
                <Input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
              </div>
              <div className="space-y-2">
                <Label>Теги аудитории</Label>
                {allTags && allTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Нет тегов. <a href="/tags" className="underline text-primary">Создать теги</a>
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Создание..." : "Создать"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : offers?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Нет офферов. Создайте первый!
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
              <div className="min-w-0 flex-1">
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
              <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
                <span>{new Date(o.created_at).toLocaleDateString("ru-RU")}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
