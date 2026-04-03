import Image from "next/image";
import Link from "next/link";
import {
  Users,
  FileText,
  Handshake,
  Clock,
  ArrowRightLeft,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { PostActions } from "../admin-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
  userCount: number;
  postCount: number;
  partnerCount: number;
  pendingPartners: number;
  openRequests: number;
  newUsersToday: number;
  pendingPosts: number;
};

type PendingPost = {
  id: string;
  fromTool: string;
  toTool: string;
  story: string;
  published: boolean;
  featured: boolean;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null; role: string };
};

type RecentRequest = {
  id: string;
  fromTool: string;
  toTool: string;
  status: string;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null; email: string };
  partner: { id: string; companyName: string; logoUrl: string | null } | null;
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: "Pending",     cls: "bg-amber-50 text-amber-700" },
  MATCHED:     { label: "Matched",     cls: "bg-blue-50 text-blue-700" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-purple-50 text-purple-700" },
  COMPLETED:   { label: "Completed",   cls: "bg-green-50 text-green-700" },
  CANCELLED:   { label: "Cancelled",   cls: "bg-gray-100 text-gray-500" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OverviewTab({
  stats,
  pendingPosts,
  recentRequests,
}: {
  stats: Stats;
  pendingPosts: PendingPost[];
  recentRequests: RecentRequest[];
}) {
  const metrics = [
    { label: "Total Users",       value: stats.userCount,      icon: Users,           cls: "text-blue-600 bg-blue-50" },
    { label: "Total Posts",       value: stats.postCount,      icon: FileText,        cls: "text-green-600 bg-green-50" },
    { label: "Active Partners",   value: stats.partnerCount,   icon: Handshake,       cls: "text-purple-600 bg-purple-50" },
    { label: "Pending Approval",  value: stats.pendingPartners + stats.pendingPosts, icon: Clock, cls: "text-amber-600 bg-amber-50" },
    { label: "Open Requests",     value: stats.openRequests,   icon: ArrowRightLeft,  cls: "text-rose-600 bg-rose-50" },
    { label: "New Users Today",   value: stats.newUsersToday,  icon: UserPlus,        cls: "text-teal-600 bg-teal-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`p-1.5 rounded-lg ${cls}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Moderation queue */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Moderation Queue</h2>
            <p className="text-xs text-gray-500 mt-0.5">{pendingPosts.length} post{pendingPosts.length !== 1 ? "s" : ""} awaiting approval</p>
          </div>
          <Link href="/app/admin?tab=posts&filter=unpublished" className="flex items-center gap-1 text-xs text-[#0F6E56] hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {pendingPosts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No posts awaiting approval</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingPosts.slice(0, 8).map((post) => (
              <div key={post.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50">
                {/* Author avatar */}
                <div className="shrink-0">
                  {post.author.image ? (
                    <Image src={post.author.image} alt="" width={32} height={32} className="rounded-full" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                      {post.author.name?.[0] ?? "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900 truncate">{post.author.name ?? "Unknown"}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs font-medium text-gray-700">{post.fromTool} → {post.toTool}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{post.story}</p>
                </div>
                <div className="shrink-0">
                  <PostActions postId={post.id} published={post.published} featured={post.featured} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent requests */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Recent Requests</h2>
            <p className="text-xs text-gray-500 mt-0.5">Last 8 migration requests</p>
          </div>
          <Link href="/app/admin?tab=requests" className="flex items-center gap-1 text-xs text-[#0F6E56] hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No requests yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentRequests.map((req) => {
              const status = STATUS_CONFIG[req.status] ?? { label: req.status, cls: "bg-gray-100 text-gray-500" };
              return (
                <div key={req.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                  {req.user.image ? (
                    <Image src={req.user.image} alt="" width={28} height={28} className="rounded-full shrink-0" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                      {req.user.name?.[0] ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-900 truncate">{req.user.name ?? req.user.email}</span>
                    <span className="text-xs text-gray-400 ml-2">{req.fromTool} → {req.toTool}</span>
                  </div>
                  {req.partner && (
                    <span className="text-xs text-gray-500 hidden sm:block">{req.partner.companyName}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>
                    {status.label}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(req.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
