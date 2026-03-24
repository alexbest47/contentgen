import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTaskQueue } from "@/hooks/useTaskQueue";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy } from "lucide-react";
import BlockLibrary, { type EmailBlockType, isTemplateLocked } from "@/components/email-builder/BlockLibrary";
import BlockCanvas, { type EmailBlock } from "@/components/email-builder/BlockCanvas";
import BlockSettingsPanel from "@/components/email-builder/BlockSettingsPanel";
import EmailBuilderHeader from "@/components/email-builder/EmailBuilderHeader";
import CreateLetterWizard from "@/components/email-builder/CreateLetterWizard";
import LetterGenerationPanel, { type ImagePlaceholder } from "@/components/email-builder/LetterGenerationPanel";
import CasePickerDialog from "@/components/email-builder/CasePickerDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function EmailBuilder() {
  const { letterId } = useParams<{ letterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { enqueue } = useTaskQueue();

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
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [generatingPlaceholderId, setGeneratingPlaceholderId] = useState<string | null>(null);
  const [settingsMode, setSettingsMode] = useState(false);
  const [selectedObjectionIds, setSelectedObjectionIds] = useState<string[]>([]);

  const handleChangeCaseId = useCallback(async (id: string | null) => {
    setCaseId(id);
    if (letterId) {
      await supabase.from("email_letters").update({ case_id: id }).eq("id", letterId);
    }
  }, [letterId]);

  const dirtyRef = useRef(false);
  const initialLoadRef = useRef(false);
  const blocksLoadedRef = useRef(false);
  const hydratingRef = useRef(false); // true while applying DB data to state

  // Refs to always have fresh values for autosave (avoids race conditions)
  const imagePlaceholdersRef = useRef(imagePlaceholders);
  useEffect(() => { imagePlaceholdersRef.current = imagePlaceholders; }, [imagePlaceholders]);
  const generatedHtmlRef = useRef(generatedHtml);
  useEffect(() => { generatedHtmlRef.current = generatedHtml; }, [generatedHtml]);

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

  // Load accent color from color scheme
  const { data: accentColor } = useQuery({
    queryKey: ["color_scheme_accent", colorSchemeId],
    queryFn: async () => {
      const { data } = await supabase.from("color_schemes").select("preview_colors").eq("id", colorSchemeId!).single();
      return data?.preview_colors?.[1] || null;
    },
    enabled: !!colorSchemeId,
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

  // Initialize state from DB (and re-hydrate if DB has newer generated content)
  useEffect(() => {
    if (!letter) return;
    const dbHtml = (letter as any).generated_html || "";
    const dbPlaceholders = ((letter as any).image_placeholders as ImagePlaceholder[]) || [];

    if (!initialLoadRef.current) {
      // First load — hydrate everything without marking dirty
      hydratingRef.current = true;
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
      setGeneratedHtml(dbHtml);
      setImagePlaceholders(dbPlaceholders);
      setSelectedObjectionIds((letter as any).selected_objection_ids || []);
      initialLoadRef.current = true;
      // Reset hydrating flag after React processes the state updates
      requestAnimationFrame(() => { hydratingRef.current = false; });
    } else if (!dirtyRef.current && dbHtml && !generatedHtmlRef.current) {
      // Re-hydrate: DB has generated content but local state is empty (e.g. background generation finished)
      hydratingRef.current = true;
      setGeneratedHtml(dbHtml);
      setImagePlaceholders(dbPlaceholders);
      setSubject(letter.subject);
      setPreheader(letter.preheader);
      requestAnimationFrame(() => { hydratingRef.current = false; });
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

  // Mark dirty on changes — but NOT during hydration from DB
  useEffect(() => {
    if (initialLoadRef.current && !hydratingRef.current) {
      dirtyRef.current = true;
      setSaveStatus("unsaved");
    }
  }, [title, subject, preheader, colorSchemeId, blocks, generatedHtml, imagePlaceholders, caseId, extraOfferIds, selectedObjectionIds]);

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
        generated_html: generatedHtmlRef.current,
        image_placeholders: imagePlaceholdersRef.current,
        selected_objection_ids: selectedObjectionIds,
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
  }, [letterId, title, subject, preheader, colorSchemeId, letterThemeTitle, letterThemeDescription, programId, offerType, offerId, caseId, extraOfferIds, generatedHtml, imagePlaceholders, blocks, selectedObjectionIds]);

  // Stable ref for save so autosave/unmount always uses latest version
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; }, [save]);

  useEffect(() => {
    const interval = setInterval(() => saveRef.current(), 30000);
    return () => clearInterval(interval);
  }, []);

  // Save only on true component unmount (empty deps = runs once)
  useEffect(() => {
    return () => { saveRef.current(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      await enqueue({
        functionName: "generate-email-block",
        payload: {
          block_id: blockId,
          block_type: block.block_type,
          config: block.config,
          color_scheme_id: colorSchemeId,
          mode: block.config.mode || "text_only",
          letter_id: letterId,
        },
        displayTitle: `Генерация блока: ${block.block_type}`,
        lane: "claude",
        targetUrl: `/email-builder/${letterId}`,
      });
      toast.success("Задача добавлена в очередь");
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    } finally {
      setGeneratingBlockId(null);
    }
  };

  const generateImage = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block?.banner_image_prompt) return;
    setGeneratingImageBlockId(blockId);
    try {
      await enqueue({
        functionName: "generate-email-block",
        payload: { generate_image: true, block_id: blockId, banner_image_prompt: block.banner_image_prompt },
        displayTitle: `Генерация изображения блока`,
        lane: "openrouter",
        targetUrl: `/email-builder/${letterId}`,
      });
      toast.success("Задача добавлена в очередь");
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
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
        audience_segment: audienceSegment,
        selected_objection_ids: selectedObjectionIds,
      } as any).eq("id", letterId);

      await enqueue({
        functionName: "generate-email-letter",
        payload: { letter_id: letterId },
        displayTitle: `Генерация письма: ${title || "Без названия"}`,
        lane: "claude",
        targetUrl: `/email-builder/${letterId}`,
      });
      toast.success("Задача добавлена в очередь");
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
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
      await enqueue({
        functionName: "generate-email-letter",
        payload: { generate_image: true, placeholder_id: placeholderId, prompt: ph.prompt },
        displayTitle: `Генерация изображения письма`,
        lane: "openrouter",
        targetUrl: `/email-builder/${letterId}`,
      });
      toast.success("Задача добавлена в очередь");
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    } finally {
      setGeneratingPlaceholderId(null);
    }
  };

  // Upload custom image for a placeholder
  const uploadPlaceholderImage = async (placeholderId: string, file: File) => {
    if (!letterId) return;
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `email-letter-${placeholderId}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("generated-images")
        .upload(fileName, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from("generated-images").getPublicUrl(fileName);
      setImagePlaceholders(prev => {
        const updated = prev.map((p) =>
          p.id === placeholderId ? { ...p, image_url: pub.publicUrl } : p
        );
        supabase.from("email_letters").update({
          image_placeholders: updated,
        } as any).eq("id", letterId);
        return updated;
      });
      toast.success("Изображение загружено");
    } catch (e: any) {
      toast.error(e.message || "Ошибка загрузки изображения");
    }
  };


  const handleExport = () => {
    const header = emailSettings?.email_header_html || "";
    const footer = emailSettings?.email_footer_html || "";

    // Build generated letter body
    let letterBody = "";
    if (generatedHtml) {
      letterBody = generatedHtml;
      for (const ph of imagePlaceholders) {
        const placeholder = `{{${ph.id}}}`;
        if (ph.image_url) {
          letterBody = letterBody.replace(
            new RegExp(`<img([^>]*)src\\s*=\\s*["']\\{\\{${ph.id}\\}\\}["']([^>]*)>`, "g"),
            `<img$1src="${ph.image_url}"$2>`
          );
          letterBody = letterBody.replace(placeholder, ph.image_url);
        } else {
          letterBody = letterBody.replace(
            new RegExp(`<img[^>]*src\\s*=\\s*["']\\{\\{${ph.id}\\}\\}["'][^>]*>`, "g"),
            ""
          );
          letterBody = letterBody.replace(placeholder, "");
        }
      }
    }

    // Build user blocks body
    const blocksBody = blocks
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((b) => {
        if (b.generated_html) {
          let html = b.generated_html;
          if (b.banner_image_url) {
            html = `<img src="${b.banner_image_url}" alt="" style="max-width:600px;width:100%;border-radius:6px;" />\n` + html;
          }
          return html;
        }
        if (b.block_type === "divider") return `<hr style="border:none;border-top:1px solid ${accentColor || '#E0E0E0'};margin:24px 0;" />`;
        if (b.block_type === "text" && b.config.html) return b.config.html;
        if (b.block_type === "cta" && b.config.text) {
          return `<div style="text-align:center;padding:16px 0;"><a href="${b.config.url || '#'}" style="display:inline-block;padding:12px 32px;background-color:${b.config.color || accentColor || '#6366f1'};color:#ffffff;border-radius:6px;text-decoration:none;font-weight:600;">${b.config.text}</a></div>`;
        }
        if (b.block_type === "image" && (b.config.url || b.config.src)) {
          return `<div style="text-align:${b.config.align || 'center'};"><img src="${b.config.url || b.config.src}" alt="${b.config.alt || ''}" style="max-width:600px;width:100%;" /></div>`;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n");

    const body = [letterBody, blocksBody].filter(Boolean).join("\n\n");
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
        
        onExportHtml={handleExport}
        onSave={save}
        onChangeTheme={() => setThemeWizardOpen(true)}
        onGenerateLetter={generateLetter}
        
        generatingLetter={generatingLetter}
        canGenerate={
          ["Приглашение на вебинар: письмо 1", "Приглашение на вебинар: письмо 2"].includes(template?.name || "")
            ? true
            : template?.name === "Прямой оффер"
              ? (!!caseId && selectedObjectionIds.length > 0)
              : !!caseId
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Block Library */}
        <div className="w-60 border-r p-3 overflow-y-auto shrink-0">
          <BlockLibrary onAddBlock={addBlock} isFullLetterMode={!!generatedHtml} templateName={template?.name || ""} />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <BlockCanvas
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            headerHtml={emailSettings?.email_header_html || ""}
            footerHtml={emailSettings?.email_footer_html || ""}
            colorSchemeId={colorSchemeId}
            onSelectBlock={(id) => {
              const block = blocks.find(b => b.id === id);
              if (block && block.block_type === "testimonial_content") {
                setCasePickerOpen(true);
                return;
              }
              if (block && isTemplateLocked(block.block_type)) return;
              setSelectedBlockId(id);
            }}
            onMoveBlock={moveBlock}
            onDeleteBlock={deleteBlock}
            onGenerateImage={generateImage}
            generatingImageBlockId={generatingImageBlockId}
            generatedHtml={generatedHtml}
            imagePlaceholders={imagePlaceholders}
            onGeneratePlaceholderImage={generatePlaceholderImage}
            generatingPlaceholderId={generatingPlaceholderId}
            onUpdateGeneratedHtml={setGeneratedHtml}
            onUploadPlaceholderImage={uploadPlaceholderImage}
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
              caseId={caseId}
              onChangeCaseId={handleChangeCaseId}
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
              selectedObjectionIds={selectedObjectionIds}
              onChangeObjectionIds={setSelectedObjectionIds}
              noCaseRequired={["Приглашение на вебинар: письмо 1", "Приглашение на вебинар: письмо 2"].includes(template?.name || "")}
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

      <CasePickerDialog
        open={casePickerOpen}
        onOpenChange={setCasePickerOpen}
        onSelect={(id) => handleChangeCaseId(id)}
        selectedCaseId={caseId}
      />
    </div>
  );
}
