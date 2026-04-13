"use client";

import Link from "next/link";
import {
  LayoutDashboard, FileText, MessageSquare, ArrowRightLeft,
  Handshake, Users, BarChart3, Package2, BookOpen, Inbox, Briefcase,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",  label: "Overview",   icon: LayoutDashboard, desc: "Platform at a glance" },
  { id: "posts",     label: "Posts",      icon: FileText,        desc: "Content moderation" },
  { id: "comments",  label: "Comments",   icon: MessageSquare,   desc: "Comment moderation" },
  { id: "requests",  label: "Requests",   icon: ArrowRightLeft,  desc: "Migration requests" },
  { id: "partners",  label: "Partners",   icon: Handshake,       desc: "Partner approvals" },
  { id: "users",     label: "Users",      icon: Users,           desc: "User management" },
  { id: "reports",   label: "Reports",    icon: BarChart3,       desc: "Reported content" },
  { id: "tools",     label: "Tools",      icon: Package2,        desc: "Software tools" },
  { id: "blog",      label: "Blog",       icon: BookOpen,        desc: "Blog management" },
  { id: "contact",   label: "Contact",    icon: Inbox,           desc: "Contact submissions" },
  { id: "jobs",      label: "Jobs",       icon: Briefcase,       desc: "Job listings" },
] as const;

export type AdminTab = typeof TABS[number]["id"];

// ─── Shell ────────────────────────────────────────────────────────────────────

export function AdminShell({
  currentTab,
  children,
}: {
  currentTab: AdminTab;
  children: React.ReactNode;
}) {
  const currentMeta = TABS.find((t) => t.id === currentTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" style={{ fontFamily: F }}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
          style={{ background: "linear-gradient(135deg,#1B2B1F,#0F6E56)", boxShadow: "0 2px 8px rgba(15,110,86,0.3)" }}
        >
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F6E56] mb-0.5">Admin</p>
          <h1 className="text-[22px] font-black text-[#1B2B1F] leading-tight">Control Panel</h1>
        </div>
      </div>

      {/* ── Mobile tab strip ─────────────────────────────────────────────────── */}
      <div className="md:hidden mb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className="flex gap-1.5 p-1.5 rounded-2xl min-w-max"
          style={{ background: "#1B2B1F" }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = currentTab === id;
            return (
              <Link
                key={id}
                href={`/app/admin?tab=${id}`}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0",
                  active
                    ? "bg-[#0F6E56] text-white shadow-sm"
                    : "text-white/50 hover:text-white/80 hover:bg-white/10"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Layout ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* Desktop sidebar nav */}
        <nav
          className="hidden md:flex flex-col w-52 shrink-0 sticky top-6 rounded-2xl overflow-hidden"
          style={{ background: "#1B2B1F", boxShadow: "0 4px 24px rgba(27,43,31,0.18)" }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Navigation</p>
          </div>

          {/* Nav items */}
          <div className="py-2">
            {TABS.map(({ id, label, icon: Icon, desc }) => {
              const active = currentTab === id;
              return (
                <Link
                  key={id}
                  href={`/app/admin?tab=${id}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-all duration-150 relative group",
                    active ? "bg-white/10" : "hover:bg-white/5"
                  )}
                >
                  {/* Active indicator */}
                  {active && (
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#0F6E56]" />
                  )}
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition-colors",
                      active ? "bg-[#0F6E56]" : "bg-white/10 group-hover:bg-white/15"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  {/* Label */}
                  <div className="min-w-0">
                    <p className={cn("text-[12px] font-semibold leading-tight truncate", active ? "text-white" : "text-white/60 group-hover:text-white/90")}>
                      {label}
                    </p>
                    <p className="text-[10px] text-white/30 truncate leading-tight mt-0.5">{desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Mobile section heading */}
          {currentMeta && (
            <div className="md:hidden flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0F6E56] shrink-0">
                <currentMeta.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#1B2B1F]">{currentMeta.label}</p>
                <p className="text-[11px] text-[#9BA39C]">{currentMeta.desc}</p>
              </div>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
