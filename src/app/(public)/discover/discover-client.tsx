"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowRight, Star, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type DbTool = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  color: string;
  abbr: string;
  country: string | null;
  category: string | null;
};

type DbAlternative = {
  id: string;
  category: string;
  description: string | null;
  license: string | null;
  switcherCount: number;
  rating: number;
  fromTool: DbTool;
  toTool: DbTool;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

function ToolLogo({ tool, size = "md" }: { tool: DbTool; size?: "md" | "lg" }) {
  const dim = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const imgDim = size === "lg" ? "h-8 w-8" : "h-6 w-6";
  const textSize = size === "lg" ? "text-[13px]" : "text-[11px]";

  return (
    <div
      className={`${dim} rounded-xl flex items-center justify-center shrink-0 bg-white`}
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 0 0 1.5px rgba(0,0,0,0.06)" }}
    >
      {tool.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tool.logoUrl} alt={tool.name} className={`${imgDim} object-contain`} />
      ) : (
        <span
          className={`${dim} rounded-xl flex items-center justify-center text-white font-black select-none ${textSize}`}
          style={{ backgroundColor: tool.color }}
        >
          {tool.abbr}
        </span>
      )}
    </div>
  );
}

// ─── Alternative card ──────────────────────────────────────────────────────────

function AlternativeCard({ alt }: { alt: DbAlternative }) {
  const { fromTool, toTool } = alt;

  return (
    <article
      className="group flex flex-col rounded-2xl bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(15,110,86,0.10)]"
      style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)", fontFamily: F }}
    >
      {/* Category + EU badge */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <span className="rounded-md bg-[#F0EDE8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7B6E]">
          {alt.category}
        </span>
        {toTool.country && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://flagcdn.com/16x12/${toTool.country}.png`}
            width={16} height={12}
            alt={toTool.country}
            className="rounded-[3px] opacity-80"
          />
        )}
      </div>

      {/* Switch visualization */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          {/* From */}
          <div className="flex flex-1 flex-col items-center gap-2 min-w-0">
            <ToolLogo tool={fromTool} size="lg" />
            <span className="text-[11px] font-medium text-[#6B7B6E] truncate max-w-full text-center">{fromTool.name}</span>
          </div>

          {/* Arrow */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F6E56]"
            style={{ boxShadow: "0 2px 8px rgba(15,110,86,0.25)" }}
          >
            <ArrowRight className="h-3.5 w-3.5 text-white" />
          </div>

          {/* To */}
          <div className="flex flex-1 flex-col items-center gap-2 min-w-0">
            <ToolLogo tool={toTool} size="lg" />
            <span className="text-[11px] font-semibold text-[#0F6E56] truncate max-w-full text-center">{toTool.name}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-4" style={{ background: "rgba(0,0,0,0.05)" }} />

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1 gap-3">
        {/* Description */}
        {alt.description && (
          <p className="text-[12px] leading-relaxed text-[#5C6B5E] line-clamp-2">{alt.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-[#9BA39C]">
          {alt.rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-[#C8956C] text-[#C8956C]" />
              <span className="font-semibold text-[#1B2B1F]">{alt.rating.toFixed(1)}</span>
            </span>
          )}
          {alt.switcherCount > 0 && (
            <>
              {alt.rating > 0 && <span className="h-1 w-1 rounded-full bg-[#DDD9D0]" />}
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {alt.switcherCount.toLocaleString()} switched
              </span>
            </>
          )}
          {alt.license && (
            <>
              <span className="h-1 w-1 rounded-full bg-[#DDD9D0] ml-auto" />
              <span className="ml-auto rounded-md bg-[#F0F7F4] px-2 py-0.5 text-[10px] font-medium text-[#0F6E56]">{alt.license}</span>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto flex gap-2 pt-1">
          <Link
            href="/signup"
            className="flex flex-1 items-center justify-center rounded-xl bg-[#0F6E56] py-2.5 text-[12px] font-semibold text-white transition-all hover:bg-[#0D6050] hover:-translate-y-px"
            style={{ boxShadow: "0 1px 4px rgba(15,110,86,0.25)" }}
          >
            Add to stack
          </Link>
          <Link
            href={`/discover/${toTool.slug}`}
            className="flex items-center justify-center rounded-xl px-3.5 py-2.5 text-[#6B7B6E] transition-all hover:bg-[#F0EDE8] hover:text-[#1B2B1F]"
            style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Main client component ─────────────────────────────────────────────────────

export function DiscoverClient({
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

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const categories = useMemo(() => {
    const cats = Array.from(new Set(alternatives.map((a) => a.category))).sort();
    return ["All", ...cats];
  }, [alternatives]);

  const filtered = useMemo(() => {
    return alternatives.filter((alt) => {
      const matchesCategory = activeCategory === "All" || alt.category === activeCategory;
      const text = [alt.fromTool.name, alt.toTool.name, alt.category, alt.description, alt.toTool.country, alt.license]
        .filter(Boolean).join(" ").toLowerCase();
      return matchesCategory && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [alternatives, activeCategory, normalizedQuery]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeCategory === "All") params.delete("category");
    else params.set("category", activeCategory);
    const q = query.trim();
    if (q) params.set("q", q); else params.delete("q");
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => router.replace(next, { scroll: false }));
  }, [activeCategory, pathname, query, router, searchParams]);

  return (
    <div style={{ fontFamily: F }}>

      {/* ── Hero + Search ──────────────────────────────────────────────────────── */}
      <div className="bg-[#F7F9FC]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10">

          {/* Headline */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-0.5 w-5 rounded-full bg-[#0F6E56]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9BA39C]">Discover</p>
            </div>
            <h1
              className="text-[36px] sm:text-[44px] font-bold text-[#1B2B1F]"
              style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}
            >
              EU alternatives to popular software
            </h1>
            <p className="mt-3 text-base text-[#5C6B5E] max-w-[500px]">
              Browse {alternatives.length} European alternatives across {categories.length - 1} categories — privacy-first, locally operated, and ready to switch.
            </p>
          </div>

          {/* Search bar */}
          <div
            className="relative rounded-2xl bg-white"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(15,110,86,0.08)", border: "1.5px solid rgba(15,110,86,0.12)" }}
          >
            <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#9BA39C]" style={{ height: 18, width: 18 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search for Slack, Notion, Figma, or any tool…"
              className="w-full rounded-2xl bg-transparent py-4 pl-12 pr-12 text-[14px] text-[#1B2B1F] placeholder:text-[#B0B8B3] outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[#F0EDE8] text-[#9BA39C] hover:bg-[#E8E3D9] hover:text-[#1B2B1F] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all",
                  cat === activeCategory
                    ? "bg-[#0F6E56] text-white shadow-sm"
                    : "bg-white text-[#6B7B6E] hover:bg-[#EAF3EE] hover:text-[#0F6E56]"
                )}
                style={cat !== activeCategory ? { border: "1.5px solid rgba(15,110,86,0.14)" } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {filtered.length > 0 ? (
          <>
            <p className="mb-6 text-[12px] text-[#9BA39C]">
              {filtered.length} alternative{filtered.length !== 1 ? "s" : ""}
              {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((alt) => (
                <AlternativeCard key={alt.id} alt={alt} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg,#EAF3EE,#D6EBE2)" }}
            >
              <Search className="h-7 w-7 text-[#0F6E56]" />
            </div>
            <h3 className="text-[16px] font-bold text-[#1B2B1F]">
              {alternatives.length === 0 ? "No alternatives yet" : "No results found"}
            </h3>
            <p className="mt-1.5 text-[13px] text-[#9BA39C] max-w-[280px]">
              {alternatives.length === 0
                ? "Check back soon — alternatives are being added regularly."
                : "Try a different search term or category."}
            </p>
            {alternatives.length > 0 && (
              <button
                type="button"
                onClick={() => { setQuery(""); setActiveCategory("All"); }}
                className="mt-5 text-[12px] font-semibold text-[#0F6E56] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* CTA strip */}
        <div
          className="mt-16 flex flex-col gap-4 rounded-2xl px-8 py-8 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "linear-gradient(135deg,#1B2B1F 0%,#243D2B 100%)", boxShadow: "0 4px 24px rgba(27,43,31,0.22)" }}
        >
          <div>
            <p className="text-[17px] font-bold text-white">Ready to make the switch?</p>
            <p className="mt-1 text-[13px] text-white/60 max-w-[400px]">
              Build your EU stack, track your migration, and connect with experts — all in one place.
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[13px] font-semibold text-[#1B2B1F] transition-all hover:-translate-y-px hover:bg-[#EFF0EB]"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
          >
            Get started free <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
