"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Handshake } from "lucide-react";
import { MOCK_PARTNERS } from "@/data/mock-data";
import { PartnerCard } from "@/components/shared/partner-card";
import { cn } from "@/lib/utils";

const ALL_SPECIALTIES = Array.from(
  new Set(MOCK_PARTNERS.flatMap((partner) => partner.specialty))
).sort();

function SpecialtyFilter({
  activeSpec,
  onChange,
}: {
  activeSpec: string;
  onChange: (specialty: string) => void;
}) {
  return (
    <div className="mb-8 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("")}
        className={cn(
          "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
          !activeSpec
            ? "bg-[#2A5FA5] text-white"
            : "border border-gray-200 bg-white text-gray-600 hover:border-[#2A5FA5] hover:text-[#2A5FA5]"
        )}
      >
        All
      </button>
      {ALL_SPECIALTIES.map((spec) => (
        <button
          key={spec}
          type="button"
          onClick={() => onChange(spec === activeSpec ? "" : spec)}
          className={cn(
            "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            spec === activeSpec
              ? "bg-[#2A5FA5] text-white"
              : "border border-gray-200 bg-white text-gray-600 hover:border-[#2A5FA5] hover:text-[#2A5FA5]"
          )}
        >
          {spec}
        </button>
      ))}
    </div>
  );
}

export function PartnersClient({
  initialQuery,
  initialSpec,
}: {
  initialQuery: string;
  initialSpec: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [activeSpec, setActiveSpec] = useState(initialSpec);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const sorted = useMemo(() => {
    const filtered = MOCK_PARTNERS.filter((partner) => {
      const searchableText = [
        partner.name,
        partner.country,
        partner.description,
        partner.pricing,
        partner.responseTime,
        ...partner.specialty,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesSpec = !activeSpec || partner.specialty.includes(activeSpec);
      return matchesQuery && matchesSpec;
    });

    return [...filtered].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.rating - a.rating;
    });
  }, [activeSpec, normalizedQuery]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    const trimmedQuery = query.trim();
    if (trimmedQuery) params.set("q", trimmedQuery);
    else params.delete("q");

    if (activeSpec) params.set("spec", activeSpec);
    else params.delete("spec");

    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      router.replace(next, { scroll: false });
    });
  }, [activeSpec, pathname, query, router, searchParams]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#2A5FA5]">
            Partners
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            EU migration partners
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {MOCK_PARTNERS.length} vetted specialists for end-to-end EU software migrations.
          </p>
        </div>
        <Link
          href="/signup"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#2A5FA5] px-5 py-2.5 text-sm font-medium text-[#2A5FA5] transition-colors hover:bg-blue-50"
        >
          <Handshake className="h-4 w-4" />
          Become a partner
        </Link>
      </div>

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="Search by name, country, specialty, or service…"
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-12 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-[#2A5FA5]"
        />
        {isPending && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-300">
            Updating…
          </span>
        )}
      </div>

      <SpecialtyFilter activeSpec={activeSpec} onChange={setActiveSpec} />

      {sorted.length > 0 ? (
        <>
          <p className="mb-5 text-xs text-gray-400">
            Showing {sorted.length} partner{sorted.length !== 1 ? "s" : ""}
            {activeSpec && ` specialising in ${activeSpec}`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">No partners found</h3>
          <p className="mt-1 text-xs text-gray-400">Try a different search or specialty filter.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveSpec("");
            }}
            className="mt-4 text-xs font-medium text-[#2A5FA5] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="mt-16 rounded-2xl bg-[#2A5FA5] px-8 py-10 text-center">
        <h2 className="mb-2 text-xl font-bold text-white">Are you a migration specialist?</h2>
        <p className="mx-auto mb-6 max-w-md text-sm text-blue-100">
          Join the Staky partner network to reach European businesses looking for expert help.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-[#2A5FA5] transition-colors hover:bg-blue-50"
        >
          Apply to become a partner
        </Link>
      </div>
    </div>
  );
}
