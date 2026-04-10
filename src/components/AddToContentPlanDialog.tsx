import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AddToContentPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "email" or "social" */
  type: "email" | "social";
  /** Title pre-filled from the letter/post */
  title: string;
  /** ID of the letter or post/project to link */
  linkedId: string;
  /** Optional program_id */
  programId?: string | null;
  /** For social: "post" or "carousel" */
  socialType?: "post" | "carousel";
  /** Optional audience segment for emails */
  audienceSegment?: string;
}

export default function AddToContentPlanDialog({
  open,
  onOpenChange,
  type,
  title: defaultTitle,
  linkedId,
  programId,
  socialType,
  audienceSegment,
}: AddToContentPlanDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [segment, setSegment] = useState(audienceSegment || "");

  // Fetch social accounts for social type
  const { data: socialAccounts } = useQuery({
    queryKey: ["social_accounts_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("is_active", true)
        .order("platform");
      if (error) throw error;
      return data;
    },
    enabled: type === "social",
  });

  const PLATFORM_LABELS: Record<string, string> = {
    instagram: "Instagram",
    telegram: "Telegram",
    vk: "ВКонтакте",
    youtube: "YouTube",
    tiktok: "TikTok",
    facebook: "Facebook",
    twitter: "X (Twitter)",
    threads: "Threads",
    dzen: "Дзен",
  };

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  // Reset form when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setTitle(defaultTitle);
      setDescription("");
      setDate(undefined);
      setSelectedAccountIds([]);
      setSegment(audienceSegment || "");
    }
    onOpenChange(v);
  };

  const handleSave = async () => {
    if (!date) {
      toast({ title: "Выберите дату", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Укажите название", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload: any = {
      date: format(date, "yyyy-MM-dd"),
      type,
      title: title.trim(),
      description: description.trim() || null,
      status: "todo",
      program_id: programId || null,
      created_by: user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      letter_id: type === "email" ? linkedId : null,
      post_id: type === "social" ? linkedId : null,
      social_type: type === "social" ? (socialType || "post") : null,
      audience_segment: type === "email" ? (segment.trim() || null) : null,
    };

    const { data: inserted, error } = await supabase
      .from("content_plan_items")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      setSaving(false);
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    // Link selected social accounts
    if (type === "social" && selectedAccountIds.length > 0 && inserted) {
      const links = selectedAccountIds.map((accId) => ({
        item_id: inserted.id,
        account_id: accId,
      }));
      await supabase.from("content_plan_social_accounts").insert(links);
    }

    setSaving(false);
    toast({ title: "Добавлено в контент-план", description: `${format(date, "d MMMM yyyy", { locale: ru })}` });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить в контент-план</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Название</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label>Описание <span className="text-muted-foreground font-normal">(опционально)</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание или заметка..."
              rows={3}
            />
          </div>

          {type === "email" && (
            <div>
              <Label>Сегмент аудитории <span className="text-muted-foreground font-normal">(опционально)</span></Label>
              <Input
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                placeholder="Например: новые подписчики, все базы, VIP..."
              />
            </div>
          )}

          <div>
            <Label>Дата</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {date ? format(date, "d MMMM yyyy", { locale: ru }) : "Выберите дату"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { setDate(d); setCalendarOpen(false); }}
                  locale={ru}
                />
              </PopoverContent>
            </Popover>
          </div>

          {type === "social" && socialAccounts && socialAccounts.length > 0 && (
            <div>
              <Label>Аккаунты <span className="text-muted-foreground font-normal">(опционально)</span></Label>
              <div className="mt-2 space-y-2 max-h-[180px] overflow-y-auto border rounded-md p-3">
                {socialAccounts.map((acc: any) => (
                  <label
                    key={acc.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
                  >
                    <Checkbox
                      checked={selectedAccountIds.includes(acc.id)}
                      onCheckedChange={() => toggleAccount(acc.id)}
                    />
                    <span className="text-sm">
                      {PLATFORM_LABELS[acc.platform] || acc.platform} — {acc.account_name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Сохраняю..." : "Добавить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
