import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RefreshCw, Loader2, Image, Layers, Copy } from "lucide-react";
import PipelineResultView from "@/components/project/PipelineResultView";
import { toast } from "sonner";
import { usePromptInfo } from "@/hooks/usePromptInfo";

const contentTypeLabels: Record<string, string> = {
  instagram: "Пост в Instagram",
  telegram: "Пост в Telegram",
  vk: "Пост в ВКонтакте",
  email: "Email-рассылка",
};

const isEmailType = (ct: string) => ct === "email";

export default function ContentDetail() {
  const { programId, offerType, offerId, projectId, contentType } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [generatingImagesKey, setGeneratingImagesKey] = useState<string | null>(null);
  const [carouselProgress, setCarouselProgress] = useState<{ current: number; total: number } | null>(null);
  const abortRef = useRef(false);
  const copyHtmlRef = useRef<(() => void) | null>(null);

  const backUrl = `/programs/${programId}/offers/${offerType}/${offerId}/projects/${projectId}`;
  const isEmail = isEmailType(contentType!);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("content_type")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const supportsCarousel = !["expert_content", "provocative_content", "testimonial_content", "myth_busting"].includes(project?.content_type ?? "");
  const supportsStaticImage = !["list_content"].includes(project?.content_type ?? "");

  const { data: promptInfo } = usePromptInfo({
    content_type: contentType,
    enabled: !!contentType,
  });

  const { data: contentPieces } = useQuery({
    queryKey: ["content_pieces", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_pieces")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getContentByCategory = (category: string) =>
    contentPieces?.find((cp) => cp.category === category);

  const pipelineJson = getContentByCategory(`pipeline_json_${contentType}`);

  const carouselImages = contentPieces
    ?.filter((cp) => cp.category.startsWith(`carousel_${contentType}_`))
    .map((cp) => {
      const match = cp.category.match(/carousel_\w+_(\d+)$/);
      return { slideNumber: match ? parseInt(match[1]) : 0, url: cp.content };
    })
    .sort((a, b) => a.slideNumber - b.slideNumber) ?? [];

  const staticImage = getContentByCategory(`static_image_${contentType}`)?.content;
  const bannerImage = getContentByCategory(`banner_${contentType}`)?.content;

  const generatePipelineMutation = useMutation({
    mutationFn: async () => {
      setGeneratingKey("pipeline");
      const { data, error } = await supabase.functions.invoke("generate-pipeline", {
        body: { project_id: projectId, content_type: contentType },
      });
      if (error) throw new Error(error.message || "Ошибка генерации");
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_pieces", projectId] });
      toast.success("Контент обновлён!");
      setGeneratingKey(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setGeneratingKey(null);
    },
  });

  const generateCarouselProgressively = async () => {
    if (!pipelineJson) {
      toast.error("Сначала сгенерируйте контент");
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(pipelineJson.content);
    } catch {
      toast.error("Не удалось прочитать JSON контента");
      return;
    }

    const prompts = parsed.carousel_prompts;
    if (!Array.isArray(prompts) || prompts.length === 0) {
      toast.error("В контенте нет промптов для карусели");
      return;
    }

    abortRef.current = false;
    setGeneratingImagesKey("carousel");
    setCarouselProgress({ current: 0, total: prompts.length });

    let failCount = 0;

    for (let i = 0; i < prompts.length; i++) {
      if (abortRef.current) break;

      setCarouselProgress({ current: i + 1, total: prompts.length });

      try {
        const { data, error } = await supabase.functions.invoke("generate-pipeline-images", {
          body: {
            project_id: projectId,
            content_type: contentType,
            mode: "carousel",
            slide_number: prompts[i].slide_number,
          },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        await queryClient.invalidateQueries({ queryKey: ["content_pieces", projectId] });
      } catch (e: any) {
        console.error(`Slide ${prompts[i].slide_number} failed:`, e);
        failCount++;
      }
    }

    setGeneratingImagesKey(null);
    setCarouselProgress(null);

    if (failCount === 0) {
      toast.success("Карусель сгенерирована!");
    } else if (failCount < prompts.length) {
      toast.warning(`Готово, но ${failCount} из ${prompts.length} слайдов не удалось сгенерировать`);
    } else {
      toast.error("Не удалось сгенерировать ни одного слайда");
    }
  };

  const generateImagesMutation = useMutation({
    mutationFn: async (mode: "static" | "banner") => {
      setGeneratingImagesKey(mode);
      const { data, error } = await supabase.functions.invoke("generate-pipeline-images", {
        body: { project_id: projectId, content_type: contentType, mode },
      });
      if (error) throw new Error(error.message || "Ошибка генерации изображений");
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_pieces", projectId] });
      toast.success("Изображение сгенерировано!");
      setGeneratingImagesKey(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setGeneratingImagesKey(null);
    },
  });

  const isAnyImageGenerating = !!generatingImagesKey;

  const carouselButtonLabel = carouselProgress
    ? `Генерация ${carouselProgress.current} из ${carouselProgress.total}...`
    : "Сгенерировать карусель";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {contentTypeLabels[contentType!] ?? contentType}
          </h1>
          {promptInfo?.[0] && (
            <p className="text-xs text-muted-foreground">
              Промпт: «{promptInfo[0].name}»
            </p>
          )}
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Готово</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => generatePipelineMutation.mutate()}
          disabled={!!generatingKey}
        >
          {generatingKey ? (
            <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Генерация...</>
          ) : (
            <><RefreshCw className="mr-1 h-3 w-3" />Обновить контент</>
          )}
        </Button>

        {isEmail ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateImagesMutation.mutate("banner")}
              disabled={isAnyImageGenerating}
            >
              {generatingImagesKey === "banner" ? (
                <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Генерация...</>
              ) : (
                <><Image className="mr-1 h-3 w-3" />Сгенерировать баннер</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyHtmlRef.current?.()}
            >
              <Copy className="mr-1 h-3 w-3" />Скопировать HTML
            </Button>
          </>
        ) : (
          <>
            {supportsCarousel && (
              <Button
                variant="outline"
                size="sm"
                onClick={generateCarouselProgressively}
                disabled={isAnyImageGenerating}
              >
                {generatingImagesKey === "carousel" ? (
                  <><Loader2 className="mr-1 h-3 w-3 animate-spin" />{carouselButtonLabel}</>
                ) : (
                  <><Layers className="mr-1 h-3 w-3" />{carouselButtonLabel}</>
                )}
              </Button>
            )}
            {supportsStaticImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateImagesMutation.mutate("static")}
                disabled={isAnyImageGenerating}
              >
                {generatingImagesKey === "static" ? (
                  <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Генерация...</>
                ) : (
                  <><Image className="mr-1 h-3 w-3" />Сгенерировать изображение</>
                )}
              </Button>
            )}
          </>
        )}
      </div>

      {carouselProgress && (
        <div className="space-y-1">
          <Progress value={(carouselProgress.current / carouselProgress.total) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Слайд {carouselProgress.current} из {carouselProgress.total}
          </p>
        </div>
      )}

      {pipelineJson ? (
        <PipelineResultView
          jsonContent={pipelineJson.content}
          isEmail={isEmail}
          contentType={contentType}
          projectContentType={project?.content_type}
          carouselImages={carouselImages}
          staticImage={staticImage}
          bannerImage={bannerImage}
          copyHtmlRef={copyHtmlRef}
          onSave={async (updatedJson: string) => {
            const { error } = await supabase
              .from("content_pieces")
              .update({ content: updatedJson })
              .eq("id", pipelineJson.id);
            if (error) {
              toast.error("Ошибка сохранения");
              return;
            }
            queryClient.invalidateQueries({ queryKey: ["content_pieces", projectId] });
            toast.success("Контент сохранён");
          }}
        />
      ) : (
        <p className="text-muted-foreground text-sm">Контент не найден.</p>
      )}
    </div>
  );
}
