"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowRight, Star, Globe } from "lucide-react";
import { CATEGORIES, POPULAR_SWITCHES, TOOLS } from "@/data/mock-data";
import type { Switch } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { cn } from "@/lib/utils";

function CategoryFilter({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const isActive = cat === active;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={cn(
              "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-[#0F6E56] text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:border-[#0F6E56] hover:text-[#0F6E56]"
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}

function AlternativeCard({ sw }: { sw: Switch }) {
  const fromTool = TOOLS[sw.from];
  const toTool = TOOLS[sw.to];
  if (!fromTool || !toTool) return null;

  const stars = Math.round(sw.rating);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 pt-4 pb-3">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
          {sw.category}
        </span>
        <div className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3 w-3",
                i < stars ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
              )}
            />
          ))}
          <span className="ml-1 text-[10px] font-semibold text-amber-700">{sw.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-5 pt-4">
        <div className="mb-4 rounded-2xl border border-gray-100 bg-[linear-gradient(180deg,#fbfdfc_0%,#f7faf9_100%)] p-3.5">
          <div className="mb-2 flex items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
              <ToolIcon slug={sw.from} size="lg" />
              <span className="line-clamp-2 text-[10px] leading-tight text-gray-500">{fromTool.name}</span>
            </div>
            <div className="flex flex-col items-center gap-1 pt-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-300 shadow-sm transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-gray-300">Switch</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
              <ToolIcon slug={sw.to} size="lg" />
              <span className="line-clamp-2 text-[10px] font-medium leading-tight text-[#0F6E56]">{toTool.name}</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-dashed border-green-200 bg-green-50/70 px-3 py-2">
            <span className="text-[10px] font-medium text-green-700">{sw.license}</span>
            <span className="text-[10px] text-green-600">{sw.euCountry}</span>
          </div>
        </div>

        <p className="mb-4 flex-1 text-xs leading-relaxed text-gray-600">{sw.description}</p>

        <div className="mb-4 grid grid-cols-1 gap-2 text-xs text-gray-500">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-gray-400" />
              EU base
            </span>
            {sw.euCountry}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Adoption
            </span>
            <span className="font-medium text-gray-700">{sw.switcherCount.toLocaleString()} switched</span>
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-100 pt-3">
          <Link
            href="/signup"
            className="flex flex-1 items-center justify-center rounded-xl bg-[#0F6E56] py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#0d5f4a]"
          >
            Add to stack
          </Link>
          <Link
            href={`/discover/${sw.to}`}
            className="flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function DiscoverClient({
  initialCategory,
  initialQuery,
}: {
  initialCategory: string;
  initialQuery: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    return POPULAR_SWITCHES.filter((sw) => {
      const matchesCategory = activeCategory === "All" || sw.category === activeCategory;
      const searchableText = [
        TOOLS[sw.from]?.name,
        TOOLS[sw.to]?.name,
        sw.category,
        sw.description,
        sw.euCountry,
        sw.license,
        `${TOOLS[sw.from]?.name} ${TOOLS[sw.to]?.name}`,
        `${sw.from} ${sw.to}`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, normalizedQuery]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (activeCategory === "All") params.delete("category");
    else params.set("category", activeCategory);

    const trimmedQuery = query.trim();
    if (trimmedQuery) params.set("q", trimmedQuery);
    else params.delete("q");

    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      router.replace(next, { scroll: false });
    });
  }, [activeCategory, pathname, query, router, searchParams]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#0F6E56]">
          Discover
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          EU alternatives to popular software
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {POPULAR_SWITCHES.length} alternatives across {CATEGORIES.length - 1} categories.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="Search for Slack, Notion, Figma…"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-10 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-[#0F6E56]"
        />
        {isPending && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-300">Updating…</span>}
      </div>

      <div className="mb-8">
        <CategoryFilter
          categories={CATEGORIES}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      {filtered.length > 0 ? (
        <>
          <p className="mb-5 text-xs text-gray-400">
            Showing {filtered.length} alternative{filtered.length !== 1 ? "s" : ""}
            {activeCategory !== "All" && ` in ${activeCategory}`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((sw) => (
              <AlternativeCard key={sw.id} sw={sw} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">No results found</h3>
          <p className="mt-1 text-xs text-gray-400">Try a different search term or category.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveCategory("All");
            }}
            className="mt-4 text-xs font-medium text-[#0F6E56] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
