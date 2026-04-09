import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Search, Check } from "lucide-react";

type Direction = "psychology" | "nutrition" | "coaching";

const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: "psychology", label: "Психология" },
  { value: "nutrition", label: "Нутрициология" },
  { value: "coaching", label: "Коучинг" },
];

interface TopicRow {
  id: string;
  parent_id: string | null;
  title: string;
  description: string;
  tags: string[];
  sort_order: number;
  direction: Direction;
}

interface TreeNode extends TopicRow {
  children: TreeNode[];
}

function buildTree(rows: TopicRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach((n) => {
    if (n.parent_id && map.has(n.parent_id)) map.get(n.parent_id)!.children.push(n);
    else roots.push(n);
  });
  const sort = (ns: TreeNode[]) => { ns.sort((a, b) => a.sort_order - b.sort_order); ns.forEach((n) => sort(n.children)); };
  sort(roots);
  return roots;
}

function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  if (!q) return nodes;
  const query = q.toLowerCase();
  const f = (ns: TreeNode[]): TreeNode[] =>
    ns.map((n) => {
      const kids = f(n.children);
      if (n.title.toLowerCase().includes(query) || kids.length > 0) return { ...n, children: kids };
      return null;
    }).filter(Boolean) as TreeNode[];
  return f(nodes);
}

function TopicNode({ node, selectedId, onSelect, depth = 0, forceOpen }: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (n: TreeNode) => void;
  depth?: number;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isOpen = forceOpen || open;
  const hasKids = node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div style={{ marginLeft: depth > 0 ? 14 : 0 }}>
      <Collapsible open={isOpen} onOpenChange={setOpen}>
        <div
          className={`group flex items-center gap-1 py-1 px-1.5 rounded-md cursor-pointer transition-colors ${
            isSelected ? "bg-primary/10" : "hover:bg-muted/50"
          }`}
          onClick={() => onSelect(node)}
        >
          {hasKids ? (
            <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-0.5 rounded hover:bg-muted shrink-0">
                {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            </CollapsibleTrigger>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <span className={`text-sm flex-1 ${isSelected ? "font-medium text-primary" : ""}`}>
            {node.title}
          </span>
          {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
        </div>
        {hasKids && (
          <CollapsibleContent>
            {node.children.map((c) => (
              <TopicNode key={c.id} node={c} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} forceOpen={forceOpen} />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export interface TopicTreeSelection {
  id: string;
  title: string;
  direction: Direction;
}

interface Props {
  value: TopicTreeSelection | null;
  onChange: (sel: TopicTreeSelection | null) => void;
}

export default function TopicTreePicker({ value, onChange }: Props) {
  const [direction, setDirection] = useState<Direction>(value?.direction || "psychology");
  const [search, setSearch] = useState("");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["topic_tree_picker", direction],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topic_tree")
        .select("*")
        .eq("direction", direction)
        .order("sort_order");
      if (error) throw error;
      return data as TopicRow[];
    },
  });

  const tree = useMemo(() => buildTree(rows ?? []), [rows]);
  const filtered = useMemo(() => filterTree(tree, search), [tree, search]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 border-b">
        {DIRECTIONS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => { setDirection(d.value); }}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
              direction === d.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Поиск темы..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      <div className="border rounded-md p-1.5 max-h-[280px] overflow-y-auto">
        {isLoading ? (
          <div className="text-xs text-muted-foreground py-4 text-center">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-xs text-muted-foreground py-4 text-center">Ничего не найдено</div>
        ) : (
          filtered.map((n) => (
            <TopicNode
              key={n.id}
              node={n}
              selectedId={value?.id || null}
              forceOpen={!!search}
              onSelect={(node) => onChange({ id: node.id, title: node.title, direction })}
            />
          ))
        )}
      </div>

      {value && (
        <div className="text-xs text-muted-foreground">
          Выбрано: <span className="font-medium text-foreground">{value.title}</span>
        </div>
      )}
    </div>
  );
}
