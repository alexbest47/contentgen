import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Generate a slug from landing name for the PHP template filename.
 * Transliterates Russian to Latin and converts to kebab-case.
 */
function generateSlug(name: string): string {
  const ru: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return name
    .toLowerCase()
    .split("")
    .map((c) => ru[c] || c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 40);
}

/**
 * WordPress form params PHP block — copied from the WP etalon.
 * This is inserted once at the top of the template, before content blocks.
 */
const WP_FORM_PARAMS_PHP = `
// код обработки форм
$isGetCourse   = get_field('is_gc');
if( $isGetCourse ):
    $formParmas = [
        'tag'   => 'action="https://lk.talentsy.ru/pl/lite/block-public/process-html?id='. get_field('getcourse_wid') .'" method="post" data-open-new-window="0"',
        'class' => '',
        'names' => [
            'name'  => 'formParams[first_name]',
            'phone' => 'formParams[phone]',
            'email' => 'formParams[email]',
        ],
        'hiddens' => '<input name="formParams[dealCustomFields][1265453]" type="hidden" value="'. $_GET['utm_info'] .'"><input name="formParams[dealCustomFields][1810276]" type="hidden" value="'. get_field('elly_alias') .'"><input name="formParams[dealCustomFields][1291877]" type="hidden"><input type="hidden" name="__gc__internal__form__helper" class="__gc__internal__form__helper"><input type="hidden" name="__gc__internal__form__helper_ref" class="__gc__internal__form__helper_ref"><input type="hidden" name="requestTime" value="1695648662"><input type="hidden" name="requestSimpleSign" value="de53721676f9b6aa19bb539ad254923d"><input type="hidden" name="isHtmlWidget" value="1">'
    ];
else:
    $formParmas = [
        'tag'   => 'data-target="axFormRequest"',
        'class' => 'ajaxForm',
        'names' => [
            'name'  => 'Name',
            'phone' => 'Phone',
            'email' => 'Email',
        ],
        'hiddens' => ''
    ];
endif;
`;

/**
 * Convert form HTML to PHP form with $formParmas variables.
 * Replaces static form attributes and input names with PHP echo statements.
 */
function convertFormToPhp(html: string): string {
  // Replace form opening tags: add $formParmas['tag'] and $formParmas['class']
  html = html.replace(
    /(<form\s+)data-target="axFormRequest"(\s+class="[^"]*?)ajaxForm([^"]*")/g,
    '$1<?= $formParmas[\'tag\']; ?> class="$2<?= $formParmas[\'class\']; ?>$3"'
  );
  // Fallback: simpler form replacement
  html = html.replace(
    /data-target="axFormRequest"/g,
    '<?= $formParmas[\'tag\']; ?>'
  );
  html = html.replace(
    /class="([^"]*?)ajaxForm([^"]*?)"/g,
    'class="$1<?= $formParmas[\'class\']; ?>$2"'
  );

  // Replace input name attributes
  html = html.replace(/name="Name"/g, 'name="<?= $formParmas[\'names\'][\'name\']; ?>"');
  html = html.replace(/name="Phone"/g, 'name="<?= $formParmas[\'names\'][\'phone\']; ?>"');
  html = html.replace(/name="Email"/g, 'name="<?= $formParmas[\'names\'][\'email\']; ?>"');

  // Replace agreed block with WP template part call
  // Match the entire noindex agreed block
  html = html.replace(
    /<noindex>\s*<div class="agreed__block[\s\S]*?<\/noindex>/g,
    '<? get_template_part( \'inc/components/form/agreed\' ); ?>'
  );

  // Add hidden fields before </form>
  html = html.replace(/<\/form>/g, '<?= $formParmas[\'hiddens\']; ?></form>');

  return html;
}

/**
 * Collect all custom CSS from blocks and return as a single inline style block.
 */
function collectInlineStyles(blocks: any[]): string {
  const styles: string[] = [];
  for (const b of blocks) {
    if (b.custom_css) {
      styles.push(b.custom_css);
    }
    const settings = b.settings || {};
    const blockType = b.landing_block_definitions?.block_type || "";
    if (settings.background_color) {
      styles.push(`.${blockType} { background-color: ${settings.background_color} !important; }`);
    }
    if (settings.card_color) {
      styles.push(`.${blockType} [class*="card"], .${blockType} [class*="item"] { background-color: ${settings.card_color} !important; }`);
    }
  }
  return styles.length > 0 ? `<style>\n${styles.join("\n")}\n</style>` : "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { landing_id } = await req.json();

    if (!landing_id) {
      return new Response(JSON.stringify({ error: "landing_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch landing with template and program
    const { data: landing, error: landingError } = await supabase
      .from("landings")
      .select("*, landing_templates(name, slug), paid_programs(title)")
      .eq("id", landing_id)
      .single();
    if (landingError) throw landingError;

    // 2. Fetch blocks with definitions (including php_template)
    const { data: blocks, error: blocksError } = await supabase
      .from("landing_blocks")
      .select("*, landing_block_definitions(id, block_type, name, category, html_template, php_template, editable_fields)")
      .eq("landing_id", landing_id)
      .eq("is_visible", true)
      .order("sort_order");
    if (blocksError) throw blocksError;

    // 3. Determine WP template name
    const pageTitle = landing.name || "Landing Page";
    let wpTemplateName = landing.wp_template_name;
    if (!wpTemplateName) {
      // Generate template name on first export
      const safeName = pageTitle.replace(/[^\wа-яА-ЯёЁ\s\-]/g, "").trim();
      wpTemplateName = `__NewAge: ${safeName}`;
      // Save it so it never changes
      await supabase
        .from("landings")
        .update({ wp_template_name: wpTemplateName })
        .eq("id", landing_id);
    }

    // 4. Check if any block has a form (to include $formParmas)
    const hasFormBlocks = (blocks || []).some((b: any) => {
      const tpl = b.landing_block_definitions?.html_template || "";
      const phpTpl = b.landing_block_definitions?.php_template || "";
      return tpl.includes('data-target="axFormRequest"') ||
             tpl.includes('name="Name"') ||
             phpTpl.includes('$formParmas');
    });

    // 5. Assemble block HTML with content overrides
    const blockHtmls = (blocks || []).map((b: any) => {
      // Use php_template if available (for form blocks), otherwise html_template
      let html = b.landing_block_definitions?.php_template || b.landing_block_definitions?.html_template || "";
      const overrides = b.content_overrides || {};

      for (const [key, value] of Object.entries(overrides)) {
        if (key.startsWith("_")) continue; // Skip internal keys like _image_overrides
        if (typeof value === "string") {
          html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
        }
      }

      // Apply image overrides
      const imageOverrides = overrides._image_overrides || {};
      for (const [originalPath, newUrl] of Object.entries(imageOverrides)) {
        if (typeof newUrl === "string" && newUrl) {
          // Replace in src, srcset attributes
          const escapedPath = originalPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          html = html.replace(new RegExp(escapedPath, "g"), newUrl);
          // Also replace format variants (jpg↔webp↔png)
          const basePath = originalPath.replace(/\.(jpg|jpeg|png|webp)$/i, "");
          const ext = originalPath.match(/\.(jpg|jpeg|png|webp)$/i)?.[1] || "";
          const variants = ["jpg", "jpeg", "png", "webp"].filter((e) => e !== ext.toLowerCase());
          for (const v of variants) {
            html = html.replace(new RegExp(basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\." + v, "gi"), newUrl as string);
          }
        }
      }

      // If the block uses html_template (not php_template) and has forms, convert them
      if (!b.landing_block_definitions?.php_template) {
        html = convertFormToPhp(html);
      }

      return html;
    });

    // 6. Collect inline styles (at the end, before footer)
    const inlineStyles = collectInlineStyles(blocks || []);

    // 7. Build breadcrumbs PHP call
    const breadcrumbSlug = landing.breadcrumb_slug || "psychology";
    const breadcrumbTitle = landing.breadcrumb_title || "Курсы психологии";

    // 8. Generate slug for filename
    const slug = generateSlug(pageTitle);

    // 9. Assemble the PHP template
    const phpTemplate = `<?php

/*
Template name: ${wpTemplateName}
*/

get_header('light');

get_template_part('inc/landing-breadcrumbs', null, ['${breadcrumbSlug}', '${breadcrumbTitle}']);

${hasFormBlocks ? "<?php" : ""}
${hasFormBlocks ? WP_FORM_PARAMS_PHP : ""}
${hasFormBlocks ? "?>" : ""}

<main class="page page_hg8ap7v1d">
${blockHtmls.join("\n\n")}
</main>

${inlineStyles}

<?php get_footer('light'); ?>
`;

    // Fix: remove nested <?php if form params were included
    // The initial <?php already opens PHP mode, so we need to handle transitions
    const cleanedPhp = phpTemplate
      .replace(/\?>\s*<\?php\s*\n\s*\n\s*\?>/g, "") // Remove empty PHP blocks when no forms
      .replace(/<\?php\s*<\?php/g, "<?php") // Fix double opening
      .replace(/\?>\s*\?>/g, "?>"); // Fix double closing

    // 10. Create ZIP
    const zip = new JSZip();
    const phpFileName = `na-${slug}.php`;
    zip.addFile(phpFileName, cleanedPhp);

    // Collect external images (from Supabase Storage) that need to be included
    const externalImages: { path: string; url: string }[] = [];
    for (const b of blocks || []) {
      const overrides = (b as any).content_overrides || {};
      const imgOverrides = overrides._image_overrides || {};
      for (const [_originalPath, newUrl] of Object.entries(imgOverrides)) {
        if (typeof newUrl === "string" && newUrl.includes("supabase")) {
          const imgName = newUrl.split("/").pop() || "image.png";
          externalImages.push({ path: `img/${imgName}`, url: newUrl });
        }
      }
    }

    // Download and add external images to ZIP
    for (const img of externalImages) {
      try {
        const resp = await fetch(img.url);
        if (resp.ok) {
          const data = new Uint8Array(await resp.arrayBuffer());
          zip.addFile(img.path, data);
        }
      } catch (e) {
        console.error(`Failed to download image ${img.url}:`, e);
      }
    }

    // Add README
    zip.addFile(
      "README.md",
      `# ${pageTitle}

Экспортировано из ContentGen Landing Constructor.
Дата: ${new Date().toISOString()}

## Файлы
- \`${phpFileName}\` — WordPress Page Template (положить в корень темы \`wp-content/themes/talentsy/new-age/\`)
${externalImages.length > 0 ? "- `img/` — новые изображения (загрузить в `wp-content/themes/talentsy/new-age/dist/images/`)" : ""}

## Развертывание
1. Загрузите \`${phpFileName}\` в \`wp-content/themes/talentsy/new-age/\`
${externalImages.length > 0 ? "2. Загрузите изображения из папки `img/` в `wp-content/themes/talentsy/new-age/dist/images/`" : ""}
${externalImages.length > 0 ? "3" : "2"}. Создайте новую страницу в WordPress и выберите шаблон «${wpTemplateName}»
`
    );

    const zipBlob = await zip.generateAsync({ type: "uint8array" });

    // 11. Upload to Storage
    const fileName = `landing-${landing_id}-${Date.now()}.zip`;
    const { error: uploadError } = await supabase.storage
      .from("landing-exports")
      .upload(fileName, zipBlob, {
        contentType: "application/zip",
        upsert: true,
      });

    if (uploadError) {
      if (uploadError.message?.includes("not found")) {
        return new Response(cleanedPhp, {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/x-php; charset=utf-8",
            "Content-Disposition": `attachment; filename="${phpFileName}"`,
          },
        });
      }
      throw uploadError;
    }

    // 12. Create signed URL
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from("landing-exports")
      .createSignedUrl(fileName, 3600);
    if (urlError) throw urlError;

    return new Response(
      JSON.stringify({
        download_url: signedUrl.signedUrl,
        file_name: fileName,
        php_file_name: phpFileName,
        wp_template_name: wpTemplateName,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Export failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
