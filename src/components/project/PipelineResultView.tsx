import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download, Image, Layers, Mail } from "lucide-react";
import { toast } from "sonner";

interface SocialJson {
  post_text: string;
  static_image_prompt: string;
  carousel_prompts: { slide_number: number; type: string; prompt: string }[];
}

interface EmailJson {
  email_subject: string;
  email_body: string;
  banner_prompt: string;
}

interface Props {
  jsonContent: string;
  isEmail: boolean;
  carouselImages?: { slideNumber: number; url: string }[];
  staticImage?: string;
  bannerImage?: string;
}

const slideTypeLabels: Record<string, string> = {
  cover: "Обложка",
  content: "Контент",
  cta: "CTA",
};

const slideTypeBadgeClass: Record<string, string> = {
  cover: "bg-primary/15 text-primary border-primary/25",
  content: "bg-secondary text-secondary-foreground",
  cta: "bg-accent text-accent-foreground",
};

const copy = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Скопировано");
};

const downloadImage = (url: string, filename: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.click();
};

export default function PipelineResultView({ jsonContent, isEmail, carouselImages, staticImage, bannerImage }: Props) {
  let parsed: SocialJson | EmailJson;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    return (
      <div className="bg-muted/50 rounded-md p-2 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
        {jsonContent}
      </div>
    );
  }

  if (isEmail) {
    const data = parsed as EmailJson;
    return (
      <div className="space-y-3">
        {/* Subject */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Тема письма
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copy(data.email_subject)}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="bg-muted/50 rounded-md p-2 text-xs font-medium">{data.email_subject}</div>
        </div>

        {/* Body */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Текст письма</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copy(data.email_body)}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="bg-muted/50 rounded-md p-2 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
            {data.email_body}
          </div>
        </div>

        {/* Banner prompt */}
        <div>
          <span className="text-xs font-medium text-muted-foreground">Промпт баннера</span>
          <div className="bg-muted/30 rounded-md p-2 text-[11px] italic text-muted-foreground max-h-20 overflow-y-auto mt-1">
            {data.banner_prompt}
          </div>
        </div>

        {/* Generated banner */}
        {bannerImage && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Баннер</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadImage(bannerImage, "banner.png")}>
                <Download className="h-3 w-3" />
              </Button>
            </div>
            <div className="rounded-md overflow-hidden border">
              <img src={bannerImage} alt="Banner" className="w-full max-h-[200px] object-contain bg-muted/30" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Social content
  const data = parsed as SocialJson;
  return (
    <div className="space-y-3">
      {/* Post text */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">Текст поста</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copy(data.post_text)}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <div className="bg-muted/50 rounded-md p-2 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
          {data.post_text}
        </div>
      </div>

      {/* Carousel prompts */}
      {data.carousel_prompts?.length > 0 && (
        <div>
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
            <Layers className="h-3 w-3" /> Слайды карусели ({data.carousel_prompts.length})
          </span>
          <div className="space-y-1.5">
            {data.carousel_prompts.map((slide) => {
              const carouselImg = carouselImages?.find(ci => ci.slideNumber === slide.slide_number);
              return (
                <div key={slide.slide_number} className="border rounded-md p-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${slideTypeBadgeClass[slide.type] || ""}`}>
                      {slide.slide_number}. {slideTypeLabels[slide.type] || slide.type}
                    </Badge>
                  </div>
                  <p className="text-[11px] italic text-muted-foreground/70 line-clamp-2">{slide.prompt}</p>
                  {carouselImg && (
                    <div className="rounded-md overflow-hidden border">
                      <img src={carouselImg.url} alt={`Slide ${slide.slide_number}`} className="w-full max-h-[150px] object-contain bg-muted/30" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Static image prompt */}
      {data.static_image_prompt && (
        <div>
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Image className="h-3 w-3" /> Промпт единого изображения
          </span>
          <div className="bg-muted/30 rounded-md p-2 text-[11px] italic text-muted-foreground max-h-20 overflow-y-auto mt-1">
            {data.static_image_prompt}
          </div>
        </div>
      )}

      {/* Generated static image */}
      {staticImage && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Единое изображение</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadImage(staticImage, "static.png")}>
              <Download className="h-3 w-3" />
            </Button>
          </div>
          <div className="rounded-md overflow-hidden border">
            <img src={staticImage} alt="Static" className="w-full max-h-[200px] object-contain bg-muted/30" />
          </div>
        </div>
      )}
    </div>
  );
}
