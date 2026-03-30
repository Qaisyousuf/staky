import Link from "next/link";
import { ArrowRight, Users, Package, Handshake } from "lucide-react";
import { POPULAR_SWITCHES, MOCK_PARTNERS, TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { PartnerCard } from "@/components/shared/partner-card";
import { prisma } from "@/lib/prisma";

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`py-16 lg:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function SectionHeader({
  label,
  title,
  description,
  action,
}: {
  label?: string;
  title: string;
  description?: string;
  action?: { href: string; text: string };
}) {
  return (
    <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {label && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#0F6E56]">
            {label}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#0F6E56] hover:underline"
        >
          {action.text}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-gray-100 bg-white">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#0F6E56 1px, transparent 1px), linear-gradient(90deg, #0F6E56 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1">
            <span className="inline-flex h-4 w-6 items-center justify-center rounded bg-[#003399] text-[8px] font-bold tracking-widest text-[#FFCC00] select-none">
              EU
            </span>
            <span className="text-xs font-medium text-[#0F6E56]">
              Built for European businesses
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Switch to <span className="text-[#0F6E56]">European software</span>
            <br />
            with confidence.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-500">
            Discover EU-based alternatives to your favourite US tools, share
            migration stories, and connect with certified migration partners.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F6E56] px-6 py-3 font-medium text-white transition-colors hover:bg-[#0d5f4a]"
            >
              Start switching
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Browse alternatives
            </Link>
          </div>

          <div className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-6">
            {[
              { icon: Package, value: "2,400+", label: "Alternatives" },
              { icon: Users, value: "18k+", label: "Switchers" },
              { icon: Handshake, value: "120+", label: "Partners" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="mb-1.5 flex justify-center">
                  <Icon className="h-4 w-4 text-[#0F6E56]" />
                </div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SwitchCard({
  from,
  to,
  category,
  switcherCount,
}: {
  from: string;
  to: string;
  category: string;
  switcherCount: number;
}) {
  const fromTool = TOOLS[from];
  const toTool = TOOLS[to];
  if (!fromTool || !toTool) return null;

  return (
    <Link
      href={`/discover?category=${encodeURIComponent(category)}`}
      className="group flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
          {category}
        </span>
      </div>

      <div className="flex items-start gap-2.5 py-1">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
          <ToolIcon slug={from} size="lg" />
          <span className="line-clamp-2 text-[10px] leading-tight text-gray-500">{fromTool.name}</span>
        </div>
        <div className="flex flex-col items-center gap-1 pt-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-300 shadow-sm transition-transform duration-200 group-hover:translate-x-0.5">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
          <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-gray-300">Switch</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
          <ToolIcon slug={to} size="lg" />
          <span className="line-clamp-2 text-[10px] font-medium leading-tight text-[#0F6E56]">{toTool.name}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs font-medium text-gray-400">
          {switcherCount.toLocaleString()} switchers
        </p>
      </div>
    </Link>
  );
}

function CommunityStoryCard({
  post,
}: {
  post: {
    id: string;
    fromTool: string;
    toTool: string;
    author: {
      name: string | null;
      image: string | null;
      title: string | null;
      company: string | null;
    };
    recommendCount: number;
  };
}) {
  const fromTool = TOOLS[post.fromTool];
  const toTool = TOOLS[post.toTool];

  return (
    <Link
      href={`/feed#post-${post.id}`}
      className="group block overflow-hidden rounded-[18px] border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
    >
      <div className="bg-white px-3 pb-3 pt-3">
        <div className="flex items-start gap-2.5 border-b border-gray-100 pb-2.5">
          <div className="flex min-w-0 items-start gap-2.5">
            {post.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.author.image}
                alt={post.author.name ?? "Profile picture"}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-gray-100"
              />
            ) : (
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F6E56] text-[10px] font-bold text-white ring-1 ring-gray-100">
                {getInitials(post.author.name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-900">{post.author.name}</p>
              <p className="truncate text-[11px] text-gray-600/80">
                {[post.author.title, post.author.company].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            <ToolIcon slug={post.fromTool} size="md" />
            <span className="line-clamp-2 text-[11px] text-gray-600">{fromTool?.name ?? post.fromTool}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5">
              <ArrowRight className="h-3 w-3" />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400">Switch</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            <ToolIcon slug={post.toTool} size="md" />
            <span className="line-clamp-2 text-[11px] font-medium text-[#0F6E56]">{toTool?.name ?? post.toTool}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
            {post.recommendCount} recommended
          </span>
          <span className="text-[11px] font-medium text-[#0F6E56]">View real post</span>
        </div>
      </div>
    </Link>
  );
}

function CtaBanner() {
  return (
    <section className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Ready to break free from US Big Tech?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
          Join thousands of European businesses discovering privacy-first software
          alternatives.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F6E56] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0d5f4a]"
          >
            Create free account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/partners"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Find a migration partner
          </Link>
        </div>
      </div>
    </section>
  );
}

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
        select: {
          id: true,
          name: true,
          image: true,
          title: true,
          company: true,
        },
      },
      _count: {
        select: {
          recommendations: true,
        },
      },
    },
  });

  const previewPosts = rawPosts.map((post) => ({
    id: post.id,
    fromTool: post.fromTool,
    toTool: post.toTool,
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

      <Section>
        <SectionHeader
          label="Popular switches"
          title="The most switched tools in Europe"
          description="See what companies like yours are replacing and what they’re switching to."
          action={{ href: "/discover", text: "View all alternatives" }}
        />
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
      </Section>

      <Section className="border-y border-gray-100 bg-gray-50">
        <SectionHeader
          label="From the community"
          title="Real migration stories"
          description="Companies sharing their honest experience switching to EU software."
          action={{ href: "/feed", text: "See all posts" }}
        />
        {previewPosts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {previewPosts.map((post) => (
              <CommunityStoryCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-gray-900">No community stories yet</p>
            <p className="mt-1 text-sm text-gray-500">
              The homepage will show the latest real migration posts as soon as they are published.
            </p>
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Read all community stories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      <Section>
        <SectionHeader
          label="Migration experts"
          title="Certified EU migration partners"
          description="Vetted specialists who handle end-to-end migrations from audit to hypercare."
          action={{ href: "/partners", text: "All partners" }}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featuredPartners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} homepage />
          ))}
        </div>
      </Section>

      <CtaBanner />
    </>
  );
}
