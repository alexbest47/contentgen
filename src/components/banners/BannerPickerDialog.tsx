import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { BANNER_TYPES, getBannerTypeLabel, PLACEHOLDER_TO_BANNER_TYPE } from "@/lib/bannerConstants";
import { OFFER_TYPES, getOfferTypeLabel } from "@/lib/offerTypes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholderId: string;
  onSelect: (imageUrl: string) => void;
}

export default function BannerPickerDialog({ open, onOpenChange, placeholderId, onSelect }: Props) {
  const autoType = PLACEHOLDER_TO_BANNER_TYPE[placeholderId] || "";
  const [tab, setTab] = useState("paid_program");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterOfferType, setFilterOfferType] = useState("all");
  const [filterBannerType, setFilterBannerType] = useState(autoType || "all");
  const [filterColorScheme, setFilterColorScheme] = useState("all");

  const { data: banners = [] } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*, paid_programs(title), color_schemes(name, preview_colors)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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

  const filtered = banners.filter((b: any) => {
    if (b.category !== tab) return false;
    if (filterBannerType !== "all" && b.banner_type !== filterBannerType) return false;
    if (filterColorScheme !== "all" && b.color_scheme_id !== filterColorScheme) return false;
    if (tab === "paid_program" && filterProgram !== "all" && b.program_id !== filterProgram) return false;
    if (tab === "offer" && filterOfferType !== "all" && b.offer_type !== filterOfferType) return false;
    return true;
  });

  const handleSelect = (b: any) => {
    onSelect(b.image_url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Выбрать баннер</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="paid_program">Платные программы</TabsTrigger>
            <TabsTrigger value="offer">Офферы</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-3 mt-3">
            {tab === "paid_program" && (
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Программа" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все программы</SelectItem>
                  {programs.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {tab === "offer" && (
              <Select value={filterOfferType} onValueChange={setFilterOfferType}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Тип оффера" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {OFFER_TYPES.map((o) => (
                    <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={filterBannerType} onValueChange={setFilterBannerType}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Тип баннера" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {BANNER_TYPES.map((bt) => (
                  <SelectItem key={bt.key} value={bt.key}>{bt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterColorScheme} onValueChange={setFilterColorScheme}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Цветовая гамма" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все гаммы</SelectItem>
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

          <TabsContent value="paid_program" className="mt-3">
            <PickerGrid banners={filtered} onSelect={handleSelect} />
          </TabsContent>
          <TabsContent value="offer" className="mt-3">
            <PickerGrid banners={filtered} onSelect={handleSelect} />
          </TabsContent>
        </Tabs>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Баннеры не найдены
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PickerGrid({ banners, onSelect }: { banners: any[]; onSelect: (b: any) => void }) {
  if (banners.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {banners.map((b: any) => (
        <Card
          key={b.id}
          className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={() => onSelect(b)}
        >
          <div className="w-full bg-muted" style={{ aspectRatio: "600 / 220" }}>
            <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
          </div>
          <div className="p-2">
            <p className="text-sm font-medium truncate">{b.title}</p>
            <p className="text-xs text-muted-foreground">
              {getBannerTypeLabel(b.banner_type)}
              {b.color_schemes?.name && ` · ${b.color_schemes.name}`}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
