import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { blockTypeLabels } from "./BlockLibrary";
import { OFFER_TYPES } from "@/lib/offerTypes";
import { toast } from "sonner";
import {
  ChevronRight, ChevronDown, Search, Check, Loader2,
} from "lucide-react";

interface TopicRow {
  id: string;
  parent_id: string | null;
  title: string;
  description: string;
  tags: string[];
}

interface TreeNode extends TopicRow {
  children: TreeNode[];
}

function buildTree(rows: TopicRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  if (!q) return nodes;
  const lower = q.toLowerCase();
  const filter = (ns: TreeNode[]): TreeNode[] =>
    ns
      .map((n) => {
        const cf = filter(n.children);
        if (n.title.toLowerCase().includes(lower) || cf.length > 0) return { ...n, children: cf };
        return null;
      })
      .filter(Boolean) as TreeNode[];
  return filter(nodes);
}

function TopicPickerNode({
  node,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}) {
  const [open, setOpen] = useState(true);
  const isSelected = node.id === selectedId;

  return (
    <div className="ml-3">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div
          className={`flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors ${
            isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
          }`}
          onClick={() => onSelect(node)}
        >
          {node.children.length > 0 ? (
            <CollapsibleTrigger asChild>
              <button
                className="p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(!open);
                }}
              >
                {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            </CollapsibleTrigger>
          ) : (
            <span className="w-4" />
          )}
          <span className="text-sm flex-1">{node.title}</span>
          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
        </div>
        {node.children.length > 0 && (
          <CollapsibleContent>
            {node.children.map((c) => (
              <TopicPickerNode key={c.id} node={c} selectedId={selectedId} onSelect={onSelect} />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

const AUDIENCE_SEGMENTS = [
  { key: "audience_from_scratch_personal", label: "С нуля — для себя" },
  { key: "audience_from_scratch_career", label: "С нуля — новая профессия" },
  { key: "audience_from_scratch_both", label: "С нуля — для себя и, возможно, профессия" },
  { key: "audience_with_diploma", label: "Есть образование — повышение квалификации" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeOnlyMode?: boolean;
  onThemeChanged?: (title: string, description: string) => void;
}

export default function CreateLetterWizard({ open, onOpenChange, themeOnlyMode, onThemeChanged }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(themeOnlyMode ? 2 : 1);
  const [selectedTopic, setSelectedTopic] = useState<TreeNode | null>(null);
  const [manualTopic, setManualTopic] = useState("");
  const [topicSearch, setTopicSearch] = useState("");
  const [audienceSegment, setAudienceSegment] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [letterTitle, setLetterTitle] = useState("");
  const [colorSchemeId, setColorSchemeId] = useState<string | null>(null);
  const [imageStyleId, setImageStyleId] = useState<string | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const [offerType, setOfferType] = useState("");
  const [offerId, setOfferId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Load topics
  const { data: topicRows } = useQuery({
    queryKey: ["topic_tree"],
    queryFn: async () => {
      const { data } = await supabase.from("topic_tree").select("*").order("sort_order");
      return (data ?? []) as TopicRow[];
    },
    enabled: open,
  });

  const tree = useMemo(() => buildTree(topicRows ?? []), [topicRows]);
  const filtered = useMemo(() => filterTree(tree, topicSearch), [tree, topicSearch]);

  // Load templates
  const { data: templates } = useQuery({
    queryKey: ["email_templates"],
    queryFn: async () => {
      const { data } = await supabase.from("email_templates").select("*").order("sort_order");
      return data ?? [];
    },
    enabled: open && step >= 1,
  });

  // Determine if selected template is "Прямой оффер"
  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);
  const selectedTemplateName = selectedTemplate?.name || "";
  const selectedTemplateCategory = (selectedTemplate as any)?.category || "paid_programs";
  const isDirectOffer = selectedTemplateName === "Прямой оффер";
  const isWebinar = selectedTemplateCategory === "webinar";
  const totalSteps = (isDirectOffer || isWebinar) ? 3 : 4;

  // Load audience variable descriptions — needed on audience step
  const audienceStepNum = (isDirectOffer || isWebinar) ? 2 : 3;
  const { data: audienceVars } = useQuery({
    queryKey: ["audience_global_vars"],
    queryFn: async () => {
      const { data } = await supabase
        .from("prompt_global_variables")
        .select("key, value")
        .in("key", AUDIENCE_SEGMENTS.map((s) => s.key));
      const map: Record<string, string> = {};
      data?.forEach((r: any) => { map[r.key] = r.value; });
      return map;
    },
    enabled: open && step >= audienceStepNum,
  });

  // Load color schemes — needed on settings step
  const settingsStepNum = (isDirectOffer || isWebinar) ? 3 : 4;
  const { data: colorSchemes } = useQuery({
    queryKey: ["color_schemes_active"],
    queryFn: async () => {
      const { data } = await supabase.from("color_schemes").select("id, name, preview_colors").eq("is_active", true).order("name");
      return data ?? [];
    },
    enabled: open && step >= settingsStepNum,
  });

  // Load image styles — needed on settings step
  const { data: imageStyles } = useQuery({
    queryKey: ["image_styles_active"],
    queryFn: async () => {
      const { data } = await supabase.from("image_styles").select("id, name").eq("is_active", true).order("name");
      return data ?? [];
    },
    enabled: open && step >= settingsStepNum,
  });

  // Load programs
  const { data: programs } = useQuery({
    queryKey: ["paid_programs_list"],
    queryFn: async () => {
      const { data } = await supabase.from("paid_programs").select("id, title").order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: open && step >= settingsStepNum,
  });

  // Load offers for selected program + type
  const { data: offers } = useQuery({
    queryKey: ["offers_wizard", programId, offerType],
    queryFn: async () => {
      if (!programId) return [];
      let q = supabase.from("offers").select("id, title").eq("program_id", programId).eq("is_archived", false);
      if (offerType) q = q.eq("offer_type", offerType as any);
      const { data } = await q.order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: open && step >= settingsStepNum && !!programId && !isWebinar,
  });

  // Load webinar offers (all active, no program filter needed)
  const { data: webinarOffers } = useQuery({
    queryKey: ["webinar_offers_wizard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("id, title, program_id")
        .eq("offer_type", "webinar" as any)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: open && isWebinar,
  });

  const handleSelectTopic = (node: TreeNode) => {
    setSelectedTopic(node);
    setManualTopic("");
  };

  const handleManualChange = (v: string) => {
    setManualTopic(v);
    if (v) setSelectedTopic(null);
  };

  const themeTitle = selectedTopic?.title || manualTopic;
  const themeDescription = selectedTopic?.description || manualTopic;
  const canNext1 = !!themeTitle.trim(); // topic selected
  const canNext2 = !!audienceSegment;   // audience selected
  const canNext3 = !!selectedTemplateId; // template selected
  const canNextWebinarAudience = isWebinar ? (!!audienceSegment && !!offerId) : !!audienceSegment;
  const canCreate = !!letterTitle.trim();

  const handleNext1 = () => {
    if (themeOnlyMode && onThemeChanged) {
      onThemeChanged(themeTitle, themeDescription);
      onOpenChange(false);
      return;
    }
    setStep(3);
  };

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    try {
      const template = templates?.find((t) => t.id === selectedTemplateId);
      const { data: letter, error } = await supabase
        .from("email_letters")
        .insert({
          created_by: user.id,
          title: letterTitle,
          selected_color_scheme_id: colorSchemeId,
          image_style_id: imageStyleId,
          letter_theme_title: (isDirectOffer || isWebinar) ? "" : themeTitle,
          letter_theme_description: (isDirectOffer || isWebinar) ? "" : themeDescription,
          template_id: selectedTemplateId,
          program_id: programId,
          offer_type: offerType,
          offer_id: offerId,
          audience_segment: audienceSegment || "",
        } as any)
        .select("id")
        .single();
      if (error) throw error;

      // Insert template blocks
      const blocks = (template?.blocks as any[]) || [];
      if (blocks.length > 0) {
        const insertBlocks = blocks.map((b: any, i: number) => ({
          letter_id: letter.id,
          block_type: b.block_type,
          sort_order: i,
          config: { mode: b.mode || "text_only", label: b.label },
        }));
        await supabase.from("email_letter_blocks").insert(insertBlocks);
      }

      onOpenChange(false);
      navigate(`/email-builder/${letter.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const resetState = () => {
    setStep(themeOnlyMode ? 2 : 1);
    setSelectedTopic(null);
    setManualTopic("");
    setTopicSearch("");
    setAudienceSegment(null);
    setSelectedTemplateId(null);
    setLetterTitle("");
    setColorSchemeId(null);
    setImageStyleId(null);
    setProgramId(null);
    setOfferType("");
    setOfferId(null);
  };

  const offerTypes = OFFER_TYPES.map((t) => [t.key, t.label] as const);

  // ─── Step titles ───
  const getStepTitle = () => {
    if (themeOnlyMode) return "Выбор темы письма";

    if (isDirectOffer || isWebinar) {
      const label = isWebinar ? "вебинар" : "оффер";
      if (step === 1) return "Шаг 1 из 3 — Как построить письмо?";
      if (step === 2) return isWebinar
        ? "Шаг 2 из 3 — Выбор вебинара и аудитории"
        : "Шаг 2 из 3 — Для кого это письмо?";
      if (step === 3) return "Шаг 3 из 3 — Настройки";
      return "";
    }

    // Default 4-step flow
    if (step === 1) return "Шаг 1 из 4 — Как построить письмо?";
    if (step === 2) return "Шаг 2 из 4 — О чём это письмо?";
    if (step === 3) return "Шаг 3 из 4 — Для кого это письмо?";
    return "Шаг 4 из 4 — Настройки";
  };

  // ─── Step content mapping ───
  // Direct offer / Webinar: step 1 = template, step 2 = audience (+webinar picker), step 3 = settings
  // Default:                step 1 = template, step 2 = topic,    step 3 = audience, step 4 = settings
  const showTemplateStep = step === 1;
  const showTopicStep = !(isDirectOffer || isWebinar) && step === 2;
  const showAudienceStep = (isDirectOffer || isWebinar) ? step === 2 : step === 3;
  const showSettingsStep = (isDirectOffer || isWebinar) ? step === 3 : step === 4;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetState();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step: Template */}
          {showTemplateStep && (
            <div className="space-y-3">
              {templates?.map((tpl) => {
                const blocks = (tpl.blocks as any[]) || [];
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <div
                    key={tpl.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"
                    }`}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{tpl.name}</h3>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{tpl.description}</p>
                    {blocks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {blocks.map((b: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {blockTypeLabels[b.block_type as keyof typeof blockTypeLabels] || b.block_type}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Step: Topic (only for non-direct-offer) */}
          {showTopicStep && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по темам..."
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="border rounded-lg max-h-[300px] overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Нет тем</p>
                ) : (
                  filtered.map((node) => (
                    <TopicPickerNode
                      key={node.id}
                      node={node}
                      selectedId={selectedTopic?.id || null}
                      onSelect={handleSelectTopic}
                    />
                  ))
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Или введите тему вручную</Label>
                <Input
                  value={manualTopic}
                  onChange={(e) => handleManualChange(e.target.value)}
                  placeholder="Своя тема..."
                />
              </div>

              {selectedTopic?.description && (
                <div className="border rounded-md p-3 bg-muted/30">
                  <p className="text-xs font-medium mb-1">Описание:</p>
                  <p className="text-sm text-muted-foreground">{selectedTopic.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Audience (+ webinar picker for webinar templates) */}
          {showAudienceStep && (
            <div className="space-y-4">
              {/* Webinar picker — only for webinar templates */}
              {isWebinar && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Выберите вебинар</Label>
                  <Select
                    value={offerId || ""}
                    onValueChange={(v) => {
                      setOfferId(v);
                      const webinar = webinarOffers?.find((w) => w.id === v);
                      if (webinar) {
                        setProgramId(webinar.program_id);
                        setOfferType("webinar");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите вебинар" />
                    </SelectTrigger>
                    <SelectContent>
                      {webinarOffers?.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {webinarOffers?.length === 0 && (
                    <p className="text-xs text-muted-foreground">Нет активных вебинаров. Создайте вебинар в разделе «Подготовка офферов».</p>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground">Это поможет точнее настроить тон и контекст</p>
              <div className="space-y-3">
                {AUDIENCE_SEGMENTS.map((seg) => {
                  const isSelected = audienceSegment === seg.key;
                  const description = audienceVars?.[seg.key] || "";
                  return (
                    <div
                      key={seg.key}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/40"
                      }`}
                      onClick={() => setAudienceSegment(seg.key)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{seg.label}</h3>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      {description && (
                        <p className="text-xs text-muted-foreground line-clamp-3">{description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step: Settings */}
          {showSettingsStep && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Название письма (внутреннее)</Label>
                <Input
                  value={letterTitle}
                  onChange={(e) => setLetterTitle(e.target.value)}
                  placeholder="Например: Прогрев — Выгорание"
                />
              </div>

              {/* Hide program/offer/type for webinar — already selected on step 2 */}
              {!isWebinar && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Платная программа</Label>
                    <Select value={programId || ""} onValueChange={(v) => { setProgramId(v); setOfferId(null); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите программу" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Тип оффера</Label>
                    <Select value={offerType} onValueChange={(v) => { setOfferType(v); setOfferId(null); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        {offerTypes.map(([key, label]) => (
                          <SelectItem key={key} value={key}>{String(label)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Конкретный оффер</Label>
                    <Select value={offerId || ""} onValueChange={setOfferId} disabled={!programId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите оффер" />
                      </SelectTrigger>
                      <SelectContent>
                        {offers?.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Цветовая гамма</Label>
                <Select value={colorSchemeId || ""} onValueChange={setColorSchemeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите гамму" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorSchemes?.map((cs) => (
                      <SelectItem key={cs.id} value={cs.id}>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {(cs.preview_colors ?? []).slice(0, 4).map((c: string, i: number) => (
                              <div
                                key={i}
                                className="w-3 h-3 rounded-full border"
                                style={{ backgroundColor: c, marginLeft: i > 0 ? -4 : 0 }}
                              />
                            ))}
                          </div>
                          {cs.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Стиль изображений</Label>
                <Select value={imageStyleId || ""} onValueChange={setImageStyleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите стиль" />
                  </SelectTrigger>
                  <SelectContent>
                    {imageStyles?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step > 1 && !themeOnlyMode && (
            <Button variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}>
              Назад
            </Button>
          )}

          {/* Step 1 → next */}
          {step === 1 && !themeOnlyMode && (
            <Button onClick={() => setStep(2)} disabled={!canNext3}>
              Далее
            </Button>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              {(isDirectOffer || isWebinar) ? (
                /* Direct offer / Webinar: step 2 = audience (+webinar) → step 3 */
                <Button onClick={() => setStep(3)} disabled={!canNextWebinarAudience}>
                  Далее
                </Button>
              ) : (
                /* Default: step 2 = topic */
                <Button onClick={handleNext1} disabled={!canNext1}>
                  {themeOnlyMode ? "Применить" : "Далее"}
                </Button>
              )}
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              {(isDirectOffer || isWebinar) ? (
                /* Direct offer / Webinar: step 3 = settings → create */
                <Button onClick={handleCreate} disabled={!canCreate || creating}>
                  {creating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  Создать письмо
                </Button>
              ) : (
                /* Default: step 3 = audience → step 4 */
                <Button onClick={() => setStep(4)} disabled={!canNext2}>
                  Далее
                </Button>
              )}
            </>
          )}

          {/* Step 4 (only for default 4-step flow) */}
          {step === 4 && !(isDirectOffer || isWebinar) && (
            <Button onClick={handleCreate} disabled={!canCreate || creating}>
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Создать письмо
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
