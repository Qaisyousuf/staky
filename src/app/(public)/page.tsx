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
    <section className="overflow-hidden bg-white">
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
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 0%, rgba(15,110,86,0.06) 0%, transparent 100%)",
        }}
      />

      {/* Centered content */}
      <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-20 text-center sm:px-6 lg:pt-24">

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.06] tracking-tight text-gray-950 sm:text-6xl lg:text-[76px]">
          The platform for{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #0d5a47 0%, #0F6E56 45%, #1aaa7a 100%)",
            }}
          >
            European software migration.
          </span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
          Explore EU tools, understand the migration effort, share experiences with the community,
          and get expert help from trusted EU IT partners.
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
      </div>

      {/* Full-width marquee — intentionally breaks out of centered container */}
      {/* Marquee — clipped to title width, overflows hidden on both sides */}
      <div className="relative mx-auto max-w-5xl overflow-hidden pb-20 pt-2">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent" />

        <div className="space-y-3">
          {/* Row 1 — US tools → left */}
          <div className="flex w-max gap-3" style={{ animation: "marquee-fwd 50s linear infinite" }}>
            {usDoubled.map((tool, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-full border border-gray-100 bg-white px-4 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.07)] select-none"
              >
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] text-[9px] font-black text-white"
                  style={{ backgroundColor: tool.color }}
                >
                  {tool.abbr}
                </span>
                <span className="text-[13.5px] font-medium text-gray-600 whitespace-nowrap">
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
                className="flex items-center gap-2.5 rounded-full border border-gray-100 bg-white px-4 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.07)] select-none"
              >
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] text-[9px] font-black text-white"
                  style={{ backgroundColor: tool.color }}
                >
                  {tool.abbr}
                </span>
                <span className="text-[13.5px] font-medium text-gray-600 whitespace-nowrap">
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
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-[0_16px_48px_rgba(0,0,0,0.09)]"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
          {category}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-gray-200 transition-colors duration-200 group-hover:text-[#0F6E56]" />
      </div>

      {/* Tools */}
      <div className="flex flex-1 flex-col gap-2.5">
        {/* From */}
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
          <ToolIcon slug={from} size="lg" />
          <div>
            <p className="text-[10px] font-medium text-gray-400">Switching from</p>
            <p className="text-[12px] font-semibold text-gray-700">{fromTool.name}</p>
          </div>
        </div>

        {/* Divider with arrow */}
        <div className="flex items-center gap-2 px-1">
          <div className="h-px flex-1 bg-gray-100" />
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
            <ArrowRight className="h-2.5 w-2.5 rotate-90 text-gray-300" />
          </div>
          <div className="h-px flex-1 bg-gray-100" />
        </div>

        {/* To */}
        <div className="flex items-center gap-3 rounded-xl bg-green-50/60 px-3 py-2.5 ring-1 ring-green-100">
          <ToolIcon slug={to} size="lg" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-medium text-[#0F6E56]">EU alternative</p>
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
            <p className="text-[12px] font-semibold text-gray-800">{toTool.name}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="text-[11px] text-gray-400">
          <span className="font-semibold text-gray-700">{switcherCount.toLocaleString()}</span> companies switched
        </p>
      </div>
    </Link>
  );
}


// ─── CTA banner ────────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="border-t border-gray-100 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-[#0F6E56]">
          Join 18,000+ European businesses
        </p>

        <h2 className="text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
          Ready to break free
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #0d5a47 0%, #0F6E56 45%, #1aaa7a 100%)",
            }}
          >
            from US Big Tech?
          </span>
        </h2>

        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-gray-500">
          Privacy-first EU software is ready. Your migration partner is waiting.
          Start today — completely free.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-2xl bg-[#0F6E56] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(15,110,86,0.3)] transition-all hover:-translate-y-px hover:bg-[#0a5a45] hover:shadow-[0_4px_20px_rgba(15,110,86,0.4)]"
          >
            Create free account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-600 transition-all hover:-translate-y-px hover:border-gray-300 hover:shadow-sm"
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
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
                The most switched tools in Europe
              </h2>
              <p className="mt-2 text-base text-gray-500">
                See what companies are replacing — and where they&apos;re going.
              </p>
            </div>
            <Link
              href="/discover"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0F6E56] hover:underline"
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
      <section className="border-y border-gray-100 bg-gray-50/40 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
                Join a growing community
              </h2>
              <p className="mt-2 text-base text-gray-500">
                Thousands of European businesses already making the switch.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0F6E56] hover:underline"
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
                  className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]"
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
                      <p className="text-[16px] font-semibold leading-tight text-gray-900">
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
                          className="mb-1 inline-flex items-center gap-1 text-[10.5px] font-medium text-[#0F6E56]"
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
                        <p className="text-[12.5px] text-gray-500 truncate">{member.title}</p>
                      </div>
                    )}

                    {/* Company */}
                    {member.company && (
                      <div className="mt-0.5 flex items-center gap-1.5 truncate">
                        <Building2 className="h-3 w-3 shrink-0 text-gray-300" />
                        <p className="text-[12.5px] text-gray-500 truncate">
                          Founder at {member.company}
                        </p>
                      </div>
                    )}

                    {/* Location */}
                    {member.location && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0 text-gray-300" />
                        <span className="text-[12.5px] text-gray-500 truncate">{member.location}</span>
                      </div>
                    )}

                    {/* Interests */}
                    {member.interests.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {member.interests.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio */}
                    <div className="mt-3 flex-1">
                      {member.bio ? (
                        <p className="text-[13px] leading-relaxed text-gray-400 line-clamp-3">
                          {member.bio}
                        </p>
                      ) : (
                        <p className="text-[13px] italic text-gray-300">No bio yet.</p>
                      )}
                    </div>

                    {/* View profile */}
                    <Link
                      href={`/profile/${member.id}`}
                      className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-[12.5px] font-semibold text-gray-600 transition-all hover:border-gray-900 hover:text-gray-900"
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
      <section className="border-t border-gray-100 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
                Certified EU migration partners
              </h2>
              <p className="mt-2 text-base text-gray-500">
                Vetted specialists ready to guide your migration from start to finish.
              </p>
            </div>
            <Link
              href="/partners"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0F6E56] hover:underline"
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
