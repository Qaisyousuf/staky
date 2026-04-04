"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  UserPlus,
  UserCheck,
  MessageSquare,
  Eye,
  MapPin,
  BadgeCheck,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFollow } from "@/actions/social";

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

function Avatar({
  name,
  image,
  role,
  size = "md",
}: {
  name: string | null;
  image: string | null;
  role: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base" };
  const isPartner = role === "PARTNER";
  const dim = dims[size];

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? ""}
        className={cn(dim, "object-cover shrink-0", isPartner ? "rounded-xl" : "rounded-full")}
      />
    );
  }
  return (
    <div
      className={cn(
        dim,
        "flex items-center justify-center font-bold text-white shrink-0 select-none",
        isPartner ? "rounded-xl bg-[#2A5FA5]" : "rounded-full bg-[#0F6E56]"
      )}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Follow toggle ─────────────────────────────────────────────────────────────

function FollowToggle({
  userId,
  initialFollowing,
  label,
}: {
  userId: string;
  initialFollowing: boolean;
  label?: string;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      try {
        const res = await toggleFollow(userId);
        setFollowing(res.following);
      } catch {
        setFollowing(!next);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shrink-0",
        following
          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
          : "bg-[#0F6E56] text-white hover:bg-[#0a5a45]"
      )}
    >
      {following
        ? <><UserCheck className="h-3.5 w-3.5" />{label ?? "Following"}</>
        : <><UserPlus className="h-3.5 w-3.5" />{label ?? "Follow"}</>}
    </button>
  );
}

// ─── Own profile card ─────────────────────────────────────────────────────────

function ProfileCard({ user }: { user: CurrentUser }) {
  const isPartner = user.activeMode === "partner" && !!user.partner?.approved;
  const coverGradient = isPartner
    ? "linear-gradient(135deg, #1e3a6e 0%, #2A5FA5 100%)"
    : "linear-gradient(135deg, #0a5a45 0%, #0F6E56 100%)";

  const displayName = isPartner ? user.partner!.companyName : user.name;
  const displayImage = isPartner ? (user.partner!.logoUrl ?? user.image) : user.image;
  const avatarRounded = isPartner ? "rounded-xl" : "rounded-full";
  const avatarBg = isPartner ? "bg-[#2A5FA5]" : "bg-[#0F6E56]";
  const tags = isPartner ? (user.partner!.specialty ?? []) : user.interests;
  const accentColor = isPartner ? "#2A5FA5" : "#0F6E56";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/*
        Two-layer cover:
        - outer div is `relative h-24` with NO overflow-hidden → avatar can extend below
        - inner div is `absolute inset-0 overflow-hidden rounded-t-2xl` → clips the image/gradient only
        - avatar is absolute on the OUTER div → not clipped
      */}
      <div className="relative h-24">
        <div
          className="absolute inset-0 rounded-t-2xl overflow-hidden"
          style={{ background: user.coverImage ? undefined : coverGradient }}
        >
          {user.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.coverImage} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        {/* Avatar: left-aligned, straddling the cover bottom edge */}
        <div className={cn("absolute bottom-0 left-4 translate-y-1/2 ring-[3px] ring-white z-10", avatarRounded)}>
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImage}
              alt={displayName ?? ""}
              className={cn("h-14 w-14 object-cover", avatarRounded)}
            />
          ) : (
            <div className={cn("h-14 w-14 flex items-center justify-center text-white text-lg font-bold select-none", avatarRounded, avatarBg)}>
              {getInitials(displayName)}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 pt-10">
        {/* Avatar row: buttons aligned to the right while avatar overlaps from above */}
        <div className="flex items-center justify-end gap-1.5 mb-3">
          <Link
            href={`/app/profile/${user.id}?from=network`}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View profile
          </Link>
          <Link
            href="/app/settings"
            className="flex items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Name + verified */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-bold text-gray-900 leading-snug truncate">
            {displayName ?? "Anonymous"}
          </span>
          {(user.verified || isPartner) && <BadgeCheck className="h-3.5 w-3.5 text-[#2A5FA5] shrink-0" />}
        </div>

        {!isPartner && (user.title || user.company) && (
          <p className="text-xs text-gray-500 truncate leading-snug mb-0.5">
            {[user.title, user.company].filter(Boolean).join(" · ")}
          </p>
        )}
        {isPartner && (
          <p className="text-xs text-gray-500 truncate leading-snug mb-0.5">Migration Partner</p>
        )}
        {((isPartner ? (user.partner!.country ?? user.location) : user.location)) && (
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
            <span className="text-[11px] text-gray-400 truncate">
              {isPartner ? (user.partner!.country ?? user.location) : user.location}
            </span>
          </div>
        )}
        {isPartner && user.partner!.description && (
          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{user.partner!.description}</p>
        )}
        {!isPartner && user.bio && (
          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{user.bio}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 mt-3 pt-3 border-t border-gray-100">
          <Link href="?tab=followers" className="flex flex-col items-center py-1.5 rounded-lg hover:bg-gray-50 transition-colors group">
            <span className="text-sm font-bold leading-none transition-colors group-hover:text-[--accent]" style={{ "--accent": accentColor } as React.CSSProperties}>
              {user.followerCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">Followers</span>
          </Link>
          <Link href="?tab=following" className="flex flex-col items-center py-1.5 rounded-lg hover:bg-gray-50 transition-colors group border-x border-gray-100">
            <span className="text-sm font-bold leading-none transition-colors group-hover:text-[--accent]" style={{ "--accent": accentColor } as React.CSSProperties}>
              {user.followingCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">Following</span>
          </Link>
          <Link href="?tab=connections" className="flex flex-col items-center py-1.5 rounded-lg hover:bg-gray-50 transition-colors group">
            <span className="text-sm font-bold leading-none transition-colors group-hover:text-[--accent]" style={{ "--accent": accentColor } as React.CSSProperties}>
              {user.connectionCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">Connects</span>
          </Link>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                  isPartner ? "bg-blue-50 text-[#2A5FA5]" : "bg-emerald-50 text-[#0F6E56]"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profile views card ───────────────────────────────────────────────────────

function ProfileViewsCard({ views }: { views: ProfileViews }) {
  const maxBar = Math.max(...views.last30Days.map((d) => d.count), 1);
  const last14 = views.last30Days.slice(-14);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-700">Profile views</p>
        <Link
          href="/app/profile/views"
          className="text-[11px] font-medium text-[#0F6E56] hover:underline"
        >
          See all
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
        <div className="px-4 py-3">
          <p className="text-lg font-bold text-gray-900 leading-none">{views.weeklyCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">this week</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-lg font-bold text-gray-900 leading-none">{views.totalCount.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">total</p>
        </div>
      </div>

      {/* Mini bar chart */}
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-end gap-px h-8">
          {last14.map(({ date, count }) => (
            <div
              key={date}
              className="flex-1 cursor-default"
              title={`${count} view${count !== 1 ? "s" : ""}`}
            >
              <div
                className="bg-[#0F6E56]/20 hover:bg-[#0F6E56]/50 rounded-[2px] transition-colors"
                style={{ height: `${Math.max((count / maxBar) * 100, count > 0 ? 12 : 4)}%` }}
              />
            </div>
          ))}
        </div>
        <p className="text-[9px] text-gray-300 mt-1">14-day activity</p>
      </div>

      {/* Recent viewers */}
      {views.recentViewers.length > 0 ? (
        <div className="border-t border-gray-100 px-4 pt-2.5 pb-3 space-y-2">
          {views.recentViewers.slice(0, 3).map((v) => (
            <Link
              key={v.id}
              href={`/app/profile/${v.viewerId}?from=views`}
              className="flex items-center gap-2.5 group"
            >
              {v.viewer?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.viewer.image} alt={v.viewer.name ?? ""} className="h-7 w-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-bold shrink-0 select-none">
                  {getInitials(v.viewer?.name ?? null)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-gray-800 group-hover:text-[#0F6E56] transition-colors truncate leading-snug">
                  {v.viewer?.name ?? "Anonymous"}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {timeAgo(v.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-4 py-4 text-center border-t border-gray-100">
          <Eye className="h-5 w-5 text-gray-200 mx-auto mb-1" />
          <p className="text-[11px] text-gray-400">No visitors yet</p>
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
  const [search, setSearch] = useState("");

  const TABS = [
    { id: "followers" as TabId, label: "Followers", count: followers.length },
    { id: "following" as TabId, label: "Following", count: following.length },
    { id: "connections" as TabId, label: "Connections", count: connections.length },
  ];

  function filterUsers<T extends { name: string | null; company: string | null }>(users: T[]): T[] {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.company?.toLowerCase().includes(q)
    );
  }

  const activeUsers =
    activeTab === "followers" ? filterUsers(followers) :
    activeTab === "following" ? filterUsers(following) :
    filterUsers(connections);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
    <div className="grid lg:grid-cols-[280px_1fr] gap-4 items-start">

      {/* Left sidebar */}
      <div className="space-y-4 lg:sticky lg:top-6">
        <ProfileCard user={currentUser} />
        <ProfileViewsCard views={profileViews} />
      </div>

      {/* Right content */}
      <div className="space-y-4 min-w-0">

          {/* People you may know */}
          {suggestedProfiles.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-[#0F6E56]" />
                <h2 className="text-sm font-semibold text-gray-900">People you may know</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {suggestedProfiles.slice(0, 3).map((p) => {
                  const pIsPartner = p.activeMode === "partner" && !!p.partner?.approved;
                  const pDisplayName = pIsPartner ? (p.partner!.companyName ?? p.name) : p.name;
                  const pDisplayImage = pIsPartner ? (p.partner!.logoUrl ?? null) : p.image;
                  return (
                    <div
                      key={p.id}
                      className="flex flex-col items-center gap-2.5 rounded-xl border border-gray-100 p-4 text-center hover:border-gray-200 hover:shadow-sm transition-all"
                    >
                      <Link href={`/app/profile/${p.id}`}>
                        <Avatar name={pDisplayName} image={pDisplayImage} role={p.role} />
                      </Link>
                      <div className="min-w-0 w-full">
                        <Link
                          href={`/app/profile/${p.id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-[#0F6E56] transition-colors truncate block"
                        >
                          {pDisplayName ?? "Anonymous"}
                        </Link>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {pIsPartner ? "Migration Partner" : (p.title ?? p.company ?? "Staky")}
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
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {TABS.map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setSearch(""); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium transition-colors",
                    activeTab === id
                      ? "text-[#0F6E56] border-b-2 border-[#0F6E56] bg-green-50/30"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "text-[11px] rounded-full px-1.5 py-0.5 font-semibold",
                      activeTab === id ? "bg-green-100 text-[#0F6E56]" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeTab}…`}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 outline-none focus:border-[#0F6E56] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* List */}
            <div className="px-5 pb-4">
              {activeUsers.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500">
                    {search ? "No results found" : `No ${activeTab} yet`}
                  </p>
                  {!search && activeTab === "followers" && (
                    <p className="text-xs text-gray-400 mt-1">Share your profile to grow your audience</p>
                  )}
                </div>
              ) : (
                activeUsers.map((user) => {
                  const isPartnerConnection = user.activeMode === "partner" && !!user.partner?.approved;
                  const displayName = isPartnerConnection ? (user.partner!.companyName ?? user.name) : user.name;
                  const displayImage = isPartnerConnection ? (user.partner!.logoUrl ?? user.image) : user.image;
                  const displayRole = isPartnerConnection ? "PARTNER" : user.role;
                  const subtitle = isPartnerConnection
                    ? "Migration Partner"
                    : [user.title, user.company].filter(Boolean).join(" · ") || "Staky member";

                  return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 -mx-5 px-5 transition-colors"
                  >
                    <Link href={`/app/profile/${user.id}`} className="shrink-0">
                      <Avatar name={displayName} image={displayImage} role={displayRole} />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/app/profile/${user.id}`}
                        className="text-sm font-semibold text-gray-900 hover:text-[#0F6E56] transition-colors truncate block leading-tight"
                      >
                        {displayName ?? "Anonymous"}
                      </Link>
                      <p className="text-xs text-gray-400 truncate leading-snug mt-0.5">{subtitle}</p>
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
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
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
