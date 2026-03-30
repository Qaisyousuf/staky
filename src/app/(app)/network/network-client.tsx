"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, UserPlus, UserCheck, MessageSquare, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFollow } from "@/actions/social";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "followers" | "following" | "connections";

interface NetworkUser {
  id: string;
  name: string | null;
  image: string | null;
  title: string | null;
  company: string | null;
  role: string;
  isFollowingBack?: boolean;
  partner?: { companyName: string; rating: number } | null;
}

interface SuggestedUser {
  id: string;
  name: string | null;
  image: string | null;
  title: string | null;
  company: string | null;
  role: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ user, size = "md" }: { user: { name: string | null; image: string | null; role: string }; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const isPartner = user.role === "PARTNER";

  if (user.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt={user.name ?? ""}
        className={cn(dim, "object-cover shrink-0", isPartner ? "rounded-xl" : "rounded-full")}
      />
    );
  }
  return (
    <div className={cn(dim, "flex items-center justify-center font-bold text-white shrink-0", isPartner ? "rounded-xl bg-[#2A5FA5]" : "rounded-full bg-[#0F6E56]")}>
      {getInitials(user.name)}
    </div>
  );
}

// ─── Follow toggle button ──────────────────────────────────────────────────────

function FollowToggle({ userId, initialFollowing, label }: { userId: string; initialFollowing: boolean; label?: string }) {
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
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shrink-0",
        following
          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
          : "bg-[#0F6E56] text-white hover:bg-[#0a5a45]"
      )}
    >
      {following ? <><UserCheck className="h-3.5 w-3.5" /> {label ?? "Following"}</> : <><UserPlus className="h-3.5 w-3.5" /> {label ?? "Follow"}</>}
    </button>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({ user, action }: { user: NetworkUser; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-5 px-5 transition-colors rounded-lg">
      <Link href={`/profile/${user.id}`} className="shrink-0">
        <Avatar user={user} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${user.id}`} className="text-sm font-medium text-gray-900 hover:text-[#0F6E56] transition-colors truncate block">
          {user.name ?? "Anonymous"}
        </Link>
        <p className="text-xs text-gray-400 truncate">
          {[user.title, user.company].filter(Boolean).join(" · ") ||
            (user.role === "PARTNER" ? "Migration Partner" : "Staky member")}
        </p>
        {user.partner && user.partner.rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-[10px] text-gray-400">{user.partner.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function NetworkClient({
  initialTab,
  followers,
  following,
  connections,
  suggestedProfiles,
}: {
  initialTab: TabId;
  followers: NetworkUser[];
  following: NetworkUser[];
  connections: NetworkUser[];
  suggestedProfiles: SuggestedUser[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
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
    <div className="max-w-2xl space-y-5">
      {/* Suggested */}
      {suggestedProfiles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">People you may know</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {suggestedProfiles.slice(0, 3).map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-xl p-4 text-center flex flex-col items-center gap-2">
                <Link href={`/profile/${p.id}`}>
                  <Avatar user={p} size="md" />
                </Link>
                <div className="min-w-0">
                  <Link href={`/profile/${p.id}`} className="text-sm font-medium text-gray-900 hover:text-[#0F6E56] transition-colors block truncate">
                    {p.name ?? "Anonymous"}
                  </Link>
                  <p className="text-xs text-gray-400 truncate">
                    {p.title ?? p.company ?? (p.role === "PARTNER" ? "Migration Partner" : "Staky")}
                  </p>
                </div>
                <FollowToggle userId={p.id} initialFollowing={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {TABS.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSearch(""); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors",
                activeTab === id
                  ? "text-[#0F6E56] border-b-2 border-[#0F6E56]"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              {label}
              <span className={cn(
                "text-xs rounded-full px-1.5 py-0.5",
                activeTab === id ? "bg-green-50 text-[#0F6E56]" : "bg-gray-100 text-gray-400"
              )}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or company…"
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 outline-none focus:border-[#0F6E56] bg-white transition-colors"
            />
          </div>
        </div>

        {/* Users */}
        <div className="px-5 pb-4">
          {activeUsers.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">
                {search ? "No results found" : `No ${activeTab} yet`}
              </p>
            </div>
          ) : (
            activeUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                action={
                  activeTab === "followers" ? (
                    <FollowToggle
                      userId={user.id}
                      initialFollowing={user.isFollowingBack ?? false}
                      label={user.isFollowingBack ? "Following" : "Follow back"}
                    />
                  ) : activeTab === "following" ? (
                    <FollowToggle userId={user.id} initialFollowing={true} label="Unfollow" />
                  ) : (
                    <Link
                      href={`/messages?user=${user.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </Link>
                  )
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
