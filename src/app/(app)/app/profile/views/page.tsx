import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, TrendingUp, Users, Handshake, BadgeCheck } from "lucide-react";
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default async function ProfileViewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getProfileViews(session.user.id);

  const now = Date.now();
  const weeklyCount = data.last30Days
    .filter((d) => now - new Date(d.date).getTime() <= 7 * 86400000)
    .reduce((s, d) => s + d.count, 0);
  const maxBar = Math.max(...data.last30Days.map((d) => d.count), 1);

  const stats = [
    { label: "Total views",       value: data.totalCount.toLocaleString(),      icon: Eye,       accent: "#0F6E56", bg: "#EAF3EE" },
    { label: "This week",         value: weeklyCount.toString(),                 icon: TrendingUp, accent: "#2A5FA5", bg: "#EEF3FA" },
    { label: "Unique visitors",   value: data.uniqueVisitorCount.toString(),     icon: Users,     accent: "#7C3AED", bg: "#F3F0FF" },
    { label: "Partner views",     value: data.partnerViews.toString(),           icon: Handshake, accent: "#D97706", bg: "#FFF7ED" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/network"
          className="flex items-center justify-center h-8 w-8 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Profile views</h1>
          <p className="text-xs text-gray-400">See everyone who visited your profile</p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, accent, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
              </div>
              <span className="text-[11px] font-medium text-gray-400 leading-tight">{label}</span>
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* ── 30-day chart ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-1 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-gray-700">Daily views — last 30 days</p>
          <span className="text-[11px] text-gray-400">peak: {maxBar}</span>
        </div>
        <div className="px-5 pb-5 pt-3">
          <div className="flex items-end gap-[3px] h-20">
            {data.last30Days.map(({ date, count }) => {
              const pct = Math.max((count / maxBar) * 100, count > 0 ? 8 : 2);
              const label = new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
              return (
                <div
                  key={date}
                  className="group relative flex-1 flex flex-col justify-end cursor-default"
                  style={{ height: "100%" }}
                >
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
                    className={count > 0 ? "w-full rounded-t-[3px] opacity-70 group-hover:opacity-100 transition-opacity" : "w-full rounded-t-[3px]"}
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Visitors</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {data.uniqueVisitorCount} unique {data.uniqueVisitorCount === 1 ? "person" : "people"} · {data.totalCount.toLocaleString()} total views
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#EEF3FA] text-[#2A5FA5] font-medium">
                <Handshake className="h-3 w-3" />{data.partnerViews} partner
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {data.recentViewers.map((v) => {
              const isPartnerViewer = v.viewerMode === "partner" && !!(v.viewer as { partner?: { approved?: boolean } | null })?.partner?.approved;
              const vPartner = (v.viewer as { partner?: { companyName?: string; logoUrl?: string | null; approved?: boolean } | null })?.partner;
              const displayName  = isPartnerViewer ? (vPartner?.companyName ?? v.viewer?.name) : v.viewer?.name;
              const displayImage = isPartnerViewer ? (vPartner?.logoUrl ?? v.viewer?.image) : v.viewer?.image;
              const subtitle     = isPartnerViewer
                ? "Migration Partner"
                : [v.viewer?.title, v.viewer?.company].filter(Boolean).join(" · ") || "Staky member";
              const avatarShape  = isPartnerViewer ? "rounded-xl" : "rounded-full";
              const avatarBg     = isPartnerViewer ? "bg-[#2A5FA5]" : "bg-[#0F6E56]";
              const profileHref  = `/app/profile/${v.viewerId}${isPartnerViewer ? "?asPartner=1" : "?asUser=1"}&from=views`;

              return (
                <div key={v.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition-colors">
                  {/* Avatar */}
                  <Link href={profileHref} className="shrink-0">
                    {displayImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayImage}
                        alt={displayName ?? ""}
                        className={cn("h-10 w-10 object-cover shrink-0", avatarShape)}
                      />
                    ) : (
                      <div className={cn("h-10 w-10 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none", avatarShape, avatarBg)}>
                        {getInitials(displayName)}
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={profileHref}
                        className="text-sm font-semibold text-gray-900 hover:text-[#0F6E56] transition-colors truncate leading-tight"
                      >
                        {displayName ?? "Anonymous"}
                      </Link>
                      {isPartnerViewer && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#EEF3FA] text-[#2A5FA5] shrink-0">
                          <BadgeCheck className="h-3 w-3" />Partner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{subtitle}</p>
                  </div>

                  {/* Right side */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400 tabular-nums">{timeAgo(v.createdAt)}</span>
                    <span className="text-[10px] text-gray-300">{formatDate(v.createdAt)}</span>
                  </div>

                  {/* Action */}
                  <Link
                    href={profileHref}
                    className="hidden sm:flex shrink-0 items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-[#0F6E56] hover:border-[#0F6E56] transition-colors"
                  >
                    View profile
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center shadow-sm">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 mb-4">
            <Eye className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No views yet</p>
          <p className="text-xs text-gray-400 mt-1.5 max-w-xs mx-auto">
            Share your profile to start attracting visitors
          </p>
          <Link
            href="/app/network"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#0F6E56] hover:underline"
          >
            <Users className="h-3.5 w-3.5" />
            Go to your network
          </Link>
        </div>
      )}

    </div>
  );
}
