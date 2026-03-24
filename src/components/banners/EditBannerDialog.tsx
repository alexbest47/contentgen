import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Loader2, ChevronDown } from "lucide-react";
import { BANNER_TYPES, getBannerTypeLabel } from "@/lib/bannerConstants";
import { OFFER_TYPES } from "@/lib/offerTypes";
import { format } from "date-fns";

interface Props {
  banner: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditBannerDialog({ banner, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(banner.title);
  const [bannerType, setBannerType] = useState(banner.banner_type);
  const [category, setCategory] = useState<"paid_program" | "offer">(banner.category);
  const [programId, setProgramId] = useState(banner.program_id || "");
  const [offerType, setOfferType] = useState(banner.offer_type || "");
  const [colorSchemeId, setColorSchemeId] = useState(banner.color_scheme_id || "");
  const [note, setNote] = useState(banner.note || "");
  const [saving, setSaving] = useState(false);

  const { data: programs = [] } = useQuery({
    queryKey: ["paid_programs_list"],
    queryFn: async () => {
      const { data } = await supabase.from("paid_programs").select("id, title").order("title");
      return data || [];
    },
  });

  const { data: colorSchemes = [] } = useQuery({
    queryKey: ["color_schemes_list"],
    queryFn: async () => {
      const { data } = await supabase.from("color_schemes").select("id, name, preview_colors").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("banners").update({
        title,
        banner_type: bannerType,
        category,
        program_id: category === "paid_program" && programId ? programId : null,
        offer_type: category === "offer" ? offerType : null,
        color_scheme_id: colorSchemeId || null,
        note,
      } as any).eq("id", banner.id);
      if (error) throw error;
      toast.success("Метаданные обновлены");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать метаданные</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Название</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Тип баннера</Label>
            <Select value={bannerType} onValueChange={setBannerType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BANNER_TYPES.map((bt) => (
                  <SelectItem key={bt.key} value={bt.key}>{bt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Категория</Label>
            <RadioGroup value={category} onValueChange={(v) => setCategory(v as any)} className="flex gap-4 mt-1">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="paid_program" id="edit-cat-program" />
                <Label htmlFor="edit-cat-program">Платная программа</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="offer" id="edit-cat-offer" />
                <Label htmlFor="edit-cat-offer">Оффер</Label>
              </div>
            </RadioGroup>
          </div>
          {category === "paid_program" && (
            <div>
              <Label>Программа</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent>
                  {programs.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {category === "offer" && (
            <div>
              <Label>Тип оффера</Label>
              <Select value={offerType} onValueChange={setOfferType}>
                <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent>
                  {OFFER_TYPES.map((o) => (
                    <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Цветовая гамма</Label>
            <Select value={colorSchemeId} onValueChange={setColorSchemeId}>
              <SelectTrigger><SelectValue placeholder="Не выбрана" /></SelectTrigger>
              <SelectContent>
                {colorSchemes.map((cs: any) => (
                  <SelectItem key={cs.id} value={cs.id}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {(cs.preview_colors || []).slice(0, 4).map((c: string, i: number) => (
                          <div key={i} className="w-3 h-3 rounded-full border" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      {cs.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Заметка</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          {/* Read-only info */}
          <div className="border-t pt-4 space-y-2 text-sm">
            <p><span className="text-muted-foreground">Источник:</span> {banner.source === "generated" ? "Сгенерирован" : "Загружен"}</p>
            <p><span className="text-muted-foreground">Дата добавления:</span> {format(new Date(banner.created_at), "dd.MM.yyyy HH:mm")}</p>
          </div>

          {banner.source === "generated" && banner.generation_prompt && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ChevronDown className="h-4 w-4" /> Промпт генерации
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-2 p-3 bg-muted rounded text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {banner.generation_prompt}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={!title || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
