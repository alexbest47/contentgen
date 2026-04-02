import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Download, Save, Loader2, Columns2, LayoutList } from "lucide-react";
import { toast } from "sonner";
import LandingBlockLibrary from "@/components/landing-builder/LandingBlockLibrary";
import LandingBlockCanvas from "@/components/landing-builder/LandingBlockCanvas";
import LandingBlockSettingsPanel from "@/components/landing-builder/LandingBlockSettingsPanel";
import LandingInlinePreview from "@/components/landing-builder/LandingInlinePreview";

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
  const [focusFieldRequest, setFocusFieldRequest] = useState<{
    blockId: string;
    field: string;
    index?: number;
    subfield?: string;
  } | null>(null);
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

  const addBlock = useCallback(async (blockDefinitionId: string) => {
    // Fetch the block definition to get default_content
    const { data: defData } = await supabase
      .from("landing_block_definitions")
      .select("default_content")
      .eq("id", blockDefinitionId)
      .single();
    const defaultContent = defData?.default_content as Record<string, any> || {};

    const maxSort = blocks.length > 0 ? Math.max(...blocks.map((b) => b.sort_order)) : 0;
    const { data, error } = await supabase
      .from("landing_blocks")
      .insert({
        landing_id: landingId!,
        block_definition_id: blockDefinitionId,
        sort_order: maxSort + 1,
        is_visible: true,
        settings: {},
        content_overrides: defaultContent,
      })
      .select("*, landing_block_definitions(id, block_type, name, category, html_template, editable_fields, default_settings, default_content)")
      .single();
    if (error) { toast.error("Ошибка добавления блока"); return; }
    const newBlock = { ...(data as any), block_definition: (data as any).landing_block_definitions } as LandingBlock;
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    toast.success("Блок добавлен");
  }, [blocks, landingId]);

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
          <Button variant="outline" size="sm" onClick={() => navigate(`/landings/${landingId}/preview`)}>
            <Eye className="mr-2 h-4 w-4" /> Превью
          </Button>
          <Button variant="outline" size="sm" onClick={saveAllBlocks}>
            <Save className="mr-2 h-4 w-4" /> Сохранить
          </Button>
        </div>
      </div>

      {/* 3-panel editor */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <LandingBlockLibrary onAddBlock={addBlock} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
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
              onSelectBlock={setSelectedBlockId}
              onFocusField={handleFocusField}
            />
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <LandingBlockSettingsPanel
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
    </div>
  );
}
