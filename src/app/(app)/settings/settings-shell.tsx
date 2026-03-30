"use client";

import { useState } from "react";
import { User, CreditCard, Bell, ShieldCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileTab } from "./tabs/profile-tab";
import { BillingTab } from "./tabs/billing-tab";
import { NotificationsTab } from "./tabs/notifications-tab";
import { PrivacyTab } from "./tabs/privacy-tab";
import { AccountTab } from "./tabs/account-tab";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SettingsUser {
  id: string;
  name: string;
  email: string;
  image: string;
  coverImage: string;
  bio: string;
  title: string;
  company: string;
  location: string;
  socialLinks: { linkedin: string; twitter: string; github: string; website: string };
  interests: string[];
  role: string;
  plan: string;
  profileVisibility: string;
  createdAt: string;
  partner: {
    companyName: string;
    country: string;
    approved: boolean;
    rating: number;
    projectCount: number;
  } | null;
}

export interface NotifSettings {
  inAppLikes: boolean;
  inAppComments: boolean;
  inAppReplies: boolean;
  inAppFollows: boolean;
  inAppConnects: boolean;
  inAppRecommendations: boolean;
  inAppSaves: boolean;
  inAppShares: boolean;
  emailLikes: boolean;
  emailComments: boolean;
  emailReplies: boolean;
  emailFollows: boolean;
  emailConnects: boolean;
  emailRecommendations: boolean;
  emailSaves: boolean;
  emailShares: boolean;
  emailDigest: "REAL_TIME" | "DAILY" | "WEEKLY" | "OFF";
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "profile",       label: "Profile",        icon: User },
  { id: "billing",       label: "Plan & Billing",  icon: CreditCard },
  { id: "notifications", label: "Notifications",   icon: Bell },
  { id: "privacy",       label: "Privacy",         icon: ShieldCheck },
  { id: "account",       label: "Account",         icon: Trash2 },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Shell ────────────────────────────────────────────────────────────────────

export function SettingsShell({
  user,
  notifSettings,
}: {
  user: SettingsUser;
  notifSettings: NotifSettings | null;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const defaultNotifSettings: NotifSettings = {
    inAppLikes: true, inAppComments: true, inAppReplies: true,
    inAppFollows: true, inAppConnects: true, inAppRecommendations: true,
    inAppSaves: true, inAppShares: true,
    emailLikes: false, emailComments: true, emailReplies: true,
    emailFollows: false, emailConnects: true, emailRecommendations: false,
    emailSaves: false, emailShares: false,
    emailDigest: "DAILY",
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account preferences</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Tab sidebar */}
        <nav className="hidden md:flex flex-col w-48 shrink-0 bg-white rounded-xl border border-gray-200 py-2 sticky top-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors rounded-lg mx-1.5 text-left",
                activeTab === id
                  ? "bg-green-50 text-[#0F6E56]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", activeTab === id ? "text-[#0F6E56]" : "text-gray-400")} />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile tab bar */}
        <div className="md:hidden w-full mb-4">
          <div className="flex overflow-x-auto gap-1 bg-white rounded-xl border border-gray-200 p-1.5 scrollbar-hide">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0",
                  activeTab === id
                    ? "bg-green-50 text-[#0F6E56]"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && <ProfileTab user={user} />}
          {activeTab === "billing" && <BillingTab plan={user.plan} />}
          {activeTab === "notifications" && (
            <NotificationsTab settings={notifSettings ?? defaultNotifSettings} />
          )}
          {activeTab === "privacy" && (
            <PrivacyTab
              profileVisibility={user.profileVisibility}
              userEmail={user.email}
            />
          )}
          {activeTab === "account" && (
            <AccountTab email={user.email} createdAt={user.createdAt} />
          )}
        </div>
      </div>
    </div>
  );
}
