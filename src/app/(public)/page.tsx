import Link from "next/link";
import {
  ArrowDown, ArrowRight, Compass, Layers, Users,
  Star, Heart, MessageCircle,
} from "lucide-react";
import { MOCK_PARTNERS, MOCK_POSTS } from "@/data/mock-data";
import { FadeIn } from "@/components/public/fade-in";
import { getPublishedTools, getPublishedAlternatives } from "@/actions/tools";
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
      <div className="mx-auto max-w-3xl px-4 pt-[56px] sm:pt-[100px] pb-4 text-center sm:px-6">
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
        <div className="h5 mx-auto mt-6 sm:mt-14 max-w-5xl pb-[80px]">
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
      className="group flex min-w-[260px] flex-col rounded-2xl border border-[#DDD9D0] bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#C5D9CE] hover:shadow-[0_12px_40px_rgba(27,43,31,0.10)]"
      style={{ fontFamily: F }}
    >
      <span className="mb-6 self-start rounded-full bg-[#EFF0EB] px-3 py-1 text-[11px] font-medium text-[#5C6B5E]">
        {alt.category}
      </span>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <InlineLogo tool={fromTool} className="h-9 w-9 object-contain" />
        <p className="text-[15px] font-bold text-[#1B2B1F]">{fromTool.name}</p>
      </div>

      <div className="my-4 flex justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4F0EA] transition-colors group-hover:bg-[#0F6E56]">
          <ArrowDown className="h-4 w-4 text-[#0F6E56] transition-colors group-hover:text-white" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <InlineLogo tool={toTool} className="h-9 w-9 object-contain" />
        <div className="flex items-center gap-1.5">
          <p className="text-[15px] font-bold text-[#0F6E56]">{toTool.name}</p>
          {toTool.country && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`https://flagcdn.com/16x12/${toTool.country}.png`} width={14} height={10} alt={toTool.country} className="rounded-[2px] opacity-80" />
          )}
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

// ─── How It Works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "01", icon: Compass, title: "Discover",
      desc: "Browse 186+ EU alternatives across 10 categories. Compare features, ratings, and real migration stories.",
    },
    {
      num: "02", icon: Layers, title: "Plan",
      desc: "Build your stack. Get a personalized migration plan with difficulty ratings and recommended switching order.",
    },
    {
      num: "03", icon: Users, title: "Switch",
      desc: "Connect with certified EU partners. Get expert help, track progress, and share your story with the community.",
    },
  ];

  return (
    <section className="bg-[#1B2B1F] py-20" style={{ fontFamily: F }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionLabel text="HOW IT WORKS" light />
          <h2 className="text-[32px] font-bold text-white" style={{ letterSpacing: "-0.03em" }}>
            Three steps to EU sovereignty
          </h2>
        </FadeIn>
        <div className="mt-16 grid gap-10 sm:grid-cols-3">
          {steps.map(({ num, icon: Icon, title, desc }, i) => (
            <FadeIn key={num} delay={i * 120}>
              <p className="mb-5 font-bold leading-none text-white/[0.07]" style={{ fontSize: "56px" }}>{num}</p>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-2 text-[18px] font-bold text-white">{title}</h3>
              <p className="text-[14px] leading-relaxed text-white/65">{desc}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Community ─────────────────────────────────────────────────────────────────

function CommunitySection() {
  const posts = MOCK_POSTS.slice(0, 3);
  return (
    <section className="bg-[#FAF8F5] py-20" style={{ fontFamily: F }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionLabel text="COMMUNITY" />
              <h2 className="text-[32px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.03em" }}>
                Real stories from real migrations
              </h2>
              <p className="mt-2 text-base text-[#5C6B5E]">See what the community is sharing</p>
            </div>
            <Link href="/feed" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#5C6B5E] transition-colors hover:text-[#1B2B1F]">
              Browse all posts <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </FadeIn>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {posts.map((post, i) => (
            <FadeIn key={post.id} delay={i * 100}>
              <Link
                href="/feed"
                className="group flex flex-col rounded-2xl border border-[#DDD9D0] bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#C5D9CE] hover:shadow-[0_12px_40px_rgba(27,43,31,0.08)]"
              >
                <div className="mb-4 flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white select-none"
                    style={{ backgroundColor: post.author.color }}
                  >
                    {post.author.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#1B2B1F]">{post.author.name}</p>
                    <p className="text-[11px] text-[#9BA39C]">{post.timeAgo}</p>
                  </div>
                </div>
                <p className="mb-4 line-clamp-3 flex-1 text-[13px] leading-relaxed text-[#5C6B5E]">{post.story}</p>
                <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-[#EFF0EB] px-3 py-2 text-[12px]">
                  <span className="font-medium text-[#5C6B5E]">{post.from}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-[#9BA39C]" />
                  <span className="font-semibold text-[#0F6E56]">{post.to}</span>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-[#9BA39C]">
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.comments.length}</span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-[10px] bg-[#0F6E56] px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-[#0D6050]"
            style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(15,110,86,0.3), 0 8px 24px rgba(15,110,86,0.18)" }}
          >
            Join the community
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

function PartnersSection() {
  const partners = MOCK_PARTNERS.slice(0, 3);
  return (
    <section className="bg-white py-20" style={{ fontFamily: F }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionLabel text="TRUSTED PARTNERS" />
              <h2 className="text-[32px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.03em" }}>
                Certified EU migration experts
              </h2>
              <p className="mt-2 text-base text-[#5C6B5E]">Vetted specialists for end-to-end migrations</p>
            </div>
            <Link href="/partners" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#5C6B5E] transition-colors hover:text-[#1B2B1F]">
              View all partners <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </FadeIn>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {partners.map((partner, i) => (
            <FadeIn key={partner.id} delay={i * 100}>
              <div className="group flex flex-col rounded-2xl border border-[#DDD9D0] bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#C5D9CE] hover:shadow-[0_12px_40px_rgba(27,43,31,0.10)]">
                <div className="mb-4 flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white select-none"
                    style={{ backgroundColor: partner.color }}
                  >
                    {partner.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-[#1B2B1F]">{partner.name}</p>
                    <p className="text-[13px] text-[#9BA39C]">{partner.countryFlag} {partner.country}</p>
                  </div>
                </div>
                <div className="mb-4 flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className={`h-3.5 w-3.5 ${idx < Math.round(partner.rating) ? "fill-[#C8956C] text-[#C8956C]" : "text-[#DDD9D0]"}`} />
                    ))}
                  </div>
                  <span className="text-[13px] font-semibold text-[#1B2B1F]">{partner.rating}</span>
                  <span className="text-[12px] text-[#9BA39C]">({partner.reviewCount})</span>
                </div>
                <div className="mb-5 flex flex-wrap gap-1.5">
                  {partner.specialty.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-full bg-[#EFF0EB] px-2.5 py-1 text-[11px] font-medium text-[#5C6B5E]">{s}</span>
                  ))}
                </div>
                <div className="mb-5 flex items-center gap-4 text-[12px] text-[#9BA39C]">
                  <span>{partner.projects} projects</span>
                  <span className="h-1 w-1 rounded-full bg-[#DDD9D0]" />
                  <span>{partner.responseTime}</span>
                </div>
                <Link
                  href="/partners"
                  className="mt-auto flex items-center justify-center rounded-lg border border-[#DDD9D0] py-2.5 text-[13px] font-semibold text-[#1B2B1F] transition-colors hover:border-[#0F6E56] hover:bg-[#E4F0EA] hover:text-[#0F6E56]"
                >
                  Request help
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mt-8 flex items-center justify-center gap-4">
          <Link href="/partners" className="text-[14px] font-medium text-[#5C6B5E] underline-offset-2 transition-colors hover:text-[#1B2B1F] hover:underline">
            View all {MOCK_PARTNERS.length} partners
          </Link>
          <span className="h-1 w-1 rounded-full bg-[#DDD9D0]" />
          <Link href="/signup" className="text-[14px] font-medium text-[#0F6E56] underline-offset-2 transition-colors hover:underline">
            Become a partner
          </Link>
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
          <p className="mt-4 text-[13px] text-white/40">Free forever · No credit card needed</p>
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

  return (
    <>
      <Hero usTools={usTools} euTools={euTools} />
      <PopularSwitches alternatives={alternatives} />
      <HowItWorks />
      <CommunitySection />
      <PartnersSection />
      <FinalCTA />
    </>
  );
}
