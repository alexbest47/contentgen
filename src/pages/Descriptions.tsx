import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOfferTypeLabel } from "@/lib/offerTypes";
import { ExternalLink } from "lucide-react";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

export default function Descriptions() {
  const { data: offers, isLoading } = useQuery({
    queryKey: ["descriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("id, title, offer_type, doc_url, paid_programs(id, title, audience_doc_url, program_doc_url), diagnostics(doc_url)")
        .eq("is_archived", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Таблица описаний</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка...</p>
      ) : !offers?.length ? (
        <p className="text-muted-foreground">Офферы пока не созданы.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Платная программа</TableHead>
                <TableHead>Описание аудитории</TableHead>
                <TableHead>Описание программы</TableHead>
                <TableHead>Тип оффера</TableHead>
                <TableHead>Оффер</TableHead>
                <TableHead>Google Docs оффера</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((o) => {
                const program = o.paid_programs as any;
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{program?.title ?? "—"}</TableCell>
                    <TableCell>
                      {program?.audience_doc_url ? (
                        <a
                          href={program.audience_doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Открыть <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {program?.program_doc_url ? (
                        <a
                          href={program.program_doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Открыть <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getOfferTypeLabel(o.offer_type)}</TableCell>
                    <TableCell>{o.title}</TableCell>
                    <TableCell>
                      {o.doc_url ? (
                        <a
                          href={o.doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Открыть <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
