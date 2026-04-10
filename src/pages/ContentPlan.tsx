import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Plus, Mail, Image, CalendarDays,
  Pencil, Trash2, GripVertical, X, ExternalLink,
  Clock, CheckCircle2, Send,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks, eachDayOfInterval,
  isSameMonth, isToday, isSameDay,
} from "date-fns";
import { ru } from "date-fns/locale";

// ─── Types ───
interface ContentPlanItem {
  id: string;
  date: string;
  type: "email" | "social" | "event";
  title: string;
  description: string | null;
  status: string;
  program_id: string | null;
  audience_segment: string | null;
  letter_id: string | null;
  social_type: string | null;
  post_id: string | null;
  event_type: string | null;
  custom_event_type_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
}

interface PaidProgram {
  id: string;
  title: string;
}

interface CustomEventType {
  id: string;
  name: string;
  color: string;
}

// ─── Color map ───
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  email: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  social: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  event: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
};

const TYPE_LABELS: Record<string, string> = {
  email: "Письмо",
  social: "Пост / Карусель",
  event: "Событие",
};

const EVENT_TYPES = [
  { value: "webinar", label: "Вебинар" },
  { value: "marathon", label: "Марафон" },
  { value: "new_stream", label: "Старт потока" },
  { value: "holiday", label: "Праздник" },
  { value: "custom", label: "Своё событие" },
];

const STATUS_LABELS: Record<string, string> = {
  todo: "Нужно подготовить",
  ready: "Готово к отправке / публикации",
  done: "Опубликовано / отправлено",
};

const STATUS_ICONS: Record<string, { icon: typeof Clock; className: string }> = {
  todo: { icon: Clock, className: "text-amber-500" },
  ready: { icon: CheckCircle2, className: "text-blue-500" },
  done: { icon: Send, className: "text-green-600" },
};

// ─── Main component ───
export default function ContentPlan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [items, setItems] = useState<ContentPlanItem[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [programs, setPrograms] = useState<PaidProgram[]>([]);
  const [customEventTypes, setCustomEventTypes] = useState<CustomEventType[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentPlanItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Form state
  const [formType, setFormType] = useState<"email" | "social" | "event">("email");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("todo");
  const [formProgramId, setFormProgramId] = useState<string>("");
  const [formAudienceSegment, setFormAudienceSegment] = useState("");
  const [formSocialType, setFormSocialType] = useState<"post" | "carousel">("post");
  const [formSelectedAccounts, setFormSelectedAccounts] = useState<string[]>([]);
  const [formEventType, setFormEventType] = useState("webinar");
  const [formCustomEventName, setFormCustomEventName] = useState("");
  const [formCustomEventColor, setFormCustomEventColor] = useState("#6B7280");

  // Detail popover
  const [detailItem, setDetailItem] = useState<ContentPlanItem | null>(null);

  // Filter
  const [filterType, setFilterType] = useState<string>("all");
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterCreator, setFilterCreator] = useState<string>("all");

  // Creator profiles
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  // DnD
  const [dragItemId, setDragItemId] = useState<string | null>(null);

  // ─── Data loading ───
  const loadItems = useCallback(async () => {
    let rangeStart: string;
    let rangeEnd: string;

    if (viewMode === "week") {
      rangeStart = format(currentWeekStart, "yyyy-MM-dd");
      rangeEnd = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd");
    } else {
      rangeStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      rangeEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    }

    const { data, error } = await supabase
      .from("content_plan_items")
      .select("*")
      .gte("date", rangeStart)
      .lte("date", rangeEnd)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading content plan:", error);
    } else {
      setItems((data as ContentPlanItem[]) || []);
    }
  }, [currentMonth, currentWeekStart, viewMode]);

  const loadRefs = useCallback(async () => {
    const [accRes, progRes, evtRes] = await Promise.all([
      supabase.from("social_accounts").select("id, platform, account_name").eq("is_active", true),
      supabase.from("paid_programs").select("id, title").order("title"),
      supabase.from("custom_event_types").select("*"),
    ]);
    if (accRes.data) setSocialAccounts(accRes.data as SocialAccount[]);
    if (progRes.data) setPrograms(progRes.data as PaidProgram[]);
    if (evtRes.data) setCustomEventTypes(evtRes.data as CustomEventType[]);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadItems(), loadRefs()]).finally(() => setLoading(false));
  }, [loadItems, loadRefs]);

  // Load creator profiles for current items
  useEffect(() => {
    if (items.length === 0) return;
    const creatorIds = Array.from(new Set(items.map((i) => i.created_by).filter(Boolean)));
    if (creatorIds.length === 0) return;

    supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", creatorIds)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        data.forEach((p: any) => {
          map[p.id] = p.full_name || "Без имени";
        });
        setProfilesMap(map);
      });
  }, [items]);

  // ─── Calendar grid ───
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekViewDays = useMemo(() => {
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end });
  }, [currentWeekStart]);

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  // ─── Item social accounts (loaded on demand) ───
  const [itemAccounts, setItemAccounts] = useState<Record<string, string[]>>({});

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterProgram !== "all" && item.program_id !== filterProgram) return false;
      if (filterAccount !== "all") {
        const accs = itemAccounts[item.id] || [];
        if (!accs.includes(filterAccount)) return false;
      }
      if (filterCreator !== "all" && item.created_by !== filterCreator) return false;
      return true;
    });
  }, [items, filterType, filterProgram, filterAccount, itemAccounts, filterCreator]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, ContentPlanItem[]> = {};
    filteredItems.forEach((item) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return map;
  }, [filteredItems]);
  useEffect(() => {
    if (items.length === 0) return;
    const socialItemIds = items.filter((i) => i.type === "social").map((i) => i.id);
    if (socialItemIds.length === 0) return;

    supabase
      .from("content_plan_social_accounts")
      .select("item_id, account_id")
      .in("item_id", socialItemIds)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string[]> = {};
        data.forEach((row: any) => {
          if (!map[row.item_id]) map[row.item_id] = [];
          map[row.item_id].push(row.account_id);
        });
        setItemAccounts(map);
      });
  }, [items]);

  // ─── Helpers ───
  const getAccountLabel = (accountId: string) => {
    const acc = socialAccounts.find((a) => a.id === accountId);
    return acc ? `${acc.platform} — ${acc.account_name}` : accountId;
  };

  const getProgramTitle = (programId: string | null) => {
    if (!programId) return null;
    return programs.find((p) => p.id === programId)?.title || null;
  };

  const getCreatorName = (userId: string) => {
    // Will be enhanced later with profiles lookup
    return userId === user?.id ? "Вы" : "Коллега";
  };

  // ─── Form handlers ───
  const resetForm = () => {
    setFormType("email");
    setFormTitle("");
    setFormDescription("");
    setFormStatus("planned");
    setFormProgramId("");
    setFormAudienceSegment("");
    setFormSocialType("post");
    setFormSelectedAccounts([]);
    setFormEventType("webinar");
    setFormCustomEventName("");
    setFormCustomEventColor("#6B7280");
    setEditingItem(null);
  };

  const openAddDialog = (dateStr: string) => {
    resetForm();
    setSelectedDate(dateStr);
    setDialogOpen(true);
  };

  const openEditDialog = (item: ContentPlanItem) => {
    setEditingItem(item);
    setSelectedDate(item.date);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setFormStatus(item.status);
    setFormProgramId(item.program_id || "");
    setFormAudienceSegment(item.audience_segment || "");
    setFormSocialType((item.social_type as "post" | "carousel") || "post");
    setFormEventType(item.event_type || "webinar");
    // Load accounts for social items
    if (item.type === "social" && itemAccounts[item.id]) {
      setFormSelectedAccounts(itemAccounts[item.id]);
    } else {
      setFormSelectedAccounts([]);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast({ title: "Укажите название", variant: "destructive" });
      return;
    }

    const payload: any = {
      date: selectedDate,
      type: formType,
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      status: formStatus,
      program_id: formProgramId || null,
      updated_at: new Date().toISOString(),
      // Email
      audience_segment: formType === "email" ? formAudienceSegment || null : null,
      letter_id: null,
      // Social
      social_type: formType === "social" ? formSocialType : null,
      post_id: null,
      // Event
      event_type: formType === "event" ? formEventType : null,
      custom_event_type_id: null,
    };

    // Handle custom event type creation
    if (formType === "event" && formEventType === "custom" && formCustomEventName.trim()) {
      const { data: newEvt } = await supabase
        .from("custom_event_types")
        .insert({ name: formCustomEventName.trim(), color: formCustomEventColor })
        .select()
        .single();
      if (newEvt) {
        payload.custom_event_type_id = newEvt.id;
        setCustomEventTypes((prev) => [...prev, newEvt as CustomEventType]);
      }
    }

    let savedItem: ContentPlanItem | null = null;

    if (editingItem) {
      const { data, error } = await supabase
        .from("content_plan_items")
        .update(payload)
        .eq("id", editingItem.id)
        .select()
        .single();
      if (error) {
        toast({ title: "Ошибка сохранения", description: error.message, variant: "destructive" });
        return;
      }
      savedItem = data as ContentPlanItem;
    } else {
      payload.created_by = user?.id;
      payload.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from("content_plan_items")
        .insert(payload)
        .select()
        .single();
      if (error) {
        toast({ title: "Ошибка создания", description: error.message, variant: "destructive" });
        return;
      }
      savedItem = data as ContentPlanItem;
    }

    // Save social accounts
    if (savedItem && formType === "social") {
      await supabase.from("content_plan_social_accounts").delete().eq("item_id", savedItem.id);
      if (formSelectedAccounts.length > 0) {
        await supabase.from("content_plan_social_accounts").insert(
          formSelectedAccounts.map((accId) => ({ item_id: savedItem!.id, account_id: accId }))
        );
      }
    }

    toast({ title: editingItem ? "Запись обновлена" : "Запись добавлена" });
    setDialogOpen(false);
    resetForm();
    loadItems();
  };

  const handleDelete = async (itemId: string) => {
    await supabase.from("content_plan_items").delete().eq("id", itemId);
    toast({ title: "Запись удалена" });
    setDetailItem(null);
    loadItems();
  };

  // ─── Drag & Drop (native HTML5) ───
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDragItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain") || dragItemId;
    if (!itemId) return;

    const { error } = await supabase
      .from("content_plan_items")
      .update({ date: dateStr, updated_at: new Date().toISOString() })
      .eq("id", itemId);

    if (error) {
      toast({ title: "Ошибка переноса", variant: "destructive" });
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, date: dateStr } : i))
      );
    }
    setDragItemId(null);
  };

  // ─── Render ───
  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Контент-план</h1>
      </div>

      {/* Navigation + Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (viewMode === "month") setCurrentMonth((m) => subMonths(m, 1));
              else setCurrentWeekStart((w) => subWeeks(w, 1));
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[220px] text-center capitalize">
            {viewMode === "month"
              ? format(currentMonth, "LLLL yyyy", { locale: ru })
              : `${format(currentWeekStart, "d MMM", { locale: ru })} — ${format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "d MMM yyyy", { locale: ru })}`}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (viewMode === "month") setCurrentMonth((m) => addMonths(m, 1));
              else setCurrentWeekStart((w) => addWeeks(w, 1));
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (viewMode === "month") setCurrentMonth(new Date());
              else setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
            }}
          >
            Сегодня
          </Button>

          <div className="flex items-center border rounded-md ml-2">
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("month")}
            >
              Месяц
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => {
                setViewMode("week");
                setCurrentWeekStart(startOfWeek(currentMonth, { weekStartsOn: 1 }));
              }}
            >
              Неделя
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="email">Письма</SelectItem>
              <SelectItem value="social">Посты</SelectItem>
              <SelectItem value="event">События</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProgram} onValueChange={setFilterProgram}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Программа" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все программы</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Аккаунт" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все аккаунты</SelectItem>
              {socialAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.platform} — {acc.account_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCreator} onValueChange={setFilterCreator}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Автор" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все авторы</SelectItem>
              {Object.entries(profilesMap).map(([uid, name]) => (
                <SelectItem key={uid} value={uid}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar grid — MONTH view */}
      {viewMode === "month" && (
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-muted/50">
          {weekDays.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-sm font-medium text-muted-foreground border-b">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const rawDayItems = itemsByDate[dateStr] || [];
            // Events first, then emails, then social
            const dayItems = [...rawDayItems].sort((a, b) => {
              const order = { event: 0, email: 1, social: 2 };
              return (order[a.type] ?? 9) - (order[b.type] ?? 9);
            });
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={dateStr}
                className={`min-h-[110px] border-b border-r p-1 transition-colors ${
                  !inMonth ? "bg-muted/30 opacity-50" : ""
                } ${today ? "bg-blue-50/50" : ""} ${
                  dragItemId ? "hover:bg-blue-50" : ""
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dateStr)}
              >
                {/* Day number + add button */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      today ? "bg-blue-600 text-white" : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {inMonth && (
                    <button
                      onClick={() => openAddDialog(dateStr)}
                      className="text-muted-foreground/50 hover:text-foreground hover:bg-muted rounded p-0.5 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-0.5">
                  {dayItems.slice(0, 4).map((item) => {
                    const colors = TYPE_COLORS[item.type];
                    const isEvent = item.type === "event";
                    const eventLabel = isEvent
                      ? (EVENT_TYPES.find((e) => e.value === item.event_type)?.label ||
                         customEventTypes.find((c) => c.id === item.custom_event_type_id)?.name ||
                         "Событие")
                      : null;
                    const StatusIcon = !isEvent && STATUS_ICONS[item.status] ? STATUS_ICONS[item.status].icon : null;
                    const statusClass = !isEvent && STATUS_ICONS[item.status] ? STATUS_ICONS[item.status].className : "";
                    return (
                      <Popover key={item.id}>
                        <PopoverTrigger asChild>
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            className={`${isEvent ? "text-xs leading-normal px-2 py-1 font-medium" : "text-[11px] leading-tight px-1.5 py-0.5"} rounded cursor-pointer ${colors.bg} ${colors.text} border ${colors.border} hover:shadow-sm transition-shadow flex items-center gap-1`}
                            title={item.title}
                          >
                            <GripVertical className={`${isEvent ? "h-3.5 w-3.5" : "h-3 w-3"} flex-shrink-0 opacity-40`} />
                            {isEvent && (
                              <span className="text-[10px] opacity-70 flex-shrink-0">{eventLabel}:</span>
                            )}
                            <span className="truncate flex-1">{item.title}</span>
                            {StatusIcon && <StatusIcon className={`h-3 w-3 flex-shrink-0 ${statusClass}`} />}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="start">
                          <ItemDetail
                            item={item}
                            accounts={itemAccounts[item.id] || []}
                            socialAccounts={socialAccounts}
                            programs={programs}
                            customEventTypes={customEventTypes}
                            onEdit={() => {
                              openEditDialog(item);
                            }}
                            onDelete={() => handleDelete(item.id)}
                            getAccountLabel={getAccountLabel}
                            getProgramTitle={getProgramTitle}
                            onNavigate={navigate}
                            creatorName={profilesMap[item.created_by] || "Неизвестный"}
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                  {dayItems.length > 4 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-[10px] text-primary hover:underline px-1 cursor-pointer bg-transparent border-none">
                          +{dayItems.length - 4} ещё
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3 max-h-[400px] overflow-y-auto" align="start">
                        <h4 className="font-semibold text-sm mb-2">
                          {format(day, "d MMMM", { locale: ru })} — все элементы ({dayItems.length})
                        </h4>
                        <div className="space-y-1">
                          {dayItems.map((item) => {
                            const colors = TYPE_COLORS[item.type];
                            const isEvt = item.type === "event";
                            const evtLabel = isEvt
                              ? (EVENT_TYPES.find((e) => e.value === item.event_type)?.label ||
                                 customEventTypes.find((c) => c.id === item.custom_event_type_id)?.name ||
                                 "Событие")
                              : null;
                            const SIcon = !isEvt && STATUS_ICONS[item.status] ? STATUS_ICONS[item.status].icon : null;
                            const sClass = !isEvt && STATUS_ICONS[item.status] ? STATUS_ICONS[item.status].className : "";
                            return (
                              <Popover key={`all-${item.id}`}>
                                <PopoverTrigger asChild>
                                  <div
                                    className={`${isEvt ? "text-xs leading-normal px-2 py-1.5 font-medium" : "text-[11px] leading-tight px-1.5 py-1"} rounded cursor-pointer ${colors.bg} ${colors.text} border ${colors.border} hover:shadow-sm transition-shadow flex items-center gap-1`}
                                    title={item.title}
                                  >
                                    {isEvt && (
                                      <span className="text-[10px] opacity-70 flex-shrink-0">{evtLabel}:</span>
                                    )}
                                    <span className="truncate flex-1">{item.title}</span>
                                    {SIcon && <SIcon className={`h-3 w-3 flex-shrink-0 ${sClass}`} />}
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4" align="start" side="right">
                                  <ItemDetail
                                    item={item}
                                    accounts={itemAccounts[item.id] || []}
                                    socialAccounts={socialAccounts}
                                    programs={programs}
                                    customEventTypes={customEventTypes}
                                    onEdit={() => openEditDialog(item)}
                                    onDelete={() => handleDelete(item.id)}
                                    getAccountLabel={getAccountLabel}
                                    getProgramTitle={getProgramTitle}
                                    onNavigate={navigate}
                                    creatorName={profilesMap[item.created_by] || "Неизвестный"}
                                  />
                                </PopoverContent>
                              </Popover>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Calendar grid — WEEK view (vertical) */}
      {viewMode === "week" && (
      <div className="space-y-3">
        {weekViewDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const rawDayItems = itemsByDate[dateStr] || [];
          const dayItems = [...rawDayItems].sort((a, b) => {
            const order = { event: 0, email: 1, social: 2 };
            return (order[a.type] ?? 9) - (order[b.type] ?? 9);
          });
          const today = isToday(day);

          return (
            <div
              key={dateStr}
              className={`border rounded-lg transition-colors ${today ? "border-blue-400 bg-blue-50/20" : ""} ${dragItemId ? "hover:bg-blue-50/30" : ""}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dateStr)}
            >
              {/* Day header */}
              <div className={`flex items-center justify-between px-4 py-2 border-b ${today ? "bg-blue-50/50" : "bg-muted/30"}`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                    today ? "bg-blue-600 text-white" : "text-foreground"
                  }`}>
                    {format(day, "d")}
                  </span>
                  <span className="text-sm font-medium capitalize">
                    {format(day, "EEEE", { locale: ru })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(day, "d MMMM", { locale: ru })}
                  </span>
                  {dayItems.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {dayItems.length}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => openAddDialog(dateStr)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted rounded p-1 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Items list */}
              {dayItems.length === 0 ? (
                <div className="px-4 py-3 text-xs text-muted-foreground">Нет записей</div>
              ) : (
                <div className="divide-y">
                  {dayItems.map((item) => {
                    const colors = TYPE_COLORS[item.type];
                    const isEvent = item.type === "event";
                    const eventLabel = isEvent
                      ? (EVENT_TYPES.find((e) => e.value === item.event_type)?.label ||
                         customEventTypes.find((c) => c.id === item.custom_event_type_id)?.name ||
                         "Событие")
                      : null;
                    const WStatusIcon = !isEvent && STATUS_ICONS[item.status] ? STATUS_ICONS[item.status].icon : null;
                    const wStatusClass = !isEvent && STATUS_ICONS[item.status] ? STATUS_ICONS[item.status].className : "";
                    const programTitle = getProgramTitle(item.program_id);
                    const accs = itemAccounts[item.id] || [];

                    return (
                      <Popover key={item.id}>
                        <PopoverTrigger asChild>
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors group"
                          >
                            {/* Color indicator */}
                            <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${colors.bg} border ${colors.border}`} />

                            {/* Grip */}
                            <GripVertical className="h-4 w-4 flex-shrink-0 opacity-30 group-hover:opacity-60" />

                            {/* Main info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{item.title}</span>
                                <Badge className={`${colors.bg} ${colors.text} border ${colors.border} text-[10px] h-5 px-1.5 flex-shrink-0`}>
                                  {TYPE_LABELS[item.type]}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                {/* Type-specific details */}
                                {item.type === "email" && (
                                  <>
                                    {WStatusIcon && (
                                      <span className="flex items-center gap-1">
                                        <WStatusIcon className={`h-3 w-3 ${wStatusClass}`} />
                                        {STATUS_LABELS[item.status]}
                                      </span>
                                    )}
                                    {programTitle && <span>📚 {programTitle}</span>}
                                    {item.audience_segment && <span>👥 {item.audience_segment}</span>}
                                  </>
                                )}
                                {item.type === "social" && (
                                  <>
                                    {WStatusIcon && (
                                      <span className="flex items-center gap-1">
                                        <WStatusIcon className={`h-3 w-3 ${wStatusClass}`} />
                                        {STATUS_LABELS[item.status]}
                                      </span>
                                    )}
                                    {programTitle && <span>📚 {programTitle}</span>}
                                    <span>{item.social_type === "carousel" ? "Карусель" : "Пост"}</span>
                                    {accs.length > 0 && (
                                      <span>{accs.map((a) => getAccountLabel(a)).join(", ")}</span>
                                    )}
                                  </>
                                )}
                                {item.type === "event" && (
                                  <>
                                    {eventLabel && <span>🎯 {eventLabel}</span>}
                                    {programTitle && <span>📚 {programTitle}</span>}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Actions hint */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); openEditDialog(item); }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="start">
                          <ItemDetail
                            item={item}
                            accounts={accs}
                            socialAccounts={socialAccounts}
                            programs={programs}
                            customEventTypes={customEventTypes}
                            onEdit={() => openEditDialog(item)}
                            onDelete={() => handleDelete(item.id)}
                            getAccountLabel={getAccountLabel}
                            getProgramTitle={getProgramTitle}
                            onNavigate={navigate}
                            creatorName={profilesMap[item.created_by] || "Неизвестный"}
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
          Письма
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-200 border border-green-300" />
          Посты / Карусели
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-200 border border-orange-300" />
          События
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Редактировать запись" : "Новая запись"} — {selectedDate && format(new Date(selectedDate + "T00:00:00"), "d MMMM yyyy", { locale: ru })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2">
              {(["email", "social", "event"] as const).map((t) => (
                <Button
                  key={t}
                  variant={formType === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormType(t)}
                  className="text-xs"
                >
                  {t === "email" && <Mail className="h-3.5 w-3.5 mr-1" />}
                  {t === "social" && <Image className="h-3.5 w-3.5 mr-1" />}
                  {t === "event" && <CalendarDays className="h-3.5 w-3.5 mr-1" />}
                  {TYPE_LABELS[t]}
                </Button>
              ))}
            </div>

            {/* Title */}
            <div>
              <Label>Название</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Тема письма, название поста или события..." />
            </div>

            {/* Description */}
            <div>
              <Label>Описание (необязательно)</Label>
              <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Краткое описание..." />
            </div>

            {/* Status — hidden for events */}
            {formType !== "event" && (
              <div>
                <Label>Статус</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Program (optional) */}
            <div>
              <Label>Программа (необязательно)</Label>
              <Select value={formProgramId || "none"} onValueChange={(v) => setFormProgramId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Без программы" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без программы</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email-specific */}
            {formType === "email" && (
              <div>
                <Label>Сегмент аудитории</Label>
                <Input
                  value={formAudienceSegment}
                  onChange={(e) => setFormAudienceSegment(e.target.value)}
                  placeholder="Например: Холодная база, Тёплые лиды..."
                />
              </div>
            )}

            {/* Social-specific */}
            {formType === "social" && (
              <>
                <div>
                  <Label>Тип</Label>
                  <Select value={formSocialType} onValueChange={(v) => setFormSocialType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">Пост</SelectItem>
                      <SelectItem value="carousel">Карусель</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Аккаунты</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {socialAccounts.map((acc) => {
                      const selected = formSelectedAccounts.includes(acc.id);
                      return (
                        <Badge
                          key={acc.id}
                          variant={selected ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            setFormSelectedAccounts((prev) =>
                              selected ? prev.filter((id) => id !== acc.id) : [...prev, acc.id]
                            );
                          }}
                        >
                          {acc.platform} — {acc.account_name}
                          {selected && <X className="h-3 w-3 ml-1" />}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Event-specific */}
            {formType === "event" && (
              <>
                <div>
                  <Label>Тип события</Label>
                  <Select value={formEventType} onValueChange={setFormEventType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((et) => (
                        <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                      ))}
                      {customEventTypes.map((cet) => (
                        <SelectItem key={cet.id} value={`custom_${cet.id}`}>
                          {cet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formEventType === "custom" && (
                  <div className="grid grid-cols-[1fr_80px] gap-2">
                    <div>
                      <Label>Название типа</Label>
                      <Input value={formCustomEventName} onChange={(e) => setFormCustomEventName(e.target.value)} placeholder="Мастер-класс..." />
                    </div>
                    <div>
                      <Label>Цвет</Label>
                      <Input type="color" value={formCustomEventColor} onChange={(e) => setFormCustomEventColor(e.target.value)} className="h-9" />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleSave}>{editingItem ? "Сохранить" : "Добавить"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Item Detail Popover Content ───
function ItemDetail({
  item,
  accounts,
  socialAccounts,
  programs,
  customEventTypes,
  onEdit,
  onDelete,
  getAccountLabel,
  getProgramTitle,
  onNavigate,
  creatorName,
}: {
  item: ContentPlanItem;
  accounts: string[];
  socialAccounts: SocialAccount[];
  programs: PaidProgram[];
  customEventTypes: CustomEventType[];
  onEdit: () => void;
  onDelete: () => void;
  getAccountLabel: (id: string) => string;
  getProgramTitle: (id: string | null) => string | null;
  onNavigate: (path: string) => void;
  creatorName: string;
}) {
  const colors = TYPE_COLORS[item.type];
  const programTitle = getProgramTitle(item.program_id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge className={`${colors.bg} ${colors.text} border ${colors.border}`}>
          {TYPE_LABELS[item.type]}
        </Badge>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-sm">{item.title}</h4>
        {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
      </div>

      <div className="text-xs space-y-1">
        {item.type !== "event" && (() => {
          const DetailStatusIcon = STATUS_ICONS[item.status]?.icon;
          const detailStatusClass = STATUS_ICONS[item.status]?.className || "";
          return (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Статус:</span>
              <span className="flex items-center gap-1">
                {DetailStatusIcon && <DetailStatusIcon className={`h-3.5 w-3.5 ${detailStatusClass}`} />}
                {STATUS_LABELS[item.status] || item.status}
              </span>
            </div>
          );
        })()}

        {programTitle && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Программа:</span>
            <span className="text-right">{programTitle}</span>
          </div>
        )}

        {item.type === "email" && item.audience_segment && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Сегмент:</span>
            <span>{item.audience_segment}</span>
          </div>
        )}

        {item.type === "social" && (
          <>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Тип:</span>
              <span>{item.social_type === "carousel" ? "Карусель" : "Пост"}</span>
            </div>
            {accounts.length > 0 && (
              <div>
                <span className="text-muted-foreground">Аккаунты:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {accounts.map((accId) => (
                    <Badge key={accId} variant="outline" className="text-[10px]">
                      {getAccountLabel(accId)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {item.type === "event" && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Тип события:</span>
            <span>
              {EVENT_TYPES.find((e) => e.value === item.event_type)?.label ||
                customEventTypes.find((c) => c.id === item.custom_event_type_id)?.name ||
                item.event_type}
            </span>
          </div>
        )}

        {(item.letter_id || item.post_id) && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Источник:</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => {
                if (item.letter_id) onNavigate(`/email-builder/${item.letter_id}`);
                if (item.post_id) onNavigate(`/programs`); // navigate to post project if possible
              }}
            >
              {item.letter_id ? "Открыть письмо" : "Открыть пост"}
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="flex justify-between pt-1 border-t mt-2">
          <span className="text-muted-foreground">Автор:</span>
          <span>{creatorName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Создано:</span>
          <span>{format(new Date(item.created_at), "d MMM yyyy, HH:mm", { locale: ru })}</span>
        </div>
      </div>
    </div>
  );
}
