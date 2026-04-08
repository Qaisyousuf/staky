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
  { href: "/app/discover", label: "Discover", icon: Compass },
  { href: "/app/feed", label: "Feed", icon: Rss },
  { href: "/app/my-stack", label: "My Stack", icon: Layers },
  { href: "/app/partners", label: "Partners", icon: Users },
  { href: "/app/requests", label: "Requests", icon: ClipboardList },
  { href: "/app/network", label: "Network", icon: Network },
];

const PARTNER_NAV = [
  { href: "/app/leads", label: "Leads", icon: Inbox },
  { href: "/app/my-posts", label: "My Posts", icon: FileText },
];

const BOTTOM_NAV = [
  { href: "/app/settings", label: "Settings", icon: Settings },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarLogo({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-14 items-center justify-between px-4 border-b border-gray-100">
      <Logo href="/app/dashboard" />
      <button
        className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
        active
          ? "bg-green-50 text-[#0F6E56]"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active ? "text-[#0F6E56]" : "text-gray-400 group-hover:text-gray-600"
        )}
      />
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
        <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

function UserAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? "User"}
        className="h-8 w-8 rounded-full object-cover shrink-0"
      />
    );
  }

  return (
    <div className="h-8 w-8 rounded-full bg-[#0F6E56] flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none">
      {initials}
    </div>
  );
}

function UserFooter({ user }: { user: SidebarUser }) {
  const [isPending, startTransition] = useTransition();

  const isPartnerMode = user.partnerApproved && user.activeMode === "partner";
  const displayName = isPartnerMode ? (user.partnerName ?? user.name) : user.name;
  const displaySubtitle = isPartnerMode ? user.name : user.email;

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <div className="border-t border-gray-100 p-3 space-y-1">
      {/* User info */}
      <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
        {isPartnerMode ? (
          user.partnerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.partnerLogoUrl} alt="" className="h-8 w-8 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-xl bg-[#2A5FA5] flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none">
              {(user.partnerName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
          )
        ) : (
          <UserAvatar name={user.name} image={user.image} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate leading-tight">
            {displayName ?? "User"}
          </p>
          <p className="text-xs text-gray-400 truncate leading-tight">{displaySubtitle}</p>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={isPending}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
      >
        <LogOut className="h-4 w-4 text-gray-400 shrink-0" />
        {isPending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const isPartnerMode = user.partnerApproved && user.activeMode === "partner";
  const isAdmin = user.role === "ADMIN";

  return (
    <>
      {/* Sidebar panel */}
      <aside
        className={cn(
          // Base
          "fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-white border-r border-gray-100 transition-transform duration-200",
          // Mobile: slide in/out; Desktop: always visible
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <SidebarLogo onClose={onClose} />

        {/* Nav items */}
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
                />
              ))}
            </NavSection>
          )}

          {/* Bottom items */}
          <NavSection>
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
              />
            )}
          </NavSection>
        </nav>

        {/* User footer */}
        <UserFooter user={user} />
      </aside>

      {/* Desktop spacer — pushes content right on large screens */}
      <div className="hidden lg:block w-60 shrink-0" />
    </>
  );
}
