import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Image, Layers, Mail, Save, Check } from "lucide-react";
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

export default function PipelineResultView({ jsonContent, isEmail, carouselImages, staticImage, bannerImage, onSave }: Props) {
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

  return <SocialView data={parsed as SocialJson} carouselImages={carouselImages} staticImage={staticImage} onSave={onSave} />;
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

  useEffect(() => {
    setPostText(data.post_text || "");
    setPostTextSingle(data.post_text_single || "");
    setPostTextCarousel(data.post_text_carousel || "");
  }, [data.post_text, data.post_text_single, data.post_text_carousel]);

  const savePostText = () => {
    if (!onSave) return;
    let updated: any;
    if (hasSplitTexts) {
      updated = { ...data, post_text_single: postTextSingle, post_text_carousel: postTextCarousel };
    } else {
      updated = { ...data, post_text: postText };
    }
    onSave(JSON.stringify(updated, null, 2));
  };

  return (
    <div className="space-y-4">
      {hasSplitTexts ? (
        <>
          <EditableField
            label="Текст для поста (одно изображение)"
            value={postTextSingle}
            onChange={setPostTextSingle}
            onSave={savePostText}
          />
          <EditableField
            label="Текст для карусели"
            value={postTextCarousel}
            onChange={setPostTextCarousel}
            onSave={savePostText}
          />
        </>
      ) : (
        <EditableField
          label="Текст поста"
          value={postText}
          onChange={setPostText}
          onSave={savePostText}
        />
      )}

      {/* Carousel slides */}
      {data.carousel_prompts?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Слайды карусели ({data.carousel_prompts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.carousel_prompts.map((slide) => {
              const carouselImg = carouselImages?.find(ci => ci.slideNumber === slide.slide_number);
              return (
                <div key={slide.slide_number} className="border rounded-md p-3 grid grid-cols-[1fr_auto] gap-4 items-start bg-muted/20">
                  <div className="space-y-1.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${slideTypeBadgeClass[slide.type] || ""}`}>
                      {slide.slide_number}. {slideTypeLabels[slide.type] || slide.type}
                    </Badge>
                    <p className="text-xs italic text-muted-foreground/70">{slide.prompt}</p>
                  </div>
                  <div className="w-[160px] flex-shrink-0">
                    {carouselImg ? (
                      <div className="rounded-md overflow-hidden border">
                        <img src={carouselImg.url} alt={`Slide ${slide.slide_number}`} className="w-full object-contain bg-muted/30" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[80px] text-[10px] text-muted-foreground/40 border rounded-md bg-muted/10">
                        —
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Static image */}
      {data.static_image_prompt && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" /> Единое изображение
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
              <div>
                <span className="text-xs text-muted-foreground">Промпт</span>
                <p className="text-xs italic text-muted-foreground/70 mt-1 bg-muted/30 rounded-md p-2">
                  {data.static_image_prompt}
                </p>
              </div>
              <div className="w-[200px] flex-shrink-0">
                {staticImage ? (
                  <ImageThumbnail src={staticImage} alt="Единое изображение" filename="static.png" />
                ) : (
                  <div className="flex items-center justify-center h-[80px] text-xs text-muted-foreground/50 border rounded-md bg-muted/10">
                    Не сгенерировано
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
