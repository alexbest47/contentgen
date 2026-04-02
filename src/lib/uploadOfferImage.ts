import { supabase } from "@/integrations/supabase/client";

export async function uploadOfferImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("offer-images")
    .upload(path, file, { upsert: true });

  if (error) throw new Error("Ошибка загрузки изображения: " + error.message);

  const { data } = supabase.storage.from("offer-images").getPublicUrl(path);
  return data.publicUrl;
}
