import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { ImagePlus } from "lucide-react";

interface ImageUploadFieldProps {
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  existingUrl?: string | null;
}

export function ImageUploadField({ imageFile, setImageFile, existingUrl }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const displayUrl = preview || existingUrl || null;

  const handleFile = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label>Изображение (квадрат) *</Label>
      <div
        className="relative w-48 h-48 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden bg-muted/30"
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImagePlus className="h-8 w-8" />
            <span className="text-xs text-center">Загрузите изображение</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
