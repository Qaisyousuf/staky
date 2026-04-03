import Link from "next/link";
import { ArrowRight, Users, Package, Handshake, Shield, Zap, Globe } from "lucide-react";
import { POPULAR_SWITCHES, MOCK_PARTNERS, TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { PartnerCard } from "@/components/shared/partner-card";
import { prisma } from "@/lib/prisma";

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="bg-white">
      {/* Very soft top glow — no grid, no pattern */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(15,110,86,0.055) 0%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 lg:pb-24 lg:pt-24">

        {/* Badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1 shadow-sm">
          <span className="flex h-3.5 w-[18px] items-center justify-center rounded-[3px] bg-[#003399] text-[7px] font-black tracking-widest text-[#FFCC00] select-none">
            EU
          </span>
          <span className="text-[11px] font-semibold text-gray-500">
            Built for European businesses
          </span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.06] tracking-tight text-gray-950 sm:text-6xl lg:text-[76px]">
          The smarter way to
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #0d5a47 0%, #0F6E56 45%, #1aaa7a 100%)",
            }}
          >
            switch to EU software.
          </span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-500 sm:text-lg">
          Discover EU-based alternatives, read honest migration stories,
          and connect with certified partners — all in one place.
        </p>

        {/* CTAs */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-2xl bg-[#0F6E56] px-6 py-3 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(15,110,86,0.3)] transition-all hover:-translate-y-px hover:bg-[#0a5a45] hover:shadow-[0_4px_20px_rgba(15,110,86,0.4)]"
          >
            Start for free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 transition-all hover:-translate-y-px hover:border-gray-300 hover:shadow-sm"
          >
            Browse alternatives
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {[
            { value: "2,400+", label: "EU alternatives" },
            { value: "18k+", label: "Companies switched" },
            { value: "120+", label: "Migration partners" },
          ].map(({ value, label }, i) => (
            <div key={label} className="flex items-center gap-x-12">
              {i > 0 && <div className="hidden h-7 w-px bg-gray-200 sm:block" />}
              <div className="text-center">
                <p className="text-[28px] font-black leading-none tracking-tight text-gray-900">{value}</p>
                <p className="mt-1 text-[11px] font-medium text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Package,
      color: "bg-green-50",
      iconColor: "text-[#0F6E56]",
      title: "Discover EU alternatives",
      description:
        "Browse 2,400+ privacy-first European tools by category, use case, or the US product you want to replace.",
    },
    {
      number: "02",
      icon: Users,
      color: "bg-blue-50",
      iconColor: "text-[#2A5FA5]",
      title: "Learn from real stories",
      description:
        "Read honest migration stories from companies who already made the switch — real challenges, real outcomes.",
    },
    {
      number: "03",
      icon: Handshake,
      color: "bg-amber-50",
      iconColor: "text-amber-600",
      title: "Get expert support",
      description:
        "Connect with vetted EU migration partners for guided, end-to-end support from audit to go-live.",
    },
  ];

  return (
    <section className="border-y border-gray-100 bg-gray-50/50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0F6E56]">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Your migration, simplified
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-gray-500">
            Everything you need for a smooth transition to European software.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {steps.map(({ number, icon: Icon, color, iconColor, title, description }) => (
            <div
              key={number}
              className="group relative rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <span className="mb-5 block text-5xl font-black leading-none tracking-tighter text-gray-100 transition-colors group-hover:text-gray-200">
                {number}
              </span>
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <h3 className="mb-2 text-base font-bold text-gray-900">{title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trust strip ───────────────────────────────────────────────────────────────

function TrustStrip() {
  const items = [
    { icon: Shield, text: "GDPR compliant by design" },
    { icon: Globe, text: "100% EU-hosted data" },
    { icon: Zap, text: "No vendor lock-in" },
    { icon: Users, text: "Community verified" },
  ];

  return (
    <div className="border-b border-gray-100 bg-white py-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {items.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-[#0F6E56]" />
              <span className="text-xs font-medium text-gray-500">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Switch card ───────────────────────────────────────────────────────────────

function SwitchCard({
  from, to, category, switcherCount,
}: {
  from: string; to: string; category: string; switcherCount: number;
}) {
  const fromTool = TOOLS[from];
  const toTool = TOOLS[to];
  if (!fromTool || !toTool) return null;

  return (
    <Link
      href={`/discover?category=${encodeURIComponent(category)}`}
      className="group flex flex-col gap-3.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
    >
      <span className="inline-flex w-fit items-center rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {category}
      </span>

      <div className="flex items-center gap-2 py-0.5">
        <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
          <ToolIcon slug={from} size="lg" />
          <span className="line-clamp-2 text-[10px] leading-tight text-gray-400">{fromTool.name}</span>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm transition-transform duration-200 group-hover:translate-x-0.5">
          <ArrowRight className="h-3 w-3 text-gray-400" />
        </div>
        <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
          <ToolIcon slug={to} size="lg" />
          <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-[#0F6E56]">{toTool.name}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-[11px] text-gray-400">
          <span className="font-semibold text-gray-600">{switcherCount.toLocaleString()}</span> companies switched
        </p>
      </div>
    </Link>
  );
}

// ─── Story card ────────────────────────────────────────────────────────────────

function StoryCard({
  post,
}: {
  post: {
    id: string;
    fromTool: string;
    toTool: string;
    story: string;
    author: { name: string | null; image: string | null; title: string | null; company: string | null };
    recommendCount: number;
  };
}) {
  const fromTool = TOOLS[post.fromTool];
  const toTool = TOOLS[post.toTool];
  const preview = post.story.length > 140 ? post.story.slice(0, 140).trim() + "…" : post.story;

  return (
    <Link
      href={`/feed#post-${post.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
    >
      {/* Switch flow */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <ToolIcon slug={post.fromTool} size="sm" />
          <span className="text-[11px] text-gray-400">{fromTool?.name ?? post.fromTool}</span>
        </div>
        <ArrowRight className="h-3 w-3 shrink-0 text-gray-300" />
        <div className="flex items-center gap-1.5">
          <ToolIcon slug={post.toTool} size="sm" />
          <span className="text-[11px] font-semibold text-[#0F6E56]">{toTool?.name ?? post.toTool}</span>
        </div>
      </div>

      {/* Preview */}
      <p className="flex-1 text-sm leading-relaxed text-gray-600">{preview}</p>

      {/* Author */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3.5">
        <div className="flex items-center gap-2">
          {post.author.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.image} alt="" className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F6E56] text-[9px] font-bold text-white">
              {getInitials(post.author.name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold leading-none text-gray-800">{post.author.name ?? "Anonymous"}</p>
            {(post.author.title || post.author.company) && (
              <p className="mt-0.5 truncate text-[10px] leading-none text-gray-400">
                {[post.author.title, post.author.company].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-[#0F6E56]">
          {post.recommendCount} recs
        </span>
      </div>
    </Link>
  );
}

// ─── CTA banner ────────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="relative py-24 sm:py-32"
        style={{
          background: "linear-gradient(135deg, #053d2f 0%, #0F6E56 40%, #1a9a70 75%, #0d5a47 100%)",
        }}
      >
        {/* Decorative glows */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, white, transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-[350px] w-[350px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, white, transparent 65%)" }}
        />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-300 shadow-[0_0_6px_rgba(134,239,172,0.8)]" />
            <span className="text-[11px] font-semibold text-white/80">Join 18,000+ European businesses</span>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Ready to break free<br />from US Big Tech?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/65">
            Privacy-first EU software is ready. Your migration partner is waiting.
            Start today — completely free.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-[#0F6E56] shadow-xl transition-all hover:-translate-y-px hover:bg-green-50 hover:shadow-2xl"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-px hover:bg-white/15"
            >
              Find a migration partner
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const rawPosts = await prisma.alternativePost.findMany({
    where: { published: true },
    orderBy: [
      { recommendations: { _count: "desc" } },
      { createdAt: "desc" },
    ],
    take: 4,
    include: {
      author: {
        select: { id: true, name: true, image: true, title: true, company: true },
      },
      _count: { select: { recommendations: true } },
    },
  });

  const previewPosts = rawPosts.map((post) => ({
    id: post.id,
    fromTool: post.fromTool,
    toTool: post.toTool,
    story: post.story,
    author: {
      name: post.author.name,
      image: post.author.image,
      title: post.author.title,
      company: post.author.company,
    },
    recommendCount: post._count.recommendations,
  }));

  const featuredPartners = MOCK_PARTNERS.slice(0, 4);

  return (
    <>
      <Hero />
      <TrustStrip />
      <HowItWorks />

      {/* ── Popular switches ── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0F6E56]">Popular switches</p>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                The most switched tools in Europe
              </h2>
              <p className="mt-1.5 max-w-lg text-sm text-gray-500">
                See what companies are replacing and where they&apos;re going.
              </p>
            </div>
            <Link
              href="/discover"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0F6E56] hover:underline"
            >
              View all alternatives <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {POPULAR_SWITCHES.slice(0, 10).map((sw) => (
              <SwitchCard
                key={sw.id}
                from={sw.from}
                to={sw.to}
                category={sw.category}
                switcherCount={sw.switcherCount}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Community stories ── */}
      <section className="border-y border-gray-100 bg-gray-50/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0F6E56]">From the community</p>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Real migration stories</h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Honest experiences from companies who made the switch.
              </p>
            </div>
            <Link
              href="/feed"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0F6E56] hover:underline"
            >
              See all posts <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {previewPosts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {previewPosts.map((post) => (
                <StoryCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
              <p className="text-sm font-semibold text-gray-700">No stories yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Real migration posts will appear here as soon as they are published.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Partners ── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0F6E56]">Migration experts</p>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Certified EU migration partners
              </h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Vetted specialists for end-to-end migration support.
              </p>
            </div>
            <Link
              href="/partners"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0F6E56] hover:underline"
            >
              All partners <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {featuredPartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} homepage />
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
