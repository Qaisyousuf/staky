"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { User, CreditCard, Bell, ShieldCheck, Trash2, Handshake, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileTab } from "./tabs/profile-tab";
import { BillingTab } from "./tabs/billing-tab";
import { NotificationsTab } from "./tabs/notifications-tab";
import { PrivacyTab } from "./tabs/privacy-tab";
import { AccountTab } from "./tabs/account-tab";
import { PartnerTab } from "./tabs/partner-tab";
import { ProfileEditor } from "../company-profile/profile-editor";

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
    id: string;
    companyName: string;
    country: string;
    description: string;
    website: string;
    approved: boolean;
    rating: number;
    projectCount: number;
    logoUrl: string | null;
    coverImage: string | null;
    specialty: string[];
    services: string[];
    certifications: string[];
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

// ─── Tab configs ──────────────────────────────────────────────────────────────

const USER_TABS = [
  { id: "profile",       label: "Profile",        icon: User },
  { id: "partner",       label: "Partner",        icon: Handshake },
  { id: "billing",       label: "Plan & Billing",  icon: CreditCard },
  { id: "notifications", label: "Notifications",   icon: Bell },
  { id: "privacy",       label: "Privacy",         icon: ShieldCheck },
  { id: "account",       label: "Account",         icon: Trash2 },
] as const;

const PARTNER_TABS = [
  { id: "company",       label: "Company Profile", icon: Building2 },
  { id: "billing",       label: "Plan & Billing",  icon: CreditCard },
  { id: "notifications", label: "Notifications",   icon: Bell },
  { id: "privacy",       label: "Privacy",         icon: ShieldCheck },
  { id: "account",       label: "Account",         icon: Trash2 },
] as const;

type UserTabId    = typeof USER_TABS[number]["id"];
type PartnerTabId = typeof PARTNER_TABS[number]["id"];
type TabId        = UserTabId | PartnerTabId;

// ─── Shell ────────────────────────────────────────────────────────────────────

export function SettingsShell({
  user,
  notifSettings,
  activeMode,
}: {
  user: SettingsUser;
  notifSettings: NotifSettings | null;
  activeMode: "user" | "partner";
}) {
  const searchParams = useSearchParams();
  const isPartner = activeMode === "partner";
  const tabs = isPartner ? PARTNER_TABS : USER_TABS;

  const initialTab = searchParams.get("tab") as TabId | null;
  const validInitial = tabs.some((t) => t.id === initialTab) ? initialTab! : tabs[0].id;
  const [activeTab, setActiveTab] = useState<TabId>(validInitial);

  // Reset to first tab when mode changes so stale tab IDs don't persist
  const currentTabValid = tabs.some((t) => t.id === activeTab);
  const resolvedTab = currentTabValid ? activeTab : tabs[0].id;

  const defaultNotifSettings: NotifSettings = {
    inAppLikes: true, inAppComments: true, inAppReplies: true,
    inAppFollows: true, inAppConnects: true, inAppRecommendations: true,
    inAppSaves: true, inAppShares: true,
    emailLikes: false, emailComments: true, emailReplies: true,
    emailFollows: false, emailConnects: true, emailRecommendations: false,
    emailSaves: false, emailShares: false,
    emailDigest: "DAILY",
  };

  const heading = isPartner ? "Partner Settings" : "Settings";
  const subtitle = isPartner
    ? "Manage your company profile and partner preferences"
    : "Manage your account preferences";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{heading}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Tab sidebar */}
        <nav className="hidden md:flex flex-col w-48 shrink-0 bg-white rounded-xl border border-gray-200 py-2 sticky top-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors rounded-lg mx-1.5 text-left",
                resolvedTab === id
                  ? isPartner
                    ? "bg-blue-50 text-[#2A5FA5]"
                    : "bg-green-50 text-[#0F6E56]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 shrink-0",
                resolvedTab === id
                  ? isPartner ? "text-[#2A5FA5]" : "text-[#0F6E56]"
                  : "text-gray-400"
              )} />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile tab bar */}
        <div className="md:hidden w-full mb-4">
          <div className="flex overflow-x-auto gap-1 bg-white rounded-xl border border-gray-200 p-1.5 scrollbar-hide">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0",
                  resolvedTab === id
                    ? isPartner
                      ? "bg-blue-50 text-[#2A5FA5]"
                      : "bg-green-50 text-[#0F6E56]"
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
          {/* Partner mode tabs */}
          {isPartner && resolvedTab === "company" && user.partner && (
            <ProfileEditor
              partner={{
                id: user.partner.id,
                companyName: user.partner.companyName,
                country: user.partner.country,
                description: user.partner.description,
                website: user.partner.website,
                logoUrl: user.partner.logoUrl ?? "",
                coverImage: user.partner.coverImage ?? "",
                specialty: user.partner.specialty,
                services: user.partner.services,
                certifications: user.partner.certifications,
                approved: user.partner.approved,
                rating: user.partner.rating,
                projectCount: user.partner.projectCount,
              }}
            />
          )}
          {isPartner && resolvedTab === "billing" && <BillingTab plan={user.plan} />}

          {/* Shared tabs */}
          {resolvedTab === "notifications" && (
            <NotificationsTab settings={notifSettings ?? defaultNotifSettings} />
          )}
          {resolvedTab === "privacy" && (
            <PrivacyTab profileVisibility={user.profileVisibility} />
          )}
          {resolvedTab === "account" && (
            <AccountTab email={user.email} createdAt={user.createdAt} />
          )}

          {/* Switcher-only tabs */}
          {!isPartner && resolvedTab === "profile" && <ProfileTab user={user} activeMode={activeMode} />}
          {!isPartner && resolvedTab === "partner" && <PartnerTab partner={user.partner} />}
          {!isPartner && resolvedTab === "billing" && <BillingTab plan={user.plan} />}
        </div>
      </div>
    </div>
  );
}
