import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Loader2, Image, Layers } from "lucide-react";
import PipelineResultView from "@/components/project/PipelineResultView";
import { toast } from "sonner";

const contentTypeLabels: Record<string, string> = {
  instagram: "Пост в Instagram",
  telegram: "Пост в Telegram",
  vk: "Пост в ВКонтакте",
  email: "Email-рассылка",
};

const subTypeLabels: Record<string, string> = {
  announcement: "Анонс",
  warmup: "Прогрев",
  conversion: "Конверсия",
};

const isEmailType = (ct: string) => ct === "email";

export default function ContentDetail() {
  const { programId, offerType, offerId, projectId, contentType, subType } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [generatingImagesKey, setGeneratingImagesKey] = useState<string | null>(null);

  const backUrl = `/programs/${programId}/offers/${offerType}/${offerId}/projects/${projectId}`;
  const isEmail = isEmailType(contentType!);

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

  const pipelineJson = getContentByCategory(`pipeline_json_${subType}`);

  const carouselImages = contentPieces
    ?.filter((cp) => cp.category.startsWith(`carousel_${subType}_`))
    .map((cp) => {
      const match = cp.category.match(/carousel_\w+_(\d+)$/);
      return { slideNumber: match ? parseInt(match[1]) : 0, url: cp.content };
    })
    .sort((a, b) => a.slideNumber - b.slideNumber) ?? [];

  const staticImage = getContentByCategory(`static_image_${subType}`)?.content;
  const bannerImage = getContentByCategory(`banner_${subType}`)?.content;

  const generatePipelineMutation = useMutation({
    mutationFn: async () => {
      setGeneratingKey("pipeline");
      const { data, error } = await supabase.functions.invoke("generate-pipeline", {
        body: { project_id: projectId, content_type: contentType, sub_type: subType },
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

  const generateImagesMutation = useMutation({
    mutationFn: async (mode: "carousel" | "static" | "banner") => {
      setGeneratingImagesKey(mode);
      const { data, error } = await supabase.functions.invoke("generate-pipeline-images", {
        body: { project_id: projectId, content_type: contentType, sub_type: subType, mode },
      });
      if (error) throw new Error(error.message || "Ошибка генерации изображений");
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_pieces", projectId] });
      toast.success("Изображения сгенерированы!");
      setGeneratingImagesKey(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setGeneratingImagesKey(null);
    },
  });

  const isAnyImageGenerating = !!generatingImagesKey;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {contentTypeLabels[contentType!] ?? contentType} — {subTypeLabels[subType!] ?? subType}
          </h1>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Готово</Badge>
      </div>

      {/* Actions bar */}
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
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateImagesMutation.mutate("carousel")}
              disabled={isAnyImageGenerating}
            >
              {generatingImagesKey === "carousel" ? (
                <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Генерация...</>
              ) : (
                <><Layers className="mr-1 h-3 w-3" />Сгенерировать карусель</>
              )}
            </Button>
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
          </>
        )}
      </div>

      {/* Content */}
      {pipelineJson ? (
        <PipelineResultView
          jsonContent={pipelineJson.content}
          isEmail={isEmail}
          carouselImages={carouselImages}
          staticImage={staticImage}
          bannerImage={bannerImage}
        />
      ) : (
        <p className="text-muted-foreground text-sm">Контент не найден.</p>
      )}
    </div>
  );
}
