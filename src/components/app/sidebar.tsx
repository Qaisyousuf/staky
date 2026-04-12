"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  LayoutDashboard,
  Compass,
  Rss,
  Layers,
  Users,
  ClipboardList,
  Inbox,
  FileText,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/actions/auth";
import { Logo } from "@/components/shared/logo";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "USER" | "PARTNER" | "ADMIN";

interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  activeMode: string;
  partnerApproved: boolean;
  partnerLogoUrl?: string | null;
  partnerName?: string | null;
}

interface SidebarProps {
  user: SidebarUser;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Nav structure ────────────────────────────────────────────────────────────

const MAIN_NAV = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/discover",  label: "Discover",  icon: Compass },
  { href: "/app/feed",      label: "Community", icon: Rss },
  { href: "/app/my-stack",  label: "My Stack",  icon: Layers },
  { href: "/app/partners",  label: "Partners",  icon: Users },
  { href: "/app/requests",  label: "Requests",  icon: ClipboardList },
  { href: "/app/network",   label: "Network",   icon: Network },
];

const PARTNER_NAV = [
  { href: "/app/leads",    label: "Leads",    icon: Inbox },
  { href: "/app/my-posts", label: "My Posts", icon: FileText },
];

const BOTTOM_NAV = [
  { href: "/app/settings", label: "Settings", icon: Settings },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarLogo({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-14 items-center justify-between px-4 shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <Logo href="/app/dashboard" />
      <button
        className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-[#9BA39C] hover:text-[#1B2B1F] hover:bg-[#F0EDE8] transition-colors"
        onClick={onClose}
        aria-label="Close sidebar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
  variant = "user",
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
  variant?: "user" | "partner" | "admin";
}) {
  const accent    = variant === "partner" ? "#2A5FA5" : variant === "admin" ? "#B83258" : "#0F6E56";
  const accentBg  = variant === "partner" ? "#EBF1FA" : variant === "admin" ? "#FEF0F4" : "#EAF3EE";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group",
        active ? "" : "text-[#5C6B5E] hover:bg-[#F7F9F8] hover:text-[#1B2B1F]"
      )}
      style={active ? { color: accent, backgroundColor: accentBg } : {}}
    >
      {/* Active left bar */}
      {active && (
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
          style={{ background: accent }}
        />
      )}

      {/* Icon box */}
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors",
          active ? "" : "bg-[#F0EDE8] group-hover:bg-[#E8E3D9]"
        )}
        style={active ? { background: accent } : {}}
      >
        <Icon
          className={cn("h-3.5 w-3.5", active ? "text-white" : "text-[#9BA39C] group-hover:text-[#5C6B5E]")}
        />
      </div>

      {label}
    </Link>
  );
}

function NavSection({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      {label && (
        <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#C8D0CA]">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

function UserFooter({ user }: { user: SidebarUser }) {
  const [isPending, startTransition] = useTransition();

  const isPartnerMode = user.partnerApproved && user.activeMode === "partner";
  const displayName    = isPartnerMode ? (user.partnerName ?? user.name) : user.name;
  const displaySub     = isPartnerMode ? user.name : user.email;

  const handleSignOut = () => {
    startTransition(async () => { await signOutAction(); });
  };

  const initials = (displayName ?? "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="shrink-0 p-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      {/* User card */}
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F7F9F8] mb-1">
        {/* Avatar */}
        {isPartnerMode ? (
          user.partnerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.partnerLogoUrl} alt="" className="h-9 w-9 rounded-xl object-cover shrink-0 ring-2 ring-white" />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-[#2A5FA5] flex items-center justify-center text-white text-xs font-bold shrink-0 select-none ring-2 ring-white">
              {(user.partnerName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
          )
        ) : user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={user.name ?? "User"} className="h-9 w-9 rounded-full object-cover shrink-0 ring-2 ring-white" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-[#0F6E56] flex items-center justify-center text-white text-xs font-bold shrink-0 select-none ring-2 ring-white">
            {initials}
          </div>
        )}

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#1B2B1F] truncate leading-tight">
            {displayName ?? "User"}
          </p>
          <p className="text-[11px] text-[#9BA39C] truncate leading-tight mt-0.5">{displaySub}</p>
        </div>

        {/* Mode badge */}
        <span
          className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
          style={
            isPartnerMode
              ? { background: "#EBF1FA", color: "#2A5FA5" }
              : user.role === "ADMIN"
              ? { background: "#FEF0F4", color: "#B83258" }
              : { background: "#EAF3EE", color: "#0F6E56" }
          }
        >
          {isPartnerMode ? "Partner" : user.role === "ADMIN" ? "Admin" : "Free"}
        </span>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={isPending}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-[#9BA39C] hover:bg-[#F7F9F8] hover:text-[#1B2B1F] transition-colors disabled:opacity-50 group"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0EDE8] group-hover:bg-[#E8E3D9] transition-colors shrink-0">
          <LogOut className="h-3.5 w-3.5 text-[#9BA39C] group-hover:text-[#5C6B5E]" />
        </div>
        {isPending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive      = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isPartnerMode = user.partnerApproved && user.activeMode === "partner";
  const isAdmin       = user.role === "ADMIN";

  return (
    <>
      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-white transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ borderRight: "1px solid rgba(0,0,0,0.06)", boxShadow: "2px 0 16px rgba(0,0,0,0.04)" }}
      >
        <SidebarLogo onClose={onClose} />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Main */}
          <NavSection>
            {MAIN_NAV.map(({ href, label, icon }) => (
              <NavItem
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={isActive(href)}
                onClick={onClose}
              />
            ))}
          </NavSection>

          {/* Partner-only */}
          {isPartnerMode && (
            <NavSection label="Partner">
              {PARTNER_NAV.map(({ href, label, icon }) => (
                <NavItem
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  active={isActive(href)}
                  onClick={onClose}
                  variant="partner"
                />
              ))}
            </NavSection>
          )}

          {/* Bottom */}
          <NavSection label="Account">
            {BOTTOM_NAV.map(({ href, label, icon }) => (
              <NavItem
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={isActive(href)}
                onClick={onClose}
              />
            ))}
            {isAdmin && (
              <NavItem
                href="/app/admin"
                label="Admin"
                icon={ShieldCheck}
                active={isActive("/app/admin")}
                onClick={onClose}
                variant="admin"
              />
            )}
          </NavSection>
        </nav>

        <UserFooter user={user} />
      </aside>

      {/* Desktop spacer */}
      <div className="hidden lg:block w-60 shrink-0" />
    </>
  );
}
