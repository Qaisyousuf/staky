"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BadgeCheck, CheckCircle2, Clock,
  Handshake, Loader2, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/data/mock-data";
import { createMigrationRequest } from "@/actions/requests";
import { ToolIcon } from "@/components/shared/tool-icon";

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

interface Switch {
  fromTool: string;
  toTool: string;
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
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-all",
      partner.featured ? "border-amber-200 shadow-sm" : "border-gray-200",
      open && "ring-2 ring-[#2A5FA5]/20"
    )}>
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
              {partner.responseTime && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {partner.responseTime}
                </span>
              )}
              {partner.pricing && (
                <span className="text-xs text-gray-400">{partner.pricing}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(partner.specialty ?? []).slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="text-[10px] font-medium text-[#2A5FA5] bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1"
                >
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

      {/* Inline connect form */}
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
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              No stack migrations detected. Your request will be sent to {partner.name} for review.{" "}
              <Link href="/app/my-stack" className="text-[#0F6E56] hover:underline font-medium">
                Add your stack
              </Link>{" "}
              to pre-fill this automatically.
            </p>
          )}

          <button
            type="button"
            onClick={handleConnect}
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A5FA5] py-2.5 text-sm font-semibold text-white hover:bg-[#244d8a] transition-colors shadow-sm disabled:opacity-70"
          >
            {isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Handshake className="h-4 w-4" />
            }
            {isPending ? "Sending…" : `Connect with ${partner.name}`}
          </button>
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
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#2A5FA5] mb-1">Certified EU Specialists</p>
        <h1 className="text-2xl font-bold text-gray-900">Migration Partners</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pick a certified partner and connect directly — your stack migrations are pre-filled.
        </p>
      </div>

      {/* Switches banner */}
      {switches.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Your migrations from stack
          </p>
          <div className="flex flex-wrap gap-2">
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
        </div>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Featured partners
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {featured.map((p) => (
              <PartnerCard key={p.id} partner={p} switches={switches} />
            ))}
          </div>
        </div>
      )}

      {/* All partners */}
      {rest.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {featured.length > 0 ? "All partners" : "Verified partners"}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {rest.map((p) => (
              <PartnerCard key={p.id} partner={p} switches={switches} />
            ))}
          </div>
        </div>
      )}

      {/* No stack nudge */}
      {switches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center">
          <p className="text-sm font-semibold text-gray-600">No stack migrations detected</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Add your US tools to My Stack and we'll pre-fill your request automatically.
          </p>
          <Link
            href="/app/my-stack"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F6E56] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0d5f4a] transition-colors"
          >
            Go to My Stack
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
