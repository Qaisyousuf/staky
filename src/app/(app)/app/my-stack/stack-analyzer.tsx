"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X, Search, ArrowRight, CheckCircle2, Zap,
  CalendarClock, ShieldAlert, Handshake, ChevronRight,
  Globe, Sparkles, TrendingUp, Star, BadgeCheck, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/data/mock-data";
import { MIGRATION_ANALYSIS, TOOL_CATEGORIES } from "@/data/migration-data";
import type { Difficulty, Impact } from "@/data/migration-data";
import { addStackItem, removeStackItem } from "@/actions/stack";
import { createMigrationRequest } from "@/actions/requests";
import { ToolIcon } from "@/components/shared/tool-icon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StackItem {
  id: string;
  toolName: string;
  category: string | null;
}

interface PartnerItem {
  id: string;
  userId: string;
  name: string;
  initials: string;
  color: string;
  logoUrl: string | null;
  country: string;
  countryFlag: string;
  specialty: string[];
  rating: number;
  reviewCount: number;
  projects: number;
  pricing: string;
  featured: boolean;
  verified: boolean;
  hasRequest: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_TOOL_OPTIONS = Object.values(TOOLS).map((t) => ({
  slug: t.slug,
  name: t.name,
  origin: t.origin,
  category: TOOL_CATEGORIES[t.slug] ?? "Other",
}));

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; cls: string; dot: string }> = {
  easy:   { label: "Easy",          cls: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-400" },
  medium: { label: "Moderate",      cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  hard:   { label: "Expert needed", cls: "bg-red-50   text-red-700   border-red-200",   dot: "bg-red-400"   },
};

const IMPACT_CONFIG: Record<Impact, { label: string; cls: string }> = {
  low:    { label: "Low impact",  cls: "bg-gray-100  text-gray-500"   },
  medium: { label: "Med impact",  cls: "bg-blue-50   text-blue-600"   },
  high:   { label: "High impact", cls: "bg-violet-50 text-violet-600" },
};

// ─── Add-tool autocomplete ────────────────────────────────────────────────────

function AddToolInput({ existingNames, onAdd, isPending }: {
  existingNames: Set<string>;
  onAdd: (slug: string, name: string, category: string) => void;
  isPending: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = query.trim()
    ? ALL_TOOL_OPTIONS.filter(
        (t) => t.name.toLowerCase().includes(query.toLowerCase()) && !existingNames.has(t.name.toLowerCase())
      ).slice(0, 7)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search tools…"
          disabled={isPending}
          className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-[#0F6E56] transition-colors placeholder:text-gray-400 disabled:opacity-60"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {suggestions.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => { onAdd(t.slug, t.name, t.category); setQuery(""); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left"
            >
              <ToolIcon slug={t.slug} size="sm" className="h-7 w-7 rounded-lg shrink-0" />
              <span className="text-xs font-medium text-gray-800 flex-1">{t.name}</span>
              <span className={cn(
                "text-[9px] font-semibold rounded-full px-1.5 py-0.5",
                t.origin === "eu" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
              )}>
                {t.origin === "eu" ? "EU" : "US"}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim() && suggestions.length === 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white rounded-xl border border-gray-200 shadow px-3 py-2.5">
          <p className="text-xs text-gray-400">No results — or already in stack.</p>
        </div>
      )}
    </div>
  );
}

// ─── Stack chip ───────────────────────────────────────────────────────────────

function StackChip({ item, onRemove, isPending }: {
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
    <div className={cn(
      "group flex items-center gap-1.5 rounded-lg border pl-2 pr-1.5 py-1.5 transition-all",
      isEU ? "border-green-200 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"
    )}>
      {tool
        ? <ToolIcon slug={tool.slug} size="sm" className="h-5 w-5 shrink-0" />
        : <span className="h-5 w-5 flex items-center justify-center rounded bg-gray-200 text-[9px] font-bold text-gray-500 shrink-0">?</span>
      }
      <span className="text-xs font-medium text-gray-800 leading-none">{item.toolName}</span>
      {isEU && <span className="text-[8px] font-bold text-green-700 bg-green-100 rounded-full px-1.5 py-0.5 leading-none">EU</span>}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={isPending}
        aria-label={`Remove ${item.toolName}`}
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full transition-colors disabled:opacity-40",
          isEU
            ? "text-green-500 hover:bg-green-200 hover:text-green-800"
            : "text-gray-400 hover:bg-gray-200 hover:text-gray-700"
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Roadmap row ──────────────────────────────────────────────────────────────

function RoadmapRow({ priority, item }: {
  priority: number;
  item: StackItem & { analysis: (typeof MIGRATION_ANALYSIS)[string] };
}) {
  const { analysis } = item;
  const fromSlug = Object.values(TOOLS).find(
    (t) => t.name.toLowerCase() === item.toolName.toLowerCase()
  )?.slug;
  const fromTool = fromSlug ? TOOLS[fromSlug] : null;
  const toTool = TOOLS[analysis.euAlternative];
  const diffCfg = DIFFICULTY_CONFIG[analysis.difficulty];

  return (
    <div className="flex gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        priority === 1 ? "bg-[#0F6E56] text-white" :
        priority <= 3  ? "bg-green-50 text-[#0F6E56]" :
        priority <= 6  ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"
      )}>
        {priority}
      </div>

      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {fromTool
            ? <ToolIcon slug={fromTool.slug} size="md" />
            : <span className="h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 text-xs font-bold text-gray-400">?</span>
          }
          <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
          {toTool && <ToolIcon slug={toTool.slug} size="md" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 mb-2">
            <span className="text-sm font-semibold text-gray-900">{fromTool?.name ?? item.toolName}</span>
            <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
            <span className="text-sm font-semibold text-[#0F6E56]">{toTool?.name ?? analysis.euAlternative}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", diffCfg.cls)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", diffCfg.dot)} />
              {diffCfg.label}
            </span>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", IMPACT_CONFIG[analysis.impact].cls)}>
              {IMPACT_CONFIG[analysis.impact].label}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <CalendarClock className="h-3 w-3" />{analysis.timeEstimate}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-2">{analysis.description}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-0.5">
            {analysis.highlights.map((h) => (
              <li key={h} className="flex items-center gap-1 text-[11px] text-gray-500">
                <CheckCircle2 className="h-3 w-3 text-[#0F6E56] shrink-0" />{h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Partner card with inline connect form ────────────────────────────────────

function PartnerCard({ partner, switches }: {
  partner: PartnerItem;
  switches: { fromTool: string; toTool: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(partner.hasRequest);
  const [isPending, startTransition] = useTransition();

  function handleConnect() {
    startTransition(async () => {
      try {
        const result = await createMigrationRequest({
          source: "partner_profile",
          partnerUserId: partner.userId,
          switches,
        });
        setSent(true);
        setOpen(false);
        router.push(`/app/requests/${result.requestId}`);
      } catch {
        // keep open
      }
    });
  }

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-all",
      partner.featured ? "border-amber-200 shadow-sm" : "border-gray-200",
      open && "ring-2 ring-[#2A5FA5]/20"
    )}>
      {/* ── Card body ── */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="shrink-0">
            {partner.logoUrl ? (
              <Image
                src={partner.logoUrl}
                alt={partner.name}
                width={52}
                height={52}
                className="rounded-2xl object-cover border border-gray-100"
                style={{ height: 52, width: 52 }}
              />
            ) : (
              <div
                className="h-[52px] w-[52px] rounded-2xl flex items-center justify-center text-sm font-bold text-white select-none"
                style={{ backgroundColor: partner.color }}
              >
                {partner.initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-gray-900">{partner.name}</span>
                {partner.verified && <BadgeCheck className="h-4 w-4 text-[#2A5FA5] shrink-0" />}
              </div>
              {partner.featured && (
                <span className="shrink-0 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 uppercase tracking-wide">
                  Featured
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-2.5">
              {partner.countryFlag} {partner.country}
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              {partner.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-gray-700">{partner.rating.toFixed(1)}</span>
                  {partner.reviewCount > 0 && (
                    <span className="text-[11px] text-gray-400">({partner.reviewCount})</span>
                  )}
                </span>
              )}
              {partner.projects > 0 && (
                <span className="text-xs text-gray-400">{partner.projects} projects</span>
              )}
              {partner.pricing && (
                <span className="text-xs text-gray-400">{partner.pricing}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(partner.specialty ?? []).slice(0, 4).map((s) => (
                <span key={s} className="text-[10px] font-medium text-[#2A5FA5] bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
                  {s}
                </span>
              ))}
              {(partner.specialty ?? []).length > 4 && (
                <span className="text-[10px] text-gray-400 border border-gray-100 rounded-full px-2.5 py-1">
                  +{(partner.specialty ?? []).length - 4}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
          {sent ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6E56]">
              <CheckCircle2 className="h-4 w-4" />
              Request sent
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all",
                open
                  ? "bg-gray-100 text-gray-700"
                  : "bg-[#2A5FA5] text-white hover:bg-[#244d8a] shadow-sm hover:shadow"
              )}
            >
              <Handshake className="h-3.5 w-3.5" />
              Connect
            </button>
          )}
          {open && !sent && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Inline connect form ── */}
      {open && !sent && (
        <div className="border-t border-[#2A5FA5]/10 bg-gradient-to-b from-blue-50/60 to-white px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded-lg bg-[#2A5FA5]/10 flex items-center justify-center">
              <Handshake className="h-3.5 w-3.5 text-[#2A5FA5]" />
            </div>
            <span className="text-xs font-bold text-gray-900">Your migration request</span>
          </div>

          {switches.length > 0 ? (
            <div className="space-y-2 mb-4">
              {switches.map((s) => {
                const from = TOOLS[s.fromTool];
                const to   = TOOLS[s.toTool];
                return (
                  <div
                    key={`${s.fromTool}-${s.toTool}`}
                    className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
                  >
                    <ToolIcon slug={s.fromTool} size="sm" className="h-7 w-7 shrink-0" />
                    <span className="text-xs font-semibold text-gray-700">{from?.name ?? s.fromTool}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0 mx-0.5" />
                    <ToolIcon slug={s.toTool} size="sm" className="h-7 w-7 shrink-0" />
                    <span className="text-xs font-semibold text-[#0F6E56]">{to?.name ?? s.toTool}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-4">Your request will be sent to {partner.name} for review.</p>
          )}

          <button
            type="button"
            onClick={handleConnect}
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A5FA5] py-2.5 text-sm font-semibold text-white hover:bg-[#244d8a] transition-colors shadow-sm disabled:opacity-70"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Handshake className="h-4 w-4" />}
            {isPending ? "Sending…" : `Connect with ${partner.name}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StackAnalyzer({
  initialItems,
  partners,
}: {
  initialItems: StackItem[];
  partners: PartnerItem[];
}) {
  const [items, setItems] = useState<StackItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();

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

  const analyzedItems = usItems
    .map((i) => {
      const slug = getSlug(i.toolName);
      const analysis = slug ? MIGRATION_ANALYSIS[slug] : undefined;
      return analysis ? { ...i, analysis } : null;
    })
    .filter(Boolean) as (StackItem & { analysis: (typeof MIGRATION_ANALYSIS)[string] })[];

  const unknownItems = usItems.filter((i) => {
    const slug = getSlug(i.toolName);
    return !slug || !MIGRATION_ANALYSIS[slug];
  });

  const sortedRoadmap = [...analyzedItems].sort((a, b) => {
    const pa = a.analysis.impactScore - a.analysis.effortScore;
    const pb = b.analysis.impactScore - b.analysis.effortScore;
    if (pb !== pa) return pb - pa;
    return a.analysis.effortScore - b.analysis.effortScore;
  });

  const quickWins    = analyzedItems.filter((i) => i.analysis.difficulty === "easy");
  const planned      = analyzedItems.filter((i) => i.analysis.difficulty === "medium");
  const expertNeeded = analyzedItems.filter((i) => i.analysis.difficulty === "hard");

  const switches = sortedRoadmap.slice(0, 5).map((item) => ({
    fromTool: getSlug(item.toolName) ?? item.toolName.toLowerCase(),
    toTool: item.analysis.euAlternative,
  }));

  const handleAdd = (slug: string, name: string, category: string) => {
    const opt: StackItem = { id: `optimistic-${Date.now()}`, toolName: name, category };
    setItems((prev) => [...prev, opt]);
    startTransition(async () => {
      try { await addStackItem(name, category); }
      catch { setItems((prev) => prev.filter((i) => i.id !== opt.id)); }
    });
  };

  const handleRemove = (id: string) => {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    startTransition(async () => {
      try { await removeStackItem(id); }
      catch { setItems(prev); }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">

      {/* ── Left: Stack panel ── */}
      <div className="lg:sticky lg:top-6 space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F6E56] mb-0.5">Stack Analyzer</p>
          <h1 className="text-lg font-bold text-gray-900">My Stack</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Add a tool</p>
          <AddToolInput existingNames={existingNames} onAdd={handleAdd} isPending={isPending} />
        </div>

        {items.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
            {usItems.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  US tools
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {usItems.map((item) => (
                    <StackChip key={item.id} item={item} onRemove={handleRemove} isPending={isPending} />
                  ))}
                </div>
              </div>
            )}
            {euItems.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                  EU tools
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {euItems.map((item) => (
                    <StackChip key={item.id} item={item} onRemove={handleRemove} isPending={isPending} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center">
            <Sparkles className="h-6 w-6 text-gray-200 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-600">Stack is empty</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Add tools to see your migration plan.</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white border border-gray-200 px-3 py-2.5 text-center">
              <p className="text-lg font-black text-red-500">{usItems.length}</p>
              <p className="text-[10px] text-gray-400 font-medium">US tools</p>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 px-3 py-2.5 text-center">
              <p className="text-lg font-black text-[#0F6E56]">{euItems.length}</p>
              <p className="text-[10px] text-gray-400 font-medium">EU tools</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Migration + Partners ── */}
      <div className="space-y-6 min-w-0">

        {analyzedItems.length > 0 ? (
          <>
            {/* Summary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-[#0F6E56]" />
                <h2 className="text-sm font-bold text-gray-900">Migration summary</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Zap,           val: quickWins.length,    label: "Quick wins",    sub: "Easy",      bg: "bg-green-50",  border: "border-green-100", val_cls: "text-green-700",  icon_cls: "text-green-500"  },
                  { icon: CalendarClock, val: planned.length,      label: "Planned",       sub: "Moderate",  bg: "bg-amber-50",  border: "border-amber-100", val_cls: "text-amber-700",  icon_cls: "text-amber-500"  },
                  { icon: ShieldAlert,   val: expertNeeded.length, label: "Expert needed", sub: "Complex",   bg: "bg-red-50",    border: "border-red-100",   val_cls: "text-red-600",    icon_cls: "text-red-400"    },
                  { icon: Globe,         val: euItems.length,      label: "Already EU",    sub: "Compliant", bg: "bg-blue-50",   border: "border-blue-100",  val_cls: "text-[#2A5FA5]",  icon_cls: "text-[#2A5FA5]"  },
                ].map(({ icon: Icon, val, label, sub, bg, border, val_cls, icon_cls }) => (
                  <div key={label} className={cn("rounded-2xl border px-4 py-4", bg, border)}>
                    <Icon className={cn("h-5 w-5 mb-2", icon_cls)} />
                    <p className={cn("text-3xl font-black leading-none mb-1", val_cls)}>{val}</p>
                    <p className={cn("text-xs font-semibold", val_cls)}>{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-4 bg-gray-50/60 border-b border-gray-100">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0F6E56]/10">
                  <ChevronRight className="h-4 w-4 text-[#0F6E56]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Recommended migration order</h2>
                  <p className="text-[11px] text-gray-400">Sorted by impact ÷ effort</p>
                </div>
                <span className="ml-auto inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                  {sortedRoadmap.length} migrations
                </span>
              </div>
              <div>
                {sortedRoadmap.map((item, i) => (
                  <RoadmapRow key={item.id} priority={i + 1} item={item} />
                ))}
              </div>
              {unknownItems.length > 0 && (
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">No EU alternative found yet:</p>
                  <div className="flex flex-wrap gap-2">
                    {unknownItems.map((i) => (
                      <span key={i.id} className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500">
                        {i.toolName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : items.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <TrendingUp className="h-8 w-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600">No migration analysis yet</p>
            <p className="text-xs text-gray-400 mt-1">Add US tools to see your recommended migration order.</p>
          </div>
        ) : null}

        {/* Partners */}
        {usItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A5FA5]/10">
                  <Handshake className="h-4 w-4 text-[#2A5FA5]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Migration Partners</h2>
                  <p className="text-[11px] text-gray-400">Connect with a certified specialist for your stack</p>
                </div>
              </div>
              <Link href="/app/partners" className="text-xs font-medium text-[#2A5FA5] hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {switches.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {switches.map((s) => (
                  <span
                    key={`${s.fromTool}-${s.toTool}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-sm"
                  >
                    <ToolIcon slug={s.fromTool} size="sm" className="h-4 w-4 shrink-0" />
                    <span className="text-gray-600">{TOOLS[s.fromTool]?.name ?? s.fromTool}</span>
                    <ArrowRight className="h-2.5 w-2.5 text-gray-300 shrink-0" />
                    <ToolIcon slug={s.toTool} size="sm" className="h-4 w-4 shrink-0" />
                    <span className="font-semibold text-[#0F6E56]">{TOOLS[s.toTool]?.name ?? s.toTool}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {partners.slice(0, 6).map((p) => (
                <PartnerCard key={p.id} partner={p} switches={switches} />
              ))}
            </div>

            {partners.length > 6 && (
              <div className="mt-4 text-center">
                <Link href="/app/partners" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2A5FA5] hover:underline">
                  See {partners.length - 6} more partners <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
