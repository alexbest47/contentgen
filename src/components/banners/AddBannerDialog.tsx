import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, RotateCcw, Upload } from "lucide-react";
import { BANNER_TYPES, BANNER_PROMPT_TEMPLATES, getBannerDimensions, getBannerTypeLabel } from "@/lib/bannerConstants";
import { OFFER_TYPES } from "@/lib/offerTypes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddBannerDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { enqueue } = useTaskQueue();

  const [mode, setMode] = useState<"upload" | "generate">("upload");
  const [title, setTitle] = useState("");
  const [bannerType, setBannerType] = useState("");
  const [category, setCategory] = useState<"paid_program" | "offer">("paid_program");
  const [programId, setProgramId] = useState("");
  const [offerType, setOfferType] = useState("");
  const [colorSchemeId, setColorSchemeId] = useState("");
  const [note, setNote] = useState("");
  const [prompt, setPrompt] = useState("");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate state
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

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
      const { data } = await supabase.from("color_schemes").select("id, name, preview_colors, description").eq("is_active", true).order("name");
      return data || [];
    },
  });

  // Update prompt template when banner type changes
  useEffect(() => {
    if (bannerType && mode === "generate") {
      setPrompt(BANNER_PROMPT_TEMPLATES[bannerType] || "");
    }
  }, [bannerType, mode]);

  const resetForm = () => {
    setTitle(""); setBannerType(""); setCategory("paid_program");
    setProgramId(""); setOfferType(""); setColorSchemeId("");
    setNote(""); setPrompt(""); setFile(null); setPreviewUrl(null);
    setSizeError(null); setGenerating(false); setGeneratedUrl(null);
    setGenError(null); setSaving(false); setMode("upload");
  };

  const handleFileSelect = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой (макс. 5MB)");
      return;
    }
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setFile(f);
    setSizeError(null);

    // Validate dimensions
    if (bannerType) {
      const img = new Image();
      img.onload = () => {
        const dims = getBannerDimensions(bannerType);
        if (dims && (img.width !== dims.width || img.height !== dims.height)) {
          setSizeError(`Размер изображения не соответствует типу баннера. Ожидается ${dims.width}×${dims.height}px, получено ${img.width}×${img.height}px`);
        }
      };
      img.src = url;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleUploadSave = async () => {
    if (!file || !title || !bannerType || !user) return;
    if (sizeError) return;
    setSaving(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `banners/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("generated-images").upload(fileName, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from("generated-images").getPublicUrl(fileName);

      const { error } = await supabase.from("banners").insert({
        title,
        banner_type: bannerType,
        category,
        program_id: category === "paid_program" && programId ? programId : null,
        offer_type: category === "offer" ? offerType : null,
        color_scheme_id: colorSchemeId || null,
        image_url: pub.publicUrl,
        source: "uploaded",
        note,
        created_by: user.id,
      } as any);
      if (error) throw error;

      toast.success("Баннер сохранён");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      onOpenChange(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!bannerType || !prompt) return;
    setGenerating(true);
    setGenError(null);
    setGeneratedUrl(null);
    try {
      const taskId = await enqueue({
        functionName: "generate-banner-image",
        payload: {
          prompt,
          banner_type: bannerType,
          color_scheme_id: colorSchemeId || null,
        },
        displayTitle: `Генерация баннера: ${title || getBannerTypeLabel(bannerType)}`,
        lane: "openrouter",
        targetUrl: "/banner-library",
      });

      // Poll for completion
      if (taskId) {
        const pollInterval = setInterval(async () => {
          const { data: task } = await supabase
            .from("task_queue")
            .select("status, result, error_message")
            .eq("id", taskId)
            .single();
          if (task?.status === "completed") {
            clearInterval(pollInterval);
            setGenerating(false);
            const result = task.result as any;
            setGeneratedUrl(result?.image_url || null);
          } else if (task?.status === "error") {
            clearInterval(pollInterval);
            setGenerating(false);
            setGenError(task.error_message || "Ошибка генерации");
          }
        }, 3000);
        setTimeout(() => { clearInterval(pollInterval); setGenerating(false); }, 5 * 60 * 1000);
      }
    } catch (e: any) {
      setGenerating(false);
      setGenError(e.message || "Ошибка");
    }
  };

  const handleGenerateSave = async () => {
    if (!generatedUrl || !title || !bannerType || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("banners").insert({
        title,
        banner_type: bannerType,
        category,
        program_id: category === "paid_program" && programId ? programId : null,
        offer_type: category === "offer" ? offerType : null,
        color_scheme_id: colorSchemeId || null,
        image_url: generatedUrl,
        source: "generated",
        generation_prompt: prompt,
        note,
        created_by: user.id,
      } as any);
      if (error) throw error;
      toast.success("Баннер сохранён в библиотеку");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      onOpenChange(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const dims = bannerType ? getBannerDimensions(bannerType) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить баннер</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1">Загрузить</TabsTrigger>
            <TabsTrigger value="generate" className="flex-1">Сгенерировать</TabsTrigger>
          </TabsList>

          {/* Common fields */}
          <div className="space-y-4 mt-4">
            <div>
              <Label>Название *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название баннера" />
            </div>
            <div>
              <Label>Тип баннера *</Label>
              <Select value={bannerType} onValueChange={setBannerType}>
                <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                <SelectContent>
                  {BANNER_TYPES.map((bt) => (
                    <SelectItem key={bt.key} value={bt.key}>
                      {bt.label} ({bt.width}×{bt.height}px)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dims && <p className="text-xs text-muted-foreground mt-1">Размер: {dims.width}×{dims.height}px</p>}
            </div>
            <div>
              <Label>Категория *</Label>
              <RadioGroup value={category} onValueChange={(v) => setCategory(v as any)} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="paid_program" id="cat-program" />
                  <Label htmlFor="cat-program">Платная программа</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="offer" id="cat-offer" />
                  <Label htmlFor="cat-offer">Оффер</Label>
                </div>
              </RadioGroup>
            </div>
            {category === "paid_program" && (
              <div>
                <Label>Программа</Label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger><SelectValue placeholder="Выберите программу" /></SelectTrigger>
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
                  <SelectTrigger><SelectValue placeholder="Выберите тип оффера" /></SelectTrigger>
                  <SelectContent>
                    {OFFER_TYPES.map((o) => (
                      <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Цветовая гамма{mode === "generate" ? " *" : ""}</Label>
              <Select value={colorSchemeId} onValueChange={setColorSchemeId}>
                <SelectTrigger><SelectValue placeholder="Выберите гамму" /></SelectTrigger>
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
          </div>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div>
              <Label>Загрузить изображение *</Label>
              <div
                className="mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded" />
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p>Перетащите файл сюда или кликните для выбора</p>
                    <p className="text-xs mt-1">JPG, PNG, WebP · макс. 5 MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              {sizeError && <p className="text-sm text-destructive mt-1">{sizeError}</p>}
            </div>
            <div>
              <Label>Заметка</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Необязательно" rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Отмена</Button>
              <Button
                onClick={handleUploadSave}
                disabled={!title || !bannerType || !file || !!sizeError || saving}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Сохранить
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between">
                <Label>Промпт</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPrompt(BANNER_PROMPT_TEMPLATES[bannerType] || "")}
                  disabled={!bannerType}
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Сбросить к шаблону
                </Button>
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={bannerType ? "Промпт для генерации" : "Сначала выберите тип баннера"}
                rows={8}
                disabled={!bannerType}
              />
            </div>
            <div>
              <Label>Заметка</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Необязательно" rows={2} />
            </div>

            {generating && (
              <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Генерируем изображение…</span>
              </div>
            )}

            {generatedUrl && (
              <div className="space-y-3">
                <img src={generatedUrl} alt="Generated" className="w-full rounded-lg border" />
                <div className="flex gap-2">
                  <Button onClick={handleGenerateSave} disabled={!title || saving} className="flex-1">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Сохранить в библиотеку
                  </Button>
                  <Button variant="outline" onClick={handleGenerate}>Перегенерировать</Button>
                </div>
              </div>
            )}

            {genError && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{genError}</p>
                <Button variant="outline" onClick={handleGenerate}>Попробовать снова</Button>
              </div>
            )}

            {!generating && !generatedUrl && !genError && (
              <Button
                onClick={handleGenerate}
                disabled={!bannerType || !prompt || (mode === "generate" && !colorSchemeId)}
                className="w-full"
              >
                Сгенерировать
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
