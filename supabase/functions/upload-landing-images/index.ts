import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { optimizeImage } from "../_shared/optimizeImage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { images, bucket, folder } = await req.json();
    // images: [{ url: string, filename: string }]

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: { filename: string; publicUrl: string; error?: string }[] = [];

    for (const img of images) {
      try {
        const response = await fetch(img.url);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);

        // Optimize: downscale + JPEG re-encode to keep landing images light.
        const opt = await optimizeImage(uint8);
        const optimizedBytes = opt.bytes;
        const contentType = opt.contentType;
        // Swap extension in filename to match optimized format
        const baseName = img.filename.replace(/\.[a-zA-Z0-9]+$/, "");
        const finalFilename = `${baseName}.${opt.ext}`;
        const storagePath = `${folder}/${finalFilename}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, optimizedBytes, {
            contentType,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(storagePath);

        results.push({ filename: img.filename, publicUrl: urlData.publicUrl });
      } catch (e) {
        results.push({ filename: img.filename, publicUrl: "", error: e.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
