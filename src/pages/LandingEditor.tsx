import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Save, Loader2, Columns2, LayoutList, Settings, Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import LandingBlockCanvas from "@/components/landing-builder/LandingBlockCanvas";
import LandingBlockSettingsPanel from "@/components/landing-builder/LandingBlockSettingsPanel";
import LandingInlinePreview from "@/components/landing-builder/LandingInlinePreview";
import BlockLibraryModal from "@/components/landing-builder/BlockLibraryModal";
import { buildPreviewHtml, useInlinedCSS, useBlockDefsMap } from "@/hooks/useLandingPreviewHtml";
import { exportLandingAsZip } from "@/utils/exportLandingZip";

export type LandingBlock = {
  id: string;
  landing_id: string;
  block_definition_id: string;
  sort_order: number;
  is_visible: boolean;
  settings: Record<string, any>;
  content_overrides: Record<string, any>;
  custom_css: string | null;
  // Joined
  block_definition?: {
    id: string;
    block_type: string;
    name: string;
    category: string;
    html_template: string;
    editable_fields: any[];
    default_settings: Record<string, any>;
    default_content: Record<string, any>;
  };
};

export default function LandingEditor() {
  const { landingId } = useParams<{ landingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [blocks, setBlocks] = useState<LandingBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [viewMode, setViewMode] = useState<"canvas" | "preview">("preview");
  const [exporting, setExporting] = useState(false);
  const [showExportSettings, setShowExportSettings] = useState(false);
  const inlinedCSS = useInlinedCSS();
  const blockDefsMap = useBlockDefsMap();
  const [focusFieldRequest, setFocusFieldRequest] = useState<{
    blockId: string;
    field: string;
    index?: number;
    subfield?: string;
  } | null>(null);

  // Block library modal state
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockModalInsertIndex, setBlockModalInsertIndex] = useState<number | null>(null);

  // Accent color state (global landing theme color)
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [showAccentPicker, setShowAccentPicker] = useState(false);

  const ACCENT_PRESETS = [
    { color: "#7835FF", label: "Фиолетовый" },
    { color: "#2563EB", label: "Синий" },
    { color: "#0891B2", label: "Бирюзовый" },
    { color: "#059669", label: "Зелёный" },
    { color: "#D97706", label: "Оранжевый" },
    { color: "#DC2626", label: "Красный" },
    { color: "#DB2777", label: "Розовый" },
    { color: "#4F46E5", label: "Индиго" },
  ];

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blocksRef = useRef<LandingBlock[]>(blocks);

  // Keep blocksRef in sync with blocks state so save always uses latest data
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // Fetch landing
  const { data: landing, isLoading: landingLoading } = useQuery({
    queryKey: ["landing", landingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landings")
        .select("*, landing_templates(name, slug), paid_programs(title)")
        .eq("id", landingId!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!landingId,
  });

  // Fetch landing blocks with definitions
  const { data: fetchedBlocks, isLoading: blocksLoading } = useQuery({
    queryKey: ["landing_blocks", landingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_blocks")
        .select("*, landing_block_definitions(id, block_type, name, category, html_template, editable_fields, default_settings, default_content)")
        .eq("landing_id", landingId!)
        .order("sort_order");
      if (error) throw error;
      return (data as any[]).map((b) => ({
        ...b,
        block_definition: b.landing_block_definitions,
      })) as LandingBlock[];
    },
    enabled: !!landingId,
  });

  // Sync fetched blocks into local state
  useEffect(() => {
    if (fetchedBlocks) setBlocks(fetchedBlocks);
  }, [fetchedBlocks]);

  // Init accent color from DB
  useEffect(() => {
    if (landing?.accent_color !== undefined) {
      setAccentColor(landing.accent_color);
    }
  }, [landing?.accent_color]);

  // Save accent color to DB
  const saveAccentColor = useCallback(async (color: string | null) => {
    setAccentColor(color);
    const { error } = await supabase
      .from("landings")
      .update({ accent_color: color } as any)
      .eq("id", landingId!);
    if (error) {
      toast.error("Ошибка сохранения цвета");
    }
  }, [landingId]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  // Save function reads from ref to always get latest blocks
  const saveAllBlocks = useCallback(async () => {
    const currentBlocks = blocksRef.current;
    if (!currentBlocks.length) return;
    setSaveStatus("saving");
    let hasError = false;
    for (const block of currentBlocks) {
      const { error } = await supabase
        .from("landing_blocks")
        .update({
          sort_order: block.sort_order,
          is_visible: block.is_visible,
          settings: block.settings,
          content_overrides: block.content_overrides,
          custom_css: block.custom_css,
        })
        .eq("id", block.id);
      if (error) {
        console.error("Save error for block", block.id, error);
        hasError = true;
      }
    }
    if (hasError) {
      toast.error("Ошибка сохранения. Проверьте, что вы авторизованы.");
      setSaveStatus("unsaved");
    } else {
      setSaveStatus("saved");
      toast.success("Сохранено");
    }
  }, []);

  // Debounced auto-save
  const triggerSave = useCallback(() => {
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveAllBlocks();
    }, 2000);
  }, [saveAllBlocks]);

  // Block operations
  const updateBlock = useCallback((blockId: string, updates: Partial<LandingBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
    );
    triggerSave();
  }, [triggerSave]);

  const toggleVisibility = useCallback((blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, is_visible: !b.is_visible } : b))
    );
    triggerSave();
  }, [triggerSave]);

  const removeBlock = useCallback(async (blockId: string) => {
    const { error } = await supabase.from("landing_blocks").delete().eq("id", blockId);
    if (error) { toast.error("Ошибка удаления блока"); return; }
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    toast.success("Блок удалён");
  }, [selectedBlockId]);

  const moveBlock = useCallback((blockId: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const updated = [...prev];
      [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
      return updated.map((b, i) => ({ ...b, sort_order: i + 1 }));
    });
    triggerSave();
  }, [triggerSave]);

  /**
   * Add block at a specific position (insertIndex = index among visible blocks).
   * Uses default_content from the block definition as content_overrides.
   */
  const addBlockAtIndex = useCallback(async (blockDefinitionId: string, insertIndex: number | null) => {
    // Fetch the block definition to get default_content
    const { data: defData } = await supabase
      .from("landing_block_definitions")
      .select("default_content")
      .eq("id", blockDefinitionId)
      .single();
    const defaultContent = defData?.default_content as Record<string, any> || {};

    // Determine sort_order for the new block
    let newSortOrder: number;
    if (insertIndex === null || insertIndex >= blocks.length) {
      // Add at the end
      newSortOrder = blocks.length > 0 ? Math.max(...blocks.map((b) => b.sort_order)) + 1 : 1;
    } else if (insertIndex <= 0) {
      // Add at the beginning
      newSortOrder = blocks.length > 0 ? Math.min(...blocks.map((b) => b.sort_order)) : 1;
    } else {
      // Insert between blocks[insertIndex-1] and blocks[insertIndex]
      // We'll use blocks[insertIndex].sort_order and shift everything after
      newSortOrder = blocks[insertIndex]?.sort_order ?? blocks.length + 1;
    }

    // Shift sort_order of blocks at or after the insertion point
    const blocksToShift = blocks.filter((b) => b.sort_order >= newSortOrder);
    if (blocksToShift.length > 0) {
      // Update in DB
      for (const b of blocksToShift) {
        await supabase
          .from("landing_blocks")
          .update({ sort_order: b.sort_order + 1 })
          .eq("id", b.id);
      }
    }

    const { data, error } = await supabase
      .from("landing_blocks")
      .insert({
        landing_id: landingId!,
        block_definition_id: blockDefinitionId,
        sort_order: newSortOrder,
        is_visible: true,
        settings: {},
        content_overrides: defaultContent,
      })
      .select("*, landing_block_definitions(id, block_type, name, category, html_template, editable_fields, default_settings, default_content)")
      .single();

    if (error) { toast.error("Ошибка добавления блока"); return; }
    const newBlock = { ...(data as any), block_definition: (data as any).landing_block_definitions } as LandingBlock;

    // Update local state: insert at position and recalculate sort_orders
    setBlocks((prev) => {
      const updated = [...prev];
      // Shift sort_orders
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].sort_order >= newSortOrder) {
          updated[i] = { ...updated[i], sort_order: updated[i].sort_order + 1 };
        }
      }
      // Insert new block at the right position
      const insertPos = insertIndex !== null ? Math.min(insertIndex, updated.length) : updated.length;
      updated.splice(insertPos, 0, newBlock);
      return updated;
    });

    setSelectedBlockId(newBlock.id);
    toast.success("Блок добавлен");
  }, [blocks, landingId]);

  // Called from inline preview "+" button
  const handleAddBlockAtIndex = useCallback((insertIndex: number) => {
    setBlockModalInsertIndex(insertIndex);
    setBlockModalOpen(true);
  }, []);

  // Called when user picks a block in the modal
  const handleBlockSelected = useCallback((blockDefinitionId: string) => {
    addBlockAtIndex(blockDefinitionId, blockModalInsertIndex);
  }, [addBlockAtIndex, blockModalInsertIndex]);

  // Handle focus-field from inline preview click
  const handleFocusField = useCallback((blockId: string, field: string, index?: number, subfield?: string) => {
    setFocusFieldRequest({ blockId, field, index, subfield });
  }, []);

  const duplicateBlock = useCallback(async (blockId: string) => {
    const original = blocks.find((b) => b.id === blockId);
    if (!original) return;
    const { data, error } = await supabase
      .from("landing_blocks")
      .insert({
        landing_id: landingId!,
        block_definition_id: original.block_definition_id,
        sort_order: original.sort_order + 1,
        is_visible: original.is_visible,
        settings: original.settings,
        content_overrides: original.content_overrides,
        custom_css: original.custom_css,
      })
      .select("*, landing_block_definitions(id, block_type, name, category, html_template, editable_fields, default_settings, default_content)")
      .single();
    if (error) { toast.error("Ошибка дублирования"); return; }
    const newBlock = { ...(data as any), block_definition: (data as any).landing_block_definitions } as LandingBlock;
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      const updated = [...prev];
      updated.splice(idx + 1, 0, newBlock);
      return updated.map((b, i) => ({ ...b, sort_order: i + 1 }));
    });
    triggerSave();
    toast.success("Блок дублирован");
  }, [blocks, landingId, triggerSave]);

  const updateLandingMeta = useMutation({
    mutationFn: async (fields: {
      landing_type?: "wordpress" | "s3";
      wp_template_name?: string | null;
      site_title?: string | null;
      form_type?: "getcourse" | "gateway";
      getcourse_widget_id?: string | null;
      getcourse_action_id?: string | null;
      form_deal_name?: string | null;
      gateway_alias?: string | null;
      url_path?: string | null;
    }) => {
      const { error } = await supabase
        .from("landings")
        .update(fields)
        .eq("id", landingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing", landingId] });
      toast.success("Настройки сохранены");
    },
    onError: (e: any) => {
      toast.error(e?.message || "Ошибка сохранения настроек");
    },
  });

  if (landingLoading || blocksLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/landings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{landing?.name || "Лендинг"}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {landing?.landing_templates?.name && (
                <Badge variant="outline">{landing.landing_templates.name}</Badge>
              )}
              {landing?.paid_programs?.title && (
                <span>{landing.paid_programs.title}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={saveStatus === "saved" ? "secondary" : saveStatus === "saving" ? "outline" : "destructive"}>
            {saveStatus === "saved" ? "Сохранено" : saveStatus === "saving" ? "Сохранение..." : "Не сохранено"}
          </Badge>
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "canvas" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none h-8 px-2"
              onClick={() => setViewMode("canvas")}
              title="Список блоков"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none h-8 px-2"
              onClick={() => setViewMode("preview")}
              title="Превью с кликабельным редактированием"
            >
              <Columns2 className="h-4 w-4" />
            </Button>
          </div>
          <Popover open={showAccentPicker} onOpenChange={setShowAccentPicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" title="Акцентный цвет лендинга" className="gap-1.5">
                <div
                  className="w-4 h-4 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: accentColor || "#7835FF" }}
                />
                <Palette className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Акцентный цвет</h4>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      title={p.label}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        accentColor === p.color ? "border-foreground scale-110 ring-2 ring-offset-1 ring-foreground/20" : "border-transparent"
                      }`}
                      style={{ backgroundColor: p.color }}
                      onClick={() => {
                        saveAccentColor(p.color);
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor || "#7835FF"}
                    onChange={(e) => saveAccentColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border"
                    title="Выбрать произвольный цвет"
                  />
                  <Input
                    value={accentColor || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                        saveAccentColor(v);
                      } else {
                        setAccentColor(v);
                      }
                    }}
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                        saveAccentColor(v);
                      }
                    }}
                    placeholder="#7835FF"
                    className="h-8 text-sm font-mono flex-1"
                  />
                  {accentColor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => saveAccentColor(null)}
                      title="Сбросить на стандартный"
                    >
                      Сброс
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover open={showExportSettings} onOpenChange={setShowExportSettings}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" title="Общие настройки лендинга">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Общие настройки лендинга</h4>
                <div className="space-y-1">
                  <Label className="text-xs">Тип лендинга</Label>
                  <Select
                    value={(landing?.landing_type as "wordpress" | "s3" | undefined) || "wordpress"}
                    onValueChange={(value: "wordpress" | "s3") => {
                      updateLandingMeta.mutate({ landing_type: value });
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wordpress">Основной сайт (WordPress)</SelectItem>
                      <SelectItem value="s3">Статичный лендинг (s3-страница)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(landing?.landing_type || "wordpress") === "wordpress" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Уникальное название шаблона</Label>
                    <Input
                      defaultValue={landing?.wp_template_name || ""}
                      onBlur={(e) => updateLandingMeta.mutate({ wp_template_name: e.target.value || null })}
                      className="h-8 text-sm"
                      placeholder="Например: Психолог-консультант"
                    />
                  </div>
                )}
                {(landing?.landing_type || "wordpress") === "s3" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Title сайта</Label>
                      <Input
                        defaultValue={landing?.site_title || ""}
                        onBlur={(e) => updateLandingMeta.mutate({ site_title: e.target.value || null })}
                        className="h-8 text-sm"
                        placeholder="Например: Онлайн-курс Talentsy"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Тип формы</Label>
                      <Select
                        value={(landing?.form_type as "getcourse" | "gateway" | undefined) || "gateway"}
                        onValueChange={(value: "getcourse" | "gateway") => {
                          const patch: {
                            form_type: "getcourse" | "gateway";
                            getcourse_widget_id?: string | null;
                            getcourse_action_id?: string | null;
                          } = { form_type: value };
                          if (value === "gateway") {
                            patch.getcourse_widget_id = null;
                            patch.getcourse_action_id = null;
                          }
                          updateLandingMeta.mutate(patch);
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="getcourse">GetCourse</SelectItem>
                          <SelectItem value="gateway">Шлюз</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(landing?.form_type || "gateway") === "getcourse" && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">ID виджета GetCourse</Label>
                          <Input
                            defaultValue={landing?.getcourse_widget_id || ""}
                            onBlur={(e) => updateLandingMeta.mutate({ getcourse_widget_id: e.target.value || null })}
                            className="h-8 text-sm"
                            placeholder="Например: 123456"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">ActionID виджета GetCourse</Label>
                          <Input
                            defaultValue={landing?.getcourse_action_id || ""}
                            onBlur={(e) => updateLandingMeta.mutate({ getcourse_action_id: e.target.value || null })}
                            className="h-8 text-sm"
                            placeholder="Например: abc123"
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Название формы/сделки (опционально)</Label>
                      <Input
                        defaultValue={landing?.form_deal_name || ""}
                        onBlur={(e) => updateLandingMeta.mutate({ form_deal_name: e.target.value || null })}
                        className="h-8 text-sm"
                        placeholder="Например: Лид-форма курса"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Alias шлюза (опционально)</Label>
                      <Input
                        defaultValue={landing?.gateway_alias || ""}
                        onBlur={(e) => updateLandingMeta.mutate({ gateway_alias: e.target.value || null })}
                        className="h-8 text-sm"
                        placeholder="Например: psychology-spring"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">URL (путь после домена)</Label>
                      <Input
                        defaultValue={landing?.url_path || ""}
                        onBlur={(e) => updateLandingMeta.mutate({ url_path: e.target.value || null })}
                        className="h-8 text-sm"
                        placeholder="/courses/psychology-pro"
                      />
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={async () => {
              if (!inlinedCSS) {
                toast.error("CSS ещё загружается, попробуйте через секунду");
                return;
              }
              setExporting(true);
              try {
                const { rawBlockHtmls } = buildPreviewHtml(
                  blocks,
                  inlinedCSS,
                  landing?.name || "landing",
                  blockDefsMap || undefined,
                  false, // no editable markers for export
                  {
                    breadcrumbSlug: landing?.breadcrumb_slug || "psychology",
                    breadcrumbTitle: landing?.breadcrumb_title || "Курсы психологии",
                  },
                  accentColor,
                );
                if (rawBlockHtmls.length === 0) {
                  toast.error("Нет блоков для экспорта");
                  return;
                }
                await exportLandingAsZip(
                  rawBlockHtmls,
                  landing?.name || "landing",
                  (landing?.landing_type as "wordpress" | "s3" | undefined) || "s3",
                  {
                    wpTemplateName: landing?.wp_template_name || null,
                    siteTitle: landing?.site_title || null,
                    formType: (landing?.form_type as "getcourse" | "gateway" | undefined) || "gateway",
                    getcourseActionId: landing?.getcourse_action_id || null,
                    formDealName: landing?.form_deal_name || null,
                    gatewayAlias: landing?.gateway_alias || null,
                  },
                );
                toast.success("ZIP-архив скачан");
              } catch (err) {
                console.error("Export error:", err);
                toast.error("Ошибка при экспорте ZIP");
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
            Скачать ZIP
          </Button>
          <Button variant="outline" size="sm" onClick={saveAllBlocks}>
            <Save className="mr-2 h-4 w-4" /> Сохранить
          </Button>
        </div>
      </div>

      {/* 2-panel editor: Preview/Canvas + Settings */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={65} minSize={40}>
          {viewMode === "canvas" ? (
            <LandingBlockCanvas
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onMoveBlock={moveBlock}
              onToggleVisibility={toggleVisibility}
              onRemoveBlock={removeBlock}
              onDuplicateBlock={duplicateBlock}
            />
          ) : (
            <LandingInlinePreview
              blocks={blocks}
              landingName={landing?.name || "Лендинг"}
              accentColor={accentColor}
              onSelectBlock={setSelectedBlockId}
              onFocusField={handleFocusField}
              onAddBlockAtIndex={handleAddBlockAtIndex}
              onMoveBlock={moveBlock}
              onDuplicateBlock={duplicateBlock}
              onRemoveBlock={removeBlock}
            />
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
          <LandingBlockSettingsPanel
            key={selectedBlock?.id || "__none__"}
            block={selectedBlock}
            onUpdateBlock={updateBlock}
            landingId={landingId!}
            programTitle={landing?.paid_programs?.title || null}
            focusFieldRequest={focusFieldRequest}
            onFocusFieldHandled={() => setFocusFieldRequest(null)}
            onBlockContentGenerated={(blockId, newOverrides) => {
              setBlocks((prev) =>
                prev.map((b) =>
                  b.id === blockId ? { ...b, content_overrides: newOverrides } : b
                )
              );
            }}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Block library modal */}
      <BlockLibraryModal
        open={blockModalOpen}
        onClose={() => {
          setBlockModalOpen(false);
          setBlockModalInsertIndex(null);
        }}
        onSelectBlock={handleBlockSelected}
      />
    </div>
  );
}
