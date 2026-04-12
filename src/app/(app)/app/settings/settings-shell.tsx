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

const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

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
  { id: "profile",       label: "Profile",        icon: User,        desc: "Personal info & photo" },
  { id: "partner",       label: "Partner",        icon: Handshake,   desc: "Apply or manage partner" },
  { id: "billing",       label: "Plan & Billing", icon: CreditCard,  desc: "Plans and payments" },
  { id: "notifications", label: "Notifications",  icon: Bell,        desc: "What you hear about" },
  { id: "privacy",       label: "Privacy",        icon: ShieldCheck, desc: "Visibility & data export" },
  { id: "account",       label: "Account",        icon: Trash2,      desc: "Security & deletion" },
] as const;

const PARTNER_TABS = [
  { id: "company",       label: "Company Profile", icon: Building2,   desc: "Public company page" },
  { id: "billing",       label: "Plan & Billing",  icon: CreditCard,  desc: "Plans and payments" },
  { id: "notifications", label: "Notifications",   icon: Bell,        desc: "What you hear about" },
  { id: "privacy",       label: "Privacy",         icon: ShieldCheck, desc: "Visibility & data export" },
  { id: "account",       label: "Account",         icon: Trash2,      desc: "Security & deletion" },
] as const;

type UserTabId    = typeof USER_TABS[number]["id"];
type PartnerTabId = typeof PARTNER_TABS[number]["id"];
type TabId        = UserTabId | PartnerTabId;

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ image, name }: { image: string; name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} className="h-10 w-10 rounded-full object-cover ring-2 ring-white shrink-0" />;
  }
  return (
    <div className="h-10 w-10 rounded-full bg-[#0F6E56] flex items-center justify-center text-white text-[13px] font-bold ring-2 ring-white shrink-0 select-none">
      {initials}
    </div>
  );
}

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
  const accent = isPartner ? "#2A5FA5" : "#0F6E56";
  const accentBg = isPartner ? "bg-[#EBF1FA]" : "bg-[#EAF3EE]";

  const initialTab = searchParams.get("tab") as TabId | null;
  const validInitial = tabs.some((t) => t.id === initialTab) ? initialTab! : tabs[0].id;
  const [activeTab, setActiveTab] = useState<TabId>(validInitial);

  const currentTabValid = tabs.some((t) => t.id === activeTab);
  const resolvedTab = currentTabValid ? activeTab : tabs[0].id;
  const currentTabMeta = tabs.find((t) => t.id === resolvedTab);

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
    <div className="max-w-5xl mx-auto px-4 lg:px-0 pb-16" style={{ fontFamily: F }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F6E56] mb-1">
            {isPartner ? "Partner" : "Account"}
          </p>
          <h1 className="text-[22px] font-black text-[#1B2B1F] leading-tight">Settings</h1>
          <p className="text-[13px] text-[#5C6B5E] mt-0.5">
            {isPartner ? "Manage your company profile and partner preferences" : "Manage your account preferences"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Avatar image={user.image} name={user.name} />
          <div className="hidden sm:block min-w-0">
            <p className="text-[13px] font-semibold text-[#1B2B1F] truncate">{user.name}</p>
            <p className="text-[11px] text-[#9BA39C] truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* ── Mobile tab strip ─────────────────────────────────────────────────── */}
      <div className="md:hidden mb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className="flex gap-1.5 p-1.5 rounded-2xl min-w-max"
          style={{ background: "rgba(0,0,0,0.04)", border: "1.5px solid rgba(0,0,0,0.06)" }}
        >
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = resolvedTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0",
                  active
                    ? "bg-white shadow-sm"
                    : "text-[#6B7B6E] hover:text-[#1B2B1F] hover:bg-white/60"
                )}
                style={active ? { color: accent, boxShadow: "0 1px 4px rgba(0,0,0,0.10)" } : {}}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Layout ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* Desktop sidebar nav */}
        <nav
          className="hidden md:flex flex-col w-52 shrink-0 sticky top-6 rounded-2xl overflow-hidden"
          style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)" }}
        >
          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 border-b border-[rgba(0,0,0,0.05)] bg-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9BA39C]">Navigation</p>
          </div>

          {/* Nav items */}
          <div className="py-2 bg-white">
            {tabs.map(({ id, label, icon: Icon, desc }) => {
              const active = resolvedTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 relative group",
                    active ? "bg-[#F7F9FC]" : "hover:bg-[#FAFAF9]"
                  )}
                >
                  {/* Active indicator */}
                  {active && (
                    <div
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                      style={{ background: accent }}
                    />
                  )}
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition-colors",
                      active ? accentBg : "bg-[#F0EDE8] group-hover:bg-[#E8E3D9]"
                    )}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: active ? accent : "#9BA39C" }}
                    />
                  </div>
                  {/* Label */}
                  <div className="min-w-0">
                    <p
                      className="text-[12px] font-semibold leading-tight truncate"
                      style={{ color: active ? accent : "#1B2B1F" }}
                    >
                      {label}
                    </p>
                    <p className="text-[10px] text-[#9BA39C] truncate leading-tight mt-0.5">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">

          {/* Mobile section heading */}
          {currentTabMeta && (
            <div className="md:hidden flex items-center gap-2.5 mb-4 px-1">
              <div
                className={cn("flex h-8 w-8 items-center justify-center rounded-xl shrink-0", accentBg)}
              >
                <currentTabMeta.icon className="h-3.5 w-3.5" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#1B2B1F]">{currentTabMeta.label}</p>
                <p className="text-[11px] text-[#9BA39C]">{currentTabMeta.desc}</p>
              </div>
            </div>
          )}

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
