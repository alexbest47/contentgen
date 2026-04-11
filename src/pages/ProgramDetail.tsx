import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Tag } from "lucide-react";
import { OFFER_TYPES, CONTENT_OFFER_KEYS, SALES_OFFER_KEYS } from "@/lib/offerTypes";
import { useContentFormat, appendFormat } from "@/lib/contentFormat";

export default function ProgramDetail() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { format, suffix } = useContentFormat();

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*").eq("id", programId!).single();
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

  const { data: programTags } = useQuery({
    queryKey: ["program_tags", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_tags" as any)
        .select("tag_id")
        .eq("program_id", programId!);
      if (error) throw error;
      return (data as any[]).map((r: any) => r.tag_id as string);
    },
    enabled: !!programId,
  });

  const assignedTagNames = allTags?.filter((t) => programTags?.includes(t.id)).map((t) => t.name) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/programs${suffix}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{program?.title ?? "..."}</h1>
          <p className="text-muted-foreground">Выберите тип оффера</p>
          <div className="flex flex-wrap gap-x-4">
            {program?.audience_doc_url && (
              <p className="text-xs text-muted-foreground mt-1">
                📄 <a href={program.audience_doc_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Google Doc аудитории</a>
              </p>
            )}
            {(program as any)?.program_doc_url && (
              <p className="text-xs text-muted-foreground mt-1">
                📝 <a href={(program as any).program_doc_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Google Doc описания программы</a>
              </p>
            )}
          </div>
          {assignedTagNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              {assignedTagNames.map((name) => (
                <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Контентные офферы</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OFFER_TYPES.filter((t) => CONTENT_OFFER_KEYS.includes(t.key)).map((type) => (
              <Card
                key={type.key}
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => navigate(appendFormat(`/programs/${programId}/offers/${type.key}`, format))}
              >
                <CardContent className="flex items-center gap-4 py-6">
                  <div className="rounded-lg bg-accent p-3 text-accent-foreground group-hover:bg-primary/10 transition-colors">
                    <type.icon className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-lg">{type.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">Продающие офферы</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OFFER_TYPES.filter((t) => SALES_OFFER_KEYS.includes(t.key)).map((type) => (
              <Card
                key={type.key}
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => navigate(appendFormat(`/programs/${programId}/offers/${type.key}`, format))}
              >
                <CardContent className="flex items-center gap-4 py-6">
                  <div className="rounded-lg bg-accent p-3 text-accent-foreground group-hover:bg-primary/10 transition-colors">
                    <type.icon className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-lg">{type.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
