import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy } from "lucide-react";
import BlockLibrary, { type EmailBlockType } from "@/components/email-builder/BlockLibrary";
import BlockCanvas, { type EmailBlock } from "@/components/email-builder/BlockCanvas";
import BlockSettingsPanel from "@/components/email-builder/BlockSettingsPanel";
import EmailBuilderHeader from "@/components/email-builder/EmailBuilderHeader";
import CreateLetterWizard from "@/components/email-builder/CreateLetterWizard";
import LetterGenerationPanel, { type ImagePlaceholder } from "@/components/email-builder/LetterGenerationPanel";
import { useAuth } from "@/contexts/AuthContext";

export default function EmailBuilder() {
  const { letterId } = useParams<{ letterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [colorSchemeId, setColorSchemeId] = useState<string | null>(null);
  const [letterThemeTitle, setLetterThemeTitle] = useState("");
  const [letterThemeDescription, setLetterThemeDescription] = useState("");
  const [programId, setProgramId] = useState<string | null>(null);
  const [offerType, setOfferType] = useState("");
  const [offerId, setOfferId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportHtml, setExportHtml] = useState("");
  const [generatingSubject, setGeneratingSubject] = useState(false);
  const [generatingBlockId, setGeneratingBlockId] = useState<string | null>(null);
  const [generatingImageBlockId, setGeneratingImageBlockId] = useState<string | null>(null);
  const [themeWizardOpen, setThemeWizardOpen] = useState(false);

  // New full-letter state
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [imagePlaceholders, setImagePlaceholders] = useState<ImagePlaceholder[]>([]);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [extraOfferIds, setExtraOfferIds] = useState<string[]>([]);
  const [audienceSegment, setAudienceSegment] = useState("");
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [generatingPlaceholderId, setGeneratingPlaceholderId] = useState<string | null>(null);
  const [settingsMode, setSettingsMode] = useState(false); // true = show pre-generation panel even after generation

  const dirtyRef = useRef(false);
  const initialLoadRef = useRef(false);
  const blocksLoadedRef = useRef(false);

  // Load letter
  const { data: letter } = useQuery({
    queryKey: ["email_letter", letterId],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_letters").select("*").eq("id", letterId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!letterId,
  });

  // Load blocks
  const { data: dbBlocks } = useQuery({
    queryKey: ["email_letter_blocks", letterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_letter_blocks")
        .select("*")
        .eq("letter_id", letterId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!letterId,
  });

  // Load email settings (header/footer)
  const { data: emailSettings } = useQuery({
    queryKey: ["email_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("email_settings").select("setting_key, setting_value");
      const map: Record<string, string> = {};
      data?.forEach((r: any) => { map[r.setting_key] = r.setting_value; });
      return map;
    },
  });

  // Load template name
  const { data: template } = useQuery({
    queryKey: ["email_template_name", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const { data } = await supabase.from("email_templates").select("name").eq("id", templateId).single();
      return data;
    },
    enabled: !!templateId,
  });

  // Initialize state from DB
  useEffect(() => {
    if (letter && !initialLoadRef.current) {
      setTitle(letter.title);
      setSubject(letter.subject);
      setPreheader(letter.preheader);
      setColorSchemeId(letter.selected_color_scheme_id);
      setLetterThemeTitle(letter.letter_theme_title);
      setLetterThemeDescription(letter.letter_theme_description);
      setProgramId((letter as any).program_id || null);
      setOfferType((letter as any).offer_type || "");
      setOfferId((letter as any).offer_id || null);
      setTemplateId(letter.template_id);
      setCaseId((letter as any).case_id || null);
      setExtraOfferIds((letter as any).extra_offer_ids || []);
      setAudienceSegment((letter as any).audience_segment || "");
      setGeneratedHtml((letter as any).generated_html || "");
      setImagePlaceholders(((letter as any).image_placeholders as ImagePlaceholder[]) || []);
      initialLoadRef.current = true;
    }
  }, [letter]);

  useEffect(() => {
    if (dbBlocks && !blocksLoadedRef.current) {
      setBlocks(dbBlocks.map((b: any) => ({
        id: b.id,
        block_type: b.block_type as EmailBlockType,
        sort_order: b.sort_order,
        config: (b.config as Record<string, any>) || {},
        generated_html: b.generated_html,
        banner_image_prompt: b.banner_image_prompt,
        banner_image_url: b.banner_image_url,
      })));
      blocksLoadedRef.current = true;
    }
  }, [dbBlocks]);

  // Mark dirty on changes
  useEffect(() => {
    if (initialLoadRef.current) {
      dirtyRef.current = true;
      setSaveStatus("unsaved");
    }
  }, [title, subject, preheader, colorSchemeId, blocks, generatedHtml, imagePlaceholders, caseId, extraOfferIds]);

  // Save
  const save = useCallback(async () => {
    if (!letterId || !dirtyRef.current) return;
    setSaveStatus("saving");
    try {
      await supabase.from("email_letters").update({
        title, subject, preheader,
        selected_color_scheme_id: colorSchemeId,
        letter_theme_title: letterThemeTitle,
        letter_theme_description: letterThemeDescription,
        program_id: programId,
        offer_type: offerType,
        offer_id: offerId,
        case_id: caseId,
        extra_offer_ids: extraOfferIds,
        generated_html: generatedHtml,
        image_placeholders: imagePlaceholders,
      } as any).eq("id", letterId);

      for (const block of blocks) {
        await supabase.from("email_letter_blocks").upsert({
          id: block.id,
          letter_id: letterId,
          block_type: block.block_type,
          sort_order: block.sort_order,
          config: block.config,
          generated_html: block.generated_html,
          banner_image_prompt: block.banner_image_prompt,
          banner_image_url: block.banner_image_url,
        });
      }

      dirtyRef.current = false;
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    }
  }, [letterId, title, subject, preheader, colorSchemeId, letterThemeTitle, letterThemeDescription, programId, offerType, offerId, caseId, extraOfferIds, generatedHtml, imagePlaceholders, blocks]);

  useEffect(() => {
    const interval = setInterval(save, 30000);
    return () => clearInterval(interval);
  }, [save]);

  useEffect(() => () => { save(); }, [save]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  // Block CRUD
  const addBlock = async (type: EmailBlockType) => {
    if (!letterId) return;
    const newOrder = blocks.length;
    const { data, error } = await supabase
      .from("email_letter_blocks")
      .insert({ letter_id: letterId, block_type: type, sort_order: newOrder, config: {} })
      .select("*")
      .single();
    if (error) { toast.error(error.message); return; }
    const newBlock: EmailBlock = {
      id: data.id,
      block_type: type,
      sort_order: newOrder,
      config: {},
      generated_html: "",
      banner_image_prompt: "",
      banner_image_url: "",
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(data.id);
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((b, i) => ({ ...b, sort_order: i }));
    });
  };

  const deleteBlock = async (id: string) => {
    await supabase.from("email_letter_blocks").delete().eq("id", id);
    setBlocks((prev) => prev.filter((b) => b.id !== id).map((b, i) => ({ ...b, sort_order: i })));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const updateBlockConfig = (blockId: string, config: Record<string, any>) => {
    // Handle _generated_html from static block components
    const generatedHtmlFromConfig = config._generated_html;
    if (generatedHtmlFromConfig !== undefined) {
      const { _generated_html, ...cleanConfig } = config;
      setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, config: cleanConfig, generated_html: _generated_html } : b));
    } else {
      setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, config } : b));
    }
  };

  const generateBlock = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;
    setGeneratingBlockId(blockId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-email-block", {
        body: {
          block_id: blockId,
          block_type: block.block_type,
          config: block.config,
          color_scheme_id: colorSchemeId,
          mode: block.config.mode || "text_only",
          letter_id: letterId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBlocks((prev) => prev.map((b) =>
        b.id === blockId
          ? { ...b, generated_html: data.block_html || "", banner_image_prompt: data.banner_image_prompt || "" }
          : b
      ));
      await supabase.from("email_letter_blocks").update({
        generated_html: data.block_html || "",
        banner_image_prompt: data.banner_image_prompt || "",
      }).eq("id", blockId);
      toast.success("Блок сгенерирован");
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации");
    } finally {
      setGeneratingBlockId(null);
    }
  };

  const generateImage = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block?.banner_image_prompt) return;
    setGeneratingImageBlockId(blockId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-email-block", {
        body: { generate_image: true, block_id: blockId, banner_image_prompt: block.banner_image_prompt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBlocks((prev) => prev.map((b) =>
        b.id === blockId ? { ...b, banner_image_url: data.banner_image_url || "" } : b
      ));
      await supabase.from("email_letter_blocks").update({ banner_image_url: data.banner_image_url || "" }).eq("id", blockId);
      toast.success("Изображение сгенерировано");
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации изображения");
    } finally {
      setGeneratingImageBlockId(null);
    }
  };

  // Full letter generation
  const generateLetter = async () => {
    if (!letterId) return;
    setGeneratingLetter(true);
    setSettingsMode(false);
    try {
      // Save current settings first
      await supabase.from("email_letters").update({
        case_id: caseId,
        extra_offer_ids: extraOfferIds,
        audience_segment: audienceSegment,
      } as any).eq("id", letterId);

      const { data, error } = await supabase.functions.invoke("generate-email-letter", {
        body: { letter_id: letterId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedHtml(data.html || "");
      setImagePlaceholders(data.image_placeholders || []);
      // Update subject/preheader from AI if provided
      if (data.email_subject) setSubject(data.email_subject);
      if (data.email_preheader) setPreheader(data.email_preheader);
      toast.success("Письмо сгенерировано");
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации письма");
    } finally {
      setGeneratingLetter(false);
    }
  };

  // Generate placeholder image
  const generatePlaceholderImage = async (placeholderId: string) => {
    const ph = imagePlaceholders.find((p) => p.id === placeholderId);
    if (!ph?.prompt) return;
    setGeneratingPlaceholderId(placeholderId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-email-letter", {
        body: { generate_image: true, placeholder_id: placeholderId, prompt: ph.prompt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const newPlaceholders = imagePlaceholders.map((p) =>
        p.id === placeholderId ? { ...p, image_url: data.image_url } : p
      );
      setImagePlaceholders(newPlaceholders);
      // Save to DB
      await supabase.from("email_letters").update({
        image_placeholders: newPlaceholders,
      } as any).eq("id", letterId);
      toast.success("Изображение сгенерировано");
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации изображения");
    } finally {
      setGeneratingPlaceholderId(null);
    }
  };

  const generateSubjectHandler = async () => {
    if (!letterId) return;
    setGeneratingSubject(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-email-subject", {
        body: { letter_id: letterId, letter_blocks_summary: blocks.map((b) => ({ type: b.block_type, config: b.config })) },
      });
      if (error) throw error;
      if (data?.subject) setSubject(data.subject);
      if (data?.preheader) setPreheader(data.preheader);
      toast.success("Тема и прехедер сгенерированы");
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации");
    } finally {
      setGeneratingSubject(false);
    }
  };

  const handleExport = () => {
    const header = emailSettings?.email_header_html || "";
    const footer = emailSettings?.email_footer_html || "";

    let body: string;
    if (generatedHtml) {
      // Export full letter HTML — replace {{image_placeholder_N}} markers with real URLs
      body = generatedHtml;
      for (const ph of imagePlaceholders) {
        const placeholder = `{{${ph.id}}}`;
        if (ph.image_url) {
          // Replace entire <img src="{{...}}"> or just the placeholder with the real URL
          body = body.replace(
            new RegExp(`<img([^>]*)src\\s*=\\s*["']\\{\\{${ph.id}\\}\\}["']([^>]*)>`, "g"),
            `<img$1src="${ph.image_url}"$2>`
          );
          // Also replace standalone markers
          body = body.replace(placeholder, ph.image_url);
        } else {
          // Remove img tags with unresolved placeholders
          body = body.replace(
            new RegExp(`<img[^>]*src\\s*=\\s*["']\\{\\{${ph.id}\\}\\}["'][^>]*>`, "g"),
            ""
          );
          body = body.replace(placeholder, "");
        }
      }
    } else {
      body = blocks
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((b) => {
          if (b.generated_html) {
            let html = b.generated_html;
            if (b.banner_image_url) {
              html = `<img src="${b.banner_image_url}" alt="" style="max-width:600px;width:100%;border-radius:6px;" />\n` + html;
            }
            return html;
          }
          if (b.block_type === "divider") return '<hr style="border:none;border-top:1px solid #E0E0E0;margin:24px 0;" />';
          if (b.block_type === "text" && b.config.html) return b.config.html;
          if (b.block_type === "cta" && b.config.text) {
            return `<div style="text-align:center;padding:16px 0;"><a href="${b.config.url || '#'}" style="display:inline-block;padding:12px 32px;background-color:${b.config.color || '#6366f1'};color:#ffffff;border-radius:6px;text-decoration:none;font-weight:600;">${b.config.text}</a></div>`;
          }
          if (b.block_type === "image" && (b.config.url || b.config.src)) {
            return `<div style="text-align:${b.config.align || 'center'};"><img src="${b.config.url || b.config.src}" alt="${b.config.alt || ''}" style="max-width:600px;width:100%;" /></div>`;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n\n");
    }

    setExportHtml(`${header}\n\n${body}\n\n${footer}`);
    setExportOpen(true);
  };

  const handleThemeChanged = async (newTitle: string, newDescription: string) => {
    setLetterThemeTitle(newTitle);
    setLetterThemeDescription(newDescription);
    if (letterId) {
      await supabase.from("email_letters").update({
        letter_theme_title: newTitle,
        letter_theme_description: newDescription,
      }).eq("id", letterId);
    }
    toast.success("Тема обновлена");
  };

  // Determine right panel content
  const showGenerationPanel = !selectedBlock || settingsMode;
  const isGenerated = !!generatedHtml && !settingsMode;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="px-4 py-2 border-b">
        <Button variant="ghost" size="sm" onClick={() => { save(); navigate("/email-builder"); }} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> К списку писем
        </Button>
      </div>

      <EmailBuilderHeader
        title={title}
        subject={subject}
        preheader={preheader}
        colorSchemeId={colorSchemeId}
        letterThemeTitle={letterThemeTitle}
        saveStatus={saveStatus}
        onChangeTitle={setTitle}
        onChangeSubject={setSubject}
        onChangePreheader={setPreheader}
        onChangeColorScheme={setColorSchemeId}
        onGenerateSubject={generateSubjectHandler}
        onExportHtml={handleExport}
        onSave={save}
        onChangeTheme={() => setThemeWizardOpen(true)}
        onGenerateLetter={generateLetter}
        generatingSubject={generatingSubject}
        generatingLetter={generatingLetter}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Block Library */}
        <div className="w-60 border-r p-3 overflow-y-auto shrink-0">
          <BlockLibrary onAddBlock={addBlock} />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <BlockCanvas
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            headerHtml={emailSettings?.email_header_html || ""}
            footerHtml={emailSettings?.email_footer_html || ""}
            onSelectBlock={setSelectedBlockId}
            onMoveBlock={moveBlock}
            onDeleteBlock={deleteBlock}
            onGenerateImage={generateImage}
            generatingImageBlockId={generatingImageBlockId}
            generatedHtml={generatedHtml}
            imagePlaceholders={imagePlaceholders}
            onGeneratePlaceholderImage={generatePlaceholderImage}
            generatingPlaceholderId={generatingPlaceholderId}
          />
        </div>

        {/* Right: Settings */}
        <div className="w-72 border-l p-3 overflow-y-auto shrink-0">
          {selectedBlock && !settingsMode ? (
            <BlockSettingsPanel
              block={selectedBlock}
              colorSchemeId={colorSchemeId}
              onUpdateConfig={updateBlockConfig}
              onGenerate={generateBlock}
              onGenerateImage={generateImage}
              generating={generatingBlockId === selectedBlock.id}
              generatingImage={generatingImageBlockId === selectedBlock.id}
              userId={user?.id || ""}
            />
          ) : (
            <LetterGenerationPanel
              programId={programId}
              offerId={offerId}
              offerType={offerType}
              letterThemeTitle={letterThemeTitle}
              templateName={template?.name || ""}
              caseId={caseId}
              onChangeCaseId={setCaseId}
              generatedHtml={settingsMode ? "" : generatedHtml}
              imagePlaceholders={imagePlaceholders}
              generatingLetter={generatingLetter}
              onGenerate={generateLetter}
              onRegenerate={generateLetter}
              onEditSettings={() => setSettingsMode(true)}
              selectedBlockHtml={null}
              onChangeSelectedBlockHtml={() => {}}
            />
          )}
        </div>
      </div>

      {/* Export modal */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Экспорт HTML</DialogTitle>
          </DialogHeader>
          <Textarea value={exportHtml} readOnly className="font-mono text-xs min-h-[400px]" />
          <Button
            className="gap-1.5"
            onClick={() => { navigator.clipboard.writeText(exportHtml); toast.success("Скопировано"); }}
          >
            <Copy className="h-4 w-4" /> Скопировать
          </Button>
        </DialogContent>
      </Dialog>

      {/* Theme change wizard */}
      <CreateLetterWizard
        open={themeWizardOpen}
        onOpenChange={setThemeWizardOpen}
        themeOnlyMode
        onThemeChanged={handleThemeChanged}
      />
    </div>
  );
}
