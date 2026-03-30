"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import {
  X, Search, ArrowRight, CheckCircle2, Zap,
  CalendarClock, ShieldAlert, Handshake, ChevronRight,
  Globe, Sparkles, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/data/mock-data";
import { MIGRATION_ANALYSIS, TOOL_CATEGORIES } from "@/data/migration-data";
import type { Difficulty, Impact } from "@/data/migration-data";
import { addStackItem, removeStackItem } from "@/actions/stack";
import { ToolIcon } from "@/components/shared/tool-icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StackItem {
  id: string;
  toolName: string;
  category: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_TOOL_OPTIONS = Object.values(TOOLS).map((t) => ({
  slug: t.slug,
  name: t.name,
  origin: t.origin,
  category: TOOL_CATEGORIES[t.slug] ?? "Other",
}));

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; cls: string }> = {
  easy:   { label: "Easy",           cls: "bg-green-50  text-green-700  border-green-200"  },
  medium: { label: "Moderate",       cls: "bg-amber-50  text-amber-700  border-amber-200"  },
  hard:   { label: "Expert needed",  cls: "bg-red-50    text-red-700    border-red-200"    },
};

const IMPACT_CONFIG: Record<Impact, { label: string; cls: string }> = {
  low:    { label: "Low impact",    cls: "bg-gray-100  text-gray-600"  },
  medium: { label: "Med impact",    cls: "bg-blue-50   text-blue-700"  },
  high:   { label: "High impact",   cls: "bg-purple-50 text-purple-700"},
};

// ─── Small helpers ────────────────────────────────────────────────────────────

function DiffBadge({ d }: { d: Difficulty }) {
  const { label, cls } = DIFFICULTY_CONFIG[d];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", cls)}>
      {label}
    </span>
  );
}

function ImpactBadge({ i }: { i: Impact }) {
  const { label, cls } = IMPACT_CONFIG[i];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", cls)}>
      {label}
    </span>
  );
}

// ─── Add-tool autocomplete ────────────────────────────────────────────────────

function AddToolInput({
  existingNames,
  onAdd,
  isPending,
}: {
  existingNames: Set<string>;
  onAdd: (slug: string, name: string, category: string) => void;
  isPending: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = query.trim()
    ? ALL_TOOL_OPTIONS.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) &&
          !existingNames.has(t.name.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (t: (typeof ALL_TOOL_OPTIONS)[0]) => {
    onAdd(t.slug, t.name, t.category);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search tools — Slack, Notion, Figma…"
          disabled={isPending}
          className="w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-[#0F6E56] transition-colors placeholder:text-gray-400 disabled:opacity-60"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {suggestions.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => handleSelect(t)}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <ToolIcon slug={t.slug} size="sm" className="h-8 w-8 rounded-lg" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800">{t.name}</span>
                <span className="ml-2 text-[10px] text-gray-400">{t.category}</span>
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold rounded-full px-2 py-0.5",
                  t.origin === "eu"
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                {t.origin === "eu" ? "🇪🇺 EU" : "🇺🇸 US"}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && suggestions.length === 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-20 bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3">
          <p className="text-sm text-gray-500">
            No matching tools — or already in your stack.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Stack item chip ──────────────────────────────────────────────────────────

function StackChip({
  item,
  onRemove,
  isPending,
}: {
  item: StackItem;
  onRemove: (id: string) => void;
  isPending: boolean;
}) {
  const slug = Object.values(TOOLS).find(
    (t) => t.name.toLowerCase() === item.toolName.toLowerCase()
  )?.slug;

  const tool = slug ? TOOLS[slug] : null;
  const isEU = tool?.origin === "eu";

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-xl border px-3 py-2 transition-all",
        isEU
          ? "border-green-200 bg-green-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      {tool ? (
        <ToolIcon slug={tool.slug} size="sm" />
      ) : (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-200 text-[10px] font-bold text-gray-500 shrink-0">
          ?
        </span>
      )}
      <span className="text-sm font-medium text-gray-800">{item.toolName}</span>
      {isEU && (
        <span className="text-[9px] font-semibold text-green-600 bg-green-100 rounded-full px-1.5 py-0.5">
          EU ✓
        </span>
      )}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={isPending}
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors disabled:opacity-40"
        aria-label={`Remove ${item.toolName}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Migration roadmap row ─────────────────────────────────────────────────────

function RoadmapRow({
  priority,
  item,
}: {
  priority: number;
  item: StackItem & { analysis: (typeof MIGRATION_ANALYSIS)[string] };
}) {
  const { analysis } = item;
  const fromTool = TOOLS[
    Object.values(TOOLS).find(
      (t) => t.name.toLowerCase() === item.toolName.toLowerCase()
    )?.slug ?? ""
  ];
  const toTool = TOOLS[analysis.euAlternative];

  return (
    <div className="flex gap-4 p-5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      {/* Priority number */}
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold mt-0.5",
          priority <= 3 ? "bg-green-50 text-[#0F6E56]" : priority <= 6 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
        )}
      >
        {priority}
      </span>

      {/* Tool switch */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {fromTool ? (
            <ToolIcon slug={fromTool.slug} size="md" />
          ) : (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-xs font-bold text-gray-500">?</span>
          )}
          <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
          {toTool ? <ToolIcon slug={toTool.slug} size="md" /> : null}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="text-sm font-semibold text-gray-900">
              {fromTool?.name ?? item.toolName}
            </span>
            <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
            <span className="text-sm font-semibold text-[#0F6E56]">
              {toTool?.name ?? analysis.euAlternative}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <DiffBadge d={analysis.difficulty} />
            <ImpactBadge i={analysis.impact} />
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-medium">
              <CalendarClock className="h-3 w-3" />
              {analysis.timeEstimate}
            </span>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed mb-2">
            {analysis.description}
          </p>

          <ul className="flex flex-wrap gap-x-4 gap-y-0.5">
            {analysis.highlights.map((h) => (
              <li key={h} className="flex items-center gap-1 text-[11px] text-gray-500">
                <CheckCircle2 className="h-3 w-3 text-[#0F6E56] shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function StackAnalyzer({ initialItems }: { initialItems: StackItem[] }) {
  const [items, setItems] = useState<StackItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  // ── Helpers ──────────────────────────────────────────────────────────────
  const existingNames = new Set(items.map((i) => i.toolName.toLowerCase()));

  const getSlug = (toolName: string) =>
    Object.values(TOOLS).find((t) => t.name.toLowerCase() === toolName.toLowerCase())?.slug;

  const usItems = items.filter((i) => {
    const slug = getSlug(i.toolName);
    return !slug || TOOLS[slug]?.origin === "us";
  });

  const euItems = items.filter((i) => {
    const slug = getSlug(i.toolName);
    return !!slug && TOOLS[slug]?.origin === "eu";
  });

  // Items that have migration analysis data
  const analyzedItems = usItems
    .map((i) => {
      const slug = getSlug(i.toolName);
      const analysis = slug ? MIGRATION_ANALYSIS[slug] : undefined;
      return analysis ? { ...i, analysis } : null;
    })
    .filter(Boolean) as (StackItem & { analysis: (typeof MIGRATION_ANALYSIS)[string] })[];

  // Items without known migration path
  const unknownItems = usItems.filter((i) => {
    const slug = getSlug(i.toolName);
    return !slug || !MIGRATION_ANALYSIS[slug];
  });

  // Sorted roadmap: priority = impactScore - effortScore desc, then effortScore asc
  const sortedRoadmap = [...analyzedItems].sort((a, b) => {
    const pa = a.analysis.impactScore - a.analysis.effortScore;
    const pb = b.analysis.impactScore - b.analysis.effortScore;
    if (pb !== pa) return pb - pa;
    return a.analysis.effortScore - b.analysis.effortScore;
  });

  const quickWins    = analyzedItems.filter((i) => i.analysis.difficulty === "easy");
  const planned      = analyzedItems.filter((i) => i.analysis.difficulty === "medium");
  const expertNeeded = analyzedItems.filter((i) => i.analysis.difficulty === "hard");

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleAdd = (slug: string, name: string, category: string) => {
    const optimisticItem: StackItem = {
      id: `optimistic-${Date.now()}`,
      toolName: name,
      category,
    };
    setItems((prev) => [...prev, optimisticItem]);

    startTransition(async () => {
      try {
        await addStackItem(name, category);
      } catch {
        setItems((prev) => prev.filter((i) => i.id !== optimisticItem.id));
      }
    });
  };

  const handleRemove = (id: string) => {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));

    startTransition(async () => {
      try {
        await removeStackItem(id);
      } catch {
        setItems(prev);
      }
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0F6E56] mb-1">
            Stack Analyzer
          </p>
          <h1 className="text-2xl font-bold text-gray-900">My Stack</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {usItems.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              {usItems.length} US {usItems.length === 1 ? "tool" : "tools"}
            </span>
          )}
          {euItems.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              {euItems.length} EU {euItems.length === 1 ? "tool" : "tools"}
            </span>
          )}
        </div>
      </div>

      {/* Add tool */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Add a tool to your stack</h2>
        <AddToolInput
          existingNames={existingNames}
          onAdd={handleAdd}
          isPending={isPending}
        />
      </div>

      {/* Current stack */}
      {items.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Current stack</h2>

          {usItems.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                US tools — needs migration
              </p>
              <div className="flex flex-wrap gap-2">
                {usItems.map((item) => (
                  <StackChip
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {euItems.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                EU tools — already compliant
              </p>
              <div className="flex flex-wrap gap-2">
                {euItems.map((item) => (
                  <StackChip
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    isPending={isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
          <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">Your stack is empty</p>
          <p className="text-xs text-gray-400 mt-1">
            Add your current tools above to get a personalised migration plan.
          </p>
        </div>
      )}

      {/* Migration summary */}
      {analyzedItems.length > 0 && (
        <>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#0F6E56]" />
              Migration summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Quick wins */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <Zap className="h-5 w-5 text-green-600 mx-auto mb-1.5" />
                <p className="text-2xl font-bold text-green-700">{quickWins.length}</p>
                <p className="text-xs font-medium text-green-600 mt-0.5">Quick wins</p>
                <p className="text-[10px] text-green-500 mt-0.5">Easy migrations</p>
              </div>
              {/* Planned */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                <CalendarClock className="h-5 w-5 text-amber-600 mx-auto mb-1.5" />
                <p className="text-2xl font-bold text-amber-700">{planned.length}</p>
                <p className="text-xs font-medium text-amber-600 mt-0.5">Planned</p>
                <p className="text-[10px] text-amber-500 mt-0.5">Moderate effort</p>
              </div>
              {/* Expert needed */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                <ShieldAlert className="h-5 w-5 text-red-500 mx-auto mb-1.5" />
                <p className="text-2xl font-bold text-red-600">{expertNeeded.length}</p>
                <p className="text-xs font-medium text-red-600 mt-0.5">Expert needed</p>
                <p className="text-[10px] text-red-400 mt-0.5">Complex migrations</p>
              </div>
              {/* Already EU */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <Globe className="h-5 w-5 text-[#2A5FA5] mx-auto mb-1.5" />
                <p className="text-2xl font-bold text-[#2A5FA5]">{euItems.length}</p>
                <p className="text-xs font-medium text-[#2A5FA5] mt-0.5">Already EU</p>
                <p className="text-[10px] text-blue-400 mt-0.5">Fully compliant</p>
              </div>
            </div>
          </div>

          {/* Migration roadmap */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <ChevronRight className="h-4 w-4 text-[#0F6E56]" />
              <h2 className="text-sm font-semibold text-gray-900">Recommended migration order</h2>
              <span className="ml-auto text-[11px] text-gray-400">
                Sorted by impact ÷ effort
              </span>
            </div>
            <div>
              {sortedRoadmap.map((item, i) => (
                <RoadmapRow key={item.id} priority={i + 1} item={item} />
              ))}
            </div>

            {unknownItems.length > 0 && (
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-2">
                  Tools without a known EU alternative yet:
                </p>
                <div className="flex flex-wrap gap-2">
                  {unknownItems.map((i) => (
                    <span key={i.id} className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
                      {i.toolName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Find partner CTA */}
      {(expertNeeded.length > 0 || analyzedItems.length >= 3) && (
        <div className="relative overflow-hidden rounded-2xl bg-[#0F6E56] px-6 py-8">
          {/* Subtle grid bg */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Handshake className="h-5 w-5 text-green-200" />
                <span className="text-xs font-semibold uppercase tracking-widest text-green-200">
                  Migration experts
                </span>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {expertNeeded.length > 0
                  ? `${expertNeeded.length} migration${expertNeeded.length > 1 ? "s" : ""} need expert help`
                  : "Speed up your migration"}
              </h3>
              <p className="mt-1.5 text-sm text-green-100 leading-relaxed max-w-lg">
                {expertNeeded.length > 0
                  ? `${expertNeeded.map((i) => TOOLS[getSlug(i.toolName) ?? ""]?.name ?? i.toolName).join(" and ")} migration${expertNeeded.length > 1 ? "s" : ""} require${expertNeeded.length === 1 ? "s" : ""} data mapping and integration work. A certified partner handles it end-to-end.`
                  : "Certified EU migration partners handle everything from audit to hypercare — so your team doesn't have to."}
              </p>
            </div>
            <Link
              href="/partners"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white hover:bg-green-50 text-[#0F6E56] font-semibold text-sm px-5 py-3 transition-colors"
            >
              Find a migration partner
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
