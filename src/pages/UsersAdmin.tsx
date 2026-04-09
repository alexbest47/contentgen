import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = Database["public"]["Enums"]["app_role"];
type CreatedCredentials = { email: string; password: string };

export default function UsersAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("user");
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Сессия истекла. Перезайдите в систему.");
      }

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("*");
      if (rolesError) throw rolesError;

      const { data: usersData, error: usersError } = await supabase.functions.invoke("admin-list-users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (usersError) throw usersError;
      if (usersData?.error) throw new Error(usersData.error);
      const authUsers: Array<{ id: string; email: string | null }> = usersData?.users ?? [];
      const emailById = new Map(authUsers.map((u) => [u.id, u.email]));

      return profiles.map((p) => ({
        ...p,
        email: emailById.get(p.id) ?? null,
        role: roles.find((r) => r.user_id === p.id)?.role ?? "user",
        roleId: roles.find((r) => r.user_id === p.id)?.id,
      }));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Upsert: delete existing then insert
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Роль обновлена");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createUserMutation = useMutation({
    mutationFn: async (payload: { email: string; full_name: string; role: AppRole }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Сессия истекла. Перезайдите в систему.");
      }

      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { email: string; password: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEmail("");
      setFullName("");
      setNewUserRole("user");
      setIsCreateDialogOpen(false);
      setCreatedCredentials({ email: data.email, password: data.password });
      toast.success("Пользователь создан");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Сессия истекла. Перезайдите в систему.");
      }

      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Пользователь удалён");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Сессия истекла. Перезайдите в систему.");
      }

      const { data, error } = await supabase.functions.invoke("admin-reset-user-password", {
        body: { user_id: userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { email: string | null; password: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreatedCredentials({
        email: data.email ?? "—",
        password: data.password,
      });
      toast.success("Пароль обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Укажите email");
      return;
    }
    if (!fullName.trim()) {
      toast.error("Укажите имя");
      return;
    }
    createUserMutation.mutate({
      email: email.trim(),
      full_name: fullName.trim(),
      role: newUserRole,
    });
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const credentialsText = createdCredentials
    ? `Адрес: ${baseUrl}\nЛогин: ${createdCredentials.email}\nПароль: ${createdCredentials.password}`
    : "";

  const copyCredentials = async () => {
    if (!credentialsText) return;
    try {
      await navigator.clipboard.writeText(credentialsText);
      toast.success("Данные скопированы");
    } catch {
      toast.error("Не удалось скопировать данные");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Пользователи</h1>
          <p className="text-muted-foreground">Управление пользователями и ролями</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      {createdCredentials && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Данные для входа нового пользователя</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{credentialsText}</div>
            <Button variant="outline" onClick={copyCredentials} className="gap-2">
              <Copy className="h-4 w-4" />
              Скопировать данные
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить пользователя</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-fullname">Имя</Label>
              <Input
                id="new-user-fullname"
                placeholder="Иван Иванов"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createUserMutation.isPending} className="gap-2">
                {createUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Создать
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : (
        <div className="space-y-3">
          {users?.map((u) => (
            <Card key={u.id}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-start gap-3">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base">{u.full_name ?? "Без имени"}</CardTitle>
                    <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
                  </div>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                    {u.role === "admin" ? "Администратор" : "Пользователь"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={u.role}
                    onValueChange={(v) => updateRoleMutation.mutate({ userId: u.id, newRole: v as AppRole })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Администратор</SelectItem>
                      <SelectItem value="user">Пользователь</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={resetPasswordMutation.isPending}
                    onClick={() => {
                      const ok = window.confirm(`Сгенерировать новый пароль для "${u.full_name ?? "Без имени"}"?`);
                      if (!ok) return;
                      resetPasswordMutation.mutate(u.id);
                    }}
                  >
                    <KeyRound className="h-4 w-4" />
                    Новый пароль
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteUserMutation.isPending || resetPasswordMutation.isPending || user?.id === u.id}
                    onClick={() => {
                      if (user?.id === u.id) {
                        toast.error("Нельзя удалить текущего пользователя");
                        return;
                      }
                      const ok = window.confirm(`Удалить пользователя "${u.full_name ?? "Без имени"}"?`);
                      if (!ok) return;
                      deleteUserMutation.mutate(u.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                Зарегистрирован: {new Date(u.created_at).toLocaleDateString("ru-RU")}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
