"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X, Search, ArrowRight, CheckCircle2, CalendarClock,
  Handshake, Sparkles, BadgeCheck, Loader2, ChevronRight,
  Plus, Star, ShieldCheck, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MIGRATION_ANALYSIS } from "@/data/migration-data";
import type { Difficulty, Impact } from "@/data/migration-data";
import { addStackItem, removeStackItem } from "@/actions/stack";
import { createMigrationRequest } from "@/actions/requests";
import { ToolIcon } from "@/components/shared/tool-icon";

// ─── Local SVG logos (by slug) ────────────────────────────────────────────────
// Pre-fills logoUrl so ToolIcon always shows the real logo, not an abbreviation.

// Covers both mock-data slugs (e.g. "gdrive") and admin-panel auto-generated
// hyphenated slugs (e.g. "google-drive") so logos resolve regardless of DB slug format.
const LOCAL_LOGOS: Record<string, string> = {
  // US tools
  slack:         "/logos/tools/slack.svg",
  notion:        "/logos/tools/notion.svg",
  figma:         "/logos/tools/figma.svg",
  gdrive:        "/logos/tools/gdrive.svg",
  "google-drive":"/logos/tools/gdrive.svg",
  zoom:          "/logos/tools/zoom.svg",
  github:        "/logos/tools/github.svg",
  salesforce:    "/logos/tools/salesforce.svg",
  mailchimp:     "/logos/tools/mailchimp.svg",
  asana:         "/logos/tools/asana.svg",
  hubspot:       "/logos/tools/hubspot.svg",
  // EU alternatives (mock slugs)
  mattermost:    "/logos/tools/mattermost.svg",
  appflowy:      "/logos/tools/appflowy.svg",
  "app-flowy":   "/logos/tools/appflowy.svg",
  penpot:        "/logos/tools/penpot.svg",
  nextcloud:     "/logos/tools/nextcloud.svg",
  jitsi:         "/logos/tools/jitsi.svg",
  "jitsi-meet":  "/logos/tools/jitsi.svg",
  gitea:         "/logos/tools/gitea.svg",
  forgejo:       "/logos/tools/forgejo.svg",
  brevo:         "/logos/tools/brevo.svg",
  plane:         "/logos/tools/plane.svg",
  suitecrm:      "/logos/tools/suitecrm.svg",
  "suite-crm":   "/logos/tools/suitecrm.svg",
  twentycrm:     "/logos/tools/twentycrm.svg",
  "twenty-crm":  "/logos/tools/twentycrm.svg",
  "twenty":      "/logos/tools/twentycrm.svg",
};

function withLogo(tool: StackTool): StackTool {
  // Use || so empty string logoUrl also falls through to the local SVG
  const logo = tool.logoUrl || LOCAL_LOGOS[tool.slug] || null;
  return { ...tool, logoUrl: logo };
}

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

interface StackTool {
  slug: string;
  name: string;
  origin: string;
  logoUrl?: string | null;
  color: string;
  abbr: string;
  category?: string | null;
  country?: string | null;
}

type EnrichedItem = StackItem & {
  fromSlug: string | null;
  fromTool: StackTool | null;
  euSlug: string | null;
  euTool: StackTool | null;
  analysis: (typeof MIGRATION_ANALYSIS)[string] | null;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  de: "Germany", fr: "France", nl: "Netherlands", se: "Sweden",
  fi: "Finland", dk: "Denmark", no: "Norway", be: "Belgium",
  at: "Austria", ch: "Switzerland", pl: "Poland", es: "Spain",
  it: "Italy", pt: "Portugal", ie: "Ireland", cz: "Czech Republic",
  ee: "Estonia", lv: "Latvia", lt: "Lithuania", si: "Slovenia",
  hr: "Croatia", hu: "Hungary", ro: "Romania", sk: "Slovakia",
};

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

// Converts "de" → "🇩🇪" using Unicode Regional Indicator Symbols
function countryFlag(code: string): string {
  return [...code.toUpperCase()].map((c) =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join("");
}

// ─── USToolBrowser ────────────────────────────────────────────────────────────

function USToolBrowser({
  allTools, addedSlugs, onAdd, onRemove, isPending, stackItems, altByFromSlug, toolBySlug,
}: {
  allTools: StackTool[];
  addedSlugs: Set<string>;
  onAdd: (tool: StackTool) => void;
  onRemove: (id: string) => void;
  isPending: boolean;
  stackItems: StackItem[];
  altByFromSlug: Map<string, string>;
  toolBySlug: Map<string, StackTool>;
}) {
  const [query, setQuery] = useState("");

  const usTools = allTools.filter((t) => t.origin === "us");
  const itemBySlug = new Map(
    stackItems.map((i) => {
      const tool = allTools.find((t) => t.name.toLowerCase() === i.toolName.toLowerCase());
      return tool ? [tool.slug, i] : null;
    }).filter(Boolean) as [string, StackItem][]
  );

  const filtered = query.trim()
    ? usTools.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : usTools;

  const sorted = [...filtered].sort((a, b) => {
    const aIn = addedSlugs.has(a.slug) ? 0 : 1;
    const bIn = addedSlugs.has(b.slug) ? 0 : 1;
    if (aIn !== bIn) return aIn - bIn;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search US tools…"
          disabled={isPending}
          className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-xs outline-none focus:border-[#0F6E56] transition-colors placeholder:text-gray-400 disabled:opacity-60"
        />
      </div>

      <div className="max-h-[460px] overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-100">
        {sorted.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">No tools found.</div>
        ) : sorted.map((t) => {
          const inStack = addedSlugs.has(t.slug);
          const item = itemBySlug.get(t.slug);
          const euSlug = altByFromSlug.get(t.slug);
          const euTool = euSlug ? toolBySlug.get(euSlug) : undefined;
          const enrichedT = withLogo(t);
          const enrichedEu = euTool ? withLogo(euTool) : undefined;

          return (
            <div
              key={t.slug}
              className={cn(
                "grid items-center gap-x-2 px-3 py-2",
                inStack ? "bg-[#0F6E56]/5" : "bg-white"
              )}
              style={{ gridTemplateColumns: "1fr 20px 1fr 72px" }}
            >
              {/* US tool */}
              <div className="flex items-center gap-2 min-w-0">
                <ToolIcon toolData={enrichedT} slug={t.slug} size="sm" className="h-6 w-6 shrink-0" />
                <div className="min-w-0">
                  <p className={cn("text-[11px] font-semibold truncate leading-tight", inStack ? "text-gray-900" : "text-gray-700")}>{t.name}</p>
                  <p className="text-[9px] text-gray-400 leading-tight">{t.category ?? "Tool"}</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="h-3 w-3 text-gray-300" />
              </div>

              {/* EU tool */}
              <div className="flex items-center gap-2 min-w-0">
                {enrichedEu ? (
                  <>
                    <ToolIcon toolData={enrichedEu} slug={euTool.slug} size="sm" className="h-6 w-6 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] font-semibold text-[#0F6E56] truncate leading-tight">{enrichedEu.name}</p>
                        {enrichedEu.country && (
                          <span className="text-[11px] leading-none">{countryFlag(enrichedEu.country)}</span>
                        )}
                      </div>
                      <p className="text-[9px] text-gray-400 leading-tight">{enrichedEu.category ?? "EU alt"}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-[10px] text-gray-300 italic">No match yet</p>
                )}
              </div>

              {/* Action */}
              <div className="flex justify-end">
                {inStack ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => item && onRemove(item.id)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onAdd(t)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold bg-[#0F6E56]/10 text-[#0F6E56] hover:bg-[#0F6E56]/20 transition-colors disabled:opacity-60 whitespace-nowrap"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {addedSlugs.size > 0 && (
        <p className="text-[10px] text-gray-400">
          <span className="font-semibold text-gray-600">{addedSlugs.size}</span> tool{addedSlugs.size !== 1 ? "s" : ""} added
        </p>
      )}
    </div>
  );
}

// ─── InlinePartnerList ────────────────────────────────────────────────────────

function InlinePartnerList({
  partners, switches, connectedPartners, onConnected, initialSentIds,
}: {
  partners: PartnerItem[];
  switches: { fromTool: string; toTool: string }[];
  connectedPartners: PartnerItem[];
  onConnected: (partner: PartnerItem) => void;
  initialSentIds: Set<string>;
}) {
  const router = useRouter();
  // Seeded from DB per-tool sent partners so state survives page refresh
  const [sentIds, setSentIds] = useState<Set<string>>(initialSentIds);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRequest(partner: PartnerItem) {
    if (sentIds.has(partner.id)) return;
    setPendingId(partner.id);
    startTransition(async () => {
      try {
        const result = await createMigrationRequest({
          source: "partner_profile",
          partnerUserId: partner.userId,
          switches,
        });
        setSentIds((prev) => new Set([...prev, partner.id]));
        onConnected(partner);
        router.push(`/app/requests/${result.requestId}`);
      } catch {
        // keep as-is
      } finally {
        setPendingId(null);
      }
    });
  }

  // Partners already connected from OTHER cards (not in this card's pool)
  const partnerIds = new Set(partners.map((p) => p.id));
  const quickPartners = connectedPartners.filter((p) => !partnerIds.has(p.id)).slice(0, 1);
  const freshPartners = partners.slice(0, quickPartners.length > 0 ? 1 : 2);

  if (partners.length === 0 && quickPartners.length === 0) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-gray-200 px-4 py-4 text-center">
        <p className="text-xs text-gray-400 mb-2">No partners available yet</p>
        <Link href="/app/partners" className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A5FA5] hover:underline">
          Browse all partners <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">

      {/* ── Quick connect: already working with this partner on another tool ── */}
      {quickPartners.length > 0 && (
        <>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#2A5FA5]">Continue with your partner</p>
          {quickPartners.map((partner) => {
            const sent = sentIds.has(partner.id);
            const loading = pendingId === partner.id;
            return (
              <div
                key={partner.id}
                className="flex items-center gap-2.5 rounded-xl border border-[#2A5FA5]/20 bg-[#2A5FA5]/[0.04] px-3 py-2.5"
              >
                {partner.logoUrl ? (
                  <Image src={partner.logoUrl} alt={partner.name} width={32} height={32}
                    className="rounded-lg object-cover shrink-0 border border-white shadow-sm" />
                ) : (
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: partner.color }}>
                    {partner.initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-gray-900 truncate">{partner.name}</span>
                    {partner.verified && <BadgeCheck className="h-3 w-3 text-[#2A5FA5] shrink-0" />}
                  </div>
                  {partner.country && (
                    <div className="flex items-center gap-1 mt-px">
                      <MapPin className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                      <span className="text-[11px] leading-none">{countryFlag(partner.country)}</span>
                      <span className="text-[9px] text-gray-400">{COUNTRY_NAMES[partner.country.toLowerCase()] ?? partner.country.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={sent || loading}
                  onClick={() => handleRequest(partner)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-colors whitespace-nowrap",
                    sent ? "bg-green-100 text-green-700" : "bg-[#2A5FA5] text-white hover:bg-[#244d8a] disabled:opacity-70"
                  )}
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : sent ? <><CheckCircle2 className="h-3 w-3" /> Sent</> : <>Add this too <ArrowRight className="h-3 w-3" /></>}
                </button>
              </div>
            );
          })}

          {freshPartners.length > 0 && (
            <div className="relative py-0.5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">or choose another</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Fresh partner cards ── */}
      {freshPartners.map((partner) => {
        const sent = sentIds.has(partner.id);
        const loading = pendingId === partner.id;
        return (
          <div
            key={partner.id}
            className="rounded-2xl bg-white overflow-hidden"
            style={{ border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
          >
            {/* Header */}
            <div className="flex items-start gap-3 px-4 pt-4 pb-3">
              {partner.logoUrl ? (
                <Image src={partner.logoUrl} alt={partner.name} width={44} height={44}
                  className="rounded-xl object-cover shrink-0 border border-gray-100" />
              ) : (
                <div className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: partner.color }}>
                  {partner.initials}
                </div>
              )}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-gray-900 leading-tight truncate">{partner.name}</span>
                  {partner.verified && <BadgeCheck className="h-3.5 w-3.5 text-[#2A5FA5] shrink-0" />}
                </div>
                {partner.country && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-[13px] leading-none">{countryFlag(partner.country)}</span>
                    <span className="text-[10px] text-gray-500">{COUNTRY_NAMES[partner.country.toLowerCase()] ?? partner.country.toUpperCase()}</span>
                  </div>
                )}
                {partner.rating > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex gap-px">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className={cn("h-3 w-3", i <= Math.round(partner.rating) ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200")} />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700">{partner.rating.toFixed(1)}</span>
                    {partner.projects > 0 && <span className="text-[11px] text-gray-400">· {partner.projects} projects</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Certification + Services */}
            <div className="mx-4 border-t border-gray-50 pt-2.5 pb-3 space-y-2">
              {partner.verified && (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0F6E56] shrink-0" />
                  <span className="text-[10px] font-semibold text-[#0F6E56]">Certified Migration Partner</span>
                </div>
              )}
              {partner.specialty.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {partner.specialty.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[9px] font-medium text-gray-500">{s}</span>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="px-4 pb-4">
              <button
                type="button"
                disabled={sent || loading}
                onClick={() => handleRequest(partner)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-bold transition-all active:scale-[0.98]",
                  sent
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-[#2A5FA5] text-white hover:bg-[#244d8a] disabled:opacity-70"
                )}
                style={!sent ? { boxShadow: "0 2px 6px rgba(42,95,165,0.35), inset 0 1px 0 rgba(255,255,255,0.12)" } : undefined}
              >
                {loading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : sent
                    ? <><CheckCircle2 className="h-3.5 w-3.5" /> Request sent</>
                    : <><Handshake className="h-3.5 w-3.5" /> Connect with this partner</>
                }
              </button>
            </div>
          </div>
        );
      })}

      <Link
        href="/app/partners"
        className="flex items-center justify-center gap-1 text-[10px] font-medium text-[#2A5FA5] hover:underline py-0.5"
      >
        View all partners <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ─── SwitchCard ───────────────────────────────────────────────────────────────

function SwitchCard({
  item, partners, connectedPartners, onRemove, isRemoving, onConnected, initialSentIds,
}: {
  item: EnrichedItem;
  partners: PartnerItem[];
  connectedPartners: PartnerItem[];
  onRemove: (id: string) => void;
  isRemoving: boolean;
  onConnected: (partner: PartnerItem) => void;
  initialSentIds: Set<string>;
}) {
  // Each card has its own independent showPartners state
  const [showPartners, setShowPartners] = useState(false);
  const { analysis, euTool, euSlug, fromSlug } = item;
  const diffCfg = analysis ? DIFFICULTY_CONFIG[analysis.difficulty] : null;
  const impCfg  = analysis ? IMPACT_CONFIG[analysis.impact] : null;

  const cardSwitch = fromSlug && euSlug
    ? [{ fromTool: fromSlug, toTool: euSlug }]
    : fromSlug
      ? [{ fromTool: fromSlug, toTool: "" }]
      : [];

  const fromToolEnriched = item.fromTool ? withLogo(item.fromTool) : null;
  const euToolEnriched = euTool ? withLogo(euTool) : null;

  return (
    <div
      className="relative rounded-xl bg-white overflow-hidden"
      style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* × remove */}
      <button
        type="button"
        disabled={isRemoving}
        onClick={() => onRemove(item.id)}
        className="absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-60 z-10"
        aria-label="Remove"
      >
        {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
      </button>

      <div className="px-3 py-2.5 flex flex-col gap-2">
        {/* ── Switch visual ── */}
        <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-2">
          {/* US tool */}
          <div className="flex flex-col items-center gap-0.5 w-[38%] min-w-0">
            {fromToolEnriched
              ? <ToolIcon toolData={fromToolEnriched} slug={item.fromSlug ?? undefined} size="sm" className="h-8 w-8" />
              : <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-200 text-[9px] font-bold text-gray-400">?</span>
            }
            <span className="text-[10px] font-semibold text-gray-800 truncate w-full text-center leading-tight">{fromToolEnriched?.name ?? item.toolName}</span>
          </div>

          {/* Arrow */}
          <div className="flex-1 flex items-center">
            <div className="h-px flex-1 border-t border-dashed border-gray-300" />
            <div className="h-4 w-4 rounded-full bg-[#0F6E56] flex items-center justify-center shrink-0 mx-1">
              <ArrowRight className="h-2 w-2 text-white" />
            </div>
            <div className="h-px flex-1 border-t border-dashed border-gray-300" />
          </div>

          {/* EU tool */}
          <div className="flex flex-col items-center gap-0.5 w-[38%] min-w-0">
            {euToolEnriched ? (
              <>
                <ToolIcon toolData={euToolEnriched} slug={euSlug ?? undefined} size="sm" className="h-8 w-8" />
                <div className="flex items-center gap-1 w-full justify-center">
                  <span className="text-[10px] font-semibold text-[#0F6E56] truncate leading-tight">{euToolEnriched.name}</span>
                  {euToolEnriched.country && (
                    <span className="text-[11px] leading-none shrink-0">{countryFlag(euToolEnriched.country)}</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-[9px] font-bold text-gray-400">?</span>
                <span className="text-[9px] text-gray-400 text-center leading-tight">No alt yet</span>
              </>
            )}
          </div>
        </div>

        {/* ── Meta badges ── */}
        {analysis && diffCfg && impCfg && (
          <div className="flex flex-wrap items-center gap-1">
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", diffCfg.cls)}>
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", diffCfg.dot)} />
              {diffCfg.label}
            </span>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", impCfg.cls)}>
              {impCfg.label}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <CalendarClock className="h-3 w-3" />
              {analysis.timeEstimate}
            </span>
          </div>
        )}

        {/* ── Partner CTA — available on every card ── */}
        {cardSwitch.length > 0 && (
          <div className="border-t border-gray-100 pt-2">
            <button
              type="button"
              onClick={() => setShowPartners((v) => !v)}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition-all",
                showPartners
                  ? "bg-gray-100 text-gray-600"
                  : "bg-[#2A5FA5] text-white hover:bg-[#244d8a]"
              )}
            >
              <Handshake className="h-3 w-3" />
              {showPartners ? "Hide partners" : "Find migration partner"}
            </button>
            {showPartners && (
              <InlinePartnerList
                partners={partners}
                switches={cardSwitch}
                connectedPartners={connectedPartners}
                onConnected={onConnected}
                initialSentIds={initialSentIds}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StackAnalyzer({
  initialItems,
  partners,
  allTools,
  alternatives,
  sentPairs,
}: {
  initialItems: StackItem[];
  partners: PartnerItem[];
  allTools: StackTool[];
  alternatives: { fromSlug: string; toSlug: string }[];
  sentPairs: string[];
}) {
  const [items, setItems] = useState<StackItem[]>(initialItems);
  const [isAdding, startAddTransition] = useTransition();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  // Tracks partners connected across any card in this session
  const [connectedPartners, setConnectedPartners] = useState<PartnerItem[]>(() =>
    partners.filter((p) => p.hasRequest)
  );

  // "partnerId:fromSlug" pairs from DB — lets each card restore its sent state
  const sentPairsSet = new Set(sentPairs);

  const toolByName = new Map(allTools.map((t) => [t.name.toLowerCase(), t]));
  const toolBySlug = new Map(allTools.map((t) => [t.slug, t]));
  const altByFromSlug = new Map(alternatives.map((a) => [a.fromSlug, a.toSlug]));

  const getSlug = (toolName: string) => toolByName.get(toolName.toLowerCase())?.slug;

  const usItems = items.filter((i) => {
    const tool = toolByName.get(i.toolName.toLowerCase());
    return !tool || tool.origin === "us";
  });

  const enrichedItems: EnrichedItem[] = usItems.map((i) => {
    const fromSlug = getSlug(i.toolName) ?? null;
    const fromTool = fromSlug ? (toolBySlug.get(fromSlug) ?? null) : null;
    const dbEuSlug = fromSlug ? (altByFromSlug.get(fromSlug) ?? null) : null;
    const analysis = fromSlug ? (MIGRATION_ANALYSIS[fromSlug] ?? null) : null;
    const euSlug = dbEuSlug ?? analysis?.euAlternative ?? null;
    const euTool = euSlug ? (toolBySlug.get(euSlug) ?? null) : null;
    return { ...i, fromSlug, fromTool, euSlug, euTool, analysis };
  });

  const addedSlugs = new Set(
    usItems.map((i) => getSlug(i.toolName)).filter(Boolean) as string[]
  );

  const handleAdd = (tool: StackTool) => {
    const tempId = `optimistic-${Date.now()}`;
    setItems((prev) => [...prev, { id: tempId, toolName: tool.name, category: tool.category ?? "Other" }]);
    startAddTransition(async () => {
      try {
        const result = await addStackItem(tool.name, tool.category ?? "Other");
        if (result.ok && result.id) {
          setItems((prev) => prev.map((i) => i.id === tempId ? { ...i, id: result.id! } : i));
        }
      } catch {
        setItems((prev) => prev.filter((i) => i.id !== tempId));
      }
    });
  };

  const handleRemove = (id: string) => {
    if (id.startsWith("optimistic-")) {
      setItems((p) => p.filter((i) => i.id !== id));
      return;
    }
    const snapshot = items;
    setRemovingIds((s) => new Set([...s, id]));
    setItems((p) => p.filter((i) => i.id !== id));
    removeStackItem(id).catch(() => {
      setItems(snapshot);
    }).finally(() => {
      setRemovingIds((s) => { const n = new Set(s); n.delete(id); return n; });
    });
  };

  const handleConnected = (partner: PartnerItem) => {
    setConnectedPartners((prev) =>
      prev.some((p) => p.id === partner.id) ? prev : [...prev, partner]
    );
  };

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F6E56] mb-0.5">Stack Analyzer</p>
        <h1 className="text-xl font-bold text-gray-900">My Stack</h1>
        <p className="text-sm text-gray-400 mt-1">Select your US tools to see European alternatives</p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">

        {/* Left: US tool browser */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">US Tools → EU Alternative</p>
          <USToolBrowser
            allTools={allTools}
            addedSlugs={addedSlugs}
            onAdd={handleAdd}
            onRemove={handleRemove}
            isPending={isAdding}
            stackItems={usItems}
            altByFromSlug={altByFromSlug}
            toolBySlug={toolBySlug}
          />
        </div>

        {/* Right: Switch cards — items-start prevents row stretching when one card expands */}
        {enrichedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
            {enrichedItems.map((item) => {
              // Partners already sent for this specific tool (survives refresh)
              const initialSentIds = new Set(
                partners
                  .filter((p) => item.fromSlug && sentPairsSet.has(`${p.id}:${item.fromSlug}`))
                  .map((p) => p.id)
              );
              return (
              <SwitchCard
                key={item.id}
                item={item}
                partners={partners}
                connectedPartners={connectedPartners}
                onRemove={handleRemove}
                isRemoving={removingIds.has(item.id)}
                onConnected={handleConnected}
                initialSentIds={initialSentIds}
              />
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 px-8 text-center">
            <Sparkles className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600">Add a US tool to get started</p>
            <p className="text-xs text-gray-400 mt-1">Select tools from the list on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}
