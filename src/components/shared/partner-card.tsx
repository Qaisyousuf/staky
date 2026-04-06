import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Clock, Briefcase, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Partner } from "@/data/mock-data";

interface PartnerCardProps {
  partner: Partner;
  compact?: boolean;
  homepage?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < full
                ? "text-amber-400"
                : i === full && half
                ? "text-amber-300"
                : "text-gray-200"
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-semibold text-gray-700">{rating.toFixed(1)}</span>
    </div>
  );
}

export function PartnerCard({ partner, compact = false, homepage = false }: PartnerCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden border bg-white transition-all duration-200 hover:-translate-y-0.5",
        homepage
          ? "rounded-[26px] border-[#e4ddcf] hover:border-[#d6cebf] hover:shadow-[0_18px_36px_rgba(17,24,39,0.08)]"
          : "rounded-2xl hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
      )}
      style={homepage ? { fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" } : undefined}
    >
      <div className={cn("flex flex-1 flex-col", homepage ? "p-4" : "p-5")}>
        <div className={cn("flex items-start gap-3", homepage ? "mb-3.5" : "mb-4")}>
          {partner.logoUrl ? (
            <span
              className={cn(
                "inline-flex shrink-0 items-center justify-center border border-gray-200 bg-white",
                homepage ? "h-11 w-11 rounded-[18px] border-[#e4ddcf] bg-[#fbfaf6]" : "h-12 w-12 rounded-2xl"
              )}
            >
              <Image
                src={partner.logoUrl}
                alt={`${partner.name} logo`}
                width={30}
                height={30}
                className="h-auto w-auto max-h-[70%] max-w-[70%] object-contain"
              />
            </span>
          ) : (
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white select-none"
              style={{ backgroundColor: partner.color }}
            >
              {partner.initials}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className={cn("font-semibold leading-tight", homepage ? "text-[15px] text-[#1e2520]" : "text-sm text-gray-900")}>
                {partner.name}
              </h3>
              {partner.verified && (
                <BadgeCheck className="h-4 w-4 text-[#2A5FA5] shrink-0" />
              )}
              {partner.featured && (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Featured
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-[#8c9388]">
              {partner.country}
            </p>
          </div>
        </div>

        {homepage ? (
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-[#e7e0d4] bg-[#faf8f2] px-3 py-1.5">
              <Briefcase className="h-3 w-3 text-[#8c9388]" />
              <span className="text-[11px] font-medium text-[#5f685f]">{partner.projects} projects</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[#dce4de] bg-[#f4f7f2] px-3 py-1.5">
              <BadgeCheck className="h-3 w-3 text-[#2A5FA5]" />
              <span className="text-[11px] font-medium text-[#2A5FA5]">Verified</span>
            </div>
          </div>
        ) : (
          <div className="mb-4 rounded-2xl border border-gray-100 p-3.5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StarRating rating={partner.rating} />
                <span className="text-[11px] text-gray-400">{partner.reviewCount} reviews</span>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Partner
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-[11px] font-medium text-gray-500">Projects</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900">{partner.projects}</p>
                </div>
              </div>
              <div className="rounded-xl bg-white px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-800">{partner.responseTime}</p>
                    <p className="text-[10px] text-gray-400">Response time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-1.5">
          {(partner.specialty ?? []).slice(0, compact ? 3 : 4).map((spec) => (
            <span
              key={spec}
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium",
                homepage
                  ? "border border-[#e7e0d4] bg-[#faf8f2] text-[#5f685f]"
                  : "border border-blue-100 bg-blue-50 text-[#2A5FA5]"
              )}
            >
              {spec}
            </span>
          ))}
          {(partner.specialty ?? []).length > (compact ? 3 : 4) && (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-medium text-gray-500">
              +{(partner.specialty ?? []).length - (compact ? 3 : 4)} more
            </span>
          )}
        </div>

        {!compact && !homepage && (
          <p className="mb-5 flex-1 text-xs leading-relaxed text-gray-500">
            {partner.description}
          </p>
        )}

        <div className={cn("mt-auto flex items-center justify-between border-t", homepage ? "border-[#ece6da] pt-3.5" : "border-gray-100 pt-3.5")}>
          {!homepage ? (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Pricing</p>
              <span className="text-xs font-medium text-gray-700">{partner.pricing}</span>
            </div>
          ) : (
            <div className="h-0" />
          )}
          <Link
            href="/login"
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors",
              homepage
                ? "rounded-full bg-[#0f3d2e] px-3.5 py-2 text-white hover:bg-[#14513d]"
                : "rounded-xl bg-[#2A5FA5] px-3.5 py-2 text-white hover:bg-[#244d8a]"
            )}
          >
            Request help
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
