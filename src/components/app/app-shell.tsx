"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import type { NotificationItem, MessageItem } from "./top-bar";

interface ShellUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "USER" | "PARTNER" | "ADMIN";
}

interface AppShellProps {
  user: ShellUser;
  notifications?: NotificationItem[];
  recentMessages?: MessageItem[];
  unreadMessageCount?: number;
  children: React.ReactNode;
}

export function AppShell({
  user,
  notifications = [],
  recentMessages = [],
  unreadMessageCount = 0,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          user={user}
          onMenuClick={() => setSidebarOpen((v) => !v)}
          notifications={notifications}
          recentMessages={recentMessages}
          unreadMessageCount={unreadMessageCount}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
