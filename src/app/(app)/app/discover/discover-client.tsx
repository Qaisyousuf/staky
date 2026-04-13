"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search, ArrowRight, Star, Globe, Check, Plus,
  Layers, Users, Compass, X,
} from "lucide-react";
import type { getPublishedAlternatives } from "@/actions/tools";
import { ToolIcon } from "@/components/shared/tool-icon";
import { addStackItem } from "@/actions/stack";
import { cn } from "@/lib/utils";

type DbAlternative = Awaited<ReturnType<typeof getPublishedAlternatives>>[number];

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_SHADOW = "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)";
const CARD_BORDER = "1.5px solid rgba(0,0,0,0.06)";
const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

function countryFlag(code: string): string {
  return Array.from(code.toUpperCase()).map((c) =>
    String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)
  ).join("");
}

// ─── Category filter ──────────────────────────────────────────────────────────

function CategoryFilter({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all"
          style={
            cat === active
              ? { background: "#0F6E56", color: "white", boxShadow: "0 1px 4px rgba(15,110,86,0.25)" }
              : { background: "white", color: "#5C6B5E", border: CARD_BORDER }
          }
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ─── Alternative card ─────────────────────────────────────────────────────────

function AlternativeCard({ alt }: { alt: DbAlternative }) {
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      try {
        await addStackItem(alt.fromTool.name, alt.category);
        setAdded(true);
      } catch {
        // silently fail — user may not be authed, redirect handled server-side
      }
    });
  }

  return (
    <article
      className="group flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
    >
      {/* ── Migration visual ── */}
      <div
        className="flex items-center gap-3 px-4 py-4 mx-4 mt-4 rounded-xl"
        style={{ background: "#F7F9F8", border: CARD_BORDER }}
      >
        {/* From tool */}
        <div className="flex flex-1 flex-col items-center gap-1.5 min-w-0">
          <ToolIcon toolData={alt.fromTool} size="lg" />
          <span className="text-[11px] font-semibold text-[#1B2B1F] truncate w-full text-center leading-tight">
            {alt.fromTool.name}
          </span>
          <span className="text-[9px] text-[#9BA39C] uppercase tracking-wide font-medium">US</span>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center"
            style={{ background: "#0F6E56" }}
          >
            <ArrowRight className="h-3 w-3 text-white" />
          </div>
          <span className="text-[8px] font-bold uppercase tracking-widest text-[#C8D0CA]">Switch</span>
        </div>

        {/* To tool */}
        <div className="flex flex-1 flex-col items-center gap-1.5 min-w-0">
          <ToolIcon toolData={alt.toTool} size="lg" />
          <span className="text-[11px] font-semibold text-[#0F6E56] truncate w-full text-center leading-tight">
            {alt.toTool.name}
          </span>
          <div className="flex items-center gap-1">
            {alt.toTool.country && (
              <span className="text-[10px] leading-none">{countryFlag(alt.toTool.country)}</span>
            )}
            <span className="text-[9px] text-[#9BA39C] uppercase tracking-wide font-medium">EU</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 gap-3">

        {/* Category + rating row */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5C6B5E]"
            style={{ background: "rgba(0,0,0,0.04)" }}
          >
            {alt.category}
          </span>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-bold text-[#1B2B1F]">{alt.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Description */}
        {alt.description && (
          <p className="text-[12px] leading-relaxed text-[#5C6B5E] flex-1 line-clamp-2">
            {alt.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {alt.license && (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#0F6E56]"
              style={{ background: "#EAF3EE", border: "1px solid rgba(15,110,86,0.15)" }}
            >
              {alt.license}
            </span>
          )}
          {alt.toTool.country && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#9BA39C]">
              <Globe className="h-2.5 w-2.5" />
              {alt.toTool.country.toUpperCase()}
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-[#9BA39C]">
            <Users className="h-2.5 w-2.5" />
            {alt.switcherCount.toLocaleString()} switched
          </span>
        </div>

        {/* Add to stack */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || added}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold transition-all",
            added
              ? "cursor-default"
              : "disabled:opacity-60"
          )}
          style={
            added
              ? { background: "#EAF3EE", color: "#0F6E56", border: "1.5px solid rgba(15,110,86,0.2)" }
              : { background: "#0F6E56", color: "white", boxShadow: "0 2px 8px rgba(15,110,86,0.25)" }
          }
        >
          {added
            ? <><Check className="h-3.5 w-3.5" /> Added to stack</>
            : isPending
              ? <><Layers className="h-3.5 w-3.5 animate-pulse" /> Adding…</>
              : <><Plus className="h-3.5 w-3.5" /> Add to stack</>
          }
        </button>
      </div>
    </article>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AppDiscoverClient({
  alternatives,
  initialCategory,
  initialQuery,
}: {
  alternatives: DbAlternative[];
  initialCategory: string;
  initialQuery: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [focused, setFocused] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(alternatives.map((a) => a.category))).sort();
    return ["All", ...cats];
  }, [alternatives]);

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    return alternatives.filter((alt) => {
      const matchesCategory = activeCategory === "All" || alt.category === activeCategory;
      const text = [
        alt.fromTool.name, alt.toTool.name,
        alt.category, alt.description, alt.toTool.country, alt.license,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesCategory && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [alternatives, activeCategory, normalizedQuery]);

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "All") params.delete("category");
    else params.set("category", cat);
    const q = query.trim();
    if (q) params.set("q", q); else params.delete("q");
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => router.replace(next, { scroll: false }));
  }

  function handleQueryChange(val: string) {
    setQuery(val);
    const params = new URLSearchParams(searchParams.toString());
    if (activeCategory === "All") params.delete("category");
    else params.set("category", activeCategory);
    const trimmed = val.trim();
    if (trimmed) params.set("q", trimmed); else params.delete("q");
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => router.replace(next, { scroll: false }));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6" style={{ fontFamily: F }}>

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F6E56] mb-1">Discover</p>
          <h1 className="text-[22px] font-black text-[#1B2B1F] leading-tight">EU Alternatives</h1>
          <p className="text-[13px] text-[#5C6B5E] mt-0.5">
            {alternatives.length} alternatives across {categories.length - 1} categories
          </p>
        </div>
        {(query || activeCategory !== "All") && (
          <button
            type="button"
            onClick={() => { setQuery(""); setActiveCategory("All"); }}
            className="self-start inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold text-[#5C6B5E] transition-colors hover:text-[#1B2B1F]"
            style={{ background: "rgba(0,0,0,0.04)", border: CARD_BORDER }}
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9BA39C]" />
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          type="search"
          placeholder="Search Slack, Notion, Figma…"
          className="w-full rounded-xl bg-white pl-10 pr-4 py-3 text-[13px] outline-none placeholder:text-[#C8D0CA] transition-all"
          style={{
            border: focused ? "1.5px solid #0F6E56" : CARD_BORDER,
            boxShadow: focused ? "0 0 0 3px rgba(15,110,86,0.08)" : CARD_SHADOW,
          }}
        />
      </div>

      {/* ── Category pills ── */}
      <CategoryFilter
        categories={categories}
        active={activeCategory}
        onChange={handleCategoryChange}
      />

      {/* ── Results count ── */}
      {filtered.length > 0 && (
        <p className="text-[11px] text-[#9BA39C]">
          <span className="font-bold text-[#1B2B1F]">{filtered.length}</span>{" "}
          alternative{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "All" && <> in <span className="font-semibold text-[#5C6B5E]">{activeCategory}</span></>}
          {normalizedQuery && <> matching &ldquo;<span className="font-semibold text-[#5C6B5E]">{normalizedQuery}</span>&rdquo;</>}
        </p>
      )}

      {/* ── Grid ── */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((alt) => (
            <AlternativeCard key={alt.id} alt={alt} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
          style={{ border: "1.5px dashed rgba(0,0,0,0.08)" }}
        >
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(0,0,0,0.04)" }}
          >
            <Compass className="h-6 w-6 text-[#9BA39C]" />
          </div>
          <p className="text-[14px] font-bold text-[#1B2B1F]">No results found</p>
          <p className="text-[12px] text-[#9BA39C] mt-1 mb-4">Try a different search term or category.</p>
          <button
            type="button"
            onClick={() => { setQuery(""); setActiveCategory("All"); }}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold text-[#0F6E56] transition-colors"
            style={{ background: "#EAF3EE", border: "1.5px solid rgba(15,110,86,0.2)" }}
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
