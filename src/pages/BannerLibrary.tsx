import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, ImageIcon, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";
import { BANNER_TYPES, getBannerTypeLabel, getBannerAspectRatio } from "@/lib/bannerConstants";
import { OFFER_TYPES, getOfferTypeLabel } from "@/lib/offerTypes";
import AddBannerDialog from "@/components/banners/AddBannerDialog";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import EditBannerDialog from "@/components/banners/EditBannerDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export default function BannerLibrary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { enqueue } = useTaskQueue();
  const [tab, setTab] = useState("paid_program");
  const [addOpen, setAddOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [deleteBanner, setDeleteBanner] = useState<any>(null);
  const [previewBanner, setPreviewBanner] = useState<any>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Filters
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterOfferType, setFilterOfferType] = useState<string>("all");
  const [filterBannerType, setFilterBannerType] = useState<string>("all");
  const [filterColorScheme, setFilterColorScheme] = useState<string>("all");

  const { data: banners = [], isLoading } = useQuery({
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

  const resetFilters = () => {
    setFilterProgram("all");
    setFilterOfferType("all");
    setFilterBannerType("all");
    setFilterColorScheme("all");
  };

  const handleDelete = async () => {
    if (!deleteBanner) return;
    const { error } = await supabase.from("banners").delete().eq("id", deleteBanner.id);
    if (error) toast.error("Ошибка удаления");
    else {
      toast.success("Баннер удалён");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    }
    setDeleteBanner(null);
  };

  const handleRegenerate = async (banner: any) => {
    setRegeneratingId(banner.id);
    await enqueue({
      functionName: "generate-banner-image",
      payload: {
        prompt: banner.generation_prompt,
        banner_type: banner.banner_type,
        color_scheme_id: banner.color_scheme_id || null,
        title: banner.title,
        category: banner.category,
        program_id: banner.program_id || null,
        offer_type: banner.offer_type || null,
        note: banner.note || "",
        created_by: banner.created_by,
        existing_banner_id: banner.id,
      },
      displayTitle: `Перегенерация: ${banner.title}`,
      lane: "openrouter",
      targetUrl: "/banner-library",
    });
    setRegeneratingId(null);
  };

  const isEmpty = banners.length === 0;
  const noResults = !isEmpty && filtered.length === 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Библиотека баннеров</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Добавить баннер
        </Button>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium">Библиотека пока пуста</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Добавьте первый баннер — загрузите готовый или сгенерируйте через Imagen
          </p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Добавить баннер
          </Button>
        </div>
      ) : (
        <>
          <Tabs value={tab} onValueChange={(v) => { setTab(v); resetFilters(); }}>
            <TabsList>
              <TabsTrigger value="paid_program">Платные программы</TabsTrigger>
              <TabsTrigger value="offer">Офферы</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap gap-3 mt-4">
              {tab === "paid_program" && (
                <Select value={filterProgram} onValueChange={setFilterProgram}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Программа" /></SelectTrigger>
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
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Тип оффера" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы офферов</SelectItem>
                    {OFFER_TYPES.map((o) => (
                      <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={filterBannerType} onValueChange={setFilterBannerType}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Тип баннера" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {BANNER_TYPES.map((bt) => (
                    <SelectItem key={bt.key} value={bt.key}>{bt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterColorScheme} onValueChange={setFilterColorScheme}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Цветовая гамма" /></SelectTrigger>
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

            <TabsContent value="paid_program" className="mt-4">
              <BannerGrid banners={filtered} onEdit={setEditBanner} onDelete={setDeleteBanner} onPreview={setPreviewBanner} onRegenerate={handleRegenerate} onDownload={handleDownload} regeneratingId={regeneratingId} />
            </TabsContent>
            <TabsContent value="offer" className="mt-4">
              <BannerGrid banners={filtered} onEdit={setEditBanner} onDelete={setDeleteBanner} onPreview={setPreviewBanner} onRegenerate={handleRegenerate} onDownload={handleDownload} regeneratingId={regeneratingId} />
            </TabsContent>
          </Tabs>

          {noResults && (
            <div className="flex flex-col items-center py-16 text-center">
              <p className="text-lg font-medium">Баннеры не найдены</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Попробуйте изменить фильтры</p>
              <Button variant="outline" onClick={resetFilters}>Сбросить фильтры</Button>
            </div>
          )}
        </>
      )}

      <AddBannerDialog open={addOpen} onOpenChange={setAddOpen} />
      {editBanner && (
        <EditBannerDialog banner={editBanner} open={!!editBanner} onOpenChange={(o) => !o && setEditBanner(null)} />
      )}
      <Dialog open={!!previewBanner} onOpenChange={(o) => !o && setPreviewBanner(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-none [&>button]:text-white">
          <DialogHeader className="px-2 pt-2">
            <DialogTitle className="text-white text-sm font-medium truncate">
              {previewBanner?.title}
            </DialogTitle>
          </DialogHeader>
          {previewBanner && (
            <img
              src={previewBanner.image_url}
              alt={previewBanner.title}
              className="w-full max-h-[85vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteBanner} onOpenChange={(o) => !o && setDeleteBanner(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить баннер?</AlertDialogTitle>
            <AlertDialogDescription>
              Баннер «{deleteBanner?.title}» будет удалён безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const handleDownload = async (banner: any) => {
  try {
    const res = await fetch(banner.image_url);
    const blob = await res.blob();
    const ext = banner.image_url.split('.').pop()?.split('?')[0] || 'png';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${banner.title}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    toast.error("Ошибка скачивания");
  }
};

function BannerGrid({ banners, onEdit, onDelete, onPreview, onRegenerate, onDownload, regeneratingId }: { banners: any[]; onEdit: (b: any) => void; onDelete: (b: any) => void; onPreview: (b: any) => void; onRegenerate: (b: any) => void; onDownload: (b: any) => void; regeneratingId: string | null }) {
  if (banners.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {banners.map((b: any) => (
        <Card key={b.id} className="overflow-hidden">
          <div
            className="w-full bg-muted cursor-pointer relative"
            style={{ aspectRatio: `${600} / ${getBannerDims(b.banner_type).h}` }}
            onClick={() => onPreview(b)}
          >
            <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
            {regeneratingId === b.id && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="p-3 space-y-1">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="font-medium truncate">{b.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {b.category === "paid_program" ? b.paid_programs?.title : getOfferTypeLabel(b.offer_type || "")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getBannerTypeLabel(b.banner_type)}
                  {b.color_schemes?.name && ` · ${b.color_schemes.name}`}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {b.source === "generated" && b.generation_prompt && (
                    <DropdownMenuItem onClick={() => onRegenerate(b)}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Перегенерировать
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onEdit(b)}>
                    <Pencil className="h-4 w-4 mr-2" /> Редактировать метаданные
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(b)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function getBannerDims(type: string): { w: number; h: number } {
  const map: Record<string, { w: number; h: number }> = {
    header_banner: { w: 600, h: 200 },
    case_card: { w: 600, h: 240 },
    program_banner: { w: 600, h: 220 },
  };
  return map[type] || { w: 600, h: 200 };
}
