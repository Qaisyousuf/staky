"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// useRouter also used inside NotifRow below
import {
  Bell, Heart, MessageCircle, Reply, UserPlus, ThumbsUp,
  Link2, Bookmark, Share2, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/social";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  postId: string | null;
  commentId: string | null;
  sender: { id: string; name: string | null; image: string | null; role: string } | null;
  post: { fromTool: string; toTool: string } | null;
}

function notifUrl(n: Notification): string {
  switch (n.type) {
    case "LIKE":
    case "RECOMMENDATION":
    case "SAVE":
    case "SHARE":
      return n.postId ? `/feed?post=${n.postId}` : "/feed";
    case "COMMENT":
    case "REPLY":
      return n.postId
        ? n.commentId
          ? `/feed?post=${n.postId}&comment=${n.commentId}`
          : `/feed?post=${n.postId}`
        : "/feed";
    case "FOLLOW":
    case "CONNECT":
      return n.sender?.id ? `/profile/${n.sender.id}` : "/feed";
    default:
      return "/notifications";
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<string, {
  icon: React.ElementType;
  bg: string;
  fg: string;
  action: string;
  category: string;
}> = {
  LIKE:           { icon: Heart,         bg: "bg-pink-100",   fg: "text-red-500",   action: "liked your post",           category: "Engagement" },
  COMMENT:        { icon: MessageCircle, bg: "bg-green-100",  fg: "text-green-600", action: "commented on your post",    category: "Engagement" },
  REPLY:          { icon: Reply,         bg: "bg-green-100",  fg: "text-green-600", action: "replied to your comment",   category: "Engagement" },
  FOLLOW:         { icon: UserPlus,      bg: "bg-blue-100",   fg: "text-blue-600",  action: "started following you",     category: "Social" },
  RECOMMENDATION: { icon: ThumbsUp,      bg: "bg-green-100",  fg: "text-green-600", action: "recommended your post",     category: "Engagement" },
  CONNECT:        { icon: Link2,         bg: "bg-blue-100",   fg: "text-blue-600",  action: "accepted your connection",  category: "Social" },
  SAVE:           { icon: Bookmark,      bg: "bg-amber-100",  fg: "text-amber-500", action: "saved your post",           category: "Engagement" },
  SHARE:          { icon: Share2,        bg: "bg-gray-100",   fg: "text-gray-500",  action: "shared your post",          category: "Engagement" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function dayLabel(iso: string): string {
  const now = new Date();
  const date = new Date(iso);
  const diffDays = Math.floor((now.setHours(0,0,0,0) - new Date(date).setHours(0,0,0,0)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString("en", { weekday: "long" });
  return date.toLocaleDateString("en", { month: "long", day: "numeric", year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
}

function groupByDay(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const groups: Map<string, Notification[]> = new Map();
  for (const n of notifications) {
    const label = dayLabel(n.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(n);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

// ─── Sender avatar ────────────────────────────────────────────────────────────

function SenderAvatar({ name, image, role, type }: {
  name: string | null;
  image: string | null;
  role: string;
  type: string;
}) {
  const initials = name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";
  const isPartner = role === "PARTNER";
  const cfg = TYPE_CFG[type];
  const TypeIcon = cfg?.icon;

  return (
    <div className="relative shrink-0">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name ?? ""}
          className={cn("h-11 w-11 object-cover", isPartner ? "rounded-xl" : "rounded-full")}
        />
      ) : (
        <div className={cn(
          "h-11 w-11 bg-[#0F6E56] flex items-center justify-center text-white text-sm font-semibold select-none",
          isPartner ? "rounded-xl" : "rounded-full"
        )}>
          {initials}
        </div>
      )}
      {TypeIcon && (
        <span className={cn(
          "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white",
          cfg.bg
        )}>
          <TypeIcon className={cn("h-3 w-3", cfg.fg)} />
        </span>
      )}
    </div>
  );
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({
  n,
  onRead,
}: {
  n: Notification;
  onRead: (id: string) => void;
}) {
  const router = useRouter();
  const cfg = TYPE_CFG[n.type];
  const action = cfg?.action ?? "interacted with your content";
  const senderName = n.sender?.name ?? "Someone";

  function handleClick() {
    if (!n.read) onRead(n.id);
    router.push(notifUrl(n));
  }

  const inner = (
    <div
      role="button"
      onClick={handleClick}
      className={cn(
        "flex items-start gap-4 px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer",
        !n.read && "bg-green-50/40"
      )}
    >
      <SenderAvatar
        name={n.sender?.name ?? null}
        image={n.sender?.image ?? null}
        role={n.sender?.role ?? "USER"}
        type={n.type}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-snug">
          <span className="font-semibold text-gray-900">{senderName}</span>{" "}
          {action}
        </p>
        {n.post && (
          <p className="text-xs text-gray-400 mt-0.5">
            {n.post.fromTool} → {n.post.toTool}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1.5">{timeAgo(n.createdAt)}</p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2 pt-0.5">
        {!n.read && (
          <div className="h-2.5 w-2.5 rounded-full bg-[#0F6E56]" />
        )}
      </div>
    </div>
  );

  return inner;
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS = ["All", "Unread", "Engagement", "Social"] as const;
type Filter = typeof FILTERS[number];

// ─── Main client component ────────────────────────────────────────────────────

export function NotificationsClient(props: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const { notifications: initial } = props;
  const router = useRouter();
  const [notifications, setNotifications] = useState(initial);
  const [filter, setFilter] = useState<Filter>("All");
  const [, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleMarkAll() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  function handleMarkOne(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    startTransition(async () => {
      await markNotificationRead(id);
    });
  }

  // Filter
  const filtered = notifications.filter((n) => {
    if (filter === "Unread") return !n.read;
    if (filter === "Engagement") {
      return ["LIKE", "COMMENT", "REPLY", "RECOMMENDATION", "SAVE", "SHARE"].includes(n.type);
    }
    if (filter === "Social") {
      return ["FOLLOW", "CONNECT"].includes(n.type);
    }
    return true;
  });

  const groups = groupByDay(filtered);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-sm font-medium text-[#0F6E56] hover:underline"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              filter === f
                ? "bg-[#0F6E56] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {f}
            {f === "Unread" && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
            <Bell className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700">No notifications here</p>
          <p className="text-xs text-gray-400 mt-1">
            {filter !== "All" ? "Try switching to All" : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ label, items }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Day label */}
              <div className="px-4 py-2.5 border-b border-gray-50 bg-gray-50/80">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {label}
                </span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {items.map((n) => (
                  <NotifRow key={n.id} n={n} onRead={handleMarkOne} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings link */}
      <div className="mt-6 text-center">
        <Link
          href="/settings?tab=notifications"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Manage notification preferences
        </Link>
      </div>
    </div>
  );
}
