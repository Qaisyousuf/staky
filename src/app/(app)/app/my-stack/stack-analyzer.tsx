"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X, Search, ArrowRight, CheckCircle2, CalendarClock,
  Handshake, Sparkles, BadgeCheck, Loader2, ChevronRight,
  Plus, Star, ShieldCheck, MapPin, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MIGRATION_ANALYSIS } from "@/data/migration-data";
import type { Difficulty, Impact } from "@/data/migration-data";
import { addStackItem, removeStackItem } from "@/actions/stack";
import { createMigrationRequest } from "@/actions/requests";
import { ToolIcon } from "@/components/shared/tool-icon";

// ─── Constants ─────────────────────────────────────────────────────────────────

const CARD_SHADOW = "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)";
const CARD_BORDER = "1.5px solid rgba(0,0,0,0.06)";
const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

// ─── Local SVG logos ──────────────────────────────────────────────────────────

const LOCAL_LOGOS: Record<string, string> = {
  slack:          "/logos/tools/slack.svg",
  notion:         "/logos/tools/notion.svg",
  figma:          "/logos/tools/figma.svg",
  gdrive:         "/logos/tools/gdrive.svg",
  "google-drive": "/logos/tools/gdrive.svg",
  zoom:           "/logos/tools/zoom.svg",
  github:         "/logos/tools/github.svg",
  salesforce:     "/logos/tools/salesforce.svg",
  mailchimp:      "/logos/tools/mailchimp.svg",
  asana:          "/logos/tools/asana.svg",
  hubspot:        "/logos/tools/hubspot.svg",
  mattermost:     "/logos/tools/mattermost.svg",
  appflowy:       "/logos/tools/appflowy.svg",
  "app-flowy":    "/logos/tools/appflowy.svg",
  penpot:         "/logos/tools/penpot.svg",
  nextcloud:      "/logos/tools/nextcloud.svg",
  jitsi:          "/logos/tools/jitsi.svg",
  "jitsi-meet":   "/logos/tools/jitsi.svg",
  gitea:          "/logos/tools/gitea.svg",
  forgejo:        "/logos/tools/forgejo.svg",
  brevo:          "/logos/tools/brevo.svg",
  plane:          "/logos/tools/plane.svg",
  suitecrm:       "/logos/tools/suitecrm.svg",
  "suite-crm":    "/logos/tools/suitecrm.svg",
  twentycrm:      "/logos/tools/twentycrm.svg",
  "twenty-crm":   "/logos/tools/twentycrm.svg",
  "twenty":       "/logos/tools/twentycrm.svg",
};

function withLogo(tool: StackTool): StackTool {
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

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; bg: string; color: string; border: string; dot: string }> = {
  easy:   { label: "Easy",          bg: "#EAF3EE", color: "#0F6E56", border: "rgba(15,110,86,0.2)",   dot: "#0F6E56" },
  medium: { label: "Moderate",      bg: "#FFFBEB", color: "#b45309", border: "rgba(180,83,9,0.2)",    dot: "#f59e0b" },
  hard:   { label: "Expert needed", bg: "#FEF2F2", color: "#dc2626", border: "rgba(220,38,38,0.2)",   dot: "#dc2626" },
};

const IMPACT_CONFIG: Record<Impact, { label: string; bg: string; color: string }> = {
  low:    { label: "Low impact",  bg: "rgba(0,0,0,0.04)", color: "#5C6B5E" },
  medium: { label: "Med impact",  bg: "#EBF1FA",          color: "#2A5FA5" },
  high:   { label: "High impact", bg: "#F3F0FF",          color: "#7c3aed" },
};

function countryFlag(code: string): string {
  return Array.from(code.toUpperCase()).map((c) =>
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
  const [focused, setFocused] = useState(false);

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
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9BA39C] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search US tools…"
          disabled={isPending}
          className="w-full rounded-xl bg-[#F7F9F8] pl-9 pr-3 py-2.5 text-[13px] outline-none placeholder:text-[#C8D0CA] disabled:opacity-60 transition-all"
          style={{
            border: focused ? "1.5px solid #0F6E56" : CARD_BORDER,
          }}
        />
      </div>

      {/* Tool list */}
      <div
        className="max-h-[480px] overflow-y-auto rounded-xl divide-y"
        style={{ border: CARD_BORDER, divideColor: "rgba(0,0,0,0.04)" }}
      >
        {sorted.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[#9BA39C]">No tools found.</div>
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
              className="grid items-center gap-x-2 px-3 py-2.5 transition-colors"
              style={{
                gridTemplateColumns: "1fr 18px 1fr 68px",
                background: inStack ? "#EAF3EE" : "white",
              }}
            >
              {/* US tool */}
              <div className="flex items-center gap-2 min-w-0">
                <ToolIcon toolData={enrichedT} slug={t.slug} size="sm" />
                <div className="min-w-0">
                  <p className={cn("text-[12px] font-semibold truncate leading-tight", inStack ? "text-[#0F6E56]" : "text-[#1B2B1F]")}>{t.name}</p>
                  <p className="text-[10px] text-[#9BA39C] leading-tight">{t.category ?? "Tool"}</p>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-3 w-3 text-[#C8D0CA] shrink-0" />

              {/* EU tool */}
              <div className="flex items-center gap-2 min-w-0">
                {enrichedEu ? (
                  <>
                    <ToolIcon toolData={enrichedEu} slug={euTool!.slug} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-[12px] font-semibold text-[#0F6E56] truncate leading-tight">{enrichedEu.name}</p>
                        {enrichedEu.country && (
                          <span className="text-[11px] leading-none shrink-0">{countryFlag(enrichedEu.country)}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#9BA39C] leading-tight">{enrichedEu.category ?? "EU alt"}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-[#C8D0CA] italic">No match yet</p>
                )}
              </div>

              {/* Action */}
              <div className="flex justify-end">
                {inStack ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => item && onRemove(item.id)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
                    style={{ background: "#FEF2F2", color: "#dc2626" }}
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onAdd(t)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
                    style={{ background: "#EAF3EE", color: "#0F6E56" }}
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
        <p className="text-[11px] text-[#9BA39C]">
          <span className="font-bold text-[#1B2B1F]">{addedSlugs.size}</span> tool{addedSlugs.size !== 1 ? "s" : ""} in your stack
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
        setSentIds((prev) => new Set(Array.from(prev).concat(partner.id)));
        onConnected(partner);
        router.push(`/app/requests/${result.requestId}`);
      } catch {
        // keep
      } finally {
        setPendingId(null);
      }
    });
  }

  const partnerIds = new Set(partners.map((p) => p.id));
  const quickPartners = connectedPartners.filter((p) => !partnerIds.has(p.id)).slice(0, 1);
  const freshPartners = partners.slice(0, quickPartners.length > 0 ? 1 : 2);

  if (partners.length === 0 && quickPartners.length === 0) {
    return (
      <div
        className="mt-3 rounded-xl px-4 py-4 text-center"
        style={{ border: "1.5px dashed rgba(0,0,0,0.08)" }}
      >
        <p className="text-[12px] text-[#9BA39C] mb-2">No partners available yet</p>
        <Link href="/app/partners" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2A5FA5] hover:underline">
          Browse all partners <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">

      {/* ── Quick connect ── */}
      {quickPartners.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A5FA5]">Continue with your partner</p>
          {quickPartners.map((partner) => {
            const sent = sentIds.has(partner.id);
            const loading = pendingId === partner.id;
            return (
              <div
                key={partner.id}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                style={{ background: "#EBF1FA", border: "1.5px solid rgba(42,95,165,0.15)" }}
              >
                {partner.logoUrl ? (
                  <Image src={partner.logoUrl} alt={partner.name} width={32} height={32}
                    className="rounded-lg object-cover shrink-0 border-2 border-white shadow-sm" />
                ) : (
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: partner.color }}>
                    {partner.initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] font-bold text-[#1B2B1F] truncate">{partner.name}</span>
                    {partner.verified && <BadgeCheck className="h-3 w-3 text-[#2A5FA5] shrink-0" />}
                  </div>
                  {partner.country && (
                    <div className="flex items-center gap-1 mt-px">
                      <MapPin className="h-2.5 w-2.5 text-[#9BA39C] shrink-0" />
                      <span className="text-[10px] text-[#5C6B5E]">{COUNTRY_NAMES[partner.country.toLowerCase()] ?? partner.country.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={sent || loading}
                  onClick={() => handleRequest(partner)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors whitespace-nowrap",
                    sent ? "text-[#0F6E56]" : "bg-[#2A5FA5] text-white hover:bg-[#244d8a] disabled:opacity-70"
                  )}
                  style={sent ? { background: "#EAF3EE" } : {}}
                >
                  {loading
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : sent
                    ? <><CheckCircle2 className="h-3 w-3" /> Sent</>
                    : <>Add this too <ArrowRight className="h-3 w-3" /></>}
                </button>
              </div>
            );
          })}

          {freshPartners.length > 0 && (
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(0,0,0,0.05)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2.5 text-[10px] font-semibold text-[#9BA39C] uppercase tracking-wider">or choose another</span>
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
            style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
          >
            <div className="flex items-start gap-3 px-4 pt-4 pb-3">
              {partner.logoUrl ? (
                <Image src={partner.logoUrl} alt={partner.name} width={44} height={44}
                  className="rounded-xl object-cover shrink-0 border-2 border-white shadow-sm" />
              ) : (
                <div className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: partner.color }}>
                  {partner.initials}
                </div>
              )}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-[#1B2B1F] leading-tight truncate">{partner.name}</span>
                  {partner.verified && <BadgeCheck className="h-3.5 w-3.5 text-[#2A5FA5] shrink-0" />}
                </div>
                {partner.country && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3 w-3 text-[#9BA39C] shrink-0" />
                    <span className="text-[11px] text-[#5C6B5E]">{COUNTRY_NAMES[partner.country.toLowerCase()] ?? partner.country.toUpperCase()}</span>
                  </div>
                )}
                {partner.rating > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-[12px] font-bold text-[#1B2B1F]">{partner.rating.toFixed(1)}</span>
                    {partner.projects > 0 && <span className="text-[11px] text-[#9BA39C]">· {partner.projects} projects</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="mx-4 pt-2.5 pb-3 space-y-2 border-t border-[rgba(0,0,0,0.05)]">
              {partner.verified && (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0F6E56] shrink-0" />
                  <span className="text-[11px] font-semibold text-[#0F6E56]">Certified Migration Partner</span>
                </div>
              )}
              {partner.specialty.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {partner.specialty.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-lg px-2 py-0.5 text-[10px] font-medium text-[#2A5FA5]"
                      style={{ background: "#EBF1FA" }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 pb-4">
              <button
                type="button"
                disabled={sent || loading}
                onClick={() => handleRequest(partner)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-bold transition-all",
                  sent ? "text-[#0F6E56]" : "bg-[#2A5FA5] text-white hover:bg-[#244d8a] disabled:opacity-70"
                )}
                style={sent
                  ? { background: "#EAF3EE", border: "1.5px solid rgba(15,110,86,0.2)" }
                  : { boxShadow: "0 2px 8px rgba(42,95,165,0.25)" }}
              >
                {loading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : sent
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /> Request sent</>
                  : <><Handshake className="h-3.5 w-3.5" /> Connect with this partner</>}
              </button>
            </div>
          </div>
        );
      })}

      <Link
        href="/app/partners"
        className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#2A5FA5] hover:underline py-1"
      >
        View all partners <ChevronRight className="h-3.5 w-3.5" />
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
      className="relative bg-white rounded-2xl overflow-hidden"
      style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
    >
      {/* Remove button */}
      <button
        type="button"
        disabled={isRemoving}
        onClick={() => onRemove(item.id)}
        className="absolute top-3 right-3 h-6 w-6 rounded-full flex items-center justify-center transition-colors disabled:opacity-60 z-10"
        style={{ background: "rgba(0,0,0,0.06)", color: "#9BA39C" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#dc2626"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "#9BA39C"; }}
        aria-label="Remove"
      >
        {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
      </button>

      <div className="p-4 flex flex-col gap-3">

        {/* ── Migration visual ── */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-3"
          style={{ background: "#F7F9F8", border: CARD_BORDER }}
        >
          {/* US tool */}
          <div className="flex flex-col items-center gap-1 w-[38%] min-w-0">
            {fromToolEnriched
              ? <ToolIcon toolData={fromToolEnriched} slug={item.fromSlug ?? undefined} size="md" />
              : <span className="h-9 w-9 flex items-center justify-center rounded-xl text-[10px] font-bold text-[#9BA39C]"
                  style={{ background: "rgba(0,0,0,0.06)" }}>?</span>
            }
            <span className="text-[11px] font-semibold text-[#1B2B1F] truncate w-full text-center leading-tight mt-0.5">
              {fromToolEnriched?.name ?? item.toolName}
            </span>
          </div>

          {/* Arrow */}
          <div className="flex-1 flex items-center gap-1">
            <div className="h-px flex-1" style={{ borderTop: "1.5px dashed rgba(0,0,0,0.12)" }} />
            <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#0F6E56" }}>
              <ArrowRight className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="h-px flex-1" style={{ borderTop: "1.5px dashed rgba(0,0,0,0.12)" }} />
          </div>

          {/* EU tool */}
          <div className="flex flex-col items-center gap-1 w-[38%] min-w-0">
            {euToolEnriched ? (
              <>
                <ToolIcon toolData={euToolEnriched} slug={euSlug ?? undefined} size="md" />
                <div className="flex items-center gap-1 w-full justify-center mt-0.5">
                  <span className="text-[11px] font-semibold text-[#0F6E56] truncate leading-tight">{euToolEnriched.name}</span>
                  {euToolEnriched.country && (
                    <span className="text-[11px] leading-none shrink-0">{countryFlag(euToolEnriched.country)}</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="h-9 w-9 flex items-center justify-center rounded-xl text-[10px] font-bold text-[#9BA39C]"
                  style={{ background: "rgba(0,0,0,0.04)" }}>?</span>
                <span className="text-[10px] text-[#C8D0CA] text-center leading-tight">No alt yet</span>
              </>
            )}
          </div>
        </div>

        {/* ── Meta badges ── */}
        {analysis && diffCfg && impCfg && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: diffCfg.bg, color: diffCfg.color, border: `1.5px solid ${diffCfg.border}` }}
            >
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: diffCfg.dot }} />
              {diffCfg.label}
            </span>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: impCfg.bg, color: impCfg.color }}
            >
              {impCfg.label}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#9BA39C]">
              <CalendarClock className="h-3 w-3" />
              {analysis.timeEstimate}
            </span>
          </div>
        )}

        {/* ── Partner CTA ── */}
        {cardSwitch.length > 0 && (
          <div className="border-t border-[rgba(0,0,0,0.05)] pt-3">
            <button
              type="button"
              onClick={() => setShowPartners((v) => !v)}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-bold transition-all"
              )}
              style={showPartners
                ? { background: "rgba(0,0,0,0.05)", color: "#1B2B1F" }
                : { background: "#2A5FA5", color: "white", boxShadow: "0 2px 8px rgba(42,95,165,0.25)" }}
            >
              <Handshake className="h-3.5 w-3.5" />
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
  const [connectedPartners, setConnectedPartners] = useState<PartnerItem[]>(() =>
    partners.filter((p) => p.hasRequest)
  );

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
    setRemovingIds((s) => new Set(Array.from(s).concat(id)));
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6" style={{ fontFamily: F }}>

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F6E56] mb-1">Stack Analyzer</p>
          <h1 className="text-[22px] font-black text-[#1B2B1F] leading-tight">My Stack</h1>
          <p className="text-[13px] text-[#5C6B5E] mt-0.5">
            Select your US tools to see European alternatives and connect with migration partners.
          </p>
        </div>
        {addedSlugs.size > 0 && (
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-white shrink-0 self-start"
            style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
          >
            <Layers className="h-4 w-4 text-[#0F6E56]" />
            <span className="text-[18px] font-black text-[#1B2B1F] leading-none">{addedSlugs.size}</span>
            <span className="text-[12px] text-[#9BA39C]">tool{addedSlugs.size !== 1 ? "s" : ""} in stack</span>
          </div>
        )}
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">

        {/* Left: Tool browser */}
        <div
          className="bg-white rounded-2xl p-4"
          style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9BA39C] mb-3">
            US Tools → EU Alternatives
          </p>
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

        {/* Right: Switch cards */}
        {enrichedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {enrichedItems.map((item) => {
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
          <div
            className="bg-white rounded-2xl py-16 px-8 text-center"
            style={{ border: "1.5px dashed rgba(0,0,0,0.08)", boxShadow: CARD_SHADOW }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3EE] mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-[#0F6E56]" />
            </div>
            <p className="text-[15px] font-bold text-[#1B2B1F]">Add a US tool to get started</p>
            <p className="text-[13px] text-[#9BA39C] mt-1.5 leading-relaxed max-w-xs mx-auto">
              Search for your current tools on the left and we&apos;ll find EU alternatives for each one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
