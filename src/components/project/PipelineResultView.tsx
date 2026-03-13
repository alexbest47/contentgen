import React, { useState, useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Image, ChevronDown, Mail, Save, Check, Layers } from "lucide-react";
import { toast } from "sonner";

interface SocialJson {
  post_text?: string;
  post_text_single?: string;
  post_text_carousel?: string;
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
  contentType?: string;
  carouselImages?: { slideNumber: number; url: string }[];
  staticImage?: string;
  bannerImage?: string;
  onSave?: (updatedJson: string) => void;
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

function EditableField({
  label,
  icon,
  value,
  onChange,
  onSave,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
}) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            {icon} {label}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(value)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm min-h-[80px] resize-y"
        />
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={handleSave} className="gap-1.5">
            {saved ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? "Сохранено" : "Сохранить"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ImageThumbnail({
  src,
  alt,
  filename,
  onPreview,
}: {
  src: string;
  alt: string;
  filename: string;
  onPreview?: (src: string, alt: string) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{alt}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => downloadImage(src, filename)}>
          <Download className="h-3 w-3" />
        </Button>
      </div>
      <div
        className="rounded-md overflow-hidden border max-w-[200px] cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onPreview?.(src, alt)}
      >
        <img src={src} alt={alt} className="w-full object-contain bg-muted/30" />
      </div>
    </div>
  );
}

function ImagePreviewDialog({
  src,
  alt,
  open,
  onOpenChange,
}: {
  src: string | null;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!src) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-2">
        <div className="flex flex-col items-center gap-2">
          <img src={src} alt={alt} className="max-h-[80vh] w-auto object-contain rounded-md" />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadImage(src, alt + ".png")}>
            <Download className="h-3.5 w-3.5" /> Скачать
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PipelineResultView({ jsonContent, isEmail, contentType, carouselImages, staticImage, bannerImage, onSave }: Props) {
  let parsed: SocialJson | EmailJson;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-xs whitespace-pre-wrap">{jsonContent}</div>
        </CardContent>
      </Card>
    );
  }

  if (isEmail) {
    return <EmailView data={parsed as EmailJson} bannerImage={bannerImage} onSave={onSave} />;
  }

  return <SocialView data={parsed as SocialJson} carouselImages={carouselImages} staticImage={staticImage} onSave={onSave} contentType={contentType} />;
}

function EmailView({ data, bannerImage, onSave }: { data: EmailJson; bannerImage?: string; onSave?: (json: string) => void }) {
  const [subject, setSubject] = useState(data.email_subject);
  const [body, setBody] = useState(data.email_body);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewAlt, setPreviewAlt] = useState("");

  useEffect(() => {
    setSubject(data.email_subject);
    setBody(data.email_body);
  }, [data.email_subject, data.email_body]);

  const saveField = () => {
    if (!onSave) return;
    const updated = { ...data, email_subject: subject, email_body: body };
    onSave(JSON.stringify(updated, null, 2));
  };

  const openPreview = (src: string, alt: string) => {
    setPreviewSrc(src);
    setPreviewAlt(alt);
  };

  return (
    <div className="space-y-4">
      <EditableField
        label="Тема письма"
        icon={<Mail className="h-3.5 w-3.5" />}
        value={subject}
        onChange={setSubject}
        onSave={saveField}
      />

      <EditableField
        label="Текст письма"
        value={body}
        onChange={setBody}
        onSave={saveField}
      />

      {/* Banner */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Баннер</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Промпт</span>
              <p className="text-xs italic text-muted-foreground/70 mt-1 bg-muted/30 rounded-md p-2">
                {data.banner_prompt}
              </p>
            </div>
            <div>
              {bannerImage ? (
                <ImageThumbnail src={bannerImage} alt="Баннер" filename="banner.png" onPreview={openPreview} />
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground/50">
                  Изображение не сгенерировано
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ImagePreviewDialog src={previewSrc} alt={previewAlt} open={!!previewSrc} onOpenChange={(o) => !o && setPreviewSrc(null)} />
    </div>
  );
}

function SocialView({
  data,
  carouselImages,
  staticImage,
  onSave,
}: {
  data: SocialJson;
  carouselImages?: { slideNumber: number; url: string }[];
  staticImage?: string;
  onSave?: (json: string) => void;
}) {
  const hasSplitTexts = !!(data.post_text_single || data.post_text_carousel);
  const [postText, setPostText] = useState(data.post_text || "");
  const [postTextSingle, setPostTextSingle] = useState(data.post_text_single || "");
  const [postTextCarousel, setPostTextCarousel] = useState(data.post_text_carousel || "");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewAlt, setPreviewAlt] = useState("");

  useEffect(() => {
    setPostText(data.post_text || "");
    setPostTextSingle(data.post_text_single || "");
    setPostTextCarousel(data.post_text_carousel || "");
  }, [data.post_text, data.post_text_single, data.post_text_carousel]);

  const saveAll = () => {
    if (!onSave) return;
    let updated: any;
    if (hasSplitTexts) {
      updated = { ...data, post_text_single: postTextSingle, post_text_carousel: postTextCarousel };
    } else {
      updated = { ...data, post_text: postText };
    }
    onSave(JSON.stringify(updated, null, 2));
  };

  const openPreview = (src: string, alt: string) => {
    setPreviewSrc(src);
    setPreviewAlt(alt);
  };

  const carouselText = hasSplitTexts ? postTextCarousel : postText;
  const setCarouselText = hasSplitTexts ? setPostTextCarousel : setPostText;
  const singleText = hasSplitTexts ? postTextSingle : postText;
  const setSingleText = hasSplitTexts ? setPostTextSingle : setPostText;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Carousel Post Card */}
      {data.carousel_prompts?.length > 0 && (
        <PostCard
          title="Пост с каруселью"
          icon={<Layers className="h-4 w-4" />}
          imageSection={
            <CarouselSlider
              images={carouselImages}
              totalSlides={data.carousel_prompts.length}
              onPreview={openPreview}
              contentType={contentType}
            />
          }
          text={carouselText}
          onTextChange={setCarouselText}
          onSave={saveAll}
          promptsSection={
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground gap-1">
                  Промпты слайдов
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {data.carousel_prompts.map((slide) => (
                  <div key={slide.slide_number} className="flex items-start gap-2 text-xs">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${slideTypeBadgeClass[slide.type] || ""}`}>
                      {slide.slide_number}. {slideTypeLabels[slide.type] || slide.type}
                    </Badge>
                    <span className="italic text-muted-foreground/70">{slide.prompt}</span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          }
        />
      )}

      {/* Single Image Post Card */}
      <PostCard
        title="Пост с изображением"
        icon={<Image className="h-4 w-4" />}
        imageSection={
          <div
            className={`${contentType === "instagram" ? "aspect-[4/5]" : "aspect-square"} bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer`}
            onClick={() => staticImage && openPreview(staticImage, "Изображение поста")}
          >
            {staticImage ? (
              <img src={staticImage} alt="Пост" className="w-full h-full object-contain" />
            ) : (
              <span className="text-sm text-muted-foreground/50">Изображение не сгенерировано</span>
            )}
          </div>
        }
        text={singleText}
        onTextChange={setSingleText}
        onSave={saveAll}
        promptsSection={
          data.static_image_prompt ? (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground gap-1">
                  Промпт изображения
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <p className="text-xs italic text-muted-foreground/70 bg-muted/30 rounded-md p-2">{data.static_image_prompt}</p>
              </CollapsibleContent>
            </Collapsible>
          ) : undefined
        }
      />

      <ImagePreviewDialog src={previewSrc} alt={previewAlt} open={!!previewSrc} onOpenChange={(o) => !o && setPreviewSrc(null)} />
    </div>
  );
}

/** Instagram-style post card */
function PostCard({
  title,
  icon,
  imageSection,
  text,
  onTextChange,
  onSave,
  promptsSection,
}: {
  title: string;
  icon: React.ReactNode;
  imageSection: React.ReactNode;
  text: string;
  onTextChange: (v: string) => void;
  onSave: () => void;
  promptsSection?: React.ReactNode;
}) {
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Card className="overflow-hidden max-w-[480px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>

      {/* Image area */}
      {imageSection}

      {/* Text & actions */}
      <div className="p-4 space-y-3">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          className="text-sm resize-none overflow-hidden border-none shadow-none p-0 focus-visible:ring-0 min-h-0"
          placeholder="Текст поста..."
        />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => copy(text)}>
            <Copy className="h-3 w-3" /> Копировать
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleSave}>
            {saved ? <Check className="h-3 w-3 text-green-600" /> : <Save className="h-3 w-3" />}
            {saved ? "Сохранено" : "Сохранить изменения"}
          </Button>
        </div>

        {promptsSection && <div className="border-t pt-2">{promptsSection}</div>}
      </div>
    </Card>
  );
}

/** Embla carousel for slide images */
function CarouselSlider({
  images,
  totalSlides,
  onPreview,
}: {
  images?: { slideNumber: number; url: string }[];
  totalSlides: number;
  onPreview: (src: string, alt: string) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const slides = Array.from({ length: totalSlides }, (_, i) => {
    const img = images?.find((im) => im.slideNumber === i + 1);
    return { number: i + 1, url: img?.url };
  });

  return (
    <div>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide) => (
            <div key={slide.number} className="flex-[0_0_100%] min-w-0">
              <div
                className={`${contentType === "instagram" ? "aspect-[4/5]" : "aspect-square"} bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer`}
                onClick={() => slide.url && onPreview(slide.url, `Слайд ${slide.number}`)}
              >
                {slide.url ? (
                  <img src={slide.url} alt={`Слайд ${slide.number}`} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-sm text-muted-foreground/50">Слайд {slide.number}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Dot indicators */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-1.5 py-3">
          {slides.map((slide, idx) => (
            <button
              key={slide.number}
              className={`h-1.5 rounded-full transition-all ${
                idx === selectedIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
              onClick={() => emblaApi?.scrollTo(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
