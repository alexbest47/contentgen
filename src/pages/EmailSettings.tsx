import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EmailSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["email_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_settings")
        .select("setting_key, setting_value");
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((r: any) => { map[r.setting_key] = r.setting_value; });
      return map;
    },
  });

  const [headerHtml, setHeaderHtml] = useState("");
  const [footerHtml, setFooterHtml] = useState("");

  useEffect(() => {
    if (settings) {
      setHeaderHtml(settings.email_header_html || "");
      setFooterHtml(settings.email_footer_html || "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { key: "email_header_html", value: headerHtml },
        { key: "email_footer_html", value: footerHtml },
      ];
      for (const u of updates) {
        const { error } = await supabase
          .from("email_settings")
          .update({ setting_value: u.value, updated_at: new Date().toISOString() })
          .eq("setting_key", u.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_settings"] });
      toast.success("Настройки сохранены");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Настройки Email</h1>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1.5">
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveMutation.isSuccess ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Сохранить
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Хедер письма (HTML)</CardTitle>
          <p className="text-sm text-muted-foreground">
            HTML-блок с логотипом, который автоматически добавляется перед телом каждого письма
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={headerHtml}
            onChange={(e) => setHeaderHtml(e.target.value)}
            className="font-mono text-xs min-h-[200px] resize-y"
            placeholder="<table>...</table>"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Футер письма (HTML)</CardTitle>
          <p className="text-sm text-muted-foreground">
            HTML-блок с реквизитами и ссылкой отписки, добавляется после тела каждого письма
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={footerHtml}
            onChange={(e) => setFooterHtml(e.target.value)}
            className="font-mono text-xs min-h-[200px] resize-y"
            placeholder="<table>...</table>"
          />
        </CardContent>
      </Card>
    </div>
  );
}
