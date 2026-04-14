import Link from "next/link";
import {
  ArrowDown, ArrowRight,
  Star, Heart, MessageCircle, BadgeCheck, Handshake, Globe, MapPin,
} from "lucide-react";
import { FadeIn } from "@/components/public/fade-in";
import { HowItWorks } from "@/components/public/how-it-works";
import { getPublishedTools, getPublishedAlternatives } from "@/actions/tools";
import { prisma } from "@/lib/prisma";
import type { DbTool } from "@/components/shared/tool-icon";

const F = "var(--font-jakarta, 'Plus Jakarta Sans'), -apple-system, BlinkMacSystemFont, sans-serif";

// ─── Shared types ──────────────────────────────────────────────────────────────

type PublishedTool = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  origin: string;
  country: string | null;
  color: string;
  abbr: string;
};

type PublishedAlternative = {
  id: string;
  category: string;
  switcherCount: number;
  fromTool: PublishedTool;
  toTool: PublishedTool;
};

type CommunityPost = {
  id: string;
  fromTool: string;
  toTool: string;
  story: string;
  createdAt: Date;
  postedAsPartner: boolean;
  author: {
    name: string | null;
    image: string | null;
    title: string | null;
    company: string | null;
    partner: { companyName: string; logoUrl: string | null } | null;
  };
  _count: { likes: number; comments: number };
  fromToolData: { name: string; logoUrl: string | null; color: string; abbr: string; country: string | null } | null;
  toToolData: { name: string; logoUrl: string | null; color: string; abbr: string; country: string | null } | null;
};

type CommunityUser = {
  id: string;
  name: string | null;
  image: string | null;
  title: string | null;
  company: string | null;
  bio: string | null;
  location: string | null;
  socialLinks: { website?: string } | null;
  createdAt: Date;
};

type CommunityPartner = {
  id: string;
  companyName: string;
  country: string;
  specialty: string[];
  logoUrl: string | null;
  rating: number;
  projectCount: number;
};

type FullPartner = {
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
  user: { name: string | null; image: string | null; title: string | null };
};

// ─── Inline logo rendering ─────────────────────────────────────────────────────

function InlineLogo({ tool, className }: { tool: DbTool; className?: string }) {
  if (tool.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={tool.logoUrl} alt={tool.name} className={className ?? "h-6 w-6 shrink-0 object-contain"} />;
  }
  return (
    <span
      className="h-6 w-6 shrink-0 rounded flex items-center justify-center text-white font-bold"
      style={{ backgroundColor: tool.color, fontSize: 9 }}
    >
      {tool.abbr}
    </span>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

function Hero({ usTools, euTools }: { usTools: PublishedTool[]; euTools: PublishedTool[] }) {
  const usDoubled = [...usTools, ...usTools];
  const euDoubled = [...euTools, ...euTools];

  return (
    <section className="overflow-hidden border-b border-[#DDD9D0] bg-[#FAF8F5]" style={{ fontFamily: F }}>
      <style>{`
        @keyframes marquee-fwd {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-rev {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        .marquee-row:hover .marquee-track { animation-play-state: paused; }
        @keyframes heroFade {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .h1 { animation: heroFade 0.65s ease-out 0.05s both; }
        .h2 { animation: heroFade 0.65s ease-out 0.15s both; }
        .h3 { animation: heroFade 0.65s ease-out 0.25s both; }
        .h4 { animation: heroFade 0.65s ease-out 0.35s both; }
        .h5 { animation: heroFade 0.65s ease-out 0.50s both; }
        @media (max-width: 640px) {
          .marquee-track { animation-duration: 30s !important; }
        }
      `}</style>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 pt-[50px] sm:pt-[100px] pb-4 text-center sm:px-6">
        <h1
          className="h1 mx-auto mt-0 max-w-[680px] font-bold text-[#1B2B1F]"
          style={{ fontSize: "clamp(42px, 6.5vw, 64px)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
        >
          Switch your stack to European software
        </h1>

        <p className="h3 mx-auto mt-5 max-w-[500px] text-lg leading-[1.7] text-[#5C6B5E]">
          Discover EU alternatives, share migration stories with the community,
          and connect with certified migration partners.
        </p>

        <div className="h4 mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-[10px] bg-[#0F6E56] px-8 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-[#0D6050]"
            style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(15,110,86,0.35), 0 8px 24px rgba(15,110,86,0.2)" }}
          >
            Get started free
          </Link>
          <Link
            href="/discover"
            className="inline-flex items-center rounded-[10px] bg-transparent px-8 py-3.5 text-[15px] font-semibold text-[#1B2B1F] transition-all duration-200 hover:-translate-y-px hover:bg-[#EFF0EB]"
            style={{ border: "1.5px solid rgba(0,0,0,0.04)", boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)" }}
          >
            Explore alternatives
          </Link>
        </div>

      </div>

      {/* Marquee — only rendered when tools exist */}
      {(usDoubled.length > 0 || euDoubled.length > 0) && (
        <div className="h5 mx-auto mt-2 sm:mt-14 max-w-5xl pb-[80px]">
          {usDoubled.length > 0 && (
            <div className="marquee-row relative overflow-x-hidden py-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[120px] bg-gradient-to-r from-[#FAF8F5] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[120px] bg-gradient-to-l from-[#FAF8F5] to-transparent" />
              <div className="marquee-track flex w-max gap-3" style={{ animation: "marquee-fwd 28s linear infinite" }}>
                {usDoubled.map((tool, i) => (
                  <div key={i} className="flex shrink-0 select-none items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                    style={{ border: "1.5px solid rgba(0,0,0,0.04)", boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)" }}>
                    <InlineLogo tool={tool} className="h-7 w-7 shrink-0 object-contain" />
                    <span className="whitespace-nowrap text-[13px] font-medium text-[#3D4D41]">{tool.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {euDoubled.length > 0 && (
            <div className="marquee-row relative overflow-x-hidden py-3 mt-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[120px] bg-gradient-to-r from-[#FAF8F5] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[120px] bg-gradient-to-l from-[#FAF8F5] to-transparent" />
              <div className="marquee-track flex w-max gap-3" style={{ animation: "marquee-rev 28s linear infinite" }}>
                {euDoubled.map((tool, i) => (
                  <div key={i} className="flex shrink-0 select-none items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                    style={{ border: "1.5px solid rgba(0,0,0,0.04)", boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)" }}>
                    <InlineLogo tool={tool} className="h-7 w-7 shrink-0 object-contain" />
                    <span className="whitespace-nowrap text-[13px] font-medium text-[#3D4D41]">{tool.name}</span>
                    {tool.country && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://flagcdn.com/16x12/${tool.country}.png`} width={14} height={10} alt={tool.country} className="rounded-[2px] opacity-70" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <div className="mb-8">
      <div className={`mb-2 h-0.5 w-6 rounded-full ${light ? "bg-white/30" : "bg-[#0F6E56]"}`} />
      <p className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${light ? "text-white/50" : "text-[#9BA39C]"}`}>
        {text}
      </p>
    </div>
  );
}

// ─── Popular Switches ──────────────────────────────────────────────────────────

function SwitchCard({ alt }: { alt: PublishedAlternative }) {
  const { fromTool, toTool } = alt;
  return (
    <Link
      href={`/discover?category=${encodeURIComponent(alt.category)}`}
      className="group flex min-w-[260px] flex-col rounded-[24px] bg-white p-6 transition-all duration-200"
      style={{
        fontFamily: F,
        border: "1.5px solid rgba(0,0,0,0.04)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <InlineLogo tool={fromTool} className="h-10 w-10 object-contain" />
          <p className="text-[15px] font-bold text-[#1B2B1F]">{fromTool.name}</p>
        </div>

        <div className="my-4 flex justify-center">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3EE] transition-all duration-200 group-hover:bg-[#0F6E56]"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 10px rgba(15,110,86,0.08)" }}
          >
            <ArrowDown className="h-4 w-4 text-[#0F6E56] transition-colors duration-200 group-hover:text-white" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 text-center">
          <InlineLogo tool={toTool} className="h-10 w-10 object-contain" />
          <div className="flex items-center gap-1.5">
            <p className="text-[15px] font-bold text-[#0F6E56]">{toTool.name}</p>
            {toTool.country && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://flagcdn.com/16x12/${toTool.country}.png`} width={14} height={10} alt={toTool.country} className="rounded-[2px] opacity-80" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-[#EFF0EB] pt-4 text-center">
        <p className="text-[13px] text-[#9BA39C]">
          <span className="font-semibold text-[#1B2B1F]">{alt.switcherCount.toLocaleString()}</span> companies switched
        </p>
      </div>
    </Link>
  );
}

function PopularSwitches({ alternatives }: { alternatives: PublishedAlternative[] }) {
  if (alternatives.length === 0) return null;
  return (
    <section className="bg-white py-20" style={{ fontFamily: F }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionLabel text="POPULAR SWITCHES" />
              <h2 className="text-[32px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.03em" }}>
                The most switched tools in Europe
              </h2>
              <p className="mt-2 text-base text-[#5C6B5E]">
                See what companies are replacing — and where they&apos;re going.
              </p>
            </div>
            <Link href="/discover" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#5C6B5E] transition-colors hover:text-[#1B2B1F]">
              View all alternatives <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </FadeIn>

        {/* Mobile */}
        <div className="mt-8 -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden">
          {alternatives.slice(0, 8).map((alt) => (
            <div key={alt.id} className="w-[260px] shrink-0">
              <SwitchCard alt={alt} />
            </div>
          ))}
        </div>

        {/* Desktop */}
        <div className="mt-8 hidden sm:flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {alternatives.slice(0, 10).map((alt) => (
            <div key={alt.id} className="w-[260px] shrink-0">
              <SwitchCard alt={alt} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Community helpers ─────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#0F6E56", "#2A5FA5", "#7C5CBF", "#B85C38", "#1F6B85", "#8A5C1F"];
function avatarColor(name: string | null | undefined) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

function Avatar({ name, image, className }: { name?: string | null; image?: string | null; className: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name ?? ""} className={`${className} object-cover`} />;
  }
  return (
    <span
      className={`${className} flex items-center justify-center text-white font-bold select-none`}
      style={{ backgroundColor: avatarColor(name) }}
    >
      {getInitials(name)}
    </span>
  );
}


// ─── Row 1 — New member profile card ─────────────────────────────────────────

function MemberProfileCard({ user }: { user: CommunityUser }) {
  const website = (user.socialLinks as { website?: string } | null)?.website;
  const color = avatarColor(user.name);

  return (
    <div
      className="group relative flex flex-col rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(27,43,31,0.10)]"
      style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)" }}
    >
      {/* Top colour band */}
      <div
        className="h-20 w-full shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}33, ${color}18)` }}
      />

      {/* Avatar — overlapping the band */}
      <div className="px-5 -mt-10 mb-3 flex items-end justify-between">
        <Avatar
          name={user.name}
          image={user.image}
          className="h-20 w-20 rounded-2xl ring-4 ring-white text-[18px] shrink-0"
        />
        <span className="mb-1 text-[10px] text-[#B0B8B3]">{timeAgo(user.createdAt)}</span>
      </div>

      {/* Info */}
      <div className="px-5 pb-5 flex-1 flex flex-col">
        <p className="text-[14px] font-bold text-[#1B2B1F] leading-tight truncate">{user.name ?? "New member"}</p>
        {(user.title || user.company) && (
          <p className="text-[12px] text-[#9BA39C] truncate mt-0.5">
            {[user.title, user.company].filter(Boolean).join(" · ")}
          </p>
        )}

        {user.location && (
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#6B7B6E]">
            <span
              className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}18` }}
            >
              <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
                <path d="M4 0C2.07 0 .5 1.567.5 3.5 .5 6.125 4 10 4 10s3.5-3.875 3.5-6.5C7.5 1.567 5.93 0 4 0zm0 4.75a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" fill={color}/>
              </svg>
            </span>
            <span className="truncate">{user.location}</span>
          </p>
        )}

        {website ? (
          <a
            href={website.startsWith("http") ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#0F6E56] hover:underline"
          >
            <Globe className="h-3 w-3 shrink-0" />
            Visit my website
          </a>
        ) : user.bio ? (
          <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-[#8A9490]">{user.bio}</p>
        ) : null}

        <div className="mt-auto pt-4">
          <Link
            href="/signup"
            className="block w-full rounded-xl py-2 text-center text-[12px] font-semibold text-[#0F6E56] transition-colors hover:bg-[#EAF3EE]"
            style={{ border: "1.5px solid rgba(15,110,86,0.2)" }}
          >
            Join the community →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Row 2 left — Story post card ─────────────────────────────────────────────

function ToolLogoBox({ tool }: { tool: { name: string; logoUrl: string | null; color: string; abbr: string } | null }) {
  if (!tool) return <div className="h-8 w-8 rounded-lg bg-[#E8E3D9] shrink-0" />;
  if (tool.logoUrl) {
    return (
      <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tool.logoUrl} alt={tool.name} className="h-5 w-5 object-contain" />
      </div>
    );
  }
  return (
    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ backgroundColor: tool.color }}>
      {tool.abbr}
    </div>
  );
}

function StoryCard({ post }: { post: CommunityPost }) {
  const fromTool = post.fromToolData;
  const toTool = post.toToolData;
  const isPartner = post.postedAsPartner && !!post.author.partner;
  const displayName = isPartner
    ? (post.author.partner!.companyName ?? post.author.name ?? "Partner")
    : (post.author.name ?? "Member");
  const displayImage = isPartner
    ? post.author.partner!.logoUrl
    : post.author.image;
  const authorInitials = displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Link
      href="/feed"
      className="group flex flex-col rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(27,43,31,0.09)]"
      style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)" }}
    >
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt={displayName}
            className={`h-8 w-8 object-cover shrink-0 ${isPartner ? "rounded-lg" : "rounded-full"}`}
          />
        ) : (
          <div className={`h-8 w-8 flex items-center justify-center text-white text-[10px] font-bold shrink-0 select-none ${isPartner ? "rounded-lg bg-[#2A5FA5]" : "rounded-full bg-[#0F6E56]"}`}>
            {authorInitials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-semibold text-[#1B2B1F] truncate leading-tight">{displayName}</p>
            {isPartner && (
              <span className="shrink-0 rounded-md bg-[#EBF0F9] px-1.5 py-0.5 text-[9px] font-semibold text-[#2A5FA5] uppercase tracking-wide">Partner</span>
            )}
          </div>
          <p className="text-[10px] text-[#9BA39C]">{timeAgo(post.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-[11px] text-[#9BA39C]">
            <Heart className="h-3 w-3" />{post._count.likes}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[#9BA39C]">
            <MessageCircle className="h-3 w-3" />{post._count.comments}
          </span>
        </div>
      </div>

      {/* Migration path */}
      {(fromTool || toTool) && (
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#F4FAF7", borderBottom: "1px solid rgba(15,110,86,0.08)" }}>
          <ToolLogoBox tool={fromTool} />
          <span className="text-[11px] font-medium text-[#4D5D52] truncate flex-1">{fromTool?.name ?? "—"}</span>
          <ArrowRight className="h-3 w-3 text-[#0F6E56] shrink-0 mx-0.5" />
          <span className="text-[11px] font-medium text-[#0F6E56] truncate flex-1 text-right">{toTool?.name ?? "—"}</span>
          <ToolLogoBox tool={toTool} />
        </div>
      )}

      {/* Story */}
      <div className="px-4 py-4 flex-1">
        <p className="line-clamp-3 text-[13px] leading-[1.75] text-[#5C6B5E]">
          &ldquo;{post.story}&rdquo;
        </p>
      </div>
    </Link>
  );
}

// ─── Row 2 right — Verified partner card ──────────────────────────────────────

function VerifiedPartnerCard({ partner }: { partner: CommunityPartner }) {
  const initials = partner.companyName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Link
      href="/partners"
      className="group flex items-start gap-4 rounded-2xl bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(42,95,165,0.10)]"
      style={{ border: "1.5px solid rgba(42,95,165,0.10)", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)" }}
    >
      {/* Logo */}
      <div className="shrink-0">
        {partner.logoUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={partner.logoUrl} alt={partner.companyName} className="h-12 w-12 rounded-xl object-cover" />
          : (
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#2A5FA5] to-[#1a3f7a] flex items-center justify-center text-white text-[12px] font-black select-none">
              {initials}
            </div>
          )
        }
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[13px] font-bold text-[#1B2B1F] truncate">{partner.companyName}</p>
          <BadgeCheck className="h-3.5 w-3.5 text-[#2A5FA5] shrink-0" />
        </div>
        <p className="text-[11px] text-[#9BA39C] mb-2">{partner.country}</p>

        {/* Rating */}
        {partner.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < Math.round(partner.rating) ? "fill-[#C8956C] text-[#C8956C]" : "text-[#E8E3D9]"}`} />
            ))}
            <span className="text-[11px] font-semibold text-[#1B2B1F] ml-0.5">{partner.rating.toFixed(1)}</span>
            {partner.projectCount > 0 && (
              <span className="text-[11px] text-[#9BA39C]">· {partner.projectCount} projects</span>
            )}
          </div>
        )}

        {/* Specialty tags */}
        {partner.specialty.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {partner.specialty.slice(0, 3).map((s) => (
              <span key={s} className="rounded-full bg-[#EBF0F9] px-2 py-0.5 text-[10px] font-medium text-[#2A5FA5]">{s}</span>
            ))}
          </div>
        )}
      </div>

      <ArrowRight className="h-3.5 w-3.5 text-[#C5CCC7] shrink-0 mt-1 group-hover:text-[#2A5FA5] transition-colors" />
    </Link>
  );
}

// ─── Community section ─────────────────────────────────────────────────────────

function CommunitySection({
  posts,
  recentUsers,
  approvedPartners,
  totalUsers,
  totalPartners,
}: {
  posts: CommunityPost[];
  recentUsers: CommunityUser[];
  approvedPartners: CommunityPartner[];
  totalUsers: number;
  totalPartners: number;
}) {
  return (
    <section className="bg-[#FAF8F5] py-24" style={{ fontFamily: F }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div>
              <SectionLabel text="COMMUNITY" />
              <h2 className="text-[32px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.03em" }}>
                Real stories from real migrations
              </h2>
              <p className="mt-2 text-base text-[#5C6B5E]">
                Join {totalUsers > 0 ? `${totalUsers.toLocaleString()}+` : "thousands of"} European professionals already switching their stack
              </p>
            </div>
            <Link href="/feed" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#5C6B5E] transition-colors hover:text-[#1B2B1F]">
              Browse all posts <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </FadeIn>

        {/* ── Row 1 — New member profiles ───────────────────────────────── */}
        <FadeIn delay={60}>
          <div className="mb-3 mt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9BA39C]">Recently joined</p>
          </div>
        </FadeIn>

        {recentUsers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentUsers.map((user, i) => (
              <FadeIn key={user.id} delay={60 + i * 70}>
                <MemberProfileCard user={user} />
              </FadeIn>
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ border: "1.5px dashed rgba(0,0,0,0.08)" }}
          >
            <p className="text-[#9BA39C] text-sm mb-3">Be the first to join the community</p>
            <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F6E56] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0D6050] transition-colors">
              Get started free
            </Link>
          </div>
        )}

        {/* ── Row 2 — Stories + Verified Partners ───────────────────────── */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">

          {/* Stories */}
          <div>
            <FadeIn>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9BA39C]">Latest stories</p>
                <Link href="/feed" className="text-[12px] font-semibold text-[#0F6E56] hover:underline">View all</Link>
              </div>
            </FadeIn>
            {posts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {posts.map((post, i) => (
                  <FadeIn key={post.id} delay={i * 80}>
                    <StoryCard post={post} />
                  </FadeIn>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl py-10 text-center" style={{ border: "1.5px dashed rgba(0,0,0,0.08)" }}>
                <p className="text-sm text-[#9BA39C]">No stories yet — be the first to share</p>
              </div>
            )}
          </div>

          {/* Verified Partners panel */}
          <FadeIn delay={120}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9BA39C]">Verified partners</p>
                <Link href="/partners" className="text-[12px] font-semibold text-[#2A5FA5] hover:underline">
                  {totalPartners > 0 ? `See all ${totalPartners}` : "View all"} →
                </Link>
              </div>

              {approvedPartners.length > 0 ? (
                <div className="space-y-3">
                  {approvedPartners.slice(0, 3).map((partner) => (
                    <VerifiedPartnerCard key={partner.id} partner={partner} />
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-2xl px-5 py-8 text-center"
                  style={{ border: "1.5px dashed rgba(42,95,165,0.12)", background: "#F7F9FC" }}
                >
                  <Handshake className="h-8 w-8 text-[#C5D3E8] mx-auto mb-3" />
                  <p className="text-[13px] font-semibold text-[#1B2B1F] mb-1">Become a partner</p>
                  <p className="text-[12px] text-[#9BA39C] mb-4">Help businesses migrate to EU software</p>
                  <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-xl bg-[#2A5FA5] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#244d8a] transition-colors">
                    Apply now
                  </Link>
                </div>
              )}

            </div>
          </FadeIn>
        </div>

        {/* Bottom CTA */}
        <FadeIn className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-[10px] bg-[#0F6E56] px-8 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-[#0D6050]"
            style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(15,110,86,0.3), 0 8px 24px rgba(15,110,86,0.18)" }}
          >
            Join the community — it&apos;s free
          </Link>
          <Link href="/feed" className="text-[15px] font-medium text-[#5C6B5E] transition-colors hover:text-[#1B2B1F]">
            Browse all posts →
          </Link>
        </FadeIn>

      </div>
    </section>
  );
}

// ─── Partners ──────────────────────────────────────────────────────────────────

function PartnerCard({ partner }: { partner: FullPartner }) {
  const initials = partner.companyName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const website = partner.website?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  return (
    <div
      className="group flex flex-col rounded-2xl bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(42,95,165,0.12)]"
      style={{ border: "1.5px solid rgba(42,95,165,0.10)", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)" }}
    >
      {/* Header row */}
      <div className="flex items-start gap-4 p-5 pb-4">
        {/* Logo */}
        <div
          className="h-[52px] w-[52px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ border: "1.5px solid rgba(42,95,165,0.12)", boxShadow: "0 2px 8px rgba(42,95,165,0.10)" }}
        >
          {partner.logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={partner.logoUrl} alt={partner.companyName} className="h-full w-full object-contain p-1.5" />
            : <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#2A5FA5] to-[#1a3f7a] text-white text-[13px] font-black select-none">{initials}</div>
          }
        </div>

        {/* Name block */}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[15px] font-bold text-[#1B2B1F] leading-tight">{partner.companyName}</p>
            <BadgeCheck className="h-4 w-4 text-[#2A5FA5] shrink-0" />
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap text-[12px] text-[#9BA39C]">
            {partner.country && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {partner.country}
              </span>
            )}
            {partner.projectCount > 0 && (
              <>
                <span className="h-1 w-1 rounded-full bg-[#DDD9D0]" />
                <span>{partner.projectCount} migrations completed</span>
              </>
            )}
          </div>
        </div>

        {/* Rating badge */}
        {partner.rating > 0 && (
          <div className="shrink-0 flex flex-col items-center gap-0.5 rounded-xl px-3 py-2" style={{ background: "#F7F9FC", border: "1px solid rgba(42,95,165,0.10)" }}>
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
        {/* Description */}
        {partner.description && (
          <p className="text-[13px] leading-relaxed text-[#5C6B5E] line-clamp-2">{partner.description}</p>
        )}

        {/* Expertise */}
        {partner.specialty.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#B0B8B3] mb-1.5">Expertise</p>
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

        {/* Services */}
        {partner.services.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#B0B8B3] mb-1.5">Services</p>
            <div className="flex flex-wrap gap-1.5">
              {partner.services.slice(0, 3).map((s) => (
                <span key={s} className="rounded-md bg-[#F0F7F4] px-2.5 py-1 text-[11px] font-medium text-[#0F6E56]">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-1 flex items-center gap-3">
          {website && (
            <a
              href={partner.website!.startsWith("http") ? partner.website! : `https://${partner.website!}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1 text-[11px] text-[#9BA39C] hover:text-[#2A5FA5] transition-colors"
            >
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">{website}</span>
            </a>
          )}
          <Link
            href="/partners"
            className="ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#2A5FA5] px-4 py-2 text-[12px] font-semibold text-white transition-all hover:bg-[#244d8a] hover:-translate-y-px"
          >
            Get in touch <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PartnersSection({ partners, total }: { partners: FullPartner[]; total: number }) {
  return (
    <section className="py-24" style={{ fontFamily: F, background: "#F7F9FC" }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionLabel text="TRUSTED PARTNERS" />
              <h2 className="text-[32px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.03em" }}>
                Certified EU migration experts
              </h2>
              <p className="mt-2 text-base text-[#5C6B5E]">
                Vetted specialists for end-to-end migrations — strategy, execution, and ongoing support
              </p>
            </div>
            <Link href="/partners" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#5C6B5E] transition-colors hover:text-[#1B2B1F]">
              View all {total > 0 ? total : ""} partners <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </FadeIn>

        {/* Cards */}
        {partners.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner, i) => (
              <FadeIn key={partner.id} delay={i * 80}>
                <PartnerCard partner={partner} />
              </FadeIn>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl py-16 text-center" style={{ border: "1.5px dashed rgba(42,95,165,0.15)" }}>
            <Handshake className="mx-auto h-10 w-10 text-[#C5D3E8] mb-4" />
            <p className="text-[15px] font-semibold text-[#1B2B1F] mb-1">No partners yet</p>
            <p className="text-[13px] text-[#9BA39C] mb-5">Be the first verified migration expert on Staky</p>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-[#2A5FA5] px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-[#244d8a] transition-colors">
              Apply as a partner
            </Link>
          </div>
        )}

        {/* Become a partner CTA */}
        <FadeIn className="mt-8">
          <div
            className="flex flex-col gap-4 rounded-2xl px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
            style={{ background: "linear-gradient(135deg,#1B2B1F 0%,#243D2B 100%)", boxShadow: "0 4px 20px rgba(27,43,31,0.20)" }}
          >
            <div>
              <p className="text-[15px] font-bold text-white">Are you a migration expert?</p>
              <p className="mt-0.5 text-[13px] text-white/60">Connect with businesses actively looking for EU migration specialists</p>
            </div>
            <Link
              href="/signup"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-semibold text-[#1B2B1F] transition-all hover:-translate-y-px hover:bg-[#EFF0EB]"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
            >
              Join as a verified partner <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}

// ─── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="bg-[#1B2B1F] py-20" style={{ fontFamily: F }}>
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <FadeIn>
          <h2 className="text-[36px] font-bold text-white" style={{ letterSpacing: "-0.03em" }}>
            Ready to switch your stack?
          </h2>
          <p className="mx-auto mt-4 max-w-[440px] text-base leading-[1.7] text-white/65">
            Join 1,200+ European professionals building independent software stacks, free from US Big Tech.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-[10px] bg-white px-8 py-4 text-[15px] font-semibold text-[#1B2B1F] transition-all duration-200 hover:-translate-y-px hover:bg-[#EFF0EB]"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15), 0 8px 24px rgba(0,0,0,0.1)" }}
            >
              Get started free
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const [allTools, alternatives] = await Promise.all([
    getPublishedTools(),
    getPublishedAlternatives(),
  ]);

  const usTools = allTools.filter((t) => t.origin === "us");
  const euTools = allTools.filter((t) => t.origin === "eu");

  // ── Community + partners data ───────────────────────────────────────────────
  const [rawPosts, recentUsers, approvedPartners, totalUsers, totalPartners, rawTrustedPartners] = await Promise.all([
    prisma.alternativePost.findMany({
      where: { published: true, visibility: "public" },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        fromTool: true,
        toTool: true,
        story: true,
        createdAt: true,
        postedAsPartner: true,
        author: {
          select: {
            name: true,
            image: true,
            title: true,
            company: true,
            partner: { select: { companyName: true, logoUrl: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, name: true, image: true, title: true, company: true, bio: true, location: true, socialLinks: true, createdAt: true },
    }),
    prisma.partner.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, companyName: true, country: true, specialty: true, logoUrl: true, rating: true, projectCount: true },
    }),
    prisma.user.count(),
    prisma.partner.count({ where: { approved: true } }),
    prisma.partner.findMany({
      where: { approved: true },
      orderBy: [{ projectCount: "desc" }, { rating: "desc" }],
      take: 6,
      select: {
        id: true,
        companyName: true,
        country: true,
        specialty: true,
        services: true,
        logoUrl: true,
        rating: true,
        projectCount: true,
        description: true,
        website: true,
        user: { select: { name: true, image: true, title: true } },
      },
    }),
  ]);

  // Resolve tool slugs for posts
  const postSlugs = Array.from(new Set(rawPosts.flatMap((p) => [p.fromTool, p.toTool].filter(Boolean))));
  const postDbTools = await prisma.softwareTool.findMany({
    where: { slug: { in: postSlugs } },
    select: { slug: true, name: true, logoUrl: true, color: true, abbr: true, country: true },
  });
  const toolBySlug = new Map(postDbTools.map((t) => [t.slug, t]));

  const communityPosts: CommunityPost[] = rawPosts.map((p) => ({
    ...p,
    fromToolData: toolBySlug.get(p.fromTool) ?? null,
    toToolData: toolBySlug.get(p.toTool) ?? null,
  }));

  const communityUsers: CommunityUser[] = recentUsers.map((u) => ({
    ...u,
    socialLinks: u.socialLinks as { website?: string } | null,
  }));

  const trustedPartners: FullPartner[] = rawTrustedPartners.map((p) => ({
    ...p,
    services: (p.services as string[]) ?? [],
  }));

  return (
    <>
      <Hero usTools={usTools} euTools={euTools} />
      <PopularSwitches alternatives={alternatives} />
      <HowItWorks />
      <CommunitySection
        posts={communityPosts}
        recentUsers={communityUsers}
        approvedPartners={approvedPartners}
        totalUsers={totalUsers}
        totalPartners={totalPartners}
      />
      <PartnersSection partners={trustedPartners} total={totalPartners} />
      <FinalCTA />
    </>
  );
}
