"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  ArrowRightLeft,
  Handshake,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",  label: "Overview",  icon: LayoutDashboard },
  { id: "posts",     label: "Posts",     icon: FileText },
  { id: "comments",  label: "Comments",  icon: MessageSquare },
  { id: "requests",  label: "Requests",  icon: ArrowRightLeft },
  { id: "partners",  label: "Partners",  icon: Handshake },
  { id: "users",     label: "Users",     icon: Users },
  { id: "reports",   label: "Reports",   icon: BarChart3 },
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
  return (
    <div className="max-w-7xl mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage users, content, and platform settings</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar nav */}
        <nav className="hidden md:flex flex-col w-48 shrink-0 bg-white rounded-xl border border-gray-200 py-2 sticky top-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={`/app/admin?tab=${id}`}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors rounded-lg mx-1.5",
                currentTab === id
                  ? "bg-green-50 text-[#0F6E56]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  currentTab === id ? "text-[#0F6E56]" : "text-gray-400"
                )}
              />
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile tab bar */}
        <div className="md:hidden w-full">
          <div className="flex overflow-x-auto gap-1 bg-white rounded-xl border border-gray-200 p-1.5 mb-4">
            {TABS.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                href={`/app/admin?tab=${id}`}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0",
                  currentTab === id
                    ? "bg-green-50 text-[#0F6E56]"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
