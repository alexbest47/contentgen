import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Image, Video, Loader2,
  ChevronUp, ChevronDown, Play, Upload, Sparkles, X, ImagePlus, Library,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

// ─── Types ───
interface VideoProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  program_id: string | null;
  offer_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface VideoStage {
  id: string;
  video_project_id: string;
  sort_order: number;
  stage_type: string;
  model: string | null;
  prompt: string | null;
  config: Record<string, any>;
  reference_image_url: string | null;
  start_frame_url: string | null;
  result_url: string | null;
  result_metadata: Record<string, any> | null;
  task_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Constants ───
const IMAGE_MODELS = [
  { value: "google/gemini-3.1-flash-image-preview", label: "Google Gemini Flash 3.1 Image" },
];

const VIDEO_MODELS = [
  { value: "veo-3.1-fast-generate-preview", label: "Veo 3.1 Fast" },
  { value: "veo-3.1-generate-preview", label: "Veo 3.1 Standard" },
  { value: "veo-3.1-lite-generate-preview", label: "Veo 3.1 Lite" },
];

const ASPECT_RATIOS = [
  { value: "9:16", label: "9:16 (Вертикальный)" },
  { value: "16:9", label: "16:9 (Горизонтальный)" },
  { value: "1:1", label: "1:1 (Квадрат)" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
];

const QUALITY_LEVELS = [
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K" },
];

// Calculate actual pixel resolution from aspect ratio + quality
function getResolution(aspectRatio: string, quality: string): string {
  // Base short side for each quality tier
  const baseSize: Record<string, number> = { "1K": 1024, "2K": 2048, "4K": 4096 };
  const base = baseSize[quality] || 1024;

  const [w, h] = aspectRatio.split(":").map(Number);
  if (!w || !h) return `${base}x${base}`;

  if (w >= h) {
    // Landscape or square: base = height
    const width = Math.round((base * w) / h);
    return `${width}x${base}`;
  } else {
    // Portrait: base = width
    const height = Math.round((base * h) / w);
    return `${base}x${height}`;
  }
}

const VIDEO_DURATIONS = [
  { value: 4, label: "4 сек" },
  { value: 6, label: "6 сек" },
  { value: 8, label: "8 сек" },
];

const VIDEO_RESOLUTIONS = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
];

const STAGE_STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  generating: "Генерация...",
  completed: "Готово",
  error: "Ошибка",
};

const STAGE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  generating: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

// ─── Main Component ───
export default function VideoProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState<VideoProject | null>(null);
  const [stages, setStages] = useState<VideoStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ─── Load data ───
  const loadData = useCallback(async () => {
    if (!id) return;
    const [projRes, stagesRes] = await Promise.all([
      supabase.from("video_projects").select("*").eq("id", id).single(),
      supabase.from("video_stages").select("*").eq("video_project_id", id).order("sort_order"),
    ]);
    if (projRes.data) setProject(projRes.data as VideoProject);
    if (stagesRes.data) setStages(stagesRes.data as VideoStage[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Stage CRUD ───
  const addStage = async (type: "image" | "video", afterIndex?: number) => {
    if (!id) return;
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : stages.length;
    const defaultModel = type === "image"
      ? IMAGE_MODELS[0].value
      : VIDEO_MODELS[0].value;

    const defaultConfig: Record<string, any> = type === "image"
      ? { aspect_ratio: "9:16", quality: "1K" }
      : { aspect_ratio: "9:16", duration: 4, resolution: "720p", generate_audio: true };

    // Shift sort_orders of subsequent stages
    if (insertAt < stages.length) {
      const updates = stages
        .filter((s) => s.sort_order >= insertAt)
        .map((s) => supabase.from("video_stages").update({ sort_order: s.sort_order + 1 }).eq("id", s.id));
      await Promise.all(updates);
    }

    const { data, error } = await supabase
      .from("video_stages")
      .insert({
        video_project_id: id,
        sort_order: insertAt,
        stage_type: type,
        model: defaultModel,
        config: defaultConfig,
      })
      .select("*")
      .single();

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }
    await loadData();
  };

  const deleteStage = async (stageId: string) => {
    await supabase.from("video_stages").delete().eq("id", stageId);
    await loadData();
    toast({ title: "Этап удалён" });
  };

  const moveStage = async (stageId: string, direction: "up" | "down") => {
    const idx = stages.findIndex((s) => s.id === stageId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= stages.length) return;

    await Promise.all([
      supabase.from("video_stages").update({ sort_order: stages[swapIdx].sort_order }).eq("id", stages[idx].id),
      supabase.from("video_stages").update({ sort_order: stages[idx].sort_order }).eq("id", stages[swapIdx].id),
    ]);
    await loadData();
  };

  // Debounce timers for DB writes
  const dbTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const updateStageField = async (stageId: string, field: string, value: any) => {
    // 1. Update local state IMMEDIATELY (optimistic)
    setStages((prev) => prev.map((s) => s.id === stageId ? { ...s, [field]: value } : s));

    // 2. For text fields (prompt), debounce DB writes to avoid hammering on every keystroke
    if (field === "prompt") {
      const timerKey = `${stageId}_${field}`;
      if (dbTimers.current[timerKey]) clearTimeout(dbTimers.current[timerKey]);
      dbTimers.current[timerKey] = setTimeout(async () => {
        await supabase
          .from("video_stages")
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq("id", stageId);
        delete dbTimers.current[timerKey];
      }, 500);
    } else {
      // Non-text fields: save immediately
      await supabase
        .from("video_stages")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", stageId);
    }
  };

  // Force flush any pending debounced writes for a stage
  const flushStageToDb = async (stageId: string) => {
    // Cancel pending timers for this stage
    Object.keys(dbTimers.current).forEach((key) => {
      if (key.startsWith(stageId)) {
        clearTimeout(dbTimers.current[key]);
        delete dbTimers.current[key];
      }
    });
    // Get current stage from state and save prompt to DB
    const currentStage = stages.find((s) => s.id === stageId);
    // Use a callback to read the latest state
    return new Promise<void>((resolve) => {
      setStages((prev) => {
        const s = prev.find((st) => st.id === stageId);
        if (s) {
          supabase
            .from("video_stages")
            .update({ prompt: s.prompt, updated_at: new Date().toISOString() })
            .eq("id", stageId)
            .then(() => resolve());
        } else {
          resolve();
        }
        return prev; // don't change state
      });
    });
  };

  const updateStageConfig = async (stageId: string, key: string, value: any) => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;
    const newConfig = { ...stage.config, [key]: value };
    await updateStageField(stageId, "config", newConfig);
  };

  // ─── Use previous stage result as start frame ───
  const getPreviousResultUrl = (stageIndex: number): string | null => {
    for (let i = stageIndex - 1; i >= 0; i--) {
      if (stages[i].result_url) return stages[i].result_url;
    }
    return null;
  };

  // ─── Upload reference image to storage ───
  const uploadReferenceImage = async (stageId: string, file: File) => {
    const ext = file.name.split(".").pop() || "png";
    const filePath = `video-content/${id}/references/${stageId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("generated-images")
      .upload(filePath, file, { contentType: file.type, upsert: true });

    if (uploadErr) {
      toast({ title: "Ошибка загрузки", description: uploadErr.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("generated-images").getPublicUrl(filePath);
    await updateStageField(stageId, "reference_image_url", urlData.publicUrl);
    toast({ title: "Референс загружен" });
  };

  // ─── Generate (enqueue task) ───
  const generateStage = async (stage: VideoStage) => {
    if (!stage.prompt?.trim()) {
      toast({ title: "Укажите промпт", variant: "destructive" });
      return;
    }

    // Flush any pending prompt edits to DB before generating
    await flushStageToDb(stage.id);

    // Optimistically set status to generating
    setStages((prev) =>
      prev.map((s) => (s.id === stage.id ? { ...s, status: "generating" } : s))
    );

    try {
      const { data, error } = await supabase.functions.invoke("enqueue-task", {
        body: {
          function_name: "generate-video-content",
          payload: { stage_id: stage.id },
          display_title: `${stage.stage_type === "image" ? "Изображение" : "Видео"}: ${stage.prompt?.substring(0, 60)}...`,
          lane: stage.stage_type === "video" ? "google-ai" : "openrouter",
          task_type: "video",
          target_url: `/vertical-content/${id}`,
        },
      });

      if (error) throw error;

      const taskId = data?.task_id;
      if (taskId) {
        // Update stage with task_id
        await supabase
          .from("video_stages")
          .update({ task_id: taskId, status: "generating", updated_at: new Date().toISOString() })
          .eq("id", stage.id);

        setStages((prev) =>
          prev.map((s) => (s.id === stage.id ? { ...s, task_id: taskId, status: "generating" } : s))
        );

        toast({ title: "Генерация запущена", description: "Задача добавлена в очередь" });

        // Start polling for result
        pollStageStatus(stage.id);
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
      setStages((prev) =>
        prev.map((s) => (s.id === stage.id ? { ...s, status: "error", error_message: e.message } : s))
      );
    }
  };

  // ─── Poll stage status ───
  const pollStageStatus = (stageId: string) => {
    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("video_stages")
        .select("status, result_url, result_metadata, error_message, task_id")
        .eq("id", stageId)
        .single();

      if (error || !data) {
        clearInterval(interval);
        return;
      }

      if (data.status === "completed" || data.status === "error") {
        clearInterval(interval);
        setStages((prev) =>
          prev.map((s) =>
            s.id === stageId
              ? { ...s, status: data.status, result_url: data.result_url, result_metadata: data.result_metadata, error_message: data.error_message }
              : s
          )
        );
        if (data.status === "completed") {
          toast({ title: "Генерация завершена!" });
        } else {
          toast({ title: "Ошибка генерации", description: data.error_message || "", variant: "destructive" });
        }
        return;
      }

      // If stage is still "generating", also check task_queue for errors
      if (data.status === "generating" && data.task_id) {
        const { data: task } = await supabase
          .from("task_queue")
          .select("status, error_message")
          .eq("id", data.task_id)
          .single();

        if (task && (task.status === "error" || task.status === "failed")) {
          clearInterval(interval);
          const errMsg = task.error_message || "Ошибка генерации";
          // Sync stage status to error
          await supabase
            .from("video_stages")
            .update({ status: "error", error_message: errMsg, updated_at: new Date().toISOString() })
            .eq("id", stageId);
          setStages((prev) =>
            prev.map((s) =>
              s.id === stageId
                ? { ...s, status: "error", error_message: errMsg }
                : s
            )
          );
          toast({ title: "Ошибка генерации", description: errMsg, variant: "destructive" });
        }
      }
    }, 3000);

    // Safety: stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  };

  // ─── Collect all project images for library ───
  const projectImages = (() => {
    const images: { url: string; label: string; stageIndex: number }[] = [];
    const seen = new Set<string>();
    stages.forEach((s, idx) => {
      const tag = s.stage_type === "image" ? "Фото" : "Видео";
      if (s.result_url && s.stage_type === "image" && !seen.has(s.result_url)) {
        seen.add(s.result_url);
        images.push({ url: s.result_url, label: `#${idx + 1} ${tag} — результат`, stageIndex: idx });
      }
      if (s.reference_image_url && !seen.has(s.reference_image_url)) {
        seen.add(s.reference_image_url);
        images.push({ url: s.reference_image_url, label: `#${idx + 1} ${tag} — референс`, stageIndex: idx });
      }
      if (s.start_frame_url && !seen.has(s.start_frame_url)) {
        seen.add(s.start_frame_url);
        images.push({ url: s.start_frame_url, label: `#${idx + 1} ${tag} — start frame`, stageIndex: idx });
      }
    });
    return images;
  })();

  // ─── Resume polling for any stages that are currently generating ───
  useEffect(() => {
    stages.forEach((s) => {
      if (s.status === "generating") {
        pollStageStatus(s.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]); // run once after initial load

  // ─── Cancel generation ───
  const cancelGeneration = async (stageId: string) => {
    await supabase
      .from("video_stages")
      .update({ status: "draft", error_message: null, updated_at: new Date().toISOString() })
      .eq("id", stageId);
    setStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, status: "draft", error_message: null } : s))
    );
    toast({ title: "Генерация отменена" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Загрузка...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Проект не найден
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vertical-content")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <Badge className={STAGE_STATUS_COLORS[project.status] || ""}>
          {project.status === "draft" ? "Черновик" : project.status}
        </Badge>
      </div>

      {/* Stages */}
      {stages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-4">Добавьте первый этап видео</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => addStage("image")}>
                <Image className="mr-2 h-4 w-4" /> Изображение
              </Button>
              <Button variant="outline" onClick={() => addStage("video")}>
                <Video className="mr-2 h-4 w-4" /> Видео
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, idx) => (
            <div key={stage.id}>
              <StageCard
                stage={stage}
                index={idx}
                total={stages.length}
                previousResultUrl={getPreviousResultUrl(idx)}
                projectImages={projectImages}
                onUpdateField={(field, value) => updateStageField(stage.id, field, value)}
                onUpdateConfig={(key, value) => updateStageConfig(stage.id, key, value)}
                onDelete={() => deleteStage(stage.id)}
                onMoveUp={() => moveStage(stage.id, "up")}
                onMoveDown={() => moveStage(stage.id, "down")}
                onGenerate={() => generateStage(stage)}
                onUploadReference={(file) => uploadReferenceImage(stage.id, file)}
                onCancelGeneration={() => cancelGeneration(stage.id)}
              />

              {/* Add stage between */}
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-2">
                  <div className="h-px w-16 bg-border" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addStage("image", idx)}
                  >
                    <Image className="mr-1 h-3 w-3" /> + Фото
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addStage("video", idx)}
                  >
                    <Video className="mr-1 h-3 w-3" /> + Видео
                  </Button>
                  <div className="h-px w-16 bg-border" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Project Image Picker (library dialog) ───
function ProjectImagePicker({
  projectImages,
  onSelect,
  trigger,
}: {
  projectImages: { url: string; label: string; stageIndex: number }[];
  onSelect: (url: string) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (projectImages.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Изображения проекта</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[60vh] pr-1">
          {projectImages.map((img, i) => (
            <button
              key={i}
              className="group relative aspect-square rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary transition-all"
              onClick={() => { onSelect(img.url); setOpen(false); }}
            >
              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] px-1 py-0.5 leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                {img.label}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reference Image Field ───
function ReferenceImageField({
  referenceUrl,
  onUpdateUrl,
  onUploadFile,
  projectImages,
}: {
  referenceUrl: string | null;
  onUpdateUrl: (url: string | null) => void;
  onUploadFile: (file: File) => void;
  projectImages: { url: string; label: string; stageIndex: number }[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "url">(referenceUrl && !referenceUrl.includes("generated-images") ? "url" : "upload");

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs">Референс (необязательно)</Label>
        <div className="flex gap-1">
          {projectImages.length > 0 && (
            <ProjectImagePicker
              projectImages={projectImages}
              onSelect={(url) => onUpdateUrl(url)}
              trigger={
                <button
                  type="button"
                  className="text-[10px] px-1.5 py-0.5 rounded text-muted-foreground hover:bg-muted flex items-center gap-0.5"
                >
                  <Library className="h-2.5 w-2.5" />
                  Из проекта
                </button>
              }
            />
          )}
          <button
            type="button"
            className={`text-[10px] px-1.5 py-0.5 rounded ${mode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            onClick={() => setMode("upload")}
          >
            Загрузить
          </button>
          <button
            type="button"
            className={`text-[10px] px-1.5 py-0.5 rounded ${mode === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            onClick={() => setMode("url")}
          >
            URL
          </button>
        </div>
      </div>

      {referenceUrl ? (
        <div className="relative inline-block">
          <img src={referenceUrl} alt="Референс" className="max-h-24 rounded border" />
          <button
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
            onClick={() => onUpdateUrl(null)}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : mode === "upload" ? (
        <>
          <div
            className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">Кликните для выбора · макс. 5 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 5 * 1024 * 1024) {
                alert("Файл слишком большой (макс. 5 MB)");
                return;
              }
              onUploadFile(f);
              e.target.value = "";
            }}
          />
        </>
      ) : (
        <Input
          value={referenceUrl || ""}
          onChange={(e) => onUpdateUrl(e.target.value || null)}
          placeholder="https://..."
          className="h-8 text-xs"
        />
      )}
    </div>
  );
}

// ─── Stage Card Component ───
function StageCard({
  stage,
  index,
  total,
  previousResultUrl,
  projectImages,
  onUpdateField,
  onUpdateConfig,
  onDelete,
  onMoveUp,
  onMoveDown,
  onGenerate,
  onUploadReference,
  onCancelGeneration,
}: {
  stage: VideoStage;
  index: number;
  total: number;
  previousResultUrl: string | null;
  projectImages: { url: string; label: string; stageIndex: number }[];
  onUpdateField: (field: string, value: any) => void;
  onUpdateConfig: (key: string, value: any) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onGenerate: () => void;
  onUploadReference: (file: File) => void;
  onCancelGeneration: () => void;
}) {
  const isImage = stage.stage_type === "image";
  const isVideo = stage.stage_type === "video";
  const models = isImage ? IMAGE_MODELS : VIDEO_MODELS;

  return (
    <Card className={`transition-shadow ${stage.status === "generating" ? "ring-2 ring-amber-300" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
            <Badge variant="outline" className="gap-1">
              {isImage ? <Image className="h-3 w-3" /> : <Video className="h-3 w-3" />}
              {isImage ? "Изображение" : "Видео"}
            </Badge>
            <Badge className={`text-[10px] ${STAGE_STATUS_COLORS[stage.status] || ""}`}>
              {STAGE_STATUS_LABELS[stage.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp} disabled={index === 0}>
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown} disabled={index === total - 1}>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Two-column layout: settings + preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Settings */}
          <div className="space-y-3">
            {/* Model */}
            <div>
              <Label className="text-xs">Модель</Label>
              <Select value={stage.model || models[0].value} onValueChange={(v) => onUpdateField("model", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prompt */}
            <div>
              <Label className="text-xs">Промпт</Label>
              <Textarea
                value={stage.prompt || ""}
                onChange={(e) => onUpdateField("prompt", e.target.value)}
                placeholder="Опишите, что нужно сгенерировать..."
                rows={3}
                className="text-xs"
              />
            </div>

            {/* Aspect Ratio */}
            <div>
              <Label className="text-xs">Соотношение сторон</Label>
              <Select
                value={stage.config?.aspect_ratio || "9:16"}
                onValueChange={(v) => onUpdateConfig("aspect_ratio", v)}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((ar) => (
                    <SelectItem key={ar.value} value={ar.value}>{ar.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image-specific: Quality */}
            {isImage && (
              <div>
                <Label className="text-xs">Разрешение</Label>
                <Select
                  value={stage.config?.quality || "1K"}
                  onValueChange={(v) => onUpdateConfig("quality", v)}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUALITY_LEVELS.map((q) => (
                      <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {getResolution(stage.config?.aspect_ratio || "9:16", stage.config?.quality || "1K")} px
                </p>
              </div>
            )}

            {/* Video-specific settings */}
            {isVideo && (
              <>
                <div>
                  <Label className="text-xs">Длительность</Label>
                  <Select
                    value={String(stage.config?.duration || 4)}
                    onValueChange={(v) => onUpdateConfig("duration", Number(v))}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIDEO_DURATIONS.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Разрешение</Label>
                  <Select
                    value={stage.config?.resolution || "720p"}
                    onValueChange={(v) => onUpdateConfig("resolution", v)}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VIDEO_RESOLUTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={stage.config?.generate_audio !== false}
                    onCheckedChange={(v) => onUpdateConfig("generate_audio", !!v)}
                  />
                  <Label className="text-xs font-normal">Генерировать аудио</Label>
                </div>

                {/* Start frame */}
                <div>
                  <Label className="text-xs">Start Frame (необязательно)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {stage.start_frame_url ? (
                      <div className="flex items-center gap-2">
                        <img src={stage.start_frame_url} className="h-10 w-10 rounded object-cover" alt="" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive"
                          onClick={() => onUpdateField("start_frame_url", null)}
                        >
                          Убрать
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {previousResultUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onUpdateField("start_frame_url", previousResultUrl)}
                          >
                            Из предыдущего этапа
                          </Button>
                        )}
                        {projectImages.length > 0 && (
                          <ProjectImagePicker
                            projectImages={projectImages}
                            onSelect={(url) => onUpdateField("start_frame_url", url)}
                            trigger={
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                <Library className="mr-1 h-3 w-3" />
                                Из проекта
                              </Button>
                            }
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Reference image */}
            <ReferenceImageField
              referenceUrl={stage.reference_image_url}
              onUpdateUrl={(url) => onUpdateField("reference_image_url", url)}
              onUploadFile={onUploadReference}
              projectImages={projectImages}
            />
          </div>

          {/* Right: Preview / Result */}
          <div className="flex flex-col items-center justify-center min-h-[200px] bg-muted/30 rounded-lg border border-dashed p-4">
            {stage.status === "generating" && (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Генерация...</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-destructive hover:text-destructive"
                  onClick={onCancelGeneration}
                >
                  <X className="mr-1 h-3 w-3" />
                  Отменить
                </Button>
              </div>
            )}

            {stage.status === "completed" && stage.result_url && (
              <div className="w-full">
                {isImage ? (
                  <img src={stage.result_url} className="w-full rounded-lg" alt="Результат" />
                ) : (
                  <video src={stage.result_url} controls className="w-full rounded-lg" />
                )}
              </div>
            )}

            {stage.status === "error" && (
              <div className="text-center">
                <p className="text-xs text-destructive">{stage.error_message || "Ошибка генерации"}</p>
              </div>
            )}

            {stage.status === "draft" && (
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  {isImage ? <Image className="h-6 w-6 text-muted-foreground" /> : <Video className="h-6 w-6 text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground mb-3">Результат появится здесь</p>
              </div>
            )}

            {/* Generate button */}
            <Button
              size="sm"
              className="mt-2"
              onClick={onGenerate}
              disabled={stage.status === "generating" || !stage.prompt?.trim()}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {stage.status === "completed" ? "Перегенерировать" : "Генерировать"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
