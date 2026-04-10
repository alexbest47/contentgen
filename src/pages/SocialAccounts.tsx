import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  is_active: boolean;
  created_at: string;
}

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "telegram", label: "Telegram" },
  { value: "vk", label: "VK" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "X (Twitter)" },
  { value: "threads", label: "Threads" },
  { value: "dzen", label: "Дзен" },
];

export default function SocialAccounts() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SocialAccount | null>(null);
  const [formPlatform, setFormPlatform] = useState("instagram");
  const [formName, setFormName] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("social_accounts")
      .select("*")
      .order("platform")
      .order("account_name");
    setAccounts((data as SocialAccount[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setFormPlatform("instagram");
    setFormName("");
    setDialogOpen(true);
  };

  const openEdit = (acc: SocialAccount) => {
    setEditing(acc);
    setFormPlatform(acc.platform);
    setFormName(acc.account_name);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ title: "Укажите название аккаунта", variant: "destructive" });
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("social_accounts")
        .update({ platform: formPlatform, account_name: formName.trim() })
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Аккаунт обновлён" });
    } else {
      const { error } = await supabase
        .from("social_accounts")
        .insert({ platform: formPlatform, account_name: formName.trim(), is_active: true });
      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Аккаунт добавлен" });
    }

    setDialogOpen(false);
    load();
  };

  const toggleActive = async (acc: SocialAccount) => {
    await supabase
      .from("social_accounts")
      .update({ is_active: !acc.is_active })
      .eq("id", acc.id);
    load();
  };

  const handleDelete = async (acc: SocialAccount) => {
    const { error } = await supabase.from("social_accounts").delete().eq("id", acc.id);
    if (error) {
      toast({ title: "Ошибка удаления", description: "Возможно, аккаунт используется в контент-плане", variant: "destructive" });
      return;
    }
    toast({ title: "Аккаунт удалён" });
    load();
  };

  const platformLabel = (value: string) =>
    PLATFORMS.find((p) => p.value === value)?.label || value;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Аккаунты соцсетей</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить аккаунт
        </Button>
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 text-sm font-medium">Платформа</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Название аккаунта</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Статус</th>
              <th className="text-right px-4 py-3 text-sm font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id} className="border-b last:border-b-0 hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium">{platformLabel(acc.platform)}</td>
                <td className="px-4 py-3 text-sm">{acc.account_name}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={acc.is_active ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleActive(acc)}
                  >
                    {acc.is_active ? "Активен" : "Отключён"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(acc)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(acc)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Нет аккаунтов. Добавьте первый.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать аккаунт" : "Новый аккаунт"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Платформа</Label>
              <Select value={formPlatform} onValueChange={setFormPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Название аккаунта</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Talentsy, Основной..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleSave}>{editing ? "Сохранить" : "Добавить"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
