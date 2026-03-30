import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Star,
  ArrowRight,
  PenSquare,
  TrendingUp,
  BarChart3,
  Eye,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";

export const metadata = { title: "My Posts — Staky" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-medium", color)}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{value}</span>
      <span className="text-gray-400 font-normal hidden sm:inline">{label}</span>
    </div>
  );
}

// ─── Engagement bar ───────────────────────────────────────────────────────────

function EngagementBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyPostsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const posts = await prisma.alternativePost.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
          recommendations: true,
          savedBy: true,
        },
      },
    },
  });

  if (posts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Posts</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your migration stories and engagement</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <FileText className="h-10 w-10 text-gray-200 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-600">No posts yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-5">
            Share your migration experience on the public feed
          </p>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 rounded-full bg-[#0F6E56] hover:bg-[#0d5f4a] px-5 py-2.5 text-sm font-medium text-white transition-colors"
          >
            <PenSquare className="h-4 w-4" />
            Write a post
          </Link>
        </div>
      </div>
    );
  }

  // Aggregate stats
  const totals = posts.reduce(
    (acc, p) => ({
      likes: acc.likes + p._count.likes,
      comments: acc.comments + p._count.comments,
      recommends: acc.recommends + p._count.recommendations,
      saves: acc.saves + p._count.savedBy,
    }),
    { likes: 0, comments: 0, recommends: 0, saves: 0 }
  );

  const maxEngagement = Math.max(
    ...posts.map((p) => p._count.likes + p._count.comments + p._count.recommendations + p._count.savedBy),
    1
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Posts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{posts.length} post{posts.length !== 1 ? "s" : ""} · all time</p>
        </div>
        <Link
          href="/feed"
          className="flex items-center gap-2 rounded-full bg-[#0F6E56] hover:bg-[#0d5f4a] px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <PenSquare className="h-3.5 w-3.5" />
          New post
        </Link>
      </div>

      {/* Totals row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ThumbsUp, value: totals.likes,     label: "Total likes",    color: "text-[#0F6E56]", bg: "bg-green-50" },
          { icon: MessageCircle, value: totals.comments, label: "Comments",   color: "text-blue-600",  bg: "bg-blue-50" },
          { icon: Star,      value: totals.recommends, label: "Recommendations", color: "text-amber-500", bg: "bg-amber-50" },
          { icon: Bookmark,  value: totals.saves,     label: "Saves",          color: "text-purple-600", bg: "bg-purple-50" },
        ].map(({ icon: Icon, value, label, color, bg }) => (
          <div key={label} className={cn("rounded-xl p-4 flex items-center gap-3", bg)}>
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm shrink-0")}>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Post list */}
      <div className="space-y-3">
        {posts.map((post) => {
          const from = TOOLS[post.fromTool];
          const to = TOOLS[post.toTool];
          const engagement =
            post._count.likes +
            post._count.comments +
            post._count.recommendations +
            post._count.savedBy;

          return (
            <article key={post.id} className="bg-white rounded-xl border border-gray-200 p-5">
              {/* Switch + date */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ToolIcon slug={post.fromTool} size="sm" />
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                  <ToolIcon slug={post.toTool} size="sm" />
                  <span className="text-sm font-medium text-gray-700 truncate ml-1">
                    {from?.name ?? post.fromTool} → {to?.name ?? post.toTool}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(post.createdAt)}</span>
              </div>

              {/* Story preview */}
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">
                {post.story}
              </p>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Engagement bars */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Engagement · {engagement} total
                  </span>
                </div>
                {[
                  { icon: ThumbsUp,      value: post._count.likes,           label: "Likes",           bar: "bg-[#0F6E56]" },
                  { icon: MessageCircle, value: post._count.comments,        label: "Comments",        bar: "bg-blue-500" },
                  { icon: Star,          value: post._count.recommendations, label: "Recommendations", bar: "bg-amber-400" },
                  { icon: Bookmark,      value: post._count.savedBy,         label: "Saves",           bar: "bg-purple-500" },
                ].map(({ icon: Icon, value, label, bar }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-24 flex items-center gap-1.5 text-[11px] text-gray-500 shrink-0">
                      <Icon className="h-3 w-3 shrink-0" />
                      {label}
                    </div>
                    <div className="flex-1">
                      <EngagementBar value={value} max={maxEngagement} color={bar} />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 w-6 text-right shrink-0">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
