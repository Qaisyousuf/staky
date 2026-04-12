"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import {
  Search, ArrowRight, BadgeCheck, Star, Globe,
  MapPin, Briefcase, Handshake, X,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type PublicPartner = {
  id: string;
  companyName: string;
  country: string;
  specialty: string[];
  services: string[];
  logoUrl: string | null;
  rating: number;
  projectCount: number;
  description: string | null;
  website: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

const AVATAR_COLORS = ["#2A5FA5", "#1a3f7a", "#0F6E56", "#7C5CBF", "#B85C38", "#1F6B85"];
function avatarColor(name: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ─── Partner card ─────────────────────────────────────────────────────────────

function PartnerCard({ partner }: { partner: PublicPartner }) {
  const initials = getInitials(partner.companyName);
  const color = avatarColor(partner.companyName);
  const website = partner.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  return (
    <div
      className="group flex flex-col rounded-2xl bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(42,95,165,0.12)]"
      style={{ border: "1.5px solid rgba(42,95,165,0.09)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)", fontFamily: F }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 p-5 pb-4">
        {/* Logo */}
        <div
          className="h-[52px] w-[52px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ border: "1.5px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
          {partner.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.logoUrl} alt={partner.companyName} className="h-full w-full object-contain p-1.5" />
          ) : (
            <div
              className="h-full w-full flex items-center justify-center text-white text-[13px] font-black select-none"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-1.5">
            <p className="text-[15px] font-bold text-[#1B2B1F] leading-tight truncate">{partner.companyName}</p>
            <BadgeCheck className="h-4 w-4 text-[#2A5FA5] shrink-0" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#9BA39C]">
            {partner.country && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {partner.country}
              </span>
            )}
            {partner.projectCount > 0 && (
              <>
                <span className="h-1 w-1 rounded-full bg-[#DDD9D0]" />
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3 shrink-0" />
                  {partner.projectCount} migrations
                </span>
              </>
            )}
          </div>
        </div>

        {/* Rating */}
        {partner.rating > 0 && (
          <div
            className="shrink-0 flex flex-col items-center gap-0.5 rounded-xl px-3 py-2"
            style={{ background: "#F7F9FC", border: "1px solid rgba(42,95,165,0.10)" }}
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-2.5 w-2.5 ${i < Math.round(partner.rating) ? "fill-[#C8956C] text-[#C8956C]" : "text-[#E8E3D9]"}`} />
              ))}
            </div>
            <span className="text-[12px] font-bold text-[#1B2B1F]">{partner.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px mx-5" style={{ background: "rgba(42,95,165,0.07)" }} />

      {/* Body */}
      <div className="px-5 pt-4 pb-5 flex-1 flex flex-col gap-3">
        {partner.description && (
          <p className="text-[13px] leading-relaxed text-[#5C6B5E] line-clamp-2">{partner.description}</p>
        )}

        {partner.specialty.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.10em] text-[#B0B8B3]">Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {partner.specialty.slice(0, 4).map((s) => (
                <span key={s} className="rounded-md bg-[#EBF0F9] px-2.5 py-1 text-[11px] font-medium text-[#2A5FA5]">{s}</span>
              ))}
              {partner.specialty.length > 4 && (
                <span className="rounded-md bg-[#F0EDE8] px-2.5 py-1 text-[11px] text-[#9BA39C]">+{partner.specialty.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {partner.services.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.10em] text-[#B0B8B3]">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {partner.services.slice(0, 3).map((s) => (
                <span key={s} className="rounded-md bg-[#F0F7F4] px-2.5 py-1 text-[11px] font-medium text-[#0F6E56]">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-1 flex items-center gap-3">
          {website ? (
            <a
              href={partner.website!.startsWith("http") ? partner.website! : `https://${partner.website!}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1 text-[11px] text-[#9BA39C] hover:text-[#2A5FA5] transition-colors"
            >
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">{website}</span>
            </a>
          ) : <span />}
          <Link
            href="/signup"
            className="ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#2A5FA5] px-4 py-2 text-[12px] font-semibold text-white transition-all hover:bg-[#244d8a] hover:-translate-y-px"
          >
            Connect <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function PartnersClient({
  partners,
  isAuthenticated,
}: {
  partners: PublicPartner[];
  isAuthenticated: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeSpec, setActiveSpec] = useState("");
  const deferredQuery = useDeferredValue(query);

  const allSpecialties = useMemo(
    () => Array.from(new Set(partners.flatMap((p) => p.specialty))).sort(),
    [partners]
  );

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return partners.filter((p) => {
      const text = [p.companyName, p.country, p.description, ...p.specialty, ...p.services]
        .filter(Boolean).join(" ").toLowerCase();
      return (!q || text.includes(q)) && (!activeSpec || p.specialty.includes(activeSpec));
    });
  }, [partners, deferredQuery, activeSpec]);

  return (
    <div style={{ fontFamily: F }}>

      {/* ── Hero + Search combined ───────────────────────────────────────────── */}
      <div className="bg-[#F7F9FC]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10">

          {/* Headline row */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-0.5 w-5 rounded-full bg-[#2A5FA5]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9BA39C]">Trusted Partners</p>
              </div>
              <h1
                className="text-[36px] sm:text-[44px] font-bold text-[#1B2B1F]"
                style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}
              >
                Certified EU migration experts
              </h1>
              <p className="mt-3 text-base text-[#5C6B5E] max-w-[500px]">
                Vetted specialists for end-to-end migrations — strategy, execution, and ongoing support.
              </p>
            </div>
            {!isAuthenticated && (
              <Link
                href="/signup"
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#2A5FA5] px-5 py-3 text-[13px] font-semibold text-white transition-all hover:bg-[#244d8a] hover:-translate-y-px"
                style={{ boxShadow: "0 2px 8px rgba(42,95,165,0.25), 0 8px 24px rgba(42,95,165,0.15)" }}
              >
                <Handshake className="h-4 w-4" />
                Become a partner
              </Link>
            )}
          </div>

          {/* Search bar */}
          <div
            className="relative rounded-2xl bg-white"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(42,95,165,0.08)", border: "1.5px solid rgba(42,95,165,0.10)" }}
          >
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#9BA39C]" style={{ height: 18, width: 18 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search by name, country, or specialty…"
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

          {/* Specialty filter pills */}
          {allSpecialties.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveSpec("")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all",
                  !activeSpec
                    ? "bg-[#2A5FA5] text-white shadow-sm"
                    : "bg-white text-[#6B7B6E] hover:bg-[#EBF0F9] hover:text-[#2A5FA5]"
                )}
                style={!activeSpec ? {} : { border: "1.5px solid rgba(42,95,165,0.12)" }}
              >
                All
              </button>
              {allSpecialties.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setActiveSpec(spec === activeSpec ? "" : spec)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all",
                    spec === activeSpec
                      ? "bg-[#2A5FA5] text-white shadow-sm"
                      : "bg-white text-[#6B7B6E] hover:bg-[#EBF0F9] hover:text-[#2A5FA5]"
                  )}
                  style={spec !== activeSpec ? { border: "1.5px solid rgba(42,95,165,0.12)" } : {}}
                >
                  {spec}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {filtered.length > 0 ? (
          <>
            <p className="mb-6 text-[12px] text-[#9BA39C]">
              {filtered.length} partner{filtered.length !== 1 ? "s" : ""}
              {activeSpec ? ` specialising in ${activeSpec}` : ""}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          </>
        ) : partners.length === 0 ? (
          /* No partners at all */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg,#EBF0F9,#DDE8F5)" }}
            >
              <Handshake className="h-7 w-7 text-[#2A5FA5]" />
            </div>
            <h3 className="text-[16px] font-bold text-[#1B2B1F]">No partners yet</h3>
            <p className="mt-1.5 text-[13px] text-[#9BA39C] max-w-[280px]">
              Be the first verified migration expert on Staky
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2A5FA5] px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-[#244d8a] transition-colors"
            >
              Apply as a partner
            </Link>
          </div>
        ) : (
          /* No search results */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EDE8]">
              <Search className="h-5 w-5 text-[#9BA39C]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#1B2B1F]">No partners found</h3>
            <p className="mt-1 text-[13px] text-[#9BA39C]">Try a different search or filter</p>
            <button
              type="button"
              onClick={() => { setQuery(""); setActiveSpec(""); }}
              className="mt-4 text-[12px] font-semibold text-[#2A5FA5] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ── Become a partner CTA ─────────────────────────────────────────── */}
        <div
          className="mt-16 flex flex-col gap-4 rounded-2xl px-8 py-8 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "linear-gradient(135deg,#1B2B1F 0%,#243D2B 100%)", boxShadow: "0 4px 24px rgba(27,43,31,0.22)" }}
        >
          <div>
            <p className="text-[17px] font-bold text-white">Are you a migration expert?</p>
            <p className="mt-1 text-[13px] text-white/60 max-w-[400px]">
              Connect with businesses across Europe actively looking for certified migration specialists.
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[13px] font-semibold text-[#1B2B1F] transition-all hover:-translate-y-px hover:bg-[#EFF0EB]"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
          >
            Join as a verified partner <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
