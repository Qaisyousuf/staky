import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Eye, Lock, TrendingUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProfileViews } from "@/actions/profile";
import { cn } from "@/lib/utils";

export const metadata = { title: "Profile views — Staky" };

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function groupByPeriod(viewers: { createdAt: string }[]) {
  const now = Date.now();
  const today: typeof viewers = [];
  const thisWeek: typeof viewers = [];
  const thisMonth: typeof viewers = [];
  for (const v of viewers) {
    const ms = now - new Date(v.createdAt).getTime();
    if (ms < 86400000) today.push(v);
    else if (ms < 7 * 86400000) thisWeek.push(v);
    else thisMonth.push(v);
  }
  return { today, thisWeek, thisMonth };
}

export default async function ProfileViewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getProfileViews(session.user.id);
  const { today, thisWeek, thisMonth } = groupByPeriod(data.recentViewers);

  const isFreePlan =
    (session.user as { plan?: string }).plan === "FREE" ||
    !(session.user as { plan?: string }).plan;

  const maxBar = Math.max(...data.last30Days.map((d) => d.count), 1);

  const now = Date.now();
  const weeklyCount = data.last30Days
    .filter((d) => now - new Date(d.date).getTime() <= 7 * 86400000)
    .reduce((s, d) => s + d.count, 0);
  const monthlyCount = data.last30Days.reduce((s, d) => s + d.count, 0);

  const groups = [
    { label: "Today", items: today },
    { label: "This week", items: thisWeek },
    { label: "This month", items: thisMonth },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/network"
          className="flex items-center justify-center h-8 w-8 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Profile views</h1>
          <p className="text-xs text-gray-400">See who visited your profile</p>
        </div>
      </div>

      {/* ── Stats + chart ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Eye className="h-3.5 w-3.5 text-[#0F6E56]" />
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{data.totalCount.toLocaleString()}</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#0F6E56]" />
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">This week</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{weeklyCount}</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Users className="h-3.5 w-3.5 text-[#0F6E56]" />
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">This month</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{monthlyCount}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="px-5 pt-3 pb-5 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500">Daily views — last 30 days</p>
            <p className="text-[10px] text-gray-400">peak: {maxBar}</p>
          </div>
          <div className="flex items-end gap-[3px] h-20">
            {data.last30Days.map(({ date, count }) => {
              const pct = Math.max((count / maxBar) * 100, count > 0 ? 8 : 2);
              const label = new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
              return (
                <div
                  key={date}
                  className="group relative flex-1 flex flex-col justify-end cursor-default"
                  style={{ height: "100%" }}
                  title={`${label}: ${count} view${count !== 1 ? "s" : ""}`}
                >
                  {/* Tooltip */}
                  {count > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap leading-tight">
                        {count} view{count !== 1 ? "s" : ""}
                        <div className="text-gray-400 font-normal">{label}</div>
                      </div>
                      <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-1" />
                    </div>
                  )}
                  <div
                    className={count > 0 ? "w-full rounded-t-[3px] opacity-70 group-hover:opacity-100 transition-opacity duration-150" : "w-full rounded-t-[3px]"}
                    style={{
                      height: `${pct}%`,
                      background: count > 0 ? "linear-gradient(to top, #0a5a45, #0F6E56)" : "#f3f4f6",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-gray-300">30 days ago</span>
            <span className="text-[10px] text-gray-300">Today</span>
          </div>
        </div>
      </div>

      {/* ── Viewers list ── */}
      {data.recentViewers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent visitors</h2>
              <p className="text-xs text-gray-400 mt-0.5">{data.recentViewers.length} people visited your profile</p>
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <div className="px-5 py-2 bg-gray-50 border-y border-gray-100">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {group.label}
                </span>
              </div>

              {(group.items as typeof data.recentViewers).map((v) => {
                const overallIdx = data.recentViewers.indexOf(v);
                const isBlurred = isFreePlan && overallIdx >= 3;
                const vMode = (v as unknown as { viewerMode?: string }).viewerMode;
                const isPartnerView = vMode === "partner" && !!(v.viewer as unknown as { partner?: { approved?: boolean } })?.partner?.approved;
                const vPartner = (v.viewer as unknown as { partner?: { companyName?: string; logoUrl?: string | null; approved?: boolean } })?.partner;
                const displayName = isPartnerView ? (vPartner?.companyName ?? v.viewer?.name) : v.viewer?.name;
                const displayImage = isPartnerView ? (vPartner?.logoUrl ?? v.viewer?.image) : v.viewer?.image;
                const avatarRounded = isPartnerView ? "rounded-xl" : "rounded-full";
                const subtitle = isPartnerView
                  ? "Migration Partner"
                  : [v.viewer?.title, v.viewer?.company].filter(Boolean).join(" · ") || "Staky member";

                return (
                  <div
                    key={v.id}
                    className={cn(
                      "relative flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0",
                      !isBlurred && "hover:bg-gray-50/60 transition-colors"
                    )}
                  >
                    <div className={cn("flex items-center gap-3 flex-1 min-w-0", isBlurred && "blur-sm pointer-events-none select-none")}>
                      {displayImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={displayImage}
                          alt={displayName ?? ""}
                          className={cn("h-10 w-10 object-cover shrink-0", avatarRounded)}
                        />
                      ) : (
                        <div className={cn("h-10 w-10 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none", isPartnerView ? "rounded-xl bg-[#2A5FA5]" : "rounded-full bg-gray-300")}>
                          {getInitials(displayName)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/app/profile/${v.viewerId}?from=views`}
                          className="text-sm font-semibold text-gray-900 hover:text-[#0F6E56] transition-colors truncate block leading-tight"
                        >
                          {displayName ?? "Anonymous"}
                        </Link>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 tabular-nums">{timeAgo(v.createdAt)}</span>
                      <Link
                        href={`/app/profile/${v.viewerId}?from=views`}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-[#0F6E56] hover:border-[#0F6E56] transition-colors whitespace-nowrap"
                      >
                        View profile
                      </Link>
                    </div>

                    {isBlurred && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 px-3 py-1.5 shadow-sm">
                          <Lock className="h-3 w-3 text-gray-400" />
                          <Link
                            href="/app/settings?tab=billing"
                            className="text-xs font-medium text-[#0F6E56] hover:underline"
                          >
                            Upgrade to see all viewers
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 mb-3">
            <Eye className="h-5 w-5 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No views yet</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Share your profile link to start attracting visitors
          </p>
        </div>
      )}

    </div>
  );
}
