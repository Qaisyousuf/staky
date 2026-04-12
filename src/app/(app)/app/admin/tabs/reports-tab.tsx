import Image from "next/image";
import { Star, TrendingUp } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type MonthBucket = { month: string; year: number; key: string; count: number };

type TopPost = {
  id: string;
  fromTool: string;
  toTool: string;
  author: { id: string; name: string | null; image: string | null };
  _count: { likes: number; recommendations: number; comments: number };
};

type PartnerLeader = {
  id: string;
  companyName: string;
  country: string;
  rating: number;
  projectCount: number;
  logoUrl: string | null;
  user: { name: string | null; image: string | null };
  _count: { leads: number };
};

type ReportsData = {
  userGrowth: MonthBucket[];
  postActivity: MonthBucket[];
  topPosts: TopPost[];
  partnerLeaderboard: PartnerLeader[];
};

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data, color }: { data: MonthBucket[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map((d) => {
        const pct = Math.round((d.count / max) * 100);
        return (
          <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">{d.count}</span>
            <div className="w-full rounded-t-sm" style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: color }} />
            <span className="text-xs text-gray-400">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportsTab({ data }: { data: ReportsData }) {
  const totalUsers = data.userGrowth.reduce((s, d) => s + d.count, 0);
  const totalPosts = data.postActivity.reduce((s, d) => s + d.count, 0);

  const maxEngagement = Math.max(
    ...data.topPosts.map((p) => p._count.likes + p._count.recommendations + p._count.comments),
    1
  );

  return (
    <div className="space-y-5">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Growth */}
        <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">User Growth</h3>
              <p className="text-xs text-gray-500 mt-0.5">Last 6 months</p>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-[#0F6E56]">
              <TrendingUp className="h-4 w-4" />
              {totalUsers} new
            </div>
          </div>
          <BarChart data={data.userGrowth} color="#0F6E56" />
        </div>

        {/* Post Activity */}
        <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Post Activity</h3>
              <p className="text-xs text-gray-500 mt-0.5">Last 6 months</p>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-[#2A5FA5]">
              <TrendingUp className="h-4 w-4" />
              {totalPosts} posts
            </div>
          </div>
          <BarChart data={data.postActivity} color="#2A5FA5" />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Posts */}
        <div className="bg-white rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="px-5 py-4 border-b border-[rgba(0,0,0,0.05)]">
            <h3 className="text-sm font-semibold text-gray-900">Top Posts by Engagement</h3>
          </div>
          {data.topPosts.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No posts yet</div>
          ) : (
            <div className="divide-y divide-[rgba(0,0,0,0.04)]">
              {data.topPosts.map((post, i) => {
                const engagement = post._count.likes + post._count.recommendations + post._count.comments;
                const pct = Math.round((engagement / maxEngagement) * 100);
                return (
                  <div key={post.id} className="px-5 py-3">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-sm font-bold text-gray-300 w-5 text-right shrink-0">#{i + 1}</span>
                      {post.author.image ? (
                        <Image src={post.author.image} alt="" width={24} height={24} className="rounded-full shrink-0" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                          {post.author.name?.[0] ?? "?"}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">
                        {post.fromTool} → {post.toTool}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">{engagement} eng.</span>
                    </div>
                    <div className="ml-8 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0F6E56]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="ml-8 flex gap-3 mt-1 text-xs text-gray-400">
                      <span>{post._count.likes} likes</span>
                      <span>{post._count.recommendations} recs</span>
                      <span>{post._count.comments} comments</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Partner Leaderboard */}
        <div className="bg-white rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="px-5 py-4 border-b border-[rgba(0,0,0,0.05)]">
            <h3 className="text-sm font-semibold text-gray-900">Partner Leaderboard</h3>
          </div>
          {data.partnerLeaderboard.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No approved partners yet</div>
          ) : (
            <div className="divide-y divide-[rgba(0,0,0,0.04)]">
              {data.partnerLeaderboard.map((partner, i) => (
                <div key={partner.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-300 w-5 text-right shrink-0">#{i + 1}</span>
                  {partner.logoUrl ? (
                    <Image src={partner.logoUrl} alt="" width={28} height={28} className="rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-7 w-7 rounded-lg bg-[#2A5FA5]/10 flex items-center justify-center text-xs font-bold text-[#2A5FA5] shrink-0">
                      {partner.companyName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{partner.companyName}</div>
                    <div className="text-xs text-gray-400">{partner.country}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-medium text-gray-700">{partner.rating.toFixed(1)}</span>
                    </div>
                    <div className="text-xs text-gray-400">{partner.projectCount} projects</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
