import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Eye, Lock } from "lucide-react";
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

  const isFreePlan = (session.user as { plan?: string }).plan === "FREE" ||
    !(session.user as { plan?: string }).plan;

  const maxBar = Math.max(...data.last30Days.map((d) => d.count), 1);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${session.user.id}`}
          className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Profile views</h1>
          <p className="text-sm text-gray-500">See who visited your profile</p>
        </div>
      </div>

      {/* Total count card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 border border-green-100">
            <Eye className="h-6 w-6 text-[#0F6E56]" />
          </div>
          <div>
            <p className="text-3xl font-bold text-[#0F6E56]">{data.totalCount.toLocaleString()}</p>
            <p className="text-sm text-gray-500">total profile views</p>
          </div>
        </div>
      </div>

      {/* 30-day bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Last 30 days</h2>
        <div className="flex items-end gap-0.5 h-24">
          {data.last30Days.map(({ date, count }) => (
            <div
              key={date}
              className="flex-1 group relative"
              title={`${date}: ${count} view${count !== 1 ? "s" : ""}`}
            >
              <div
                className="bg-[#0F6E56] rounded-sm opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ height: `${Math.max((count / maxBar) * 100, count > 0 ? 4 : 0)}%`, minHeight: count > 0 ? "3px" : "0" }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">30 days ago</span>
          <span className="text-[10px] text-gray-400">Today</span>
        </div>
      </div>

      {/* Viewers list */}
      {data.recentViewers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent viewers</h2>
          </div>

          {[
            { label: "Today", items: today },
            { label: "This week", items: thisWeek },
            { label: "This month", items: thisMonth },
          ]
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <div key={group.label}>
                <p className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100">
                  {group.label}
                </p>
                {(group.items as typeof data.recentViewers).map((v) => {
                  const overallIdx = data.recentViewers.indexOf(v);
                  const isBlurred = isFreePlan && overallIdx >= 3;

                  return (
                    <div
                      key={v.id}
                      className={cn(
                        "relative flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 last:border-0",
                        isBlurred ? "select-none" : "hover:bg-gray-50 transition-colors"
                      )}
                    >
                      <div className={cn("flex items-center gap-4 flex-1 min-w-0", isBlurred && "blur-sm pointer-events-none")}>
                        {v.viewer?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.viewer.image}
                            alt={v.viewer.name ?? ""}
                            className="h-10 w-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[#0F6E56] flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {getInitials(v.viewer?.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/profile/${v.viewerId}`}
                            className="text-sm font-medium text-gray-900 hover:text-[#0F6E56] transition-colors truncate block"
                          >
                            {v.viewer?.name ?? "Anonymous"}
                          </Link>
                          <p className="text-xs text-gray-400 truncate">
                            {[v.viewer?.title, v.viewer?.company].filter(Boolean).join(" · ") || "Staky member"}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{timeAgo(v.createdAt)}</span>
                      </div>

                      {isBlurred && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm">
                            <Lock className="h-3.5 w-3.5 text-gray-400" />
                            <Link href="/settings?tab=billing" className="text-xs font-medium text-[#0F6E56] hover:underline">
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
      )}

      {data.recentViewers.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-14 text-center">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">No views yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Share your profile to attract more visitors
          </p>
        </div>
      )}
    </div>
  );
}
