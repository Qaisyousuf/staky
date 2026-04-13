"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BadgeCheck, CheckCircle2,
  Handshake, Loader2, MapPin, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/data/mock-data";
import { createMigrationRequest } from "@/actions/requests";
import { ToolIcon } from "@/components/shared/tool-icon";

// ─── Constants ─────────────────────────────────────────────────────────────────

const CARD_SHADOW = "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)";
const CARD_BORDER = "1.5px solid rgba(0,0,0,0.06)";
const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  responseTime: string;
  pricing: string;
  featured: boolean;
  verified: boolean;
  hasRequest: boolean;
}

interface ToolData {
  name: string;
  logoUrl: string | null;
  color: string;
  abbr: string;
}

interface Switch {
  fromTool: string;
  toTool: string;
  fromToolData?: ToolData;
  toToolData?: ToolData;
}

// ─── Partner card ─────────────────────────────────────────────────────────────

function PartnerCard({ partner, switches }: { partner: PartnerItem; switches: Switch[] }) {
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
        // stay open
      }
    });
  }

  return (
    <div
      className={cn(
        "bg-white rounded-2xl overflow-hidden transition-all duration-200",
        open ? "ring-2 ring-[#2A5FA5]/20" : "hover:-translate-y-0.5"
      )}
      style={{
        border: partner.featured ? "1.5px solid rgba(251,191,36,0.3)" : CARD_BORDER,
        boxShadow: CARD_SHADOW,
      }}
    >
      {/* ── Hero color band ── */}
      <div
        className="h-16 relative"
        style={{
          background: partner.featured
            ? "linear-gradient(135deg, #1e3f6b 0%, #2A5FA5 60%, #4a7fc4 100%)"
            : "linear-gradient(135deg, #1e3f6b 0%, #2A5FA5 100%)",
        }}
      >
        {partner.featured && (
          <div className="absolute top-2.5 right-3">
            <span className="flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-200 uppercase tracking-wider">
              <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" /> Featured
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="px-5 pb-5">

        {/* Logo + name row */}
        <div className="flex items-end justify-between -mt-8 mb-3">
          {/* Logo */}
          <div className="relative shrink-0">
            {partner.logoUrl ? (
              <Image
                src={partner.logoUrl}
                alt={partner.name}
                width={56}
                height={56}
                className="rounded-2xl object-cover border-4 border-white shadow-md"
                style={{ height: 56, width: 56 }}
              />
            ) : (
              <div
                className="h-14 w-14 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-sm font-bold text-white select-none"
                style={{ backgroundColor: partner.color }}
              >
                {partner.initials}
              </div>
            )}
          </div>

          {/* View profile link */}
          <Link
            href={`/app/profile/${partner.userId}?asPartner=1&from=partners`}
            className="mb-1 text-[11px] font-semibold text-[#2A5FA5] hover:underline transition-colors"
          >
            View profile
          </Link>
        </div>

        {/* Name + verified */}
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <h3 className="text-[15px] font-black text-[#1B2B1F] leading-tight">{partner.name}</h3>
          {partner.verified && (
            <BadgeCheck className="h-4 w-4 text-[#2A5FA5] shrink-0" />
          )}
        </div>

        {/* Country */}
        {partner.country && (
          <p className="flex items-center gap-1 text-[12px] text-[#9BA39C] mb-3">
            <MapPin className="h-3 w-3 shrink-0" />
            {partner.country}
          </p>
        )}

        {/* Stats + specialty row */}
        {(partner.rating > 0 || partner.projects > 0) && (
          <div className="flex items-center gap-3 mb-3">
            {partner.rating > 0 && (
              <div
                className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
                style={{ background: "#FFFBEB", border: "1.5px solid rgba(251,191,36,0.25)" }}
              >
                <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                <span className="text-[13px] font-black text-[#1B2B1F]">{partner.rating.toFixed(1)}</span>
                <span className="text-[10px] text-[#9BA39C]">rating</span>
              </div>
            )}
            {partner.projects > 0 && (
              <div
                className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
                style={{ background: "#EAF3EE", border: "1.5px solid rgba(15,110,86,0.15)" }}
              >
                <span className="text-[13px] font-black text-[#0F6E56]">{partner.projects}</span>
                <span className="text-[10px] text-[#5C6B5E]">projects</span>
              </div>
            )}
          </div>
        )}

        {/* Specialty tags */}
        {(partner.specialty ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(partner.specialty ?? []).slice(0, 4).map((s) => (
              <span
                key={s}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                style={{ background: "#EBF1FA", color: "#2A5FA5" }}
              >
                {s}
              </span>
            ))}
            {(partner.specialty ?? []).length > 4 && (
              <span
                className="text-[11px] text-[#5C6B5E] px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(0,0,0,0.04)", border: CARD_BORDER }}
              >
                +{(partner.specialty ?? []).length - 4}
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-[rgba(0,0,0,0.05)] mb-4" />

        {/* Action */}
        {sent ? (
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#0F6E56]">
            <CheckCircle2 className="h-4 w-4" />
            Request sent
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold transition-all",
              open
                ? "bg-[rgba(0,0,0,0.05)] text-[#1B2B1F]"
                : "bg-[#2A5FA5] text-white hover:bg-[#244d8a]"
            )}
            style={!open ? { boxShadow: "0 2px 8px rgba(42,95,165,0.25)" } : {}}
          >
            <Handshake className="h-4 w-4" />
            {open ? "Hide" : "Connect with partner"}
          </button>
        )}
      </div>

      {/* ── Inline connect panel ── */}
      {open && !sent && (
        <div
          className="px-5 pb-5 pt-4 border-t"
          style={{ borderColor: "rgba(42,95,165,0.1)", background: "rgba(235,241,250,0.4)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#9BA39C] mb-3">
            Your migration request
          </p>

          {switches.length > 0 ? (
            <div className="space-y-2 mb-4">
              {switches.map((s) => {
                const from = TOOLS[s.fromTool];
                const to   = TOOLS[s.toTool];
                return (
                  <div
                    key={`${s.fromTool}-${s.toTool}`}
                    className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5"
                    style={{ border: CARD_BORDER, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                  >
                    <ToolIcon slug={s.fromTool} toolData={s.fromToolData} size="sm" />
                    <span className="text-[12px] font-semibold text-[#1B2B1F]">{s.fromToolData?.name ?? from?.name ?? s.fromTool}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#C8D0CA] shrink-0 mx-0.5" />
                    <ToolIcon slug={s.toTool} toolData={s.toToolData} size="sm" />
                    <span className="text-[12px] font-semibold text-[#0F6E56]">{s.toToolData?.name ?? to?.name ?? s.toTool}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-[#5C6B5E] mb-4 leading-relaxed">
              No stack migrations detected. Your request will go to {partner.name} for review.{" "}
              <Link href="/app/my-stack" className="text-[#0F6E56] hover:underline font-semibold">
                Add your stack
              </Link>{" "}
              to pre-fill this automatically.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConnect}
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A5FA5] py-2.5 text-[13px] font-bold text-white hover:bg-[#244d8a] transition-colors disabled:opacity-60"
              style={{ boxShadow: "0 2px 8px rgba(42,95,165,0.25)" }}
            >
              {isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Handshake className="h-4 w-4" />
              }
              {isPending ? "Sending…" : "Send request"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-10 px-3.5 rounded-xl text-[12px] font-semibold text-[#5C6B5E] hover:bg-white transition-colors"
              style={{ border: CARD_BORDER }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PartnerMatchList({
  switches,
  partners,
}: {
  switches: Switch[];
  partners: PartnerItem[];
}) {
  const featured = partners.filter((p) => p.featured);
  const rest     = partners.filter((p) => !p.featured);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6" style={{ fontFamily: F }}>

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A5FA5] mb-1">Certified EU Specialists</p>
          <h1 className="text-[22px] font-black text-[#1B2B1F] leading-tight">Migration Partners</h1>
          <p className="text-[13px] text-[#5C6B5E] mt-0.5">
            Pick a certified partner — your stack migrations are pre-filled automatically.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start">
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-white"
            style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
          >
            <span className="text-[18px] font-black text-[#1B2B1F] leading-none">{partners.length}</span>
            <span className="text-[12px] text-[#9BA39C]">verified partners</span>
          </div>
        </div>
      </div>

      {/* ── Stack migrations banner ── */}
      {switches.length > 0 && (
        <div
          className="bg-white rounded-2xl px-5 py-4"
          style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9BA39C] mb-3">
            Your migrations from stack
          </p>
          <div className="flex flex-wrap gap-2">
            {switches.map((s) => (
              <span
                key={`${s.fromTool}-${s.toTool}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px]"
                style={{ border: CARD_BORDER, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                <ToolIcon slug={s.fromTool} toolData={s.fromToolData} size="sm" />
                <span className="text-[#5C6B5E] font-medium">{s.fromToolData?.name ?? TOOLS[s.fromTool]?.name ?? s.fromTool}</span>
                <ArrowRight className="h-2.5 w-2.5 text-[#C8D0CA] shrink-0" />
                <ToolIcon slug={s.toTool} toolData={s.toToolData} size="sm" />
                <span className="font-semibold text-[#0F6E56]">{s.toToolData?.name ?? TOOLS[s.toTool]?.name ?? s.toTool}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── No stack nudge ── */}
      {switches.length === 0 && (
        <div
          className="bg-white rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{ border: "1.5px dashed rgba(0,0,0,0.1)", boxShadow: CARD_SHADOW }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-[#1B2B1F]">Pre-fill your migration request</p>
            <p className="text-[12px] text-[#5C6B5E] mt-0.5 leading-relaxed">
              Add your current US tools to My Stack and we&apos;ll automatically include them in your partner request.
            </p>
          </div>
          <Link
            href="/app/my-stack"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F6E56] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#0d5f4a] transition-colors shrink-0"
            style={{ boxShadow: "0 2px 8px rgba(15,110,86,0.25)" }}
          >
            Go to My Stack
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ── Featured partners ── */}
      {featured.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9BA39C]">
            Featured partners
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {featured.map((p) => (
              <PartnerCard key={p.id} partner={p} switches={switches} />
            ))}
          </div>
        </div>
      )}

      {/* ── All partners ── */}
      {rest.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9BA39C]">
            {featured.length > 0 ? "All partners" : "Verified partners"}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {rest.map((p) => (
              <PartnerCard key={p.id} partner={p} switches={switches} />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {partners.length === 0 && (
        <div
          className="bg-white rounded-2xl py-16 text-center"
          style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBF1FA] mx-auto mb-4">
            <Handshake className="h-6 w-6 text-[#2A5FA5]" />
          </div>
          <p className="text-[15px] font-bold text-[#1B2B1F]">No partners yet</p>
          <p className="mt-1.5 text-[13px] text-[#9BA39C] max-w-xs mx-auto leading-relaxed">
            Verified migration partners will appear here once approved.
          </p>
        </div>
      )}
    </div>
  );
}
