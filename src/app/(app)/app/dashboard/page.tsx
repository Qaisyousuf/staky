import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Layers, Users, Handshake, Star, Inbox, FileText,
  TrendingUp, ArrowRight, Plus, Compass, PenSquare,
  ThumbsUp, MessageCircle, Bookmark, Clock,
  CheckCircle2, CircleDot, XCircle, AlertCircle,
  Building2, BadgeCheck, BarChart3, Eye, UserPlus,
  Zap,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { TOOLS, POPULAR_SWITCHES } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { getSuggestedProfiles } from "@/actions/profile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const TOOL_NAME_TO_SLUG = Object.fromEntries(
  Object.entries(TOOLS).map(([slug, t]) => [t.name.toLowerCase(), slug])
);

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, value, label, href, accent = "green" }: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  href?: string;
  accent?: "green" | "blue" | "amber" | "purple";
}) {
  const c = {
    green:  { bg: "bg-green-50",  icon: "text-[#0F6E56]",  border: "border-green-100",  val: "text-[#0F6E56]"  },
    blue:   { bg: "bg-blue-50",   icon: "text-[#2A5FA5]",  border: "border-blue-100",   val: "text-[#2A5FA5]"  },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-600",  border: "border-amber-100",  val: "text-amber-700"  },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100", val: "text-purple-700" },
  }[accent];

  const inner = (
    <div className="group bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4 hover:border-gray-300 hover:shadow-md transition-all">
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border", c.bg, c.border)}>
        <Icon className={cn("h-5 w-5", c.icon)} />
      </span>
      <div>
        <p className={cn("text-2xl font-black leading-none", c.val)}>{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
      </div>
      {href && <ArrowRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-gray-500 transition-colors" />}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:      { label: "Pending",       icon: Clock,        cls: "bg-amber-50  text-amber-700  border-amber-200"  },
  UNDER_REVIEW: { label: "Under review",  icon: CircleDot,    cls: "bg-orange-50 text-orange-700 border-orange-200" },
  MATCHED:      { label: "Assigned",      icon: CircleDot,    cls: "bg-blue-50   text-blue-700   border-blue-200"   },
  ACCEPTED:     { label: "Accepted",      icon: CircleDot,    cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  IN_PROGRESS:  { label: "In progress",   icon: TrendingUp,   cls: "bg-green-50  text-green-700  border-green-200"  },
  COMPLETED:    { label: "Completed",     icon: CheckCircle2, cls: "bg-gray-100  text-gray-600   border-gray-200"   },
  CANCELLED:    { label: "Cancelled",     icon: XCircle,      cls: "bg-red-50    text-red-600    border-red-200"    },
} as const;

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
  const { label, icon: Icon, cls } = config;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", cls)}>
      <Icon className="h-2.5 w-2.5" />{label}
    </span>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

type DashboardPost = {
  id: string; fromTool: string; toTool: string; story: string; createdAt: Date;
  author: { name: string | null; image: string | null; title: string | null; company: string | null; role: string };
  _count: { likes: number; comments: number };
};

function PostCard({ post }: { post: DashboardPost }) {
  const fromTool = TOOLS[post.fromTool];
  const toTool   = TOOLS[post.toTool];
  const isPartner = post.author.role === "PARTNER";

  return (
    <Link href={`/app/feed?post=${post.id}`}>
      <article className={cn(
        "bg-white rounded-2xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer",
        isPartner && "border-l-4 border-l-[#2A5FA5]"
      )}>
        <div className="flex items-start gap-3 mb-3">
          {post.author.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.image} alt={post.author.name ?? ""}
              className={cn("h-9 w-9 object-cover shrink-0", isPartner ? "rounded-xl" : "rounded-full")} />
          ) : (
            <div className={cn(
              "h-9 w-9 flex items-center justify-center bg-[#0F6E56] text-white text-xs font-bold shrink-0 select-none",
              isPartner ? "rounded-xl" : "rounded-full"
            )}>
              {getInitials(post.author.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{post.author.name}</p>
            <p className="text-xs text-gray-400 truncate">
              {post.author.title}{post.author.company && ` · ${post.author.company}`}
            </p>
          </div>
          <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(post.createdAt)}</span>
        </div>

        {fromTool && toTool && (
          <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
            <ToolIcon slug={post.fromTool} size="sm" />
            <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
            <ToolIcon slug={post.toTool} size="sm" />
            <span className="text-xs text-gray-600 font-medium">{toTool.name}</span>
          </div>
        )}

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">{post.story}</p>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{post._count.likes}</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post._count.comments}</span>
        </div>
      </article>
    </Link>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      {action && (
        <Link href={action.href} className="flex items-center gap-1 text-xs font-medium text-[#0F6E56] hover:underline">
          {action.label}<ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ─── User Dashboard ───────────────────────────────────────────────────────────

async function UserDashboard({ userId, userName }: { userId: string; userName: string | null | undefined }) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [stackCount, followingCount, connectionCount, stackItems, profileViewsCount, recentViewers] =
    await Promise.all([
      prisma.stackItem.count({ where: { stack: { userId } } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.connection.count({ where: { OR: [{ userId }, { targetId: userId }] } }),
      prisma.stackItem.findMany({ where: { stack: { userId } }, orderBy: { order: "asc" }, take: 8 }),
      prisma.profileView.count({ where: { profileId: userId, createdAt: { gte: weekAgo } } }),
      prisma.profileView.findMany({
        where: { profileId: userId, viewerId: { not: null } },
        include: { viewer: { select: { id: true, name: true, image: true, title: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
        distinct: ["viewerId"],
      }),
    ]);

  const stackSlugs = stackItems.map((i) => TOOL_NAME_TO_SLUG[i.toolName.toLowerCase()]).filter(Boolean);
  const suggestedUsers = await getSuggestedProfiles([userId]);

  const feedPosts = await prisma.alternativePost.findMany({
    where: {
      published: true,
      ...(stackSlugs.length > 0
        ? { OR: [{ fromTool: { in: stackSlugs } }, { toTool: { in: stackSlugs } }] }
        : {}),
    },
    include: { author: { select: { name: true, image: true, title: true, company: true, role: true } }, _count: { select: { likes: true, comments: true } } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const firstName = userName?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Welcome banner */}
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[#0F6E56] text-xs font-semibold uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-2xl font-black text-gray-900">Welcome back, {firstName} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening with your EU migration journey.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/app/settings?tab=partner"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold px-4 py-2.5 transition-colors"
          >
            <Handshake className="h-4 w-4 text-gray-400" />
            Become a partner
          </Link>
          <Link
            href="/app/feed"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F6E56] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d5f4a] transition-colors shadow-sm"
          >
            <PenSquare className="h-4 w-4" />
            Write a story
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Layers}    value={stackCount}        label="Stack tools"          href="/app/my-stack"       accent="green"  />
        <MetricCard icon={Users}     value={followingCount}    label="Following"             href="/app/network"        accent="blue"   />
        <MetricCard icon={Handshake} value={connectionCount}   label="Connections"           href="/app/network"        accent="purple" />
        <MetricCard icon={Eye}       value={profileViewsCount} label="Profile views (7d)"    href="/app/profile/views"  accent="amber"  />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { href: "/app/my-stack",  icon: Plus,      label: "Add to stack",  desc: "Manage EU tools",       bg: "bg-green-50",  text: "text-[#0F6E56]",  border: "hover:border-green-300"  },
          { href: "/app/discover",  icon: Compass,   label: "Browse tools",  desc: "Find alternatives",     bg: "bg-blue-50",   text: "text-[#2A5FA5]",  border: "hover:border-blue-300"   },
          { href: "/app/partners",  icon: Handshake, label: "Find partner",  desc: "Get migration help",    bg: "bg-purple-50", text: "text-purple-600", border: "hover:border-purple-300" },
          { href: "/app/feed",  icon: PenSquare, label: "Write story",   desc: "Share experience",      bg: "bg-amber-50",  text: "text-amber-600",  border: "hover:border-amber-300"  },
        ] as const).map(({ href, icon: Icon, label, desc, bg, text, border }) => (
          <Link key={href} href={href}
            className={cn("group bg-white rounded-2xl border border-gray-200 p-4 transition-all hover:shadow-sm", border)}
          >
            <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3", bg)}>
              <Icon className={cn("h-4 w-4", text)} />
            </span>
            <p className="text-sm font-bold text-gray-900">{label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Feed */}
        <div className="lg:col-span-2 space-y-3">
          <SectionHeader
            title={stackSlugs.length > 0 ? "From your stack" : "Recent stories"}
            action={{ href: "/app/feed", label: "View all" }}
          />
          {feedPosts.length > 0 ? (
            feedPosts.map((post) => <PostCard key={post.id} post={post as unknown as DashboardPost} />)
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">No stories yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                {stackSlugs.length > 0 ? "No posts about your stack tools yet." : "Be the first to share your migration story."}
              </p>
              <Link href="/app/feed" className="inline-flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] text-white text-xs font-semibold px-4 py-2 transition-colors">
                <PenSquare className="h-3.5 w-3.5" />Write a story
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Your stack */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <SectionHeader title="Your stack" action={{ href: "/app/my-stack", label: "Manage" }} />
            {stackItems.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {stackItems.map((item) => {
                  const slug = TOOL_NAME_TO_SLUG[item.toolName.toLowerCase()];
                  return slug ? (
                    <div key={item.id} className="flex flex-col items-center gap-1">
                      <ToolIcon slug={slug} size="md" />
                      <span className="text-[9px] text-gray-400 max-w-[40px] text-center truncate">{TOOLS[slug]?.name}</span>
                    </div>
                  ) : (
                    <span key={item.id} className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600">
                      {item.toolName}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5">
                <Layers className="h-7 w-7 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-3">Your stack is empty</p>
                <Link href="/app/my-stack" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6E56] hover:underline">
                  <Plus className="h-3.5 w-3.5" />Add tools
                </Link>
              </div>
            )}
          </div>

          {/* Suggested switches */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <SectionHeader title="Suggested switches" action={{ href: "/app/discover", label: "See all" }} />
            <div className="space-y-0">
              {POPULAR_SWITCHES.slice(0, 4).map((sw) => {
                const toTool = TOOLS[sw.to];
                return (
                  <Link key={sw.id} href={`/app/discover?category=${encodeURIComponent(sw.category)}`}
                    className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 -mx-4 px-4 hover:bg-gray-50 transition-colors rounded-lg"
                  >
                    <ToolIcon slug={sw.from} size="sm" />
                    <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
                    <ToolIcon slug={sw.to} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{toTool?.name}</p>
                      <p className="text-[10px] text-gray-400">{sw.switcherCount.toLocaleString()} switched</p>
                    </div>
                    <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Profile viewers */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <SectionHeader title="Who viewed your profile" action={{ href: "/app/profile/views", label: "See all" }} />
            {recentViewers.length > 0 ? (
              <div className="space-y-3">
                {recentViewers.slice(0, 3).map((v) => (
                  <Link key={v.id} href={`/app/profile/${v.viewerId}`} className="flex items-center gap-3 group">
                    {v.viewer?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.viewer.image} alt={v.viewer.name ?? ""} className="h-8 w-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[#0F6E56] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(v.viewer?.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-[#0F6E56] transition-colors">
                        {v.viewer?.name ?? "Anonymous"}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{v.viewer?.title ?? "Staky member"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <Eye className="h-6 w-6 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No profile views yet</p>
              </div>
            )}
          </div>

          {/* Grow network */}
          {suggestedUsers.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <SectionHeader title="Grow your network" action={{ href: "/app/network", label: "View all" }} />
              <div className="space-y-3">
                {suggestedUsers.slice(0, 3).map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    {u.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.image} alt={u.name ?? ""} className="h-8 w-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[#0F6E56] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(u.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/app/profile/${u.id}`} className="text-xs font-semibold text-gray-900 hover:text-[#0F6E56] truncate block transition-colors">
                        {u.name ?? "Anonymous"}
                      </Link>
                      <p className="text-[10px] text-gray-400 truncate">{u.title ?? u.company ?? "Staky member"}</p>
                    </div>
                    <Link href={`/app/profile/${u.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-green-50 text-[#0F6E56] hover:bg-green-100 transition-colors shrink-0"
                    >
                      <UserPlus className="h-3 w-3" />View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Partner Dashboard ────────────────────────────────────────────────────────

async function PartnerDashboard({ userId, userName }: { userId: string; userName: string | null | undefined }) {
  const partner = await prisma.partner.findUnique({ where: { userId } });

  const [newLeadsCount, activeProjectsCount, followerCount, recentLeads, myPosts] = await Promise.all([
    partner ? prisma.migrationRequest.count({ where: { partnerId: partner.id, status: "PENDING" } }) : 0,
    partner ? prisma.migrationRequest.count({ where: { partnerId: partner.id, status: { in: ["IN_PROGRESS", "MATCHED"] } } }) : 0,
    prisma.follow.count({ where: { followingId: userId } }),
    partner ? prisma.migrationRequest.findMany({
      where: { partnerId: partner.id },
      include: { user: { select: { name: true, email: true, company: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }) : [],
    prisma.alternativePost.findMany({
      where: { authorId: userId, published: true },
      include: { _count: { select: { likes: true, comments: true, recommendations: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const firstName = userName?.split(" ")[0] ?? "Partner";

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Company banner */}
      <div className="rounded-2xl border border-blue-100 bg-white px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left — company identity */}
          <div className="flex items-start gap-4">
            {/* Company logo / initials */}
            {partner?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={partner.logoUrl}
                alt={partner.companyName}
                className="h-14 w-14 rounded-xl object-cover shrink-0 border border-gray-200"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-[#2A5FA5] flex items-center justify-center text-white text-lg font-black shrink-0 select-none">
                {partner?.companyName
                  ?.split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() ?? "P"}
              </div>
            )}

            <div>
              {/* Label row */}
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[#2A5FA5] text-[10px] font-bold uppercase tracking-widest">
                  Partner Dashboard
                </p>
                {partner?.approved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold text-[#2A5FA5]">
                    <BadgeCheck className="h-3 w-3" />Verified
                  </span>
                )}
              </div>

              {/* Company name */}
              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                {partner?.companyName ?? firstName}
              </h1>

              {/* Country + rating + projects */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {partner?.country && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Building2 className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    {partner.country}
                  </span>
                )}
                {partner?.country && <span className="text-gray-200 text-xs">·</span>}
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  <span className="font-semibold text-gray-700">
                    {partner?.rating && partner.rating > 0 ? partner.rating.toFixed(1) : "No rating"}
                  </span>
                </span>
                <span className="text-gray-200 text-xs">·</span>
                <span className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{partner?.projectCount ?? 0}</span> projects
                </span>
              </div>

              {/* Specialty chips */}
              {partner && (partner.specialty ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {(partner.specialty ?? []).slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[10px] font-medium text-[#2A5FA5]"
                    >
                      {s}
                    </span>
                  ))}
                  {(partner.specialty ?? []).length > 4 && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-500">
                      +{(partner.specialty ?? []).length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex gap-2 shrink-0 sm:mt-1">
            <Link href="/app/my-posts"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              <FileText className="h-4 w-4" />New post
            </Link>
            <Link href="/app/leads"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2A5FA5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#244d8a] transition-colors shadow-sm"
            >
              <Inbox className="h-4 w-4" />View leads
            </Link>
          </div>
        </div>
      </div>

      {/* Pending approval */}
      {partner && !partner.approved && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Approval pending</p>
            <p className="text-xs text-amber-600 mt-0.5">Your partner profile is under review. You&apos;ll be notified once approved.</p>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Inbox}      value={newLeadsCount}       label="New leads"       href="/app/leads"  accent="amber"  />
        <MetricCard icon={TrendingUp} value={activeProjectsCount} label="Active projects" href="/app/leads"  accent="green"  />
        <MetricCard icon={Star}       value={partner?.rating ? partner.rating.toFixed(1) : "—"} label="Rating" accent="amber" />
        <MetricCard icon={Users}      value={followerCount}       label="Followers"                     accent="blue"   />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Leads */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <h2 className="text-sm font-bold text-gray-900">Recent leads</h2>
              <Link href="/app/leads" className="flex items-center gap-1 text-xs font-medium text-[#2A5FA5] hover:underline">
                All leads<ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentLeads.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentLeads.map((lead) => {
                  const fromTool = TOOLS[lead.fromTool];
                  const toTool   = TOOLS[lead.toTool];
                  return (
                    <Link key={lead.id} href={`/app/leads/${lead.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      {lead.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={lead.user.image} alt={lead.user.name ?? ""} className="h-9 w-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-bold shrink-0">
                          {getInitials(lead.user.name)}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{lead.user.name ?? lead.user.email}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {fromTool && <span className="text-[10px] text-gray-400">{fromTool.name}</span>}
                          <ArrowRight className="h-2.5 w-2.5 text-gray-300 shrink-0" />
                          {toTool && <span className="text-[10px] font-semibold text-[#0F6E56]">{toTool.name}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={lead.status} />
                        <span className="text-[10px] text-gray-400">{timeAgo(lead.createdAt)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Inbox className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-700">No leads yet</p>
                <p className="text-xs text-gray-400 mt-1">{partner?.approved ? "Leads appear when businesses request your help." : "Leads come in once your profile is approved."}</p>
              </div>
            )}
          </div>

          {/* Post performance */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <h2 className="text-sm font-bold text-gray-900">Post performance</h2>
              <Link href="/app/my-posts" className="flex items-center gap-1 text-xs font-medium text-[#2A5FA5] hover:underline">
                All posts<ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {myPosts.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {myPosts.map((post) => {
                  const fromTool = TOOLS[post.fromTool];
                  const toTool   = TOOLS[post.toTool];
                  const total    = post._count.likes + post._count.comments + post._count.recommendations;
                  const max      = Math.max(...myPosts.map((p) => p._count.likes + p._count.comments + p._count.recommendations), 1);
                  return (
                    <div key={post.id} className="px-5 py-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          {fromTool && <ToolIcon slug={post.fromTool} size="sm" />}
                          <ArrowRight className="h-3 w-3 text-gray-300" />
                          {toTool && <ToolIcon slug={post.toTool} size="sm" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{post.story}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(post.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5 text-gray-400" />{post._count.likes}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5 text-gray-400" />{post._count.comments}</span>
                          <span className="flex items-center gap-1"><Bookmark className="h-3.5 w-3.5 text-gray-400" />{post._count.recommendations}</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2A5FA5] rounded-full" style={{ width: `${(total / max) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 shrink-0">{total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-700">No posts yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Share migration stories to attract leads.</p>
                <Link href="/app/my-posts" className="inline-flex items-center gap-1.5 rounded-xl bg-[#2A5FA5] hover:bg-[#244d8a] text-white text-xs font-semibold px-4 py-2 transition-colors">
                  <PenSquare className="h-3.5 w-3.5" />Write first post
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Quick actions</h3>
            <div className="space-y-1">
              {([
                { href: "/app/leads",           icon: Inbox,     label: "Manage leads"         },
                { href: "/app/my-posts",        icon: PenSquare, label: "Write a post"          },
                { href: "/app/company-profile", icon: Building2, label: "Edit company profile"  },
                { href: "/app/discover",        icon: Compass,   label: "Browse alternatives"   },
              ] as const).map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                >
                  <Icon className="h-4 w-4 text-gray-400 group-hover:text-[#2A5FA5] transition-colors shrink-0" />
                  <span className="flex-1 font-medium">{label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#2A5FA5] transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Specialties */}
          {partner && (partner.specialty ?? []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">Your specialties</h3>
                <Link href="/app/company-profile" className="text-xs text-[#2A5FA5] hover:underline">Edit</Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(partner.specialty ?? []).map((spec) => (
                  <span key={spec} className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[#2A5FA5]">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Profile visibility */}
          {partner && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Profile visibility</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Status",         value: partner.approved  ? "✓ Approved"    : "Pending review",  ok: partner.approved  },
                  { label: "Featured",       value: partner.featured  ? "✓ Featured"    : "Not featured",    ok: partner.featured  },
                  { label: "Total projects", value: String(partner.projectCount),                            ok: true              },
                  { label: "Pricing",        value: partner.pricing ?? "—",                                  ok: !!partner.pricing },
                ].map(({ label, value, ok }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className={cn("text-xs font-semibold", ok ? "text-[#0F6E56]" : "text-gray-400")}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const metadata = { title: "Dashboard — Staky" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id: userId, name } = session.user;

  // Read activeMode + partner approval from DB — session JWT can be stale after a mode switch
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      activeMode: true,
      partner: { select: { approved: true } },
    },
  });
  const activeMode = userRecord?.activeMode ?? "user";
  const partnerApproved = userRecord?.partner?.approved ?? false;

  const isPartnerMode = partnerApproved && activeMode === "partner";
  return isPartnerMode
    ? <PartnerDashboard userId={userId} userName={name} />
    : <UserDashboard userId={userId} userName={name} />;
}
