import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Layers, Users, Handshake, ClipboardList,
  Star, Inbox, FileText, TrendingUp,
  ArrowRight, Plus, Compass, PenSquare,
  ThumbsUp, MessageCircle, Bookmark,
  Clock, CheckCircle2, CircleDot, XCircle,
  AlertCircle, Building2, BadgeCheck,
  BarChart3, Eye, UserPlus,
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

// Map tool display-names → slugs (for stack matching)
const TOOL_NAME_TO_SLUG = Object.fromEntries(
  Object.entries(TOOLS).map(([slug, t]) => [t.name.toLowerCase(), slug])
);

// ─── Shared UI ────────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  value,
  label,
  href,
  accent = "green",
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  href?: string;
  accent?: "green" | "blue" | "amber" | "purple";
}) {
  const colors = {
    green:  { bg: "bg-green-50",  text: "text-[#0F6E56]",  ring: "border-green-100" },
    blue:   { bg: "bg-blue-50",   text: "text-[#2A5FA5]",  ring: "border-blue-100" },
    amber:  { bg: "bg-amber-50",  text: "text-amber-600",  ring: "border-amber-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "border-purple-100" },
  };
  const c = colors[accent];

  const inner = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all">
      <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl border", c.bg, c.ring)}>
        <Icon className={cn("h-5 w-5", c.text)} />
      </span>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {action && (
        <Link
          href={action.href}
          className="flex items-center gap-1 text-xs font-medium text-[#0F6E56] hover:underline"
        >
          {action.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:     { label: "Pending",     icon: Clock,         cls: "bg-amber-50 text-amber-700 border-amber-200" },
  MATCHED:     { label: "Matched",     icon: CircleDot,     cls: "bg-blue-50 text-blue-700 border-blue-200" },
  IN_PROGRESS: { label: "In progress", icon: TrendingUp,    cls: "bg-green-50 text-green-700 border-green-200" },
  COMPLETED:   { label: "Completed",   icon: CheckCircle2,  cls: "bg-gray-100 text-gray-600 border-gray-200" },
  CANCELLED:   { label: "Cancelled",   icon: XCircle,       cls: "bg-red-50 text-red-600 border-red-200" },
} as const;

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const { label, icon: Icon, cls } = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", cls)}>
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

// ─── Mini post card (dashboard feed) ─────────────────────────────────────────

type DashboardPost = {
  id: string;
  fromTool: string;
  toTool: string;
  story: string;
  createdAt: Date;
  author: { name: string | null; image: string | null; title: string | null; company: string | null; role: string };
  _count: { likes: number; comments: number };
};

function MiniPostCard({ post }: { post: DashboardPost }) {
  const fromTool = TOOLS[post.fromTool];
  const toTool = TOOLS[post.toTool];
  const isPartner = post.author.role === "PARTNER";

  return (
    <article className={cn(
      "bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all",
      isPartner && "border-l-[3px] border-l-[#2A5FA5]"
    )}>
      {/* Author + switch */}
      <div className="flex items-start gap-3 mb-3">
        {post.author.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.author.image}
            alt={post.author.name ?? ""}
            className={cn("h-9 w-9 object-cover shrink-0", isPartner ? "rounded-xl" : "rounded-full")}
          />
        ) : (
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center text-white text-xs font-bold select-none shrink-0",
              isPartner ? "rounded-xl" : "rounded-full"
            )}
            style={{ backgroundColor: "#0F6E56" }}
          >
            {getInitials(post.author.name)}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{post.author.name}</p>
          <p className="text-xs text-gray-400 truncate">
            {post.author.title}{post.author.company && ` · ${post.author.company}`}
          </p>
        </div>
        <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(post.createdAt)}</span>
      </div>

      {/* Switch badge */}
      {fromTool && toTool && (
        <div className="flex items-center gap-2 mb-3 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 w-fit">
          <ToolIcon slug={post.fromTool} size="sm" />
          <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
          <ToolIcon slug={post.toTool} size="sm" />
          <span className="text-xs text-gray-600 font-medium">{toTool.name}</span>
        </div>
      )}

      {/* Excerpt */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">
        {post.story}
      </p>

      {/* Counts */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3.5 w-3.5" />
          {post._count.likes}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {post._count.comments}
        </span>
      </div>
    </article>
  );
}

// ─── User Dashboard ───────────────────────────────────────────────────────────

async function UserDashboard({
  userId,
  userName,
}: {
  userId: string;
  userName: string | null | undefined;
}) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Fetch all metrics in parallel
  const [stackCount, followingCount, connectionCount, requestCount, stackItems, profileViewsCount, recentViewers] =
    await Promise.all([
      prisma.stackItem.count({ where: { stack: { userId } } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.connection.count({
        where: { OR: [{ userId }, { targetId: userId }] },
      }),
      prisma.migrationRequest.count({ where: { userId } }),
      prisma.stackItem.findMany({
        where: { stack: { userId } },
        orderBy: { order: "asc" },
        take: 8,
      }),
      prisma.profileView.count({
        where: { profileId: userId, createdAt: { gte: weekAgo } },
      }),
      prisma.profileView.findMany({
        where: { profileId: userId, viewerId: { not: null } },
        include: {
          viewer: { select: { id: true, name: true, image: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        distinct: ["viewerId"],
      }),
    ]);

  // Match stack tool names to slugs for feed filtering
  const stackSlugs = stackItems
    .map((i) => TOOL_NAME_TO_SLUG[i.toolName.toLowerCase()])
    .filter(Boolean);

  // Suggested users for "Grow your network"
  const suggestedUsers = await getSuggestedProfiles([userId]);

  // Fetch feed posts (stack-matched or recent)
  const feedPosts = await prisma.alternativePost.findMany({
    where: {
      published: true,
      ...(stackSlugs.length > 0
        ? { OR: [{ fromTool: { in: stackSlugs } }, { toTool: { in: stackSlugs } }] }
        : {}),
    },
    include: {
      author: { select: { name: true, image: true, title: true, company: true, role: true } },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const firstName = userName?.split(" ")[0] ?? "there";

  const QUICK_ACTIONS = [
    { href: "/my-stack",  icon: Plus,      label: "Add to stack",    desc: "Manage your EU tools",          accent: "green"  },
    { href: "/discover",  icon: Compass,   label: "Browse tools",    desc: "Find EU alternatives",          accent: "blue"   },
    { href: "/partners",  icon: Handshake, label: "Find partner",    desc: "Get migration help",            accent: "purple" },
    { href: "/feed",      icon: PenSquare, label: "Write a story",   desc: "Share your experience",         accent: "amber"  },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0F6E56] mb-1">
            Dashboard
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {firstName} 👋
          </h1>
        </div>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] text-white text-sm font-medium px-4 py-2.5 transition-colors"
        >
          <PenSquare className="h-4 w-4" />
          Write a story
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Layers}        value={stackCount}         label="Stack tools"          href="/my-stack"        accent="green"  />
        <MetricCard icon={Users}         value={followingCount}     label="Following"             href="/network"         accent="blue"   />
        <MetricCard icon={Handshake}     value={connectionCount}    label="Connections"           href="/network"         accent="purple" />
        <MetricCard icon={Eye}           value={profileViewsCount}  label="Profile views (7 days)" href="/profile/views"  accent="purple" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, accent }) => {
          const accentMap = {
            green:  "hover:border-[#0F6E56] hover:bg-green-50  group-hover:text-[#0F6E56]",
            blue:   "hover:border-[#2A5FA5] hover:bg-blue-50   group-hover:text-[#2A5FA5]",
            purple: "hover:border-purple-400 hover:bg-purple-50 group-hover:text-purple-600",
            amber:  "hover:border-amber-400 hover:bg-amber-50  group-hover:text-amber-600",
          };
          const iconMap = {
            green:  "text-[#0F6E56]  bg-green-50",
            blue:   "text-[#2A5FA5]  bg-blue-50",
            purple: "text-purple-600 bg-purple-50",
            amber:  "text-amber-600  bg-amber-50",
          };
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group bg-white rounded-xl border border-gray-200 p-4 transition-all",
                accentMap[accent]
              )}
            >
              <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg mb-3", iconMap[accent])}>
                <Icon className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Feed column */}
        <div className="lg:col-span-2 space-y-3">
          <SectionHeader
            title={stackSlugs.length > 0 ? "From your stack" : "Recent stories"}
            action={{ href: "/feed", label: "View all" }}
          />

          {feedPosts.length > 0 ? (
            feedPosts.map((post) => (
              <MiniPostCard key={post.id} post={post as unknown as DashboardPost} />
            ))
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
              <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">No stories yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                {stackSlugs.length > 0
                  ? "No posts about your stack tools yet. Check the full feed."
                  : "Be the first to share your migration story."}
              </p>
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F6E56] hover:bg-[#0d5f4a] text-white text-xs font-medium px-4 py-2 transition-colors"
              >
                <PenSquare className="h-3.5 w-3.5" />
                Write a story
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar column */}
        <div className="space-y-4">
          {/* Your stack */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <SectionHeader title="Your stack" action={{ href: "/my-stack", label: "Manage" }} />
            {stackItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stackItems.map((item) => {
                  const slug = TOOL_NAME_TO_SLUG[item.toolName.toLowerCase()];
                  return slug ? (
                    <div key={item.id} className="flex flex-col items-center gap-1">
                      <ToolIcon slug={slug} size="md" />
                      <span className="text-[9px] text-gray-400 max-w-[40px] text-center truncate">
                        {TOOLS[slug]?.name}
                      </span>
                    </div>
                  ) : (
                    <span
                      key={item.id}
                      className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600"
                    >
                      {item.toolName}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <Layers className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-3">Your stack is empty</p>
                <Link
                  href="/my-stack"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F6E56] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add tools
                </Link>
              </div>
            )}
          </div>

          {/* Suggested switches */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <SectionHeader
              title="Suggested switches"
              action={{ href: "/discover", label: "See all" }}
            />
            <div className="space-y-0">
              {POPULAR_SWITCHES.slice(0, 4).map((sw) => {
                const toTool = TOOLS[sw.to];
                return (
                  <Link
                    key={sw.id}
                    href={`/discover?category=${encodeURIComponent(sw.category)}`}
                    className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-4 px-4 transition-colors rounded-lg"
                  >
                    <ToolIcon slug={sw.from} size="sm" />
                    <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
                    <ToolIcon slug={sw.to} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{toTool?.name}</p>
                      <p className="text-[10px] text-gray-400">{sw.switcherCount.toLocaleString()} switched</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Who viewed your profile */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <SectionHeader title="Who viewed your profile" action={{ href: "/profile/views", label: "See all" }} />
            {recentViewers.length > 0 ? (
              <div className="space-y-3">
                {recentViewers.slice(0, 3).map((v) => (
                  <Link key={v.id} href={`/profile/${v.viewerId}`} className="flex items-center gap-3 group">
                    {v.viewer?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.viewer.image} alt={v.viewer.name ?? ""} className="h-8 w-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-[#0F6E56] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(v.viewer?.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate group-hover:text-[#0F6E56] transition-colors">
                        {v.viewer?.name ?? "Anonymous"}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{v.viewer?.title ?? "Staky member"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Eye className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No views yet</p>
              </div>
            )}
          </div>

          {/* Grow your network */}
          {suggestedUsers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <SectionHeader title="Grow your network" action={{ href: "/network", label: "View all" }} />
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
                      <Link href={`/profile/${u.id}`} className="text-xs font-medium text-gray-900 hover:text-[#0F6E56] truncate block transition-colors">
                        {u.name ?? "Anonymous"}
                      </Link>
                      <p className="text-[10px] text-gray-400 truncate">{u.title ?? u.company ?? "Staky member"}</p>
                    </div>
                    <Link
                      href={`/profile/${u.id}`}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-green-50 text-[#0F6E56] hover:bg-green-100 transition-colors shrink-0"
                    >
                      <UserPlus className="h-3 w-3" />
                      View
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

async function PartnerDashboard({
  userId,
  userName,
}: {
  userId: string;
  userName: string | null | undefined;
}) {
  const partner = await prisma.partner.findUnique({ where: { userId } });

  const [newLeadsCount, activeProjectsCount, followerCount, recentLeads, myPosts] =
    await Promise.all([
      partner
        ? prisma.migrationRequest.count({
            where: { partnerId: partner.id, status: "PENDING" },
          })
        : Promise.resolve(0),
      partner
        ? prisma.migrationRequest.count({
            where: { partnerId: partner.id, status: { in: ["IN_PROGRESS", "MATCHED"] } },
          })
        : Promise.resolve(0),
      prisma.follow.count({ where: { followingId: userId } }),
      partner
        ? prisma.migrationRequest.findMany({
            where: { partnerId: partner.id },
            include: {
              user: { select: { name: true, email: true, company: true, image: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 6,
          })
        : Promise.resolve([]),
      prisma.alternativePost.findMany({
        where: { authorId: userId, published: true },
        include: {
          _count: { select: { likes: true, comments: true, recommendations: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const firstName = userName?.split(" ")[0] ?? "Partner";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2A5FA5]">
              Partner Dashboard
            </p>
            {partner?.approved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-semibold text-[#2A5FA5]">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {firstName} 👋
          </h1>
          {partner && (
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-gray-700">
                {partner.rating > 0 ? partner.rating.toFixed(1) : "No rating yet"}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{partner.projectCount} total projects</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href="/my-posts"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 transition-colors"
          >
            <FileText className="h-4 w-4" />
            New post
          </Link>
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2A5FA5] hover:bg-[#244d8a] text-white text-sm font-medium px-4 py-2.5 transition-colors"
          >
            <Inbox className="h-4 w-4" />
            View leads
          </Link>
        </div>
      </div>

      {/* Partner not approved banner */}
      {partner && !partner.approved && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Approval pending</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Your partner profile is under review. You'll be notified once approved.
            </p>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Inbox}       value={newLeadsCount}      label="New leads"       href="/leads"            accent="amber"  />
        <MetricCard icon={TrendingUp}  value={activeProjectsCount} label="Active projects" href="/leads"            accent="green"  />
        <MetricCard icon={Star}        value={partner?.rating ? partner.rating.toFixed(1) : "—"} label="Rating"    accent="amber"  />
        <MetricCard icon={Users}       value={followerCount}      label="Followers"                                 accent="blue"   />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recent leads */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent leads</h2>
              <Link
                href="/leads"
                className="flex items-center gap-1 text-xs font-medium text-[#2A5FA5] hover:underline"
              >
                All leads <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentLeads.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentLeads.map((lead) => {
                  const fromTool = TOOLS[lead.fromTool];
                  const toTool = TOOLS[lead.toTool];
                  return (
                    <div key={lead.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      {/* User avatar */}
                      {lead.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={lead.user.image} alt={lead.user.name ?? ""} className="h-9 w-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-bold shrink-0 select-none">
                          {getInitials(lead.user.name)}
                        </span>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lead.user.name ?? lead.user.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {fromTool && <span className="text-[10px] text-gray-400">{fromTool.name}</span>}
                          <ArrowRight className="h-2.5 w-2.5 text-gray-300 shrink-0" />
                          {toTool && <span className="text-[10px] font-medium text-[#0F6E56]">{toTool.name}</span>}
                        </div>
                      </div>

                      {/* Status + time */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={lead.status} />
                        <span className="text-[10px] text-gray-400">{timeAgo(lead.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">No leads yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  {partner?.approved
                    ? "Leads will appear here when businesses request your help."
                    : "Leads will come in once your profile is approved."}
                </p>
              </div>
            )}
          </div>

          {/* Post performance */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Post performance</h2>
              <Link
                href="/my-posts"
                className="flex items-center gap-1 text-xs font-medium text-[#2A5FA5] hover:underline"
              >
                All posts <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {myPosts.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {myPosts.map((post) => {
                  const fromTool = TOOLS[post.fromTool];
                  const toTool = TOOLS[post.toTool];
                  const totalEngagement = post._count.likes + post._count.comments + post._count.recommendations;
                  const maxEngagement = Math.max(...myPosts.map((p) =>
                    p._count.likes + p._count.comments + p._count.recommendations
                  ), 1);

                  return (
                    <div key={post.id} className="px-5 py-4">
                      <div className="flex items-start gap-3 mb-2.5">
                        {/* Tool icons */}
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          {fromTool && <ToolIcon slug={post.fromTool} size="sm" />}
                          <ArrowRight className="h-3 w-3 text-gray-300" />
                          {toTool && <ToolIcon slug={post.toTool} size="sm" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                            {post.story}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(post.createdAt)}</p>
                        </div>
                      </div>

                      {/* Engagement bar */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3.5 w-3.5 text-gray-400" />
                            {post._count.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5 text-gray-400" />
                            {post._count.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bookmark className="h-3.5 w-3.5 text-gray-400" />
                            {post._count.recommendations}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2A5FA5] rounded-full"
                            style={{ width: `${(totalEngagement / maxEngagement) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 shrink-0">
                          {totalEngagement} total
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <BarChart3 className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">No posts yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  Share migration stories to attract leads and build your reputation.
                </p>
                <Link
                  href="/my-posts"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2A5FA5] hover:bg-[#244d8a] text-white text-xs font-medium px-4 py-2 transition-colors"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  Write first post
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick actions</h3>
            <div className="space-y-1.5">
              {[
                { href: "/leads",           icon: Inbox,        label: "Manage leads",       accent: "amber" },
                { href: "/my-posts",        icon: PenSquare,    label: "Write a post",        accent: "blue" },
                { href: "/company-profile", icon: Building2,    label: "Edit company profile",accent: "green" },
                { href: "/discover",        icon: Compass,      label: "Browse alternatives", accent: "green" },
              ].map(({ href, icon: Icon, label, accent }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                >
                  <Icon className="h-4 w-4 text-gray-400 group-hover:text-[#2A5FA5] transition-colors shrink-0" />
                  {label}
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 ml-auto group-hover:text-[#2A5FA5] transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Specialties */}
          {partner && partner.specialty.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Your specialties</h3>
                <Link href="/company-profile" className="text-xs text-[#2A5FA5] hover:underline">
                  Edit
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {partner.specialty.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[#2A5FA5]"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Partner profile card */}
          {partner && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Profile visibility</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Status</span>
                  <span className={cn(
                    "text-xs font-semibold",
                    partner.approved ? "text-green-600" : "text-amber-600"
                  )}>
                    {partner.approved ? "✓ Approved" : "Pending review"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Featured</span>
                  <span className={cn("text-xs font-semibold", partner.featured ? "text-[#2A5FA5]" : "text-gray-400")}>
                    {partner.featured ? "✓ Featured" : "Not featured"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Total projects</span>
                  <span className="text-xs font-semibold text-gray-700">{partner.projectCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Pricing</span>
                  <span className="text-xs font-semibold text-gray-700">{partner.pricing ?? "—"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Dashboard — Staky",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: userId, role, name } = session.user;
  const isPartner = role === "PARTNER" || role === "ADMIN";

  return isPartner ? (
    <PartnerDashboard userId={userId} userName={name} />
  ) : (
    <UserDashboard userId={userId} userName={name} />
  );
}
