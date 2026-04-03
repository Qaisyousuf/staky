"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search, ArrowRight, Star, Globe, Check, Plus,
  Layers, Users,
} from "lucide-react";
import { CATEGORIES, POPULAR_SWITCHES, TOOLS } from "@/data/mock-data";
import type { Switch } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { addStackItem } from "@/actions/stack";
import { cn } from "@/lib/utils";

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
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={cn(
            "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            cat === active
              ? "bg-[#0F6E56] text-white shadow-sm"
              : "border border-gray-200 bg-white text-gray-600 hover:border-[#0F6E56] hover:text-[#0F6E56]"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ─── Alternative card ─────────────────────────────────────────────────────────

function AlternativeCard({ sw }: { sw: Switch }) {
  const fromTool = TOOLS[sw.from];
  const toTool   = TOOLS[sw.to];
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!fromTool || !toTool) return null;

  function handleAdd() {
    startTransition(async () => {
      try {
        await addStackItem(fromTool.name, sw.category);
        setAdded(true);
      } catch {
        // silently fail — user may not be authed, redirect handled server-side
      }
    });
  }

  return (
    <article className="group flex flex-col rounded-2xl border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-md overflow-hidden">

      {/* Top: category + rating */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {sw.category}
        </span>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-gray-700">{sw.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">

        {/* Tool switch visual */}
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <ToolIcon slug={sw.from} size="lg" />
            <span className="text-[10px] text-gray-500 leading-tight">{fromTool.name}</span>
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm">
              <ArrowRight className="h-3 w-3 text-gray-400" />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-300">Switch</span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <ToolIcon slug={sw.to} size="lg" />
            <span className="text-[10px] font-semibold text-[#0F6E56] leading-tight">{toTool.name}</span>
          </div>
        </div>

        {/* Description */}
        <p className="mb-4 flex-1 text-xs leading-relaxed text-gray-600">{sw.description}</p>

        {/* Meta row */}
        <div className="mb-4 flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {sw.euCountry}
          </span>
          <span className="h-1 w-1 rounded-full bg-gray-200" />
          <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
            {sw.license}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Users className="h-3 w-3" />
            {sw.switcherCount.toLocaleString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending || added}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all",
              added
                ? "bg-green-50 text-[#0F6E56] border border-green-200 cursor-default"
                : "bg-[#0F6E56] text-white hover:bg-[#0d5f4a] shadow-sm hover:shadow disabled:opacity-60"
            )}
          >
            {added
              ? <><Check className="h-3.5 w-3.5" /> Added to stack</>
              : isPending
                ? <><Layers className="h-3.5 w-3.5 animate-pulse" /> Adding…</>
                : <><Plus className="h-3.5 w-3.5" /> Add to stack</>
            }
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AppDiscoverClient({
  initialCategory,
  initialQuery,
}: {
  initialCategory: string;
  initialQuery: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    return POPULAR_SWITCHES.filter((sw) => {
      const matchesCategory = activeCategory === "All" || sw.category === activeCategory;
      const text = [
        TOOLS[sw.from]?.name, TOOLS[sw.to]?.name,
        sw.category, sw.description, sw.euCountry, sw.license,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesCategory && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [activeCategory, normalizedQuery]);

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
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[#0F6E56] text-xs font-semibold uppercase tracking-widest mb-1">Discover</p>
          <h1 className="text-2xl font-black text-gray-900">EU Alternatives</h1>
          <p className="text-gray-500 text-sm mt-1">
            {POPULAR_SWITCHES.length} alternatives across {CATEGORIES.length - 1} categories — add any to your stack.
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            type="search"
            placeholder="Search Slack, Notion, Figma…"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10"
          />
        </div>
        <CategoryFilter
          categories={CATEGORIES}
          active={activeCategory}
          onChange={handleCategoryChange}
        />
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <>
          <p className="text-xs text-gray-400">
            {filtered.length} alternative{filtered.length !== 1 ? "s" : ""}
            {activeCategory !== "All" && ` in ${activeCategory}`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((sw) => (
              <AlternativeCard key={sw.id} sw={sw} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No results found</p>
          <p className="mt-1 text-xs text-gray-400">Try a different search term or category.</p>
          <button
            type="button"
            onClick={() => { setQuery(""); setActiveCategory("All"); }}
            className="mt-4 text-xs font-medium text-[#0F6E56] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
