"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// useRouter also used inside NotifRow below
import {
  Bell, Heart, MessageCircle, MessageSquare, Reply, UserPlus, ThumbsUp,
  Link2, Bookmark, Share2, CheckCheck, BriefcaseBusiness, CircleCheckBig, CircleOff, CircleDot, Receipt, CreditCard, ClipboardList, CheckSquare, Inbox, Briefcase, Eye, FileText,
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
  requestId: string | null;
  senderMode: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
    partnerName?: string | null;
    partnerLogoUrl?: string | null;
  } | null;
  post: { fromTool: string; toTool: string } | null;
}

function notifUrl(n: Notification, role?: string): string {
  const isPartner = role === "PARTNER" || role === "ADMIN";
  switch (n.type) {
    case "NEW_POST":
      return n.postId ? `/app/feed?post=${n.postId}` : "/app/feed";
    case "LIKE":
    case "RECOMMENDATION":
    case "SAVE":
    case "SHARE":
      return n.postId ? `/app/feed?post=${n.postId}` : "/app/feed";
    case "COMMENT":
    case "REPLY":
      return n.postId
        ? n.commentId
          ? `/app/feed?post=${n.postId}&comment=${n.commentId}`
          : `/app/feed?post=${n.postId}`
        : "/app/feed";
    case "FOLLOW":
    case "CONNECT":
    case "PROFILE_VIEW": {
      if (!n.sender?.id) return "/app/profile/views";
      const personaParam = n.senderMode === "partner" ? "asPartner=1" : "asUser=1";
      return `/app/profile/${n.sender.id}?${personaParam}&from=notifications`;
    }
    case "REQUEST_RECEIVED":
      return n.requestId ? `/leads/${n.requestId}` : "/leads";
    case "REQUEST_ACCEPTED":
    case "REQUEST_REJECTED":
    case "REQUEST_ACTIVE":
    case "REQUEST_COMPLETED":
      return n.requestId ? `/requests/${n.requestId}` : "/requests";
    case "REQUEST_MESSAGE":
      if (!n.requestId) return isPartner ? "/leads" : "/requests";
      return isPartner ? `/leads/${n.requestId}` : `/requests/${n.requestId}`;
    case "INVOICE_SENT":
      return n.requestId ? `/requests/${n.requestId}` : "/requests";
    case "INVOICE_PAID":
      if (!n.requestId) return isPartner ? "/leads" : "/requests";
      return isPartner ? `/leads/${n.requestId}` : `/requests/${n.requestId}`;
    case "CONFIG_REQUEST_SENT":
      return n.requestId ? `/requests/${n.requestId}` : "/requests";
    case "CONFIG_SUBMITTED":
      return n.requestId ? `/leads/${n.requestId}` : "/leads";
    case "CONTACT_RECEIVED":
      return "/admin?tab=contact";
    case "JOB_APPLICATION_RECEIVED":
      return "/admin?tab=jobs";
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
  NEW_POST:       { icon: FileText,      bg: "bg-green-100",  fg: "text-green-600", action: "shared a new post",          category: "Community" },
  LIKE:           { icon: Heart,         bg: "bg-pink-100",   fg: "text-red-500",   action: "liked your post",           category: "Engagement" },
  COMMENT:        { icon: MessageCircle, bg: "bg-green-100",  fg: "text-green-600", action: "commented on your post",    category: "Engagement" },
  REPLY:          { icon: Reply,         bg: "bg-green-100",  fg: "text-green-600", action: "replied to your comment",   category: "Engagement" },
  FOLLOW:         { icon: UserPlus,      bg: "bg-blue-100",   fg: "text-blue-600",  action: "started following you",     category: "Social" },
  RECOMMENDATION: { icon: ThumbsUp,      bg: "bg-green-100",  fg: "text-green-600", action: "recommended your post",     category: "Engagement" },
  CONNECT:        { icon: Link2,         bg: "bg-blue-100",   fg: "text-blue-600",  action: "connected with you",        category: "Social" },
  SAVE:           { icon: Bookmark,      bg: "bg-amber-100",  fg: "text-amber-500", action: "saved your post",           category: "Engagement" },
  SHARE:          { icon: Share2,        bg: "bg-gray-100",   fg: "text-gray-500",  action: "shared your post",          category: "Engagement" },
  REQUEST_RECEIVED:  { icon: BriefcaseBusiness, bg: "bg-blue-100",    fg: "text-blue-600",    action: "sent you a migration request",            category: "Requests" },
  REQUEST_ACCEPTED:  { icon: CircleCheckBig,    bg: "bg-green-100",   fg: "text-green-600",   action: "accepted your migration request",         category: "Requests" },
  REQUEST_REJECTED:  { icon: CircleOff,         bg: "bg-rose-100",    fg: "text-rose-600",    action: "rejected your migration request",         category: "Requests" },
  REQUEST_ACTIVE:    { icon: CircleDot,         bg: "bg-amber-100",   fg: "text-amber-600",   action: "started work on your migration request",  category: "Requests" },
  REQUEST_COMPLETED: { icon: CircleCheckBig,    bg: "bg-emerald-100", fg: "text-emerald-600", action: "completed your migration request",        category: "Requests" },
  REQUEST_MESSAGE:   { icon: MessageSquare,     bg: "bg-blue-100",    fg: "text-blue-600",    action: "sent you a message about your request",   category: "Requests" },
  INVOICE_SENT:          { icon: Receipt,       bg: "bg-amber-100",   fg: "text-amber-600",   action: "sent you an invoice",                      category: "Requests" },
  INVOICE_PAID:          { icon: CreditCard,    bg: "bg-green-100",   fg: "text-green-600",   action: "confirmed invoice payment",                category: "Requests" },
  CONFIG_REQUEST_SENT:   { icon: ClipboardList, bg: "bg-blue-100",    fg: "text-blue-600",    action: "sent you a configuration request",         category: "Requests" },
  CONFIG_SUBMITTED:      { icon: CheckSquare,   bg: "bg-green-100",   fg: "text-green-600",   action: "submitted their configuration",            category: "Requests" },
  PROFILE_VIEW:             { icon: Eye,       bg: "bg-purple-100", fg: "text-purple-600", action: "viewed your profile",          category: "Social" },
  CONTACT_RECEIVED:         { icon: Inbox,     bg: "bg-blue-100",   fg: "text-blue-600",   action: "sent a contact message",       category: "Admin" },
  JOB_APPLICATION_RECEIVED: { icon: Briefcase, bg: "bg-violet-100", fg: "text-violet-600", action: "submitted a job application",  category: "Admin" },
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

function SenderAvatar({ name, image, senderMode, partnerName, partnerLogoUrl, type }: {
  name: string | null;
  image: string | null;
  senderMode: string;
  partnerName?: string | null;
  partnerLogoUrl?: string | null;
  type: string;
}) {
  const isPartner = senderMode === "partner";
  const displayName  = isPartner ? (partnerName ?? name) : name;
  const displayImage = isPartner ? (partnerLogoUrl ?? image) : image;
  const initials = displayName?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";
  const cfg = TYPE_CFG[type];
  const TypeIcon = cfg?.icon;

  return (
    <div className="relative shrink-0">
      {displayImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayImage}
          alt={displayName ?? ""}
          className={cn("h-11 w-11 object-cover", isPartner ? "rounded-xl" : "rounded-full")}
        />
      ) : (
        <div className={cn(
          "h-11 w-11 flex items-center justify-center text-white text-sm font-semibold select-none",
          isPartner ? "rounded-xl bg-[#2A5FA5]" : "rounded-full bg-[#0F6E56]"
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
  userRole,
}: {
  n: Notification;
  onRead: (id: string) => void;
  userRole: string;
}) {
  const router = useRouter();
  const cfg = TYPE_CFG[n.type];
  const action = cfg?.action ?? "interacted with your content";
  const isPartnerSender = n.senderMode === "partner";
  const senderName = isPartnerSender
    ? (n.sender?.partnerName ?? n.sender?.name ?? "Someone")
    : (n.sender?.name ?? "Someone");

  function handleClick() {
    if (!n.read) onRead(n.id);
    router.push(notifUrl(n, userRole));
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
        senderMode={n.senderMode}
        partnerName={n.sender?.partnerName}
        partnerLogoUrl={n.sender?.partnerLogoUrl}
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

const FILTERS = ["All", "Unread", "Engagement", "Social", "Requests"] as const;
type Filter = typeof FILTERS[number];

// ─── Main client component ────────────────────────────────────────────────────

export function NotificationsClient(props: {
  notifications: Notification[];
  unreadCount: number;
  userRole: string;
}) {
  const { notifications: initial, userRole } = props;
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
    if (filter === "Requests") {
      return [
        "REQUEST_RECEIVED",
        "REQUEST_ACCEPTED",
        "REQUEST_REJECTED",
        "REQUEST_ACTIVE",
        "REQUEST_COMPLETED",
        "REQUEST_MESSAGE",
      ].includes(n.type);
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
                  <NotifRow key={n.id} n={n} onRead={handleMarkOne} userRole={userRole} />
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
