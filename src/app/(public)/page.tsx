import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Globe, Briefcase, Building2 } from "lucide-react";
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
  const usTools = Object.values(TOOLS).filter((t) => t.origin === "us");
  const euTools = Object.values(TOOLS).filter((t) => t.origin === "eu");
  const usDoubled = [...usTools, ...usTools];
  const euDoubled = [...euTools, ...euTools];

  return (
    <section
      className="overflow-hidden bg-[#f6f4ee]"
      style={{
        backgroundImage: "radial-gradient(circle at top, rgba(22,163,74,0.10), transparent 35%)",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @keyframes marquee-fwd {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-rev {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* Soft top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px]" />

      {/* Centered content */}
      <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-20 text-center sm:px-6 lg:pt-24">

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1] tracking-[-0.02em] text-[#151a16] sm:text-6xl lg:text-[76px]">
          The platform for{" "}
          <span className="text-[#0f3d2e]">
            European software migration.
          </span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-[1.75] text-[rgba(0,0,0,0.6)] sm:text-lg">
          Explore EU tools, understand the migration effort, share experiences with the community,
          and get expert help from trusted EU IT partners.
        </p>

        {/* CTAs */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-full bg-[#0f3d2e] px-8 py-[14px] text-base font-medium text-white transition-all duration-200 ease-in-out hover:-translate-y-px hover:bg-[#14503d]"
          >
            Start for free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.15)] bg-transparent px-8 py-[14px] text-base font-medium text-[#4f584f] transition-all duration-200 ease-in-out hover:-translate-y-px hover:bg-[rgba(0,0,0,0.04)]"
          >
            Browse alternatives
          </Link>
        </div>
      </div>

      {/* Full-width marquee — intentionally breaks out of centered container */}
      {/* Marquee — clipped to title width, overflows hidden on both sides */}
      <div className="relative mx-auto max-w-5xl overflow-hidden pb-20 pt-2">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#f6f4ee] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#f6f4ee] to-transparent" />

        <div className="space-y-3">
          {/* Row 1 — US tools → left */}
          <div className="flex w-max gap-3" style={{ animation: "marquee-fwd 50s linear infinite" }}>
            {usDoubled.map((tool, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-full border border-[#e3ded1] bg-[#fbfaf6] px-4 py-2.5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] select-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/tools/${tool.slug}.svg`}
                  alt={tool.name}
                  className="h-5 w-5 shrink-0 object-contain"
                />
                <span className="text-[13.5px] font-medium text-[#5a635a] whitespace-nowrap">
                  {tool.name}
                </span>
              </div>
            ))}
          </div>

          {/* Row 2 — EU tools → right */}
          <div className="flex w-max gap-3" style={{ animation: "marquee-rev 50s linear infinite" }}>
            {euDoubled.map((tool, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-full border border-[#e3ded1] bg-[#fbfaf6] px-4 py-2.5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] select-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/logos/tools/${tool.slug}.svg`}
                  alt={tool.name}
                  className="h-5 w-5 shrink-0 object-contain"
                />
                <span className="text-[13.5px] font-medium text-[#5a635a] whitespace-nowrap">
                  {tool.name}
                </span>
                {tool.country && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://flagcdn.com/16x12/${tool.country}.png`}
                    width={16}
                    height={12}
                    alt={tool.country}
                    className="rounded-[2px] opacity-70"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
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
      className="group flex flex-col rounded-2xl border border-[#e4ddcf] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d6cebf] hover:shadow-[0_14px_36px_rgba(17,24,39,0.08)]"
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8c9388]">
          {category}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-[#cfc8bb] transition-colors duration-200 group-hover:text-[#0f3d2e]" />
      </div>

      {/* Tools */}
      <div className="flex flex-1 flex-col gap-2.5">
        {/* From */}
        <div className="flex items-center gap-3 rounded-xl border border-[#ece6da] bg-[#faf8f2] px-3 py-2.5">
          <ToolIcon slug={from} size="lg" />
          <div>
            <p className="text-[10px] font-medium text-[#8c9388]">Switching from</p>
            <p className="text-[12px] font-semibold text-[#2c332d]">{fromTool.name}</p>
          </div>
        </div>

        {/* Divider with arrow */}
        <div className="flex items-center gap-2 px-1">
          <div className="h-px flex-1 bg-[#e8e2d7]" />
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[#e8e2d7] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
            <ArrowRight className="h-2.5 w-2.5 rotate-90 text-[#b9b2a5]" />
          </div>
          <div className="h-px flex-1 bg-[#e8e2d7]" />
        </div>

        {/* To */}
        <div className="flex items-center gap-3 rounded-xl border border-[#d8e4db] bg-[#f4f7f2] px-3 py-2.5">
          <ToolIcon slug={to} size="lg" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-medium text-[#0f3d2e]">EU alternative</p>
              {toTool.country && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://flagcdn.com/16x12/${toTool.country}.png`}
                  width={16}
                  height={12}
                  alt={toTool.country}
                  className="rounded-[2px]"
                />
              )}
            </div>
            <p className="text-[12px] font-semibold text-[#1f2923]">{toTool.name}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 border-t border-[#ece6da] pt-4">
        <p className="text-[11px] text-[#8c9388]">
          <span className="font-semibold text-[#374039]">{switcherCount.toLocaleString()}</span> companies switched
        </p>
      </div>
    </Link>
  );
}


// ─── CTA banner ────────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section
      className="border-t border-[#e7e0d4] bg-[#f6f4ee] py-24 sm:py-32"
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0f3d2e]">
          Join 18,000+ European businesses
        </p>

        <h2 className="text-4xl font-bold tracking-[-0.03em] text-[#151a16] sm:text-5xl">
          Ready to break free
          <br />
          <span className="text-[#0f3d2e]">
            from US Big Tech?
          </span>
        </h2>

        <p className="mx-auto mt-5 max-w-lg text-base leading-[1.75] text-[#5a635a]">
          Privacy-first EU software is ready. Your migration partner is waiting.
          Start today — completely free.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-full bg-[#0f3d2e] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,61,46,0.10)] transition-colors hover:bg-[#14513d]"
          >
            Create free account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 rounded-full border border-[#d7d1c3] bg-[#f6f4ee] px-7 py-3.5 text-sm font-semibold text-[#4f584f] transition-colors hover:border-[#c5bcab] hover:bg-[#f2efe7]"
          >
            Find a migration partner
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const [communityMembers, featuredPartners] = await Promise.all([
    prisma.user.findMany({
      where: { suspended: false, name: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, name: true, image: true, coverImage: true, bio: true, title: true, company: true, location: true, interests: true, socialLinks: true, role: true, verified: true },
    }),
    Promise.resolve(MOCK_PARTNERS.slice(0, 4)),
  ]);

  return (
    <>
      <Hero />

      {/* ── Popular switches ── */}
      <section
        className="bg-[#f6f4ee] py-24"
        style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#151a16] sm:text-4xl">
                The most switched tools in Europe
              </h2>
              <p className="mt-2 text-base text-[#5a635a]">
                See what companies are replacing — and where they&apos;re going.
              </p>
            </div>
            <Link
              href="/discover"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0f3d2e] hover:underline"
            >
              View all EU alternatives <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {/* Mobile: horizontal scroll — Desktop: grid */}
          <div className="sm:hidden -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {POPULAR_SWITCHES.slice(0, 10).map((sw) => (
              <div key={sw.id} className="w-[72vw] max-w-[240px] shrink-0">
                <SwitchCard
                  from={sw.from}
                  to={sw.to}
                  category={sw.category}
                  switcherCount={sw.switcherCount}
                />
              </div>
            ))}
          </div>
          <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

      {/* ── Community members ── */}
      <section
        className="border-y border-[#e7e0d4] bg-[#fbfaf6] py-24"
        style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#151a16] sm:text-4xl">
                Join a growing community
              </h2>
              <p className="mt-2 text-base text-[#5a635a]">
                Thousands of European businesses already making the switch.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0f3d2e] hover:underline"
            >
              Join the community <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {communityMembers.map((member, idx) => {
              const isPartner = member.role === "PARTNER";
              const COVER_GRADIENTS = [
                "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
                "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
                "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)",
              ];
              const defaultCover = COVER_GRADIENTS[idx % COVER_GRADIENTS.length];

              return (
                <div
                  key={member.id}
                  className="group flex flex-col rounded-2xl border border-[#e4ddcf] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d6cebf] hover:shadow-[0_14px_36px_rgba(17,24,39,0.08)]"
                >
                  {/* Cover + avatar — relative wrapper so avatar can overlap */}
                  <div className="relative">
                    {/* Cover */}
                    {member.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.coverImage}
                        alt=""
                        className="h-24 w-full rounded-t-2xl object-cover"
                      />
                    ) : (
                      <div
                        className="relative h-24 w-full overflow-hidden rounded-t-2xl"
                        style={{ background: defaultCover }}
                      >
                        <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <pattern id={`grid-${member.id}`} width="28" height="28" patternUnits="userSpaceOnUse">
                              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="0.8" />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill={`url(#grid-${member.id})`} />
                        </svg>
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white opacity-[0.06]" />
                      </div>
                    )}

                    {/* Avatar — absolutely placed at bottom of cover, hangs 50% below */}
                    <div className="absolute bottom-0 left-5 translate-y-1/2">
                      {member.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.image}
                          alt={member.name ?? ""}
                          className="h-16 w-16 rounded-2xl object-cover shadow-md ring-[3px] ring-white"
                        />
                      ) : (
                        <div
                          className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-md ring-[3px] ring-white"
                          style={{ backgroundColor: isPartner ? "#2A5FA5" : "#0F6E56" }}
                        >
                          {getInitials(member.name)}
                        </div>
                      )}
                    </div>

                    {/* Partner badge — top right of cover */}
                    {isPartner && (
                      <div className="absolute bottom-2 right-4">
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[#2A5FA5]">
                          <BadgeCheck className="h-3 w-3" />
                          Migration Partner
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body — pt accounts for avatar hanging below cover */}
                  <div className="flex flex-1 flex-col px-6 pb-6 pt-11">

                    {/* Name + badge */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[16px] font-semibold leading-tight text-[#1e2520]">
                        {member.name}
                      </p>
                      <BadgeCheck
                        className="h-[17px] w-[17px] shrink-0"
                        style={{ color: isPartner ? "#2A5FA5" : "#0F6E56" }}
                      />
                    </div>

                    {/* Visit my website */}
                    {(() => {
                      const links = member.socialLinks as Record<string, string> | null;
                      const website = links?.website;
                      if (!website) return null;
                      const href = website.startsWith("http") ? website : `https://${website}`;
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-1 inline-flex items-center gap-1 text-[10.5px] font-medium text-[#0f3d2e]"
                        >
                          <Globe className="h-2.5 w-2.5 shrink-0" />
                          Visit my website
                        </a>
                      );
                    })()}

                    {/* Title */}
                    {member.title && (
                      <div className="mt-1 flex items-center gap-1.5 truncate">
                        <Briefcase className="h-3 w-3 shrink-0 text-gray-300" />
                        <p className="text-[12.5px] text-[#646d64] truncate">{member.title}</p>
                      </div>
                    )}

                    {/* Company */}
                    {member.company && (
                      <div className="mt-0.5 flex items-center gap-1.5 truncate">
                        <Building2 className="h-3 w-3 shrink-0 text-gray-300" />
                        <p className="text-[12.5px] text-[#646d64] truncate">
                          Founder at {member.company}
                        </p>
                      </div>
                    )}

                    {/* Location */}
                    {member.location && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0 text-gray-300" />
                        <span className="text-[12.5px] text-[#646d64] truncate">{member.location}</span>
                      </div>
                    )}

                    {/* Interests */}
                    {member.interests.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {member.interests.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[#e7e0d4] bg-[#faf8f2] px-2.5 py-1 text-[10px] font-medium text-[#646d64]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio */}
                    <div className="mt-3 flex-1">
                      {member.bio ? (
                        <p className="text-[13px] leading-relaxed text-[#70786f] line-clamp-3">
                          {member.bio}
                        </p>
                      ) : (
                        <p className="text-[13px] italic text-[#9ba29a]">No bio yet.</p>
                      )}
                    </div>

                    {/* View profile */}
                    <Link
                      href={`/profile/${member.id}`}
                      className="mt-5 flex items-center justify-center gap-1.5 rounded-full border border-[#d7d1c3] py-2.5 text-[12.5px] font-semibold text-[#4f584f] transition-colors hover:border-[#c5bcab] hover:bg-[#f7f4ec] hover:text-[#263029]"
                    >
                      View profile
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Partners ── */}
      <section
        className="border-t border-[#e7e0d4] bg-[#f6f4ee] py-24"
        style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#151a16] sm:text-4xl">
                Certified EU migration partners
              </h2>
              <p className="mt-2 text-base text-[#5a635a]">
                Vetted specialists ready to guide your migration from start to finish.
              </p>
            </div>
            <Link
              href="/partners"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0f3d2e] hover:underline"
            >
              View all partners <ArrowRight className="h-3.5 w-3.5" />
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
