import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Layers, Handshake, Inbox, FileText,
  TrendingUp, ArrowRight, Plus, Compass, PenSquare,
  Heart, MessageCircle, Bookmark, Clock,
  CheckCircle2, CircleDot, XCircle, AlertCircle,
  Building2, BadgeCheck, BarChart3, Eye, UserPlus,
  Zap, MapPin, Settings,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { ToolIcon, type DbTool } from "@/components/shared/tool-icon";
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

const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

// ─── Metric card ──────────────────────────────────────────────────────────────


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

// ─── Tool logo box ────────────────────────────────────────────────────────────

function ToolLogoBox({ tool }: { tool: DbTool | null | undefined }) {
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

// ─── Post card ────────────────────────────────────────────────────────────────

type DashboardPost = {
  id: string; fromTool: string; toTool: string; story: string; createdAt: Date;
  fromToolData?: DbTool | null; toToolData?: DbTool | null;
  author: { name: string | null; image: string | null; title: string | null; company: string | null; role: string };
  _count: { likes: number; comments: number };
};

function PostCard({ post }: { post: DashboardPost }) {
  const isPartner = post.author.role === "PARTNER";
  const fromData = post.fromToolData;
  const toData   = post.toToolData;

  return (
    <Link href={`/app/feed?post=${post.id}`}>
      <article
        className="group flex flex-col rounded-2xl bg-white overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(27,43,31,0.10)] cursor-pointer"
        style={{ border: isPartner ? "1.5px solid rgba(42,95,165,0.18)" : "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)" }}
      >
        {/* Switch header — green band */}
        <div
          className="px-4 py-3.5 flex items-center gap-2"
          style={{ background: isPartner ? "#F0F5FA" : "#F4FAF7", borderBottom: `1px solid ${isPartner ? "rgba(42,95,165,0.08)" : "rgba(15,110,86,0.08)"}` }}
        >
          <ToolLogoBox tool={fromData} />
          <span className="text-[12px] font-medium text-[#4D5D52] truncate flex-1">{fromData?.name ?? post.fromTool}</span>
          <ArrowRight className={cn("h-3.5 w-3.5 shrink-0 mx-0.5", isPartner ? "text-[#2A5FA5]" : "text-[#0F6E56]")} />
          <span className={cn("text-[12px] font-medium truncate flex-1 text-right", isPartner ? "text-[#2A5FA5]" : "text-[#0F6E56]")}>{toData?.name ?? post.toTool}</span>
          <ToolLogoBox tool={toData} />
        </div>

        <div className="p-5 flex flex-col flex-1">
          {/* Story */}
          <p className="flex-1 line-clamp-3 text-[13px] leading-[1.75] text-[#5C6B5E] mb-4">
            &ldquo;{post.story}&rdquo;
          </p>

          {/* Author + engagement */}
          <div className="flex items-center gap-2.5 pt-3 border-t border-[#F0EDE8]">
            {post.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author.image} alt={post.author.name ?? ""}
                className={cn("h-7 w-7 object-cover shrink-0", isPartner ? "rounded-lg" : "rounded-full")} />
            ) : (
              <div className={cn(
                "h-7 w-7 flex items-center justify-center bg-[#0F6E56] text-white text-[10px] font-bold shrink-0 select-none",
                isPartner ? "rounded-lg" : "rounded-full"
              )}>
                {getInitials(post.author.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[#1B2B1F] truncate leading-tight">{post.author.name ?? "Member"}</p>
              <p className="text-[10px] text-[#9BA39C]">{timeAgo(post.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1 text-[11px] text-[#9BA39C]"><Heart className="h-3 w-3" />{post._count.likes}</span>
              <span className="flex items-center gap-1 text-[11px] text-[#9BA39C]"><MessageCircle className="h-3 w-3" />{post._count.comments}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, action, blue }: { title: string; action?: { href: string; label: string }; blue?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[13px] font-bold text-[#1B2B1F]">{title}</h2>
      {action && (
        <Link
          href={action.href}
          className={cn(
            "flex items-center gap-1 text-[11px] font-semibold hover:underline",
            blue ? "text-[#2A5FA5]" : "text-[#0F6E56]"
          )}
        >
          {action.label}<ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ─── User Dashboard ───────────────────────────────────────────────────────────

async function UserDashboard({ userId, userName, activeMode, hasPartner }: { userId: string; userName: string | null | undefined; activeMode: string; hasPartner: boolean }) {
  const [userProfile, followingCount, connectionCount, stackItems, profileViewsCount, recentViewers, topAlts] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, image: true, title: true, company: true, bio: true, location: true },
      }),
      prisma.follow.count({ where: { followerId: userId, followerMode: activeMode } }),
      prisma.connection.count({ where: { OR: [{ userId, requesterMode: activeMode }, { targetId: userId, targetMode: activeMode }] } }),
      prisma.stackItem.findMany({ where: { stack: { userId, mode: activeMode } }, orderBy: { order: "asc" }, take: 8 }),
      prisma.profileView.count({ where: { profileId: userId } }),
      prisma.profileView.findMany({
        where: { profileId: userId, viewerId: { not: null } },
        include: { viewer: { select: { id: true, name: true, image: true, title: true, partner: { select: { companyName: true, logoUrl: true, approved: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 10,
        distinct: ["viewerId"],
      }),
      prisma.softwareAlternative.findMany({
        where: { published: true },
        orderBy: { switcherCount: "desc" },
        take: 4,
        include: {
          fromTool: { select: { name: true, logoUrl: true, color: true, abbr: true, country: true } },
          toTool:   { select: { name: true, logoUrl: true, color: true, abbr: true, country: true } },
        },
      }),
    ]);

  // Resolve stack tool names → slugs via DB for feed filtering
  const stackToolNames = stackItems.map((i) => i.toolName);
  const [dbStackTools, suggestedUsers] = await Promise.all([
    prisma.softwareTool.findMany({
      where: { name: { in: stackToolNames } },
      select: { name: true, slug: true, logoUrl: true, color: true, abbr: true, country: true },
    }),
    getSuggestedProfiles([userId]),
  ]);
  const toolByName = new Map(dbStackTools.map((t) => [t.name.toLowerCase(), t]));
  const stackSlugs = dbStackTools.map((t) => t.slug);

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

  // Fetch tool data for feed post slugs
  const feedSlugs = Array.from(new Set(feedPosts.flatMap((p) => [p.fromTool, p.toTool])));
  const feedDbTools = await prisma.softwareTool.findMany({
    where: { slug: { in: feedSlugs } },
    select: { slug: true, name: true, logoUrl: true, color: true, abbr: true, country: true },
  });
  const toolBySlug = new Map(feedDbTools.map((t) => [t.slug, t]));

  const AVATAR_COLORS = ["#0F6E56", "#2A5FA5", "#7C5CBF", "#B85C38", "#1F6B85", "#8A5C1F"];
  const avatarColor = AVATAR_COLORS[(userProfile?.name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

  const CARD_SHADOW = "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)";
  const CARD_BORDER = "1.5px solid rgba(0,0,0,0.06)";

  return (
    <div className="max-w-5xl mx-auto space-y-4 px-4 sm:px-6 lg:px-8" style={{ fontFamily: F }}>

      {/* ── Profile hero card ─────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col rounded-2xl bg-white overflow-hidden"
        style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
      >
        {/* Colour band */}
        <div className="h-28 sm:h-32 w-full shrink-0" style={{ background: `linear-gradient(135deg, ${avatarColor}40, ${avatarColor}18)` }} />

        {/* Avatar row */}
        <div className="px-6 -mt-12 flex items-end justify-between gap-4">
          {userProfile?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userProfile.image}
              alt={userProfile.name ?? ""}
              className="h-24 w-24 rounded-2xl ring-4 ring-white object-cover shrink-0"
            />
          ) : (
            <div
              className="h-24 w-24 rounded-2xl ring-4 ring-white flex items-center justify-center text-white text-[22px] font-black shrink-0 select-none"
              style={{ backgroundColor: avatarColor }}
            >
              {getInitials(userProfile?.name ?? userName)}
            </div>
          )}
          {/* Action buttons — aligned to bottom of avatar */}
          <div className="flex items-center gap-2 pb-1 flex-wrap justify-end">
            {!hasPartner && (
              <Link
                href="/app/settings?tab=partner"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white hover:bg-[#F7F9FC] text-[#5C6B5E] text-[12px] font-semibold px-3.5 py-2 transition-colors"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                <Handshake className="h-3.5 w-3.5 text-[#9BA39C]" />
                Become a partner
              </Link>
            )}
            <Link
              href="/app/settings"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] text-white text-[12px] font-semibold px-3.5 py-2 transition-colors"
              style={{ boxShadow: "0 1px 4px rgba(15,110,86,0.25)" }}
            >
              <Settings className="h-3.5 w-3.5" />
              Edit profile
            </Link>
          </div>
        </div>

        {/* Profile info */}
        <div className="px-6 pt-4 pb-5">
          <p className="text-[18px] font-black text-[#1B2B1F] leading-tight">{userProfile?.name ?? userName ?? "Member"}</p>
          {(userProfile?.title || userProfile?.company) && (
            <p className="text-[13px] text-[#6B7B6E] mt-0.5">
              {[userProfile.title, userProfile.company].filter(Boolean).join(" · ")}
            </p>
          )}
          {userProfile?.location && (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#9BA39C]">
              <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: avatarColor }} />
              {userProfile.location}
            </p>
          )}
          {userProfile?.bio && (
            <p className="mt-3 text-[13px] leading-relaxed text-[#5C6B5E] line-clamp-2 max-w-[560px]">{userProfile.bio}</p>
          )}

          {/* Stats strip */}
          <div className="mt-5 flex flex-wrap gap-6 pt-4 border-t border-[#F0EDE8]">
            {[
              { value: followingCount,    label: "Following",       href: "/app/network",       color: "#2A5FA5" },
              { value: connectionCount,   label: "Connected",       href: "/app/network",       color: "#7C5CBF" },
              { value: profileViewsCount, label: "Profile views",   href: "/app/profile/views", color: "#B85C38" },
            ].map(({ value, label, href, color }) => (
              <Link key={label} href={href} className="group flex flex-col items-start gap-0.5 hover:opacity-80 transition-opacity">
                <span className="text-[22px] font-black leading-none" style={{ color }}>{value}</span>
                <span className="text-[11px] text-[#9BA39C] font-medium group-hover:text-[#5C6B5E] transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { href: "/app/my-stack",  icon: Plus,      label: "Add to stack",  desc: "Manage EU tools",    iconBg: "bg-[#E8F5F1]",  iconColor: "text-[#0F6E56]"  },
          { href: "/app/discover",  icon: Compass,   label: "Browse tools",  desc: "Find alternatives",  iconBg: "bg-[#EBF1FA]",  iconColor: "text-[#2A5FA5]"  },
          { href: "/app/partners",  icon: Handshake, label: "Find partner",  desc: "Get migration help", iconBg: "bg-purple-50",  iconColor: "text-purple-600" },
          { href: "/app/feed",      icon: PenSquare, label: "Write story",   desc: "Share experience",   iconBg: "bg-amber-50",   iconColor: "text-amber-600"  },
        ] as const).map(({ href, icon: Icon, label, desc, iconBg, iconColor }) => (
          <Link key={href} href={href}
            className="group bg-white rounded-xl p-4 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-0.5"
            style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
          >
            <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3", iconBg)}>
              <Icon className={cn("h-4 w-4", iconColor)} />
            </span>
            <p className="text-[12px] font-bold text-[#1B2B1F]">{label}</p>
            <p className="text-[11px] text-[#9BA39C] mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* ── Main content grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_292px] gap-4">

        {/* Feed */}
        <div>
          <SectionHeader
            title={stackItems.length > 0 ? "From your stack" : "Recent stories"}
            action={{ href: "/app/feed", label: "View all" }}
          />
          {feedPosts.length > 0 ? (
            <div className="flex flex-col gap-5">
              {feedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{ ...post, fromToolData: toolBySlug.get(post.fromTool) ?? null, toToolData: toolBySlug.get(post.toTool) ?? null }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center" style={{ border: "1.5px dashed rgba(0,0,0,0.09)", boxShadow: CARD_SHADOW }}>
              <FileText className="h-8 w-8 text-[#9BA39C] mx-auto mb-3" />
              <p className="text-[13px] font-semibold text-[#1B2B1F]">No stories yet</p>
              <p className="text-[12px] text-[#9BA39C] mt-1 mb-4">
                {stackItems.length > 0 ? "No posts about your stack tools yet." : "Be the first to share your migration story."}
              </p>
              <Link href="/app/feed" className="inline-flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] text-white text-[12px] font-semibold px-4 py-2 transition-colors">
                <PenSquare className="h-3.5 w-3.5" />Write a story
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">

          {/* Who viewed your profile */}
          <div className="bg-white rounded-2xl p-4" style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
            <SectionHeader title="Who viewed your profile" action={{ href: "/app/profile/views", label: "See all" }} />
            {recentViewers.length > 0 ? (
              <div className="space-y-3">
                {recentViewers.slice(0, 4).map((v) => {
                  const vm = (v as unknown as { viewerMode?: string }).viewerMode ?? "user";
                  const vPartner = (v.viewer as unknown as { partner?: { companyName: string; logoUrl: string | null; approved: boolean } | null })?.partner;
                  const isPC = vm === "partner" && !!vPartner?.approved;
                  const dName  = isPC ? (vPartner!.companyName ?? v.viewer?.name) : v.viewer?.name;
                  const dImage = isPC ? (vPartner!.logoUrl ?? v.viewer?.image) : v.viewer?.image;
                  const shape  = isPC ? "rounded-lg" : "rounded-full";
                  const bg     = isPC ? "bg-[#2A5FA5]" : "bg-[#0F6E56]";
                  return (
                  <Link key={v.id} href={`/app/profile/${v.viewerId}${isPC ? "?asPartner=1" : "?asUser=1"}&from=views`} className="flex items-center gap-3 group">
                    {dImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dImage} alt={dName ?? ""} className={`h-8 w-8 ${shape} object-cover shrink-0`} />
                    ) : (
                      <div className={`h-8 w-8 ${shape} ${bg} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                        {getInitials(dName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-[#1B2B1F] truncate group-hover:text-[#0F6E56] transition-colors">
                        {dName ?? "Anonymous"}
                      </p>
                      <p className="text-[10px] text-[#9BA39C] truncate">{isPC ? "Migration Partner" : (v.viewer?.title ?? "Staky member")}</p>
                    </div>
                  </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5">
                <Eye className="h-6 w-6 text-[#9BA39C] mx-auto mb-2" />
                <p className="text-[12px] text-[#9BA39C]">No profile views yet</p>
              </div>
            )}
          </div>

          {/* Your stack */}
          <div className="bg-white rounded-2xl p-4" style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
            <SectionHeader title="Your stack" action={{ href: "/app/my-stack", label: "Manage" }} />
            {stackItems.length > 0 ? (
              <div className="flex flex-wrap gap-x-5 gap-y-5">
                {stackItems.map((item) => {
                  const dbTool = toolByName.get(item.toolName.toLowerCase());
                  return dbTool ? (
                    <div key={item.id} className="flex flex-col items-center gap-1.5">
                      <ToolIcon toolData={dbTool} size="md" />
                      <span className="text-[9px] text-[#9BA39C] max-w-[44px] text-center truncate leading-tight">{dbTool.name}</span>
                    </div>
                  ) : (
                    <span key={item.id} className="inline-flex items-center rounded-lg bg-[#F7F9FC] px-2.5 py-1.5 text-[11px] font-medium text-[#5C6B5E]">
                      {item.toolName}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-5">
                <Layers className="h-7 w-7 text-[#9BA39C] mx-auto mb-2" />
                <p className="text-[12px] text-[#5C6B5E] mb-3">Your stack is empty</p>
                <Link href="/app/my-stack" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0F6E56] hover:underline">
                  <Plus className="h-3.5 w-3.5" />Add tools
                </Link>
              </div>
            )}
          </div>

          {/* Suggested switches */}
          <div className="bg-white rounded-2xl p-4" style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
            <SectionHeader title="Suggested switches" action={{ href: "/app/discover", label: "See all" }} />
            <div>
              {topAlts.map((alt) => (
                <Link key={alt.id} href={`/app/discover?category=${encodeURIComponent(alt.category)}`}
                  className="flex items-center gap-3 py-2.5 border-b border-[#F0EDE8] last:border-0 -mx-4 px-4 hover:bg-[#F7F9FC] transition-colors"
                >
                  <ToolIcon toolData={alt.fromTool} size="sm" />
                  <ArrowRight className="h-3 w-3 text-[#9BA39C] shrink-0" />
                  <ToolIcon toolData={alt.toTool} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[#1B2B1F] truncate">{alt.toTool.name}</p>
                    <p className="text-[10px] text-[#9BA39C]">{alt.switcherCount.toLocaleString()} switched</p>
                  </div>
                  <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Grow network */}
          {suggestedUsers.length > 0 && (
            <div className="bg-white rounded-2xl p-4" style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
              <SectionHeader title="Grow your network" action={{ href: "/app/network", label: "View all" }} />
              <div className="space-y-3">
                {suggestedUsers.slice(0, 3).map((u) => {
                  const uIsPC = !!u.partner?.approved;
                  const uDisplayName = uIsPC ? (u.partner!.companyName ?? u.name) : u.name;
                  const uDisplayImage = uIsPC ? (u.partner!.logoUrl ?? u.image) : u.image;
                  const profileHref = `/app/profile/${u.id}${uIsPC ? "?asPartner=1" : "?asUser=1"}`;
                  return (
                    <div key={u.id} className="flex items-center gap-3">
                      {uDisplayImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={uDisplayImage} alt={uDisplayName ?? ""} className={`h-8 w-8 object-cover shrink-0 ${uIsPC ? "rounded-xl" : "rounded-full"}`} />
                      ) : (
                        <div className={`h-8 w-8 flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${uIsPC ? "rounded-xl bg-[#2A5FA5]" : "rounded-full bg-[#0F6E56]"}`}>
                          {getInitials(uDisplayName)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link href={profileHref} className="text-[12px] font-semibold text-[#1B2B1F] hover:text-[#0F6E56] truncate block transition-colors">
                          {uDisplayName ?? "Anonymous"}
                        </Link>
                        <p className="text-[10px] text-[#9BA39C] truncate">{uIsPC ? "Migration Partner" : (u.title ?? u.company ?? "Staky member")}</p>
                      </div>
                      <Link href={profileHref}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-[#E8F5F1] text-[#0F6E56] hover:bg-green-100 transition-colors shrink-0"
                      >
                        <UserPlus className="h-3 w-3" />View
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Partner Dashboard ────────────────────────────────────────────────────────

async function PartnerDashboard({ userId }: { userId: string }) {
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

  // Resolve tool slugs to names for leads + posts
  const partnerToolSlugs = Array.from(new Set([
    ...(recentLeads as { fromTool: string; toTool: string }[]).flatMap((l) => [l.fromTool, l.toTool]),
    ...myPosts.flatMap((p) => [p.fromTool, p.toTool]),
  ]));
  const partnerDbTools = await prisma.softwareTool.findMany({
    where: { slug: { in: partnerToolSlugs } },
    select: { slug: true, name: true, logoUrl: true, color: true, abbr: true, country: true },
  });
  const partnerToolBySlug = new Map(partnerDbTools.map((t) => [t.slug, t]));

  const companyInitials = (partner?.companyName ?? "P")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const CARD_SHADOW = "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)";
  const CARD_BORDER = "1.5px solid rgba(0,0,0,0.06)";

  return (
    <div className="max-w-5xl mx-auto space-y-4 px-4 sm:px-6 lg:px-8" style={{ fontFamily: F }}>

      {/* ── Company hero card ──────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col rounded-2xl bg-white overflow-hidden"
        style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
      >
        {/* Cover image or gradient band */}
        {partner?.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={partner.coverImage}
            alt="Cover"
            className="h-28 sm:h-36 w-full object-cover shrink-0"
          />
        ) : (
          <div className="h-28 sm:h-32 w-full shrink-0" style={{ background: "linear-gradient(135deg, #2A5FA540, #2A5FA518)" }} />
        )}

        {/* Logo row */}
        <div className="px-6 -mt-12 flex items-end justify-between gap-4">
          {partner?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={partner.logoUrl}
              alt={partner.companyName}
              className="h-24 w-24 rounded-2xl ring-4 ring-white object-cover shrink-0"
            />
          ) : (
            <div
              className="h-24 w-24 rounded-2xl ring-4 ring-white flex items-center justify-center text-white text-[22px] font-black shrink-0 select-none"
              style={{ background: "linear-gradient(135deg, #2A5FA5 0%, #1a3d6e 100%)" }}
            >
              {companyInitials}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-1">
            <Link
              href="/app/settings?tab=partner"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2A5FA5] hover:bg-[#244d8a] text-white text-[12px] font-semibold px-3.5 py-2 transition-colors"
              style={{ boxShadow: "0 1px 4px rgba(42,95,165,0.25)" }}
            >
              <Settings className="h-3.5 w-3.5" />
              Edit profile
            </Link>
          </div>
        </div>

        {/* Company info */}
        <div className="px-6 pt-4 pb-5">
          {/* Name + verified badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[18px] font-black text-[#1B2B1F] leading-tight">
              {partner?.companyName ?? "Your Company"}
            </p>
            {partner?.approved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF1FA] px-2 py-0.5 text-[10px] font-bold text-[#2A5FA5]">
                <BadgeCheck className="h-3 w-3" />Verified partner
              </span>
            )}
          </div>

          {/* Country · projects */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {partner?.country && (
              <>
                <span className="inline-flex items-center gap-1 text-[12px] text-[#5C6B5E]">
                  <Building2 className="h-3.5 w-3.5 text-[#9BA39C] shrink-0" />
                  {partner.country}
                </span>
                <span className="text-[#C8D0CA] text-[12px]">·</span>
              </>
            )}
            <span className="text-[12px] text-[#5C6B5E]">
              <span className="font-semibold text-[#1B2B1F]">{partner?.projectCount ?? 0}</span> projects
            </span>
          </div>

          {/* Specialty chips */}
          {partner && (partner.specialty ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(partner.specialty ?? []).slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full bg-[#EBF1FA] px-2.5 py-0.5 text-[10px] font-medium text-[#2A5FA5]"
                  style={{ border: "1px solid rgba(42,95,165,0.12)" }}
                >
                  {s}
                </span>
              ))}
              {(partner.specialty ?? []).length > 5 && (
                <span className="inline-flex items-center rounded-full bg-[#F7F9FC] px-2.5 py-0.5 text-[10px] font-medium text-[#5C6B5E]">
                  +{(partner.specialty ?? []).length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Stats strip */}
          <div className="mt-5 flex flex-wrap gap-6 pt-4 border-t border-[#F0EDE8]">
            {[
              { value: newLeadsCount,       label: "New leads",       href: "/app/leads", color: "#B85C38" },
              { value: activeProjectsCount, label: "Active projects",  href: "/app/leads", color: "#0F6E56" },
              { value: followerCount,       label: "Followers",        href: undefined,    color: "#2A5FA5" },
            ].map(({ value, label, href, color }) => {
              const inner = (
                <span key={label} className="group flex flex-col items-start gap-0.5">
                  <span className="text-[22px] font-black leading-none" style={{ color }}>{value}</span>
                  <span className="text-[11px] text-[#9BA39C] font-medium group-hover:text-[#5C6B5E] transition-colors">{label}</span>
                </span>
              );
              return href ? (
                <Link key={label} href={href} className="hover:opacity-80 transition-opacity">{inner}</Link>
              ) : <span key={label}>{inner}</span>;
            })}
          </div>
        </div>
      </div>

      {/* Pending approval banner */}
      {partner && !partner.approved && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-4" style={{ background: "#FFFBEB", border: "1.5px solid rgba(245,158,11,0.2)" }}>
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-[13px] font-bold text-amber-800">Approval pending</p>
            <p className="text-[12px] text-amber-600 mt-0.5">Your partner profile is under review. You&apos;ll be notified once approved.</p>
          </div>
        </div>
      )}

      {/* ── Content grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_292px] gap-4">
        <div className="space-y-4">

          {/* Recent leads */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <div>
                <h2 className="text-[13px] font-bold text-[#1B2B1F]">Recent leads</h2>
                <p className="text-[11px] text-[#9BA39C] mt-0.5">{recentLeads.length} migration request{recentLeads.length !== 1 ? "s" : ""}</p>
              </div>
              <Link href="/app/leads" className="flex items-center gap-1 text-[11px] font-semibold text-[#2A5FA5] hover:underline">
                All leads<ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentLeads.length > 0 ? (
              <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                {recentLeads.map((lead) => {
                  const fromData = partnerToolBySlug.get(lead.fromTool);
                  const toData   = partnerToolBySlug.get(lead.toTool);
                  return (
                    <Link key={lead.id} href={`/app/leads/${lead.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAF9] transition-colors"
                    >
                      {lead.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={lead.user.image} alt={lead.user.name ?? ""} className="h-9 w-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-[#EBF1FA] flex items-center justify-center text-[#2A5FA5] text-[11px] font-bold shrink-0">
                          {getInitials(lead.user.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1B2B1F] truncate">{lead.user.name ?? lead.user.email}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {fromData ? (
                            <ToolLogoBox tool={fromData as DbTool} />
                          ) : null}
                          <span className="text-[10px] text-[#9BA39C]">{fromData?.name ?? lead.fromTool}</span>
                          <ArrowRight className="h-2.5 w-2.5 text-[#9BA39C] shrink-0" />
                          <span className="text-[10px] font-semibold text-[#2A5FA5]">{toData?.name ?? lead.toTool}</span>
                          {toData ? (
                            <ToolLogoBox tool={toData as DbTool} />
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={lead.status} />
                        <span className="text-[10px] text-[#9BA39C]">{timeAgo(lead.createdAt)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Inbox className="h-8 w-8 text-[#9BA39C] mx-auto mb-3" />
                <p className="text-[13px] font-semibold text-[#1B2B1F]">No leads yet</p>
                <p className="text-[12px] text-[#9BA39C] mt-1">
                  {partner?.approved ? "Leads appear when businesses request your help." : "Leads come in once your profile is approved."}
                </p>
              </div>
            )}
          </div>

          {/* Post performance */}
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <div>
                <h2 className="text-[13px] font-bold text-[#1B2B1F]">Post performance</h2>
                <p className="text-[11px] text-[#9BA39C] mt-0.5">{myPosts.length} published post{myPosts.length !== 1 ? "s" : ""}</p>
              </div>
              <Link href="/app/my-posts" className="flex items-center gap-1 text-[11px] font-semibold text-[#2A5FA5] hover:underline">
                All posts<ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {myPosts.length > 0 ? (
              <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                {myPosts.map((post) => {
                  const fromData = partnerToolBySlug.get(post.fromTool);
                  const toData   = partnerToolBySlug.get(post.toTool);
                  const total    = post._count.likes + post._count.comments + post._count.recommendations;
                  const max      = Math.max(...myPosts.map((p) => p._count.likes + p._count.comments + p._count.recommendations), 1);
                  return (
                    <div key={post.id} className="px-5 py-4 hover:bg-[#FAFAF9] transition-colors">
                      {/* Tool path + story */}
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                        style={{ background: "#F0F5FA", border: "1px solid rgba(42,95,165,0.08)" }}
                      >
                        {fromData && <ToolLogoBox tool={fromData as DbTool} />}
                        <span className="text-[11px] font-medium text-[#5C6B5E] truncate flex-1">{fromData?.name ?? post.fromTool}</span>
                        <ArrowRight className="h-3 w-3 text-[#2A5FA5] shrink-0" />
                        <span className="text-[11px] font-semibold text-[#2A5FA5] truncate flex-1 text-right">{toData?.name ?? post.toTool}</span>
                        {toData && <ToolLogoBox tool={toData as DbTool} />}
                      </div>
                      <p className="text-[13px] text-[#5C6B5E] leading-relaxed line-clamp-2 mb-3">
                        &ldquo;{post.story}&rdquo;
                      </p>
                      {/* Engagement bar */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-[11px] text-[#9BA39C]">
                          <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post._count.likes}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post._count.comments}</span>
                          <span className="flex items-center gap-1"><Bookmark className="h-3.5 w-3.5" />{post._count.recommendations}</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(total / max) * 100}%`, background: "#2A5FA5" }} />
                        </div>
                        <span className="text-[10px] font-semibold text-[#5C6B5E] shrink-0">{total} engagements</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-8 w-8 text-[#9BA39C] mx-auto mb-3" />
                <p className="text-[13px] font-semibold text-[#1B2B1F]">No posts yet</p>
                <p className="text-[12px] text-[#9BA39C] mt-1 mb-4">Share migration stories to attract leads.</p>
                <Link href="/app/my-posts" className="inline-flex items-center gap-1.5 rounded-xl bg-[#2A5FA5] hover:bg-[#244d8a] text-white text-[12px] font-semibold px-4 py-2 transition-colors">
                  <PenSquare className="h-3.5 w-3.5" />Write first post
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
        <div className="space-y-3">

          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-4" style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
            <h3 className="text-[13px] font-bold text-[#1B2B1F] mb-3">Quick actions</h3>
            <div className="space-y-0.5">
              {([
                { href: "/app/leads",           icon: Inbox,     label: "Manage leads",         iconBg: "#EBF1FA", iconColor: "#2A5FA5" },
                { href: "/app/my-posts",        icon: PenSquare, label: "Write a post",          iconBg: "#EAF3EE", iconColor: "#0F6E56" },
                { href: "/app/settings?tab=company", icon: Building2, label: "Edit company profile", iconBg: "#F3EFFE", iconColor: "#7C5CBF" },
                { href: "/app/discover",        icon: Compass,   label: "Browse alternatives",   iconBg: "#FEF3EC", iconColor: "#B85C38" },
              ] as const).map(({ href, icon: Icon, label, iconBg, iconColor }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-[#5C6B5E] hover:bg-[#F7F9F8] hover:text-[#1B2B1F] transition-all group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors" style={{ background: iconBg }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
                  </div>
                  <span className="flex-1 font-medium">{label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#C8D0CA] group-hover:text-[#9BA39C] transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Specialties */}
          {partner && (partner.specialty ?? []).length > 0 && (
            <div className="bg-white rounded-2xl p-4" style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-[#1B2B1F]">Your specialties</h3>
                <Link href="/app/settings?tab=company" className="text-[11px] font-semibold text-[#2A5FA5] hover:underline">Edit</Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(partner.specialty ?? []).map((spec) => (
                  <span key={spec} className="inline-flex items-center rounded-full bg-[#EBF1FA] px-2.5 py-1 text-[11px] font-medium text-[#2A5FA5]"
                    style={{ border: "1px solid rgba(42,95,165,0.12)" }}>
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Profile visibility */}
          {partner && (
            <div className="bg-white rounded-2xl p-4" style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
              <h3 className="text-[13px] font-bold text-[#1B2B1F] mb-3">Profile status</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Approval",      value: partner.approved  ? "Approved"       : "Pending",       ok: partner.approved  },
                  { label: "Featured",      value: partner.featured  ? "Featured"       : "Not featured",  ok: partner.featured  },
                  { label: "Projects done", value: String(partner.projectCount),                           ok: true              },
                  { label: "Pricing",       value: partner.pricing ?? "—",                                 ok: !!partner.pricing },
                ].map(({ label, value, ok }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-[rgba(0,0,0,0.04)] last:border-0">
                    <span className="text-[11px] text-[#9BA39C]">{label}</span>
                    <span className="text-[11px] font-semibold" style={{ color: ok ? "#0F6E56" : "#9BA39C" }}>{value}</span>
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
  const hasPartner = userRecord?.partner != null;

  const isPartnerMode = partnerApproved && activeMode === "partner";
  return isPartnerMode
    ? <PartnerDashboard userId={userId} />
    : <UserDashboard userId={userId} userName={name} activeMode={activeMode} hasPartner={hasPartner} />;
}
