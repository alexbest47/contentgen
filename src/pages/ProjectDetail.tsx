import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Sparkles, Check, Loader2, RefreshCw, Image, Send, Mail, ExternalLink, Eye, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { usePromptInfo } from "@/hooks/usePromptInfo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const getStatusLabel = (status: string, contentType?: string): string => {
  if (contentType === "reference_material") {
    const refLabels: Record<string, string> = {
      generating_leads: "Генерация справочного материала...",
      leads_ready: "Выберите справочный материал",
      lead_selected: "Справочный материал выбран",
    };
    if (refLabels[status]) return refLabels[status];
  }
  if (contentType === "expert_content") {
    const expertLabels: Record<string, string> = {
      generating_leads: "Генерация тем экспертного контента...",
      leads_ready: "Выберите тему экспертного контента",
      lead_selected: "Тема экспертного контента выбрана",
    };
    if (expertLabels[status]) return expertLabels[status];
  }
  if (contentType === "provocative_content") {
    const provocativeLabels: Record<string, string> = {
      generating_leads: "Генерация тем провокационного контента...",
      leads_ready: "Выберите тему провокационного контента",
      lead_selected: "Тема провокационного контента выбрана",
    };
    if (provocativeLabels[status]) return provocativeLabels[status];
  }
  if (contentType === "list_content") {
    const listLabels: Record<string, string> = {
      generating_leads: "Генерация тем списка...",
      leads_ready: "Выберите тему списка",
      lead_selected: "Тема списка выбрана",
    };
    if (listLabels[status]) return listLabels[status];
  }
  if (contentType === "testimonial_content") {
    const testimonialLabels: Record<string, string> = {
      draft: "Выберите кейс-отзыв",
      generating_leads: "Генерация углов подачи...",
      leads_ready: "Выберите угол подачи",
      lead_selected: "Угол подачи выбран",
    };
    if (testimonialLabels[status]) return testimonialLabels[status];
  }
  if (contentType === "myth_busting") {
    const mythLabels: Record<string, string> = {
      generating_leads: "Генерация тем разбора мифа...",
      leads_ready: "Выберите тему разбора мифа",
      lead_selected: "Тема разбора мифа выбрана",
    };
    if (mythLabels[status]) return mythLabels[status];
  }
  if (contentType === "objection_handling") {
    const objLabels: Record<string, string> = {
      draft: "Выберите возражение",
      generating_leads: "Генерация углов подачи...",
      leads_ready: "Выберите угол подачи",
      lead_selected: "Угол подачи выбран",
    };
    if (objLabels[status]) return objLabels[status];
  }
  const defaultLabels: Record<string, string> = {
    draft: "Черновик",
    generating_leads: "Генерация лид-магнитов...",
    leads_ready: "Выберите лид-магнит",
    lead_selected: "Лид-магнит выбран",
    generating_content: "Генерация контента...",
    completed: "Завершено",
    error: "Ошибка",
  };
  return defaultLabels[status] ?? status;
};

interface ContentType {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  isEmail: boolean;
}

const contentTypes: ContentType[] = [
  { key: "instagram", label: "Пост в Instagram", description: "Текст, карусель и изображения", icon: <Image className="h-5 w-5" />, isEmail: false },
  { key: "telegram", label: "Пост в Telegram", description: "Текст, карусель и изображения", icon: <Send className="h-5 w-5" />, isEmail: false },
  { key: "vk", label: "Пост в ВКонтакте", description: "Текст, карусель и изображения", icon: <Send className="h-5 w-5" />, isEmail: false },
  { key: "email", label: "Email-рассылка", description: "Тема, текст и баннер", icon: <Mail className="h-5 w-5" />, isEmail: true },
];

export default function ProjectDetail() {
  const { programId, offerType, offerId, projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [jsonDialog, setJsonDialog] = useState<{ name: string; json: any } | null>(null);
  const [selectingCase, setSelectingCase] = useState(false);
  const [filterType, setFilterType] = useState<string>("__all__");
  const [filterProduct, setFilterProduct] = useState<string>("__all__");
  const [filterTone, setFilterTone] = useState<string>("__all__");
  const [filterQuality, setFilterQuality] = useState<string>("__all__");
  const [filterTag, setFilterTag] = useState<string>("__all__");
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);

  const backUrl = `/programs/${programId}/offers/${offerType}/${offerId}`;

  const { data: allPromptInfo } = usePromptInfo({
    enabled: true,
  });

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: leadMagnets } = useQuery({
    queryKey: ["lead_magnets", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("lead_magnets").select("*").eq("project_id", projectId!);
      if (error) throw error;
      return data;
    },
  });

  const { data: contentPieces } = useQuery({
    queryKey: ["content_pieces", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_pieces")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: project?.status === "lead_selected" || project?.status === "completed",
  });

  const { data: pipelineCounts } = useQuery({
    queryKey: ["pipeline_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("channel, id")
        .eq("is_active", true)
        .not("channel", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((p: any) => {
        counts[p.channel] = (counts[p.channel] || 0) + 1;
      });
      return counts;
    },
  });

  // Color schemes
  const { data: colorSchemes } = useQuery({
    queryKey: ["color_schemes_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("color_schemes")
        .select("*")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data as { id: string; name: string; description: string; preview_colors: string[]; is_active: boolean }[];
    },
  });

  // Initialize selectedSchemeId from project or first active scheme
  useEffect(() => {
    if (project && colorSchemes) {
      const saved = (project as any).selected_color_scheme_id;
      if (saved && colorSchemes.some(s => s.id === saved)) {
        setSelectedSchemeId(saved);
      } else if (colorSchemes.length > 0 && !selectedSchemeId) {
        setSelectedSchemeId(colorSchemes[0].id);
      }
    }
  }, [project, colorSchemes]);

  const saveColorScheme = async (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    await supabase.from("projects").update({ selected_color_scheme_id: schemeId } as any).eq("id", projectId!);
  };

  // Fetch case classifications for testimonial_content
  const isTestimonial = project?.content_type === "testimonial_content";
  const needsCaseSelection = isTestimonial && project?.status === "draft" && !(project as any)?.selected_case_id;

  // Fetch selected case classification
  const selectedCaseId = (project as any)?.selected_case_id;
  const { data: selectedCase } = useQuery({
    queryKey: ["selected_case", selectedCaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_classifications")
        .select("*")
        .eq("id", selectedCaseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isTestimonial && !!selectedCaseId,
  });

  const { data: classifications } = useQuery({
    queryKey: ["case_classifications_for_select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_classifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: needsCaseSelection,
  });

  // Usage count: how many projects reference each case_classification
  const { data: usageCounts } = useQuery({
    queryKey: ["case_usage_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("selected_case_id")
        .not("selected_case_id", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((p: any) => {
        counts[p.selected_case_id] = (counts[p.selected_case_id] || 0) + 1;
      });
      return counts;
    },
    enabled: needsCaseSelection,
  });

  // Compute filter options from classifications
  const filterOptions = (() => {
    if (!classifications) return { types: [], products: [], tones: [], qualities: [], tags: [] };
    const types = new Set<string>();
    const products = new Set<string>();
    const tones = new Set<string>();
    const qualities = new Set<string>();
    const tags = new Set<string>();
    classifications.forEach((c) => {
      const j = (c.classification_json || {}) as any;
      if (j.video_type) types.add(j.video_type);
      (j.products || []).forEach((p: string) => products.add(p));
      if (j.emotional_tone) tones.add(j.emotional_tone);
      if (j.content_quality) qualities.add(j.content_quality);
      (j.tags || []).forEach((t: string) => tags.add(t));
    });
    return {
      types: Array.from(types).sort(),
      products: Array.from(products).sort(),
      tones: Array.from(tones).sort(),
      qualities: Array.from(qualities).sort(),
      tags: Array.from(tags).sort(),
    };
  })();

  // Filter classifications
  const filteredClassifications = classifications?.filter((c) => {
    const j = (c.classification_json || {}) as any;
    if (filterType !== "__all__" && j.video_type !== filterType) return false;
    if (filterProduct !== "__all__" && !(j.products || []).includes(filterProduct)) return false;
    if (filterTone !== "__all__" && j.emotional_tone !== filterTone) return false;
    if (filterQuality !== "__all__" && j.content_quality !== filterQuality) return false;
    if (filterTag !== "__all__" && !(j.tags || []).includes(filterTag)) return false;
    return true;
  });

  const selectCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      setSelectingCase(true);
      // Save selected_case_id
      const { error: updateErr } = await supabase.from("projects").update({
        selected_case_id: caseId,
      } as any).eq("id", projectId!);
      if (updateErr) throw updateErr;

      // Generate angles
      const { data, error } = await supabase.functions.invoke("generate-lead-magnets", {
        body: { project_id: projectId, content_type: "testimonial_content", case_classification_id: caseId },
      });
      if (error) throw new Error(error.message || "Ошибка генерации углов");
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["lead_magnets", projectId] });
      toast.success("Углы подачи сгенерированы!");
      setSelectingCase(false);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setSelectingCase(false);
    },
  });

  const selectMutation = useMutation({
    mutationFn: async (leadMagnetId: string) => {
      const selectedLm = leadMagnets?.find(lm => lm.id === leadMagnetId);
      await supabase.from("lead_magnets").update({ is_selected: false }).eq("project_id", projectId!);
      await supabase.from("lead_magnets").update({ is_selected: true }).eq("id", leadMagnetId);
      const { error } = await supabase.from("projects").update({
        selected_lead_magnet_id: leadMagnetId,
        status: "lead_selected" as const,
        title: selectedLm?.title ?? project?.title ?? "",
      }).eq("id", projectId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["lead_magnets", projectId] });
      const ct = project?.content_type;
      toast.success(ct === "reference_material" ? "Справочный материал выбран" : ct === "expert_content" ? "Тема экспертного контента выбрана" : ct === "provocative_content" ? "Тема провокационного контента выбрана" : ct === "list_content" ? "Тема списка выбрана" : ct === "testimonial_content" ? "Угол подачи выбран" : ct === "myth_busting" ? "Тема разбора мифа выбрана" : "Лид-магнит выбран");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generatePipelineMutation = useMutation({
    mutationFn: async (contentType: string) => {
      setGeneratingKey(contentType);
      const { data, error } = await supabase.functions.invoke("generate-pipeline", {
        body: { project_id: projectId, content_type: contentType },
      });
      if (error) throw new Error(error.message || "Ошибка генерации");
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_pieces", projectId] });
      toast.success("Контент сгенерирован!");
      setGeneratingKey(null);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setGeneratingKey(null);
    },
  });

  const getPipelineJson = (contentType: string) =>
    contentPieces?.find((cp) => cp.category === `pipeline_json_${contentType}`);

  const isLeadSelected = project?.status === "lead_selected" || project?.status === "completed";
  const visibleLeadMagnets = isLeadSelected
    ? leadMagnets?.filter(lm => lm.is_selected)
    : leadMagnets;
  const showLeadMagnets = visibleLeadMagnets && visibleLeadMagnets.length > 0;
  const showContentGeneration = isLeadSelected;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project?.title ?? "..."}</h1>
          <p className="text-muted-foreground">{getStatusLabel(project?.status ?? "draft", project?.content_type)}</p>
        </div>
      </div>

      {/* Selected case info for testimonial_content */}
      {isTestimonial && selectedCase && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Выбранный кейс</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedCase.source_url ? (
                <a href={selectedCase.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-sm text-primary hover:underline">
                  {selectedCase.file_name} <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="font-medium text-sm">{selectedCase.file_name}</span>
              )}
            </div>
            {(() => {
              const cj = (selectedCase.classification_json || {}) as any;
              return (
                <>
                  {cj.summary && <p className="text-sm text-muted-foreground">{cj.summary}</p>}
                  <div className="flex flex-wrap gap-1">
                    {cj.video_type && <Badge variant="outline">{cj.video_type}</Badge>}
                    {cj.student_name && <Badge variant="secondary">{cj.student_name}</Badge>}
                    {(cj.products || []).map((p: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </>
              );
            })()}
            <Button size="sm" variant="ghost" onClick={() => setJsonDialog({ name: selectedCase.file_name, json: selectedCase.classification_json })}>
              <Eye className="h-4 w-4 mr-1" /> Посмотреть JSON
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Case selection for testimonial_content */}
      {needsCaseSelection && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Выберите кейс-отзыв</h2>
          {selectingCase && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Генерация углов подачи...
            </div>
          )}
          <Card>
            <CardContent className="pt-6">
              {!classifications || classifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Нет результатов классификации. Сначала обработайте кейсы в разделе «Управление кейсами».
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Все типы</SelectItem>
                        {filterOptions.types.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterProduct} onValueChange={setFilterProduct}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Продукт" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Все продукты</SelectItem>
                        {filterOptions.products.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterTone} onValueChange={setFilterTone}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Тон" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Все тона</SelectItem>
                        {filterOptions.tones.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterQuality} onValueChange={setFilterQuality}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Качество" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Все качества</SelectItem>
                        {filterOptions.qualities.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterTag} onValueChange={setFilterTag}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue placeholder="Тег" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Все теги</SelectItem>
                        {filterOptions.tags.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Файл</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Студент</TableHead>
                        <TableHead>Продукты</TableHead>
                        <TableHead>Тон</TableHead>
                        <TableHead>Качество</TableHead>
                        <TableHead>Теги</TableHead>
                        <TableHead>Использован</TableHead>
                        <TableHead className="w-[140px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(filteredClassifications || []).map((c) => {
                        const j = (c.classification_json || {}) as any;
                        const count = usageCounts?.[c.id] || 0;
                        return (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div className="max-w-[200px]">
                                {c.source_url ? (
                                  <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate block">
                                    {c.file_name}
                                  </a>
                                ) : (
                                  <span className="text-sm font-medium truncate block">{c.file_name}</span>
                                )}
                                {j.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{j.summary}</p>}
                              </div>
                            </TableCell>
                            <TableCell>{j.video_type && <Badge variant="outline">{j.video_type}</Badge>}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {j.student_name || "—"}
                                {j.student_age && <span className="text-muted-foreground">, {j.student_age}</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[180px]">
                                {(j.products || []).map((p: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell><span className="text-sm">{j.emotional_tone || "—"}</span></TableCell>
                            <TableCell><span className="text-sm">{j.content_quality || "—"}</span></TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {(j.tags || []).slice(0, 3).map((t: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                                ))}
                                {(j.tags || []).length > 3 && <span className="text-xs text-muted-foreground">+{j.tags.length - 3}</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {count > 0 ? (
                                <Badge variant="secondary" className="text-xs">{count}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => setJsonDialog({ name: c.file_name, json: j })}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => selectCaseMutation.mutate(c.id)}
                                  disabled={selectingCase}
                                >
                                  Выбрать
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showLeadMagnets && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {project?.content_type === "reference_material" ? "Варианты справочных материалов" 
              : (project?.content_type === "expert_content" || project?.content_type === "provocative_content" || project?.content_type === "myth_busting") ? "Темы контента" 
              : project?.content_type === "list_content" ? "Варианты списков" 
              : project?.content_type === "testimonial_content" ? "Углы подачи кейса"
              : "Варианты лид-магнитов"}
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {visibleLeadMagnets.map((lm) => (
              <Card key={lm.id} className={`transition-all ${lm.is_selected ? "ring-2 ring-primary" : ""}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{lm.title}</CardTitle>
                    {lm.is_selected && <Badge className="bg-primary text-primary-foreground"><Check className="mr-1 h-3 w-3" />Выбран</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                   {project?.content_type === "testimonial_content" ? (
                     <>
                       <div><span className="font-medium">Тип угла:</span> {lm.visual_format}</div>
                       <div><span className="font-medium">Ключевая цитата:</span> {lm.visual_content || "—"}</div>
                       <div><span className="font-medium">Крючок:</span> {lm.instant_value}</div>
                       {lm.save_reason && (() => { try { const arc = JSON.parse(lm.save_reason); return arc ? <div className="space-y-1"><span className="font-medium">Сюжетная арка:</span><div className="pl-3 text-muted-foreground"><div>До: {arc.before}</div><div>Поворот: {arc.turning_point}</div><div>После: {arc.after}</div></div></div> : null; } catch { return null; } })()}
                       {lm.cta_text && <div><span className="font-medium">Что чувствует читатель:</span> {lm.cta_text}</div>}
                       <div><span className="font-medium">Переход к офферу:</span> {lm.transition_to_course}</div>
                     </>
                   ) : project?.content_type === "expert_content" || project?.content_type === "myth_busting" ? (
                     <>
                       <div><span className="font-medium">Категория:</span> {lm.visual_format}</div>
                       <div><span className="font-medium">Угол подачи:</span> {lm.visual_content}</div>
                       <div><span className="font-medium">Крючок:</span> {lm.instant_value}</div>
                       <div><span className="font-medium">Переход к офферу:</span> {lm.transition_to_course}</div>
                     </>
                   ) : project?.content_type === "provocative_content" ? (
                     <>
                       <div><span className="font-medium">Формат:</span> {lm.visual_format}</div>
                       <div><span className="font-medium">Угол подачи:</span> {lm.visual_content}</div>
                       <div><span className="font-medium">Крючок:</span> {lm.instant_value}</div>
                       <div><span className="font-medium">Триггер дискуссии:</span> {(lm as any).save_reason}</div>
                       <div><span className="font-medium">Переход к офферу:</span> {lm.transition_to_course}</div>
                     </>
                   ) : project?.content_type === "list_content" ? (
                     <>
                       <div><span className="font-medium">Подтип:</span> {lm.visual_format}</div>
                       <div><span className="font-medium">Крючок:</span> {lm.instant_value}</div>
                       <div><span className="font-medium">Переход к офферу:</span> {lm.transition_to_course}</div>
                     </>
                  ) : (
                    <>
                      <div><span className="font-medium">Визуальный формат:</span> {lm.visual_format}</div>
                      <div><span className="font-medium">Визуальный контент:</span> {lm.visual_content}</div>
                      <div><span className="font-medium">Мгновенная ценность:</span> {lm.instant_value}</div>
                      <div><span className="font-medium">Причина сохранить:</span> {(lm as any).save_reason}</div>
                      <div><span className="font-medium">Переход к офферу:</span> {lm.transition_to_course}</div>
                    </>
                  )}
                  {!lm.is_selected && (project?.status === "leads_ready" || project?.status === "lead_selected") && (
                    <Button variant="outline" className="w-full" onClick={() => selectMutation.mutate(lm.id)} disabled={selectMutation.isPending}>
                      Выбрать этот вариант
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showContentGeneration && colorSchemes && colorSchemes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Цветовая гамма</h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {colorSchemes.map((scheme) => {
              const isSelected = selectedSchemeId === scheme.id;
              return (
                <button
                  key={scheme.id}
                  className={`relative rounded-lg border-2 p-3 text-left transition-all hover:border-primary/50 ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  onClick={() => saveColorScheme(scheme.id)}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 rounded-full bg-primary p-0.5">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex gap-0.5 mb-2 h-10 rounded overflow-hidden">
                    {scheme.preview_colors.map((color: string, i: number) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <p className="text-sm font-medium truncate">{scheme.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showContentGeneration && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Создание контента</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {contentTypes.map((ct) => {
              const isGenerating = generatingKey === ct.key;
              const hasContent = !!getPipelineJson(ct.key);
              const stepCount = pipelineCounts?.[ct.key] || 0;
              const contentUrl = `/programs/${programId}/offers/${offerType}/${offerId}/projects/${projectId}/content/${ct.key}`;

              return (
                <Card
                  key={ct.key}
                  className={`transition-all ${hasContent ? "cursor-pointer hover:border-primary/50" : ""}`}
                  onClick={() => hasContent && navigate(contentUrl)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">{ct.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{ct.label}</CardTitle>
                          {hasContent && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              Готово
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{ct.description}</p>
                      </div>
                      {hasContent && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      size="sm"
                      variant={hasContent ? "outline" : "default"}
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        generatePipelineMutation.mutate(ct.key);
                      }}
                      disabled={isGenerating || (!!generatingKey && generatingKey !== ct.key) || stepCount === 0}
                    >
                      {isGenerating ? (
                        <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Генерация...</>
                      ) : hasContent ? (
                        <><RefreshCw className="mr-1 h-3 w-3" />Обновить</>
                      ) : (
                        <><Sparkles className="mr-1 h-3 w-3" />Создать</>
                      )}
                    </Button>
                    {stepCount === 0 && <p className="text-xs text-destructive mt-1 text-center">Нет промптов</p>}
                    {stepCount > 0 && (() => {
                      const prompt = allPromptInfo?.find(p => p.channel === ct.key);
                      return prompt ? (
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          Промпт: «{prompt.name}»
                        </p>
                      ) : null;
                    })()}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* JSON dialog for case preview */}
      <Dialog open={!!jsonDialog} onOpenChange={() => setJsonDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Классификация: {jsonDialog?.name}</DialogTitle>
          </DialogHeader>
          {jsonDialog?.json && (
            <div className="space-y-4">
              {jsonDialog.json.quote && (
                <blockquote className="border-l-4 border-primary pl-4 italic text-sm">«{jsonDialog.json.quote}»</blockquote>
              )}
              {jsonDialog.json.before_after && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">До</p>
                    <p className="text-sm">{jsonDialog.json.before_after.before || "—"}</p>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">После</p>
                    <p className="text-sm">{jsonDialog.json.before_after.after || "—"}</p>
                  </div>
                </div>
              )}
              {jsonDialog.json.key_insights && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Ключевые инсайты</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {jsonDialog.json.key_insights.map((insight: string, i: number) => <li key={i}>{insight}</li>)}
                  </ul>
                </div>
              )}
              <details>
                <summary className="text-xs text-muted-foreground cursor-pointer">Полный JSON</summary>
                <pre className="whitespace-pre-wrap text-xs leading-relaxed rounded-md bg-muted p-4 mt-2">
                  {JSON.stringify(jsonDialog.json, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
