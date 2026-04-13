"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search, UserPlus, UserCheck, MessageSquare, Eye,
  MapPin, BadgeCheck, Settings, TrendingUp, Users,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFollow } from "@/actions/social";

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_SHADOW = "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)";
const CARD_BORDER = "1.5px solid rgba(0,0,0,0.06)";
const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "followers" | "following" | "connections";

interface CurrentUser {
  id: string;
  name: string | null;
  image: string | null;
  coverImage: string | null;
  bio: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  role: string;
  activeMode: string;
  verified: boolean;
  interests: string[];
  followerCount: number;
  followingCount: number;
  connectionCount: number;
  partner: {
    companyName: string;
    logoUrl: string | null;
    coverImage: string | null;
    specialty: string[];
    description: string | null;
    country: string | null;
    rating: number;
    approved: boolean;
  } | null;
}

interface ProfileViews {
  totalCount: number;
  weeklyCount: number;
  last30Days: { date: string; count: number }[];
  recentViewers: {
    id: string;
    viewerId: string | null;
    createdAt: string;
    viewer: { id: string; name: string | null; image: string | null; title: string | null; company: string | null } | null;
  }[];
}

interface NetworkUser {
  id: string;
  name: string | null;
  image: string | null;
  title: string | null;
  company: string | null;
  role: string;
  activeMode?: string;
  isFollowingBack?: boolean;
  partner?: { companyName: string; logoUrl?: string | null; rating: number; approved?: boolean } | null;
}

interface SuggestedUser {
  id: string;
  name: string | null;
  image: string | null;
  title: string | null;
  company: string | null;
  role: string;
  activeMode?: string;
  partner?: { companyName: string; logoUrl: string | null; approved: boolean } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function UserAvatar({
  name, image, isPartner, size = "md",
}: {
  name: string | null; image: string | null; isPartner: boolean; size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: "h-8 w-8 text-[10px]", md: "h-10 w-10 text-[11px]", lg: "h-14 w-14 text-sm" };
  const shape = isPartner ? "rounded-xl" : "rounded-full";
  const bg = isPartner ? "bg-[#2A5FA5]" : "bg-[#0F6E56]";
  const dim = dims[size];

  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name ?? ""} className={cn(dim, shape, "object-cover shrink-0")} />;
  }
  return (
    <div className={cn(dim, shape, bg, "flex items-center justify-center font-bold text-white shrink-0 select-none")}>
      {getInitials(name)}
    </div>
  );
}

// ─── Follow toggle ────────────────────────────────────────────────────────────

function FollowToggle({ userId, initialFollowing, label }: {
  userId: string; initialFollowing: boolean; label?: string;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      try { const res = await toggleFollow(userId); setFollowing(res.following); }
      catch { setFollowing(!next); }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-50 shrink-0",
        following
          ? "bg-[#F7F9F8] text-[#5C6B5E] hover:bg-[#F0EDE8]"
          : "bg-[#0F6E56] text-white hover:bg-[#0a5a45]"
      )}
    >
      {following
        ? <><UserCheck className="h-3.5 w-3.5" />{label ?? "Following"}</>
        : <><UserPlus className="h-3.5 w-3.5" />{label ?? "Follow"}</>}
    </button>
  );
}

// ─── Own profile card (hero) ──────────────────────────────────────────────────

function ProfileCard({ user }: { user: CurrentUser }) {
  const isPartner = user.activeMode === "partner" && !!user.partner?.approved;
  const accent    = isPartner ? "#2A5FA5" : "#0F6E56";
  const bandBg    = isPartner
    ? "linear-gradient(135deg, #2A5FA540, #2A5FA518)"
    : "linear-gradient(135deg, #0F6E5640, #0F6E5618)";

  const displayName  = isPartner ? user.partner!.companyName : user.name;
  const displayImage = isPartner ? (user.partner!.logoUrl ?? user.image) : user.image;
  const initials     = (displayName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const shape        = isPartner ? "rounded-2xl" : "rounded-full";

  const stats = [
    { value: user.followerCount,   label: "Followers",  href: "?tab=followers"   },
    { value: user.followingCount,  label: "Following",  href: "?tab=following"   },
    { value: user.connectionCount, label: "Connects",   href: "?tab=connections" },
  ];

  return (
    <div className="relative flex flex-col rounded-2xl bg-white overflow-hidden" style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
      {/* Colour band */}
      <div className="h-[72px] w-full shrink-0" style={{ background: bandBg }} />

      {/* Avatar + actions row */}
      <div className="px-4 -mt-8 flex items-end justify-between gap-2">
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayImage} alt={displayName ?? ""}
            className={cn("h-16 w-16 object-cover ring-4 ring-white shrink-0", shape)} />
        ) : (
          <div className={cn("h-16 w-16 ring-4 ring-white flex items-center justify-center text-white text-lg font-black shrink-0 select-none", shape)}
            style={{ backgroundColor: accent }}>
            {initials}
          </div>
        )}
        <div className="flex items-center gap-1.5 pb-1 flex-wrap justify-end">
          <Link
            href={`/app/profile/${user.id}?from=network`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-colors text-[#5C6B5E] hover:text-[#1B2B1F] hover:bg-[#F7F9F8]"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          >
            View profile
          </Link>
          <Link
            href="/app/settings"
            className="flex items-center justify-center h-7 w-7 rounded-xl text-[#9BA39C] hover:text-[#1B2B1F] hover:bg-[#F7F9F8] transition-colors"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Profile info */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <p className="text-[16px] font-black text-[#1B2B1F] leading-tight">{displayName ?? "Anonymous"}</p>
          {(user.verified || isPartner) && (
            <BadgeCheck className="h-4 w-4 text-[#2A5FA5] shrink-0" />
          )}
        </div>
        {!isPartner && (user.title || user.company) && (
          <p className="text-[12px] text-[#6B7B6E] truncate leading-snug">
            {[user.title, user.company].filter(Boolean).join(" · ")}
          </p>
        )}
        {isPartner && (
          <p className="text-[12px] text-[#6B7B6E] leading-snug">Migration Partner</p>
        )}
        {(isPartner ? (user.partner!.country ?? user.location) : user.location) && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 shrink-0" style={{ color: "#C8D0CA" }} />
            <span className="text-[11px] text-[#9BA39C] truncate">
              {isPartner ? (user.partner!.country ?? user.location) : user.location}
            </span>
          </div>
        )}

        {/* Stats strip */}
        <div className="mt-4 grid grid-cols-3 pt-4 border-t border-[#F0EDE8]">
          {stats.map(({ value, label, href }, i) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex flex-col items-center py-1.5 rounded-xl hover:bg-[#F7F9F8] transition-colors group",
                i !== 2 && "border-r border-[rgba(0,0,0,0.05)]"
              )}
            >
              <span className="text-[15px] font-black leading-none text-[#1B2B1F] group-hover:transition-colors" style={{ color: undefined }}>
                {value.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#9BA39C] mt-0.5 font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Profile views card ───────────────────────────────────────────────────────

function ProfileViewsCard({ views }: { views: ProfileViews }) {
  const maxBar = Math.max(...views.last30Days.map((d) => d.count), 1);
  const last14 = views.last30Days.slice(-14);

  return (
    <div className="rounded-2xl bg-white overflow-hidden" style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <p className="text-[13px] font-bold text-[#1B2B1F]">Profile views</p>
        <Link href="/app/profile/views" className="text-[11px] font-semibold text-[#0F6E56] hover:underline flex items-center gap-1">
          See all<ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 divide-x" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", borderColor: "rgba(0,0,0,0.05)" }}>
        <div className="px-4 py-3">
          <p className="text-[22px] font-black text-[#1B2B1F] leading-none">{views.weeklyCount}</p>
          <p className="text-[10px] text-[#9BA39C] mt-0.5 font-medium">this week</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[22px] font-black text-[#1B2B1F] leading-none">{views.totalCount.toLocaleString()}</p>
          <p className="text-[10px] text-[#9BA39C] mt-0.5 font-medium">all time</p>
        </div>
      </div>

      {/* Mini bar chart */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-end gap-[2px] h-10">
          {last14.map(({ date, count }) => (
            <div key={date} className="flex-1 cursor-default" title={`${count} view${count !== 1 ? "s" : ""}`}>
              <div
                className="rounded-[2px] transition-colors"
                style={{
                  height: `${Math.max((count / maxBar) * 100, count > 0 ? 12 : 4)}%`,
                  background: count > 0 ? "rgba(15,110,86,0.25)" : "rgba(0,0,0,0.05)",
                }}
              />
            </div>
          ))}
        </div>
        <p className="text-[9px] text-[#C8D0CA] mt-1.5 font-medium uppercase tracking-wide">14-day activity</p>
      </div>

      {/* Recent viewers */}
      {views.recentViewers.length > 0 ? (
        <div className="px-4 pt-1 pb-3 space-y-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          {views.recentViewers.slice(0, 3).map((v) => (
            <Link key={v.id} href={`/app/profile/${v.viewerId}?from=views`} className="flex items-center gap-2.5 group">
              {v.viewer?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.viewer.image} alt={v.viewer.name ?? ""} className="h-7 w-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-[#EAF3EE] flex items-center justify-center text-[#0F6E56] text-[10px] font-bold shrink-0 select-none">
                  {getInitials(v.viewer?.name ?? null)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#1B2B1F] group-hover:text-[#0F6E56] transition-colors truncate leading-snug">
                  {v.viewer?.name ?? "Anonymous"}
                </p>
                <p className="text-[10px] text-[#C8D0CA]">{timeAgo(v.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-4 py-5 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          <Eye className="h-5 w-5 text-[#E8E3D9] mx-auto mb-1.5" />
          <p className="text-[11px] text-[#9BA39C]">No visitors yet</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NetworkClient({
  tab,
  currentUser,
  profileViews,
  followers,
  following,
  connections,
  suggestedProfiles,
}: {
  tab: TabId;
  currentUser: CurrentUser;
  profileViews: ProfileViews;
  followers: NetworkUser[];
  following: NetworkUser[];
  connections: NetworkUser[];
  suggestedProfiles: SuggestedUser[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>(tab);
  const [search, setSearch]       = useState("");

  const TABS = [
    { id: "followers"   as TabId, label: "Followers",   count: followers.length   },
    { id: "following"   as TabId, label: "Following",   count: following.length   },
    { id: "connections" as TabId, label: "Connections", count: connections.length },
  ];

  function filterUsers<T extends { name: string | null; company: string | null }>(users: T[]): T[] {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => u.name?.toLowerCase().includes(q) || u.company?.toLowerCase().includes(q));
  }

  const activeUsers =
    activeTab === "followers"   ? filterUsers(followers)   :
    activeTab === "following"   ? filterUsers(following)   :
    filterUsers(connections);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4" style={{ fontFamily: F }}>
      <div className="grid lg:grid-cols-[272px_1fr] gap-4 items-start">

        {/* ── Left sidebar ───────────────────────────────────────────────────── */}
        <div className="space-y-3 lg:sticky lg:top-6">
          <ProfileCard user={currentUser} />
          <ProfileViewsCard views={profileViews} />
        </div>

        {/* ── Right content ───────────────────────────────────────────────────── */}
        <div className="space-y-3 min-w-0">

          {/* People you may know */}
          {suggestedProfiles.length > 0 && (
            <div className="rounded-2xl bg-white overflow-hidden" style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}>
              <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF3EE] shrink-0">
                  <TrendingUp className="h-3.5 w-3.5 text-[#0F6E56]" />
                </div>
                <h2 className="text-[13px] font-bold text-[#1B2B1F]">People you may know</h2>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {suggestedProfiles.slice(0, 3).map((p) => {
                  const pIsPartner   = p.activeMode === "partner" && !!p.partner?.approved;
                  const pDisplayName = pIsPartner ? (p.partner!.companyName ?? p.name) : p.name;
                  const pDisplayImg  = pIsPartner ? (p.partner!.logoUrl ?? null) : p.image;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col items-center gap-3 rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5"
                      style={{ border: CARD_BORDER, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                    >
                      <Link href={`/app/profile/${p.id}`}>
                        <UserAvatar name={pDisplayName} image={pDisplayImg} isPartner={pIsPartner} size="lg" />
                      </Link>
                      <div className="min-w-0 w-full flex-1">
                        <Link
                          href={`/app/profile/${p.id}`}
                          className="text-[13px] font-bold text-[#1B2B1F] hover:text-[#0F6E56] transition-colors truncate block leading-tight"
                        >
                          {pDisplayName ?? "Anonymous"}
                        </Link>
                        <p className="text-[11px] text-[#9BA39C] truncate mt-0.5">
                          {pIsPartner ? "Migration Partner" : (p.title ?? p.company ?? "Staky member")}
                        </p>
                      </div>
                      <FollowToggle userId={p.id} initialFollowing={false} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Followers / Following / Connections */}
          <div className="rounded-2xl bg-white overflow-hidden" style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}>

            {/* Tab strip */}
            <div className="flex p-1.5 gap-1" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#FAFAF9" }}>
              {TABS.map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setSearch(""); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150",
                    activeTab === id
                      ? "bg-white text-[#0F6E56]"
                      : "text-[#9BA39C] hover:text-[#5C6B5E] hover:bg-white/60"
                  )}
                  style={activeTab === id ? { boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : {}}
                >
                  {label}
                  <span className={cn(
                    "text-[10px] rounded-lg px-1.5 py-0.5 font-bold",
                    activeTab === id ? "bg-[#EAF3EE] text-[#0F6E56]" : "bg-[#F0EDE8] text-[#9BA39C]"
                  )}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="px-4 pt-3.5 pb-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#C8D0CA] pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeTab}…`}
                  className="w-full rounded-xl pl-9 pr-3 py-2 text-[13px] placeholder:text-[#C8D0CA] outline-none transition-all"
                  style={{ background: "#F7F9F8", border: "1.5px solid rgba(0,0,0,0.06)" }}
                  onFocus={(e) => { e.currentTarget.style.border = "1.5px solid #0F6E56"; e.currentTarget.style.background = "#fff"; }}
                  onBlur={(e)  => { e.currentTarget.style.border = "1.5px solid rgba(0,0,0,0.06)"; e.currentTarget.style.background = "#F7F9F8"; }}
                />
              </div>
            </div>

            {/* List */}
            <div className="px-4 pb-3 pt-1">
              {activeUsers.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-[#F7F9F8] flex items-center justify-center mx-auto mb-3">
                    <Users className="h-5 w-5 text-[#C8D0CA]" />
                  </div>
                  <p className="text-[13px] font-semibold text-[#1B2B1F]">
                    {search ? "No results found" : `No ${activeTab} yet`}
                  </p>
                  {!search && activeTab === "followers" && (
                    <p className="text-[12px] text-[#9BA39C] mt-1">Share your profile to grow your audience</p>
                  )}
                </div>
              ) : (
                activeUsers.map((user) => {
                  const isPC       = user.activeMode === "partner" && !!user.partner?.approved;
                  const dName      = isPC ? (user.partner!.companyName ?? user.name) : user.name;
                  const dImage     = isPC ? (user.partner!.logoUrl ?? user.image) : user.image;
                  const subtitle   = isPC
                    ? "Migration Partner"
                    : [user.title, user.company].filter(Boolean).join(" · ") || "Staky member";

                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 py-3 -mx-4 px-4 rounded-xl hover:bg-[#F7F9F8] transition-colors"
                      style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                    >
                      <Link href={`/app/profile/${user.id}`} className="shrink-0">
                        <UserAvatar name={dName} image={dImage} isPartner={isPC} size="md" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/app/profile/${user.id}`}
                          className="text-[13px] font-bold text-[#1B2B1F] hover:text-[#0F6E56] transition-colors truncate block leading-tight"
                        >
                          {dName ?? "Anonymous"}
                        </Link>
                        <p className="text-[11px] text-[#9BA39C] truncate leading-snug mt-0.5">{subtitle}</p>
                      </div>
                      <div className="shrink-0">
                        {activeTab === "followers" ? (
                          <FollowToggle
                            userId={user.id}
                            initialFollowing={user.isFollowingBack ?? false}
                            label={user.isFollowingBack ? "Following" : "Follow back"}
                          />
                        ) : activeTab === "following" ? (
                          <FollowToggle userId={user.id} initialFollowing={true} label="Unfollow" />
                        ) : (
                          <Link
                            href={`/app/messages?user=${user.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-[#5C6B5E] hover:bg-[#F0EDE8] transition-colors"
                            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Message
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
