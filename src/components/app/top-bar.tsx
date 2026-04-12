"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Menu, Search, Bell, Mail, Settings, X, Plus,
  Heart, MessageCircle, Reply, UserPlus, ThumbsUp,
  Link2, Bookmark, Share2, BriefcaseBusiness, CircleCheckBig, CircleOff, CircleDot, MessageSquare,
  ArrowLeftRight, Eye, Handshake, ShieldCheck, ShieldX, Trash2, Receipt, CreditCard, ClipboardList, CheckSquare, Inbox, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/social";
import { setActiveMode } from "@/actions/partner-mode";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationItem {
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

// ─── Notification URL builder ─────────────────────────────────────────────────

function notifUrl(n: NotificationItem, role?: string): string {
  const isPartner = role === "PARTNER" || role === "ADMIN";
  switch (n.type) {
    case "LIKE":
    case "RECOMMENDATION":
    case "SAVE":
    case "SHARE":
      return n.postId ? `/feed?post=${n.postId}` : "/feed";
    case "COMMENT":
      return n.postId
        ? n.commentId
          ? `/feed?post=${n.postId}&comment=${n.commentId}`
          : `/feed?post=${n.postId}`
        : "/feed";
    case "REPLY":
      return n.postId
        ? n.commentId
          ? `/feed?post=${n.postId}&comment=${n.commentId}`
          : `/feed?post=${n.postId}`
        : "/feed";
    case "FOLLOW":
    case "CONNECT":
    case "PROFILE_VIEW":
      return n.sender?.id ? `/app/profile/${n.sender.id}?from=views` : "/app/profile/views";
    case "REQUEST_RECEIVED":
      return n.requestId ? `/app/leads/${n.requestId}` : "/app/leads";
    case "REQUEST_ACCEPTED":
    case "REQUEST_REJECTED":
    case "REQUEST_ACTIVE":
    case "REQUEST_COMPLETED":
      return n.requestId ? `/app/requests/${n.requestId}` : "/app/requests";
    case "REQUEST_MESSAGE":
      if (!n.requestId) return isPartner ? "/app/leads" : "/app/requests";
      return isPartner ? `/app/leads/${n.requestId}` : `/app/requests/${n.requestId}`;
    case "PARTNER_APPLICATION":
      return "/app/admin?tab=partners";
    case "PARTNER_APPROVED":
    case "PARTNER_REJECTED":
    case "PARTNER_DELETED":
      return "/app/settings?tab=partner";
    case "INVOICE_SENT":
      // Client receives: go to their request
      return n.requestId ? `/app/requests/${n.requestId}` : "/app/requests";
    case "INVOICE_PAID":
      // Partner receives (client confirmed): go to lead; client receives (partner confirmed): go to request
      if (!n.requestId) return isPartner ? "/app/leads" : "/app/requests";
      return isPartner ? `/app/leads/${n.requestId}` : `/app/requests/${n.requestId}`;
    case "CONFIG_REQUEST_SENT":
      // Client receives: go to their request
      return n.requestId ? `/app/requests/${n.requestId}` : "/app/requests";
    case "CONFIG_SUBMITTED":
      // Partner receives: go to the lead
      return n.requestId ? `/app/leads/${n.requestId}` : "/app/leads";
    case "CONTACT_RECEIVED":
      return "/app/admin?tab=contact";
    case "JOB_APPLICATION_RECEIVED":
      return "/app/admin?tab=jobs";
    default:
      return "/app/notifications";
  }
}

export interface MessageItem {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null; role: string };
}

interface TopBarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "USER" | "PARTNER" | "ADMIN";
  activeMode: string;
  partnerApproved: boolean;
  partnerLogoUrl?: string | null;
  partnerName?: string | null;
}

interface TopBarProps {
  user: TopBarUser;
  onMenuClick: () => void;
  notifications?: NotificationItem[];
  recentMessages?: MessageItem[];
  unreadMessageCount?: number;
}

// ─── Notification type config ─────────────────────────────────────────────────

const TYPE_CFG: Record<string, { icon: React.ElementType; bg: string; fg: string; action: string }> = {
  LIKE:           { icon: Heart,          bg: "bg-pink-100",   fg: "text-red-500",   action: "liked your post" },
  COMMENT:        { icon: MessageCircle,  bg: "bg-green-100",  fg: "text-green-600", action: "commented on your post" },
  REPLY:          { icon: Reply,          bg: "bg-green-100",  fg: "text-green-600", action: "replied to your comment" },
  FOLLOW:         { icon: UserPlus,       bg: "bg-blue-100",   fg: "text-blue-600",  action: "started following you" },
  RECOMMENDATION: { icon: ThumbsUp,       bg: "bg-green-100",  fg: "text-green-600", action: "recommended your post" },
  CONNECT:        { icon: Link2,          bg: "bg-blue-100",   fg: "text-blue-600",  action: "accepted your connection" },
  SAVE:           { icon: Bookmark,       bg: "bg-amber-100",  fg: "text-amber-500", action: "saved your post" },
  SHARE:          { icon: Share2,         bg: "bg-gray-100",   fg: "text-gray-500",  action: "shared your post" },
  REQUEST_RECEIVED:  { icon: BriefcaseBusiness, bg: "bg-blue-100",   fg: "text-blue-600",  action: "sent you a migration request" },
  REQUEST_ACCEPTED:  { icon: CircleCheckBig,    bg: "bg-green-100",  fg: "text-green-600", action: "accepted your migration request" },
  REQUEST_REJECTED:  { icon: CircleOff,         bg: "bg-rose-100",   fg: "text-rose-600",  action: "rejected your migration request" },
  REQUEST_ACTIVE:    { icon: CircleDot,         bg: "bg-amber-100",  fg: "text-amber-600", action: "started work on your migration request" },
  REQUEST_COMPLETED: { icon: CircleCheckBig,    bg: "bg-emerald-100",fg: "text-emerald-600", action: "completed your migration request" },
  REQUEST_MESSAGE:   { icon: MessageSquare,     bg: "bg-blue-100",   fg: "text-blue-600",    action: "sent you a message about your request" },
  PROFILE_VIEW:          { icon: Eye,          bg: "bg-purple-100", fg: "text-purple-600",  action: "viewed your profile" },
  PARTNER_APPLICATION:   { icon: Handshake,    bg: "bg-blue-100",   fg: "text-blue-600",   action: "submitted a partner application" },
  PARTNER_APPROVED:      { icon: ShieldCheck,  bg: "bg-green-100",  fg: "text-green-600",  action: "approved your partner application" },
  PARTNER_REJECTED:      { icon: ShieldX,      bg: "bg-rose-100",   fg: "text-rose-600",   action: "rejected your partner application" },
  PARTNER_DELETED:       { icon: Trash2,       bg: "bg-rose-100",   fg: "text-rose-600",   action: "removed your partner account" },
  INVOICE_SENT:          { icon: Receipt,       bg: "bg-amber-100",  fg: "text-amber-600",  action: "sent you an invoice" },
  INVOICE_PAID:          { icon: CreditCard,    bg: "bg-green-100",  fg: "text-green-600",  action: "confirmed invoice payment" },
  CONFIG_REQUEST_SENT:   { icon: ClipboardList, bg: "bg-blue-100",   fg: "text-blue-600",   action: "sent you a configuration request" },
  CONFIG_SUBMITTED:      { icon: CheckSquare,   bg: "bg-green-100",  fg: "text-green-600",  action: "submitted their configuration" },
  CONTACT_RECEIVED:          { icon: Inbox,     bg: "bg-blue-100",   fg: "text-blue-600",   action: "sent a contact message" },
  JOB_APPLICATION_RECEIVED:  { icon: Briefcase, bg: "bg-violet-100", fg: "text-violet-600", action: "submitted a job application" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "1d ago";
  return `${d}d ago`;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ref, handler]);
}

// ─── Animated panel wrapper ───────────────────────────────────────────────────

function AnimatedPanel({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={cn(
        "transition-all duration-150 ease-out",
        entered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── Sender avatar with type icon overlay ─────────────────────────────────────

function SenderAvatar({
  name,
  image,
  type,
  senderMode,
  partnerName,
  partnerLogoUrl,
}: {
  name: string | null;
  image: string | null;
  type: string;
  senderMode?: string;
  partnerName?: string | null;
  partnerLogoUrl?: string | null;
}) {
  const isPartnerSender = senderMode === "partner";
  const displayName = isPartnerSender ? (partnerName ?? name) : name;
  const displayImage = isPartnerSender ? (partnerLogoUrl ?? image) : image;

  const initials = displayName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  const cfg = TYPE_CFG[type];
  const TypeIcon = cfg?.icon;

  return (
    <div className="relative shrink-0">
      {displayImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayImage}
          alt={displayName ?? ""}
          className={cn("h-9 w-9 object-cover", isPartnerSender ? "rounded-lg" : "rounded-full")}
        />
      ) : (
        <div
          className={cn(
            "h-9 w-9 flex items-center justify-center text-white text-xs font-semibold select-none",
            isPartnerSender
              ? "rounded-lg bg-[#2A5FA5]"
              : "rounded-full bg-[#0F6E56]"
          )}
        >
          {initials}
        </div>
      )}
      {TypeIcon && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white",
            cfg.bg
          )}
        >
          <TypeIcon className={cn("h-2.5 w-2.5", cfg.fg)} />
        </span>
      )}
    </div>
  );
}

// ─── Notification dropdown ────────────────────────────────────────────────────

function NotificationDropdown({
  notifications,
  onClose,
  onMarkAllRead,
  onNotifClick,
}: {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotifClick: (n: NotificationItem) => void;
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AnimatedPanel className="absolute right-0 top-full mt-2 w-[380px] max-sm:fixed max-sm:inset-x-0 max-sm:top-14 max-sm:mt-0 max-sm:w-full rounded-2xl max-sm:rounded-none bg-white overflow-hidden z-50" style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <span className="text-[13px] font-bold text-[#1B2B1F]">Notifications</span>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-semibold text-[#0F6E56] hover:underline"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center justify-center h-6 w-6 rounded-lg text-[#9BA39C] hover:bg-[#F7F9F8] hover:text-[#1B2B1F] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F9F8] mb-3">
            <Bell className="h-4 w-4 text-[#C8D0CA]" />
          </div>
          <p className="text-sm font-semibold text-[#1B2B1F]">All caught up</p>
          <p className="text-xs text-[#9BA39C] mt-0.5">No new notifications</p>
        </div>
      ) : (
        <div className="max-h-[360px] max-sm:max-h-[calc(100svh-7rem)] overflow-y-auto divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
          {notifications.map((n) => {
            const senderName = n.sender?.name ?? "Someone";
            const cfg = TYPE_CFG[n.type];
            const action = cfg?.action ?? "interacted with your content";

            return (
              <div
                key={n.id}
                role="button"
                onClick={() => onNotifClick(n)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 hover:bg-[#FAFAF9] transition-colors cursor-pointer",
                  !n.read && "bg-[#EAF3EE]/40"
                )}
              >
                <SenderAvatar
                  name={n.sender?.name ?? null}
                  image={n.sender?.image ?? null}
                  type={n.type}
                  senderMode={n.senderMode}
                  partnerName={n.sender?.partnerName}
                  partnerLogoUrl={n.sender?.partnerLogoUrl}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[#5C6B5E] leading-snug">
                    <span className="font-semibold text-[#1B2B1F]">
                      {n.senderMode === "partner" && n.sender?.partnerName
                        ? n.sender.partnerName
                        : senderName}
                    </span>{" "}
                    {action}
                  </p>
                  {n.post && (
                    <p className="text-[11px] text-[#9BA39C] mt-0.5 truncate">
                      {n.post.fromTool} → {n.post.toTool}
                    </p>
                  )}
                  <p className="text-[11px] text-[#C8D0CA] mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>

                {!n.read && (
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0F6E56]" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <Link
          href="/app/notifications"
          onClick={onClose}
          className="text-[11px] font-semibold text-[#0F6E56] hover:underline"
        >
          View all notifications
        </Link>
        <Link
          href="/app/settings?tab=notifications"
          onClick={onClose}
          className="text-[11px] text-[#9BA39C] hover:text-[#5C6B5E] transition-colors"
        >
          Settings
        </Link>
      </div>
    </AnimatedPanel>
  );
}

// ─── Message item avatar (with optional online dot) ───────────────────────────

function MessageAvatar({
  name,
  image,
  role,
}: {
  name: string | null;
  image: string | null;
  role: string;
}) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  const isPartner = role === "PARTNER";

  return (
    <div className="relative shrink-0">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name ?? ""}
          className={cn("h-10 w-10 object-cover", isPartner ? "rounded-xl" : "rounded-full")}
        />
      ) : (
        <div
          className={cn(
            "h-10 w-10 flex items-center justify-center text-white text-sm font-semibold select-none",
            isPartner ? "rounded-xl bg-[#2A5FA5]" : "rounded-full bg-[#0F6E56]"
          )}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

// ─── Message dropdown ─────────────────────────────────────────────────────────

function MessageDropdown({
  messages,
  onClose,
}: {
  messages: MessageItem[];
  onClose: () => void;
}) {
  return (
    <AnimatedPanel className="absolute right-0 top-full mt-2 w-[380px] max-sm:w-[calc(100vw-2rem)] rounded-2xl bg-white overflow-hidden z-50" style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <span className="text-[13px] font-bold text-[#1B2B1F]">Messages</span>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-[#0F6E56] rounded-lg hover:bg-[#EAF3EE] transition-colors" style={{ border: "1px solid rgba(15,110,86,0.15)" }}>
            <Plus className="h-3.5 w-3.5" /> New message
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-6 w-6 rounded-lg text-[#9BA39C] hover:bg-[#F7F9F8] hover:text-[#1B2B1F] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F9F8] mb-3">
            <Mail className="h-5 w-5 text-[#C8D0CA]" />
          </div>
          <p className="text-sm font-semibold text-[#1B2B1F]">No messages yet</p>
          <p className="text-xs text-[#9BA39C] mt-0.5">Conversations with partners appear here</p>
        </div>
      ) : (
        <div className="max-h-[320px] overflow-y-auto divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3.5 hover:bg-[#FAFAF9] transition-colors cursor-pointer",
                !msg.read && "bg-[#EAF3EE]/40"
              )}
            >
              <MessageAvatar
                name={msg.sender.name}
                image={msg.sender.image}
                role={msg.sender.role}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={cn("text-[13px] truncate", !msg.read ? "font-semibold text-[#1B2B1F]" : "font-medium text-[#5C6B5E]")}>
                    {msg.sender.name ?? "Unknown"}
                  </span>
                  <span className="text-[11px] text-[#C8D0CA] shrink-0">{timeAgo(msg.createdAt)}</span>
                </div>
                <p className={cn("text-xs line-clamp-2 leading-relaxed", !msg.read ? "text-[#5C6B5E]" : "text-[#9BA39C]")}>
                  {msg.content}
                </p>
              </div>

              {!msg.read && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0F6E56]" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <Link
          href="/app/messages"
          onClick={onClose}
          className="text-[11px] font-semibold text-[#0F6E56] hover:underline"
        >
          View all messages
        </Link>
      </div>
    </AnimatedPanel>
  );
}

// ─── User menu dropdown ───────────────────────────────────────────────────────

function UserMenuDropdown({ user, onClose }: { user: TopBarUser; onClose: () => void }) {
  const pathname = usePathname();
  const { update } = useSession();
  const [isSwitching, startSwitching] = useTransition();

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  const isPartnerMode = user.activeMode === "partner" && user.partnerApproved;

  const badgeLabel = isPartnerMode ? "Partner" : user.role === "ADMIN" ? "Admin" : "Switcher";
  const badgeColor = isPartnerMode
    ? "bg-blue-50 text-[#2A5FA5]"
    : user.role === "ADMIN"
    ? "bg-red-50 text-red-600"
    : "bg-green-50 text-[#0F6E56]";

  const handleSwitch = () => {
    const nextMode = isPartnerMode ? "user" : "partner";
    startSwitching(async () => {
      await setActiveMode(nextMode);
      await update();
      onClose();
      window.location.href = pathname;
    });
  };

  return (
    <AnimatedPanel className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white overflow-hidden z-50" style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}>
      {/* Profile header */}
      <div className="px-4 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3">
          {isPartnerMode ? (
            user.partnerLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.partnerLogoUrl} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0 ring-2 ring-white" style={{ boxShadow: "0 0 0 1.5px rgba(0,0,0,0.08)" }} />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-[#2A5FA5] flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                {(user.partnerName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
            )
          ) : user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" style={{ boxShadow: "0 0 0 1.5px rgba(0,0,0,0.08)" }} />
          ) : (
            <div className="h-10 w-10 rounded-full bg-[#0F6E56] flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#1B2B1F] truncate leading-tight">
              {isPartnerMode ? (user.partnerName ?? user.name) : user.name}
            </p>
            <p className="text-[11px] text-[#9BA39C] truncate leading-tight mt-0.5">
              {isPartnerMode ? user.name : user.email}
            </p>
          </div>
        </div>
        <span
          className={cn("mt-2.5 inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-bold", badgeColor)}
        >
          {badgeLabel}
        </span>
      </div>

      {/* Menu items */}
      <div className="py-1.5 px-1.5">
        <Link
          href="/app/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#5C6B5E] hover:bg-[#F7F9F8] hover:text-[#1B2B1F] transition-colors group"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F0EDE8] group-hover:bg-[#E8E3D9] transition-colors shrink-0">
            <Settings className="h-3.5 w-3.5 text-[#9BA39C]" />
          </div>
          Settings
        </Link>

        {/* Mode switch — only for approved partners */}
        {user.partnerApproved && (
          <button
            onClick={handleSwitch}
            disabled={isSwitching}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-[#5C6B5E] hover:bg-[#F7F9F8] hover:text-[#1B2B1F] transition-colors disabled:opacity-50 group"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F0EDE8] group-hover:bg-[#E8E3D9] transition-colors shrink-0">
              <ArrowLeftRight className="h-3.5 w-3.5 text-[#9BA39C]" />
            </div>
            {isSwitching
              ? "Switching…"
              : isPartnerMode
              ? "Switch to Switcher account"
              : "Switch to Partner account"}
          </button>
        )}
      </div>
    </AnimatedPanel>
  );
}

// ─── Main TopBar ──────────────────────────────────────────────────────────────

type Panel = "notifications" | "messages" | "user" | null;

export function TopBar({
  user,
  onMenuClick,
  notifications = [],
  recentMessages = [],
  unreadMessageCount = 0,
}: TopBarProps) {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [, startTransition] = useTransition();

  // Sync notifications when the server re-fetches after a mode switch
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const unreadCount = localNotifications.filter((n) => !n.read).length;

  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef   = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  const toggle = (panel: Panel) =>
    setActivePanel((prev) => (prev === panel ? null : panel));

  useClickOutside(notifRef, () => activePanel === "notifications" && setActivePanel(null));
  useClickOutside(msgRef,   () => activePanel === "messages"      && setActivePanel(null));
  useClickOutside(userRef,  () => activePanel === "user"          && setActivePanel(null));

  function handleMarkAllRead() {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(() => markAllNotificationsRead());
  }

  function handleNotifClick(n: NotificationItem) {
    if (!n.read) {
      setLocalNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
      startTransition(() => markNotificationRead(n.id));
    }
    setActivePanel(null);
    router.push(notifUrl(n, user.role));
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  const isPartnerMode = user.activeMode === "partner" && user.partnerApproved;
  const partnerInitials = (user.partnerName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header
      className="flex h-14 items-center gap-3 bg-white px-4 lg:px-5 shrink-0"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}
    >
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl text-[#9BA39C] hover:bg-[#F7F9F8] hover:text-[#1B2B1F] transition-colors"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xs">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-[#C8D0CA] pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            className="w-full h-9 pl-9 pr-14 text-[13px] rounded-xl outline-none transition-all placeholder:text-[#C8D0CA]"
            style={{
              background: "#F7F9F8",
              border: "1.5px solid rgba(0,0,0,0.06)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "1.5px solid #0F6E56";
              e.currentTarget.style.background = "#fff";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "1.5px solid rgba(0,0,0,0.06)";
              e.currentTarget.style.background = "#F7F9F8";
            }}
          />
          <kbd className="absolute right-3 flex items-center gap-0.5 text-[10px] text-[#C8D0CA] font-mono pointer-events-none select-none">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 ml-auto">

        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => toggle("notifications")}
            className={cn(
              "relative flex items-center justify-center h-9 w-9 rounded-xl transition-colors",
              activePanel === "notifications"
                ? "bg-[#EAF3EE] text-[#0F6E56]"
                : "text-[#9BA39C] hover:bg-[#F7F9F8] hover:text-[#1B2B1F]"
            )}
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                <span className="relative flex items-center justify-center h-[17px] min-w-[17px] rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </span>
            )}
          </button>
          {activePanel === "notifications" && (
            <NotificationDropdown
              notifications={localNotifications}
              onClose={() => setActivePanel(null)}
              onMarkAllRead={handleMarkAllRead}
              onNotifClick={handleNotifClick}
            />
          )}
        </div>

        {/* Messages */}
        <div ref={msgRef} className="relative">
          <button
            onClick={() => toggle("messages")}
            className={cn(
              "relative flex items-center justify-center h-9 w-9 rounded-xl transition-colors",
              activePanel === "messages"
                ? "bg-[#EAF3EE] text-[#0F6E56]"
                : "text-[#9BA39C] hover:bg-[#F7F9F8] hover:text-[#1B2B1F]"
            )}
            aria-label="Messages"
          >
            <Mail className="h-[18px] w-[18px]" />
            {unreadMessageCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>
          {activePanel === "messages" && (
            <MessageDropdown
              messages={recentMessages}
              onClose={() => setActivePanel(null)}
            />
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px mx-1" style={{ background: "rgba(0,0,0,0.08)" }} />

        {/* User avatar button */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => toggle("user")}
            className={cn(
              "flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl transition-all duration-150",
              activePanel === "user"
                ? "bg-[#EAF3EE]"
                : "hover:bg-[#F7F9F8]"
            )}
            aria-label="User menu"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              {isPartnerMode ? (
                user.partnerLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.partnerLogoUrl} alt="" className="h-7 w-7 rounded-lg object-cover" />
                ) : (
                  <div className="h-7 w-7 rounded-lg bg-[#2A5FA5] flex items-center justify-center text-white text-[11px] font-bold select-none">
                    {partnerInitials}
                  </div>
                )
              ) : user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-[#0F6E56] flex items-center justify-center text-white text-[11px] font-bold select-none">
                  {initials}
                </div>
              )}
            </div>

            {/* Name + mode — hidden on small screens */}
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-[12px] font-semibold text-[#1B2B1F] leading-tight truncate max-w-[96px]">
                {isPartnerMode ? (user.partnerName ?? user.name) : user.name}
              </p>
              <p
                className="text-[10px] font-semibold leading-tight"
                style={{ color: isPartnerMode ? "#2A5FA5" : "#0F6E56" }}
              >
                {isPartnerMode ? "Partner" : user.role === "ADMIN" ? "Admin" : "Switcher"}
              </p>
            </div>
          </button>
          {activePanel === "user" && (
            <UserMenuDropdown user={user} onClose={() => setActivePanel(null)} />
          )}
        </div>
      </div>
    </header>
  );
}
