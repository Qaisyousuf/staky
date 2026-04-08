"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  BadgeCheck, MapPin, Briefcase, Star,
  UserPlus, UserCheck, Link2, CalendarDays,
  Globe, ExternalLink, Handshake,
  Tag, MessageSquare, CheckCircle2, Eye, Network, ArrowRight, ArrowLeft,
  Award, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFollow, toggleConnect } from "@/actions/social";
import { recordProfileView } from "@/actions/profile";
import { RequestHelpButton } from "@/components/shared/request-help-button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
}

interface ProfileUser {
  id: string;
  name: string | null;
  image: string | null;
  coverImage: string | null;
  bio: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  role: string;
  verified: boolean;
  plan: string;
  activeMode: string;
  createdAt: string;
  socialLinks: SocialLinks;
  interests: string[];
  partner: {
    companyName: string;
    country: string;
    specialty: string[];
    services: string[];
    certifications: string[];
    description: string | null;
    pricing: string | null;
    rating: number;
    projectCount: number;
    approved: boolean;
    featured: boolean;
    logoUrl: string | null;
    coverImage: string | null;
    website: string | null;
  } | null;
}

interface SuggestedProfile {
  id: string;
  name: string | null;
  image: string | null;
  title: string | null;
  company: string | null;
  role: string;
  activeMode?: string;
  partner?: { companyName: string; logoUrl: string | null; approved: boolean } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatWebsite(url: string) {
  const href = url.startsWith("http") ? url : `https://${url}`;
  const domain = href.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return { href, domain };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  image,
  name,
  isPartner,
  className,
}: {
  image: string | null;
  name: string | null;
  isPartner: boolean;
  className?: string;
}) {
  const shape = isPartner ? "rounded-2xl" : "rounded-full";
  const bg = isPartner
    ? "bg-[#2A5FA5]"
    : "bg-gradient-to-br from-[#0F6E56] to-[#1a9070]";

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={name ?? ""} className={cn(shape, "object-cover", className)} />
    );
  }
  return (
    <div className={cn(shape, bg, "flex items-center justify-center font-bold text-white select-none", className)}>
      {getInitials(name)}
    </div>
  );
}

// ─── Follow button ────────────────────────────────────────────────────────────

function FollowButton({ userId, initialFollowing }: { userId: string; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      try { const res = await toggleFollow(userId); setFollowing(res.following); }
      catch { setFollowing(!next); }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50",
        following
          ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          : "bg-[#0F6E56] text-white hover:bg-[#0a5a45]"
      )}
    >
      {following
        ? <><UserCheck className="h-3.5 w-3.5" /> Following</>
        : <><UserPlus className="h-3.5 w-3.5" /> Follow</>
      }
    </button>
  );
}

// ─── Connect button ───────────────────────────────────────────────────────────

function ConnectButton({ userId, initialConnected }: { userId: string; initialConnected: boolean }) {
  const [connected, setConnected] = useState(initialConnected);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !connected;
    setConnected(next);
    startTransition(async () => {
      try { const res = await toggleConnect(userId); setConnected(res.connected); }
      catch { setConnected(!next); }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50",
        connected
          ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          : "bg-[#2A5FA5] text-white hover:bg-[#244d8a]"
      )}
    >
      <Link2 className="h-3.5 w-3.5" />
      {connected ? "Connected" : "Connect"}
    </button>
  );
}

// ─── Profile Strength ─────────────────────────────────────────────────────────

function ProfileStrength({ user }: { user: ProfileUser }) {
  const links = user.socialLinks;
  const hasSocialLink = !!(links.linkedin || links.twitter || links.github || links.website);

  const fields = [
    { met: !!user.image,                pts: 15, suggestion: "Add a profile photo" },
    { met: !!user.name,                  pts: 10, suggestion: "Add your full name" },
    { met: !!user.title,                 pts: 15, suggestion: "Add a headline" },
    { met: !!user.bio,                   pts: 15, suggestion: "Write a short bio" },
    { met: !!user.company,               pts: 10, suggestion: "Add your company" },
    { met: !!user.location,              pts: 10, suggestion: "Add your location" },
    { met: hasSocialLink,                pts: 10, suggestion: "Add a social link" },
    { met: user.interests.length > 0,   pts: 10, suggestion: "Add interests" },
    { met: !!links.website,              pts:  5, suggestion: "Add your website" },
  ];

  const score = fields.filter((f) => f.met).reduce((s, f) => s + f.pts, 0);
  const incomplete = fields.filter((f) => !f.met);

  const { badge, color } =
    score >= 90 ? { badge: "All-star ⭐", color: "text-amber-500" } :
    score >= 61 ? { badge: "Advanced", color: "text-[#0F6E56]" } :
    score >= 31 ? { badge: "Intermediate", color: "text-blue-500" } :
    { badge: "Getting started", color: "text-gray-400" };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Profile strength</h3>
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-3xl font-black text-[#0F6E56]">
            {score}<span className="text-sm text-gray-400 font-normal">%</span>
          </span>
          <span className={cn("text-[11px] font-bold", color)}>{badge}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-[#0F6E56] to-[#1abc8a] rounded-full transition-all duration-700"
            style={{ width: `${score}%` }}
          />
        </div>

        {incomplete.length > 0 ? (
          <div className="space-y-2.5">
            {incomplete.slice(0, 4).map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-200 shrink-0" />
                <span className="text-xs text-gray-500 flex-1">{f.suggestion}</span>
                <span className="text-[10px] font-semibold text-[#0F6E56]">+{f.pts}</span>
              </div>
            ))}
            <Link
              href="/app/settings"
              className="mt-1 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#0F6E56] hover:text-[#0F6E56] transition-colors"
            >
              Edit profile <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#0F6E56] font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Profile complete!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Partner self sidebar ──────────────────────────────────────────────────────

function PartnerSelfSidebar({ partner }: { partner: NonNullable<ProfileUser["partner"]> }) {
  const fields = [
    { met: !!partner.logoUrl,                          suggestion: "Add a company logo" },
    { met: !!partner.description,                      suggestion: "Write a company description" },
    { met: (partner.specialty ?? []).length > 0,       suggestion: "Add specialties" },
    { met: (partner.services ?? []).length > 0,        suggestion: "Add services" },
    { met: (partner.certifications ?? []).length > 0,  suggestion: "Add certifications" },
    { met: !!partner.website,                          suggestion: "Add your website" },
    { met: !!partner.pricing,                          suggestion: "Add pricing info" },
  ];
  const complete = fields.filter((f) => f.met).length;
  const pct = Math.round((complete / fields.length) * 100);
  const incomplete = fields.filter((f) => !f.met);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Partner profile</h3>
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-3xl font-black text-[#2A5FA5]">
            {pct}<span className="text-sm text-gray-400 font-normal">%</span>
          </span>
          <span className="text-[11px] font-bold text-[#2A5FA5]">
            {pct === 100 ? "Complete ✓" : `${complete}/${fields.length} fields`}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-[#1e3f6b] to-[#2A5FA5] rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        {incomplete.length > 0 ? (
          <div className="space-y-2.5">
            {incomplete.slice(0, 4).map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-200 shrink-0" />
                <span className="text-xs text-gray-500 flex-1">{f.suggestion}</span>
              </div>
            ))}
            <Link
              href="/app/settings?tab=partner"
              className="mt-1 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-[#2A5FA5]/30 text-xs font-semibold text-[#2A5FA5] hover:bg-blue-50 transition-colors"
            >
              Edit partner profile <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#2A5FA5] font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Partner profile complete!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── People also viewed ───────────────────────────────────────────────────────

function PeopleAlsoViewed({ profiles }: { profiles: SuggestedProfile[] }) {
  if (profiles.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">People also viewed</h3>
      </div>
      <div className="p-3 space-y-1">
        {profiles.slice(0, 3).map((p) => {
          const pIsPartner = p.activeMode === "partner" && !!p.partner?.approved;
          const pDisplayName = pIsPartner ? (p.partner!.companyName ?? p.name) : p.name;
          const pDisplayImage = pIsPartner ? (p.partner!.logoUrl ?? null) : p.image;
          return (
            <Link
              key={p.id}
              href={`/app/profile/${p.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Avatar
                image={pDisplayImage}
                name={pDisplayName}
                isPartner={pIsPartner}
                className="h-9 w-9 text-sm shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#0F6E56] transition-colors">
                  {pDisplayName ?? "Anonymous"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {pIsPartner ? "Migration Partner" : (p.title ?? p.company ?? "Staky member")}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileClient({
  user,
  followerCount,
  followingCount,
  isFollowing,
  isConnected,
  connectionCount,
  isSelf,
  suggestedProfiles,
  backHref,
}: {
  user: ProfileUser;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isConnected: boolean;
  connectionCount: number | null;
  isSelf: boolean;
  suggestedProfiles: SuggestedProfile[];
  backHref?: string;
}) {
  // Show partner identity only when the profile user is in partner mode
  const isPartner = user.activeMode === "partner" && !!user.partner?.approved;
  const displayName = isPartner ? (user.partner!.companyName ?? user.name) : user.name;
  const displayImage = isPartner ? (user.partner!.logoUrl ?? user.image) : user.image;

  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    recordProfileView(user.id).catch(() => {});
  }, [user.id]);

  const bioText = user.bio ?? "";
  const bioTruncated = bioText.length > 240 && !bioExpanded ? bioText.slice(0, 240) + "…" : bioText;

  const websiteUrl = isPartner ? user.partner?.website : user.socialLinks.website;
  const website = websiteUrl ? formatWebsite(websiteUrl) : null;

  const coverGradient = isPartner
    ? "linear-gradient(135deg, #0d2748 0%, #1e3f6b 45%, #2A5FA5 75%, #4a7fc4 100%)"
    : "linear-gradient(135deg, #064e3b 0%, #0a5c45 45%, #0F6E56 75%, #10b981 100%)";
  const activeCover = isPartner
    ? (user.partner!.coverImage ?? user.coverImage)
    : user.coverImage;

  return (
    <div className="max-w-4xl mx-auto">
      {backHref && (
        <div className="mb-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {backHref === "/app/network" ? "Back to Network" : "Back to Profile Views"}
          </Link>
        </div>
      )}
      <div className="grid lg:grid-cols-[1fr_256px] gap-4 items-start">

        {/* ── Profile card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

          {/* Cover */}
          <div className="h-40 relative overflow-hidden">
            {activeCover ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeCover} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              </>
            ) : (
              <div className="w-full h-full" style={{ background: coverGradient }} />
            )}
          </div>

          {/* Body */}
          <div className="px-6 pb-7">

            {/* Avatar + action row */}
            <div className="flex items-end justify-between -mt-11 mb-5">
              {/* Avatar with verified dot */}
              <div className="relative">
                <Avatar
                  image={displayImage}
                  name={displayName}
                  isPartner={isPartner}
                  className="h-[88px] w-[88px] text-2xl border-4 border-white shadow-lg"
                />
                {user.verified && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 bg-[#2A5FA5] rounded-full border-2 border-white flex items-center justify-center">
                    <BadgeCheck className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>

              {/* Action buttons — compact and professional */}
              <div className="flex items-center gap-2 mb-0.5">
                {isSelf ? (
                  <Link
                    href={isPartner ? "/app/settings?tab=partner" : "/app/settings"}
                    className={cn(
                      "inline-flex items-center h-8 px-3.5 rounded-lg text-xs font-semibold transition-colors",
                      isPartner
                        ? "border border-[#2A5FA5]/30 text-[#2A5FA5] bg-white hover:bg-blue-50"
                        : "border border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
                    )}
                  >
                    {isPartner ? "Edit partner profile" : "Edit profile"}
                  </Link>
                ) : (
                  <>
                    {isPartner ? (
                      <>
                        <ConnectButton userId={user.id} initialConnected={isConnected} />
                        {user.partner?.approved && (
                          <RequestHelpButton
                            source="partner_profile"
                            partnerUserId={user.id}
                            partnerName={user.partner.companyName}
                            label="Request help"
                            className="inline-flex items-center gap-1.5 h-8 rounded-lg bg-[#0F6E56] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#0a5a45]"
                          />
                        )}
                      </>
                    ) : (
                      <FollowButton userId={user.id} initialFollowing={isFollowing} />
                    )}
                    <Link
                      href={`/app/messages?user=${user.id}`}
                      className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Name + partner badge */}
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">{displayName ?? "Anonymous"}</h1>
              {isPartner && (
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-semibold text-[#2A5FA5]">
                  <BadgeCheck className="h-3 w-3" /> Migration Partner
                </span>
              )}
              {isPartner && user.partner!.featured && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                  <Star className="h-3 w-3 fill-amber-500" /> Featured
                </span>
              )}
            </div>

            {/* For partners: personal account name as secondary */}
            {isPartner && user.name && (
              <p className="text-xs text-gray-400 -mt-0.5 mb-2">{user.name}</p>
            )}

            {/* User headline */}
            {!isPartner && user.title && (
              <p className="text-sm font-medium text-gray-600 mb-3">{user.title}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-4">
              {!isPartner && user.company && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {user.company}
                </span>
              )}
              {(isPartner ? user.partner!.country : user.location) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {isPartner ? user.partner!.country : user.location}
                </span>
              )}
              <span className="flex items-center gap-1 text-gray-400">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                Joined {new Date(user.createdAt).getFullYear()}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-5">
              {isPartner ? (
                <Link href="/app/network" className="group">
                  <span className="text-sm font-bold text-gray-900 group-hover:text-[#2A5FA5] transition-colors">
                    {connectionCount ?? 0}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">connections</span>
                </Link>
              ) : (
                <>
                  <Link href="/app/network?tab=followers" className="group">
                    <span className="text-sm font-bold text-gray-900 group-hover:text-[#0F6E56] transition-colors">
                      {followerCount}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">followers</span>
                  </Link>
                  <span className="text-gray-200">·</span>
                  <Link href="/app/network?tab=following" className="group">
                    <span className="text-sm font-bold text-gray-900 group-hover:text-[#0F6E56] transition-colors">
                      {followingCount}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">following</span>
                  </Link>
                </>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mb-5" />

            {/* Partner description or user bio */}
            {isPartner ? (
              <>
                {user.partner!.description && (
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">About</p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {user.partner!.description.length > 240 && !bioExpanded
                        ? user.partner!.description.slice(0, 240) + "…"
                        : user.partner!.description}
                    </p>
                    {user.partner!.description.length > 240 && (
                      <button
                        onClick={() => setBioExpanded(!bioExpanded)}
                        className="mt-1.5 text-xs font-semibold text-[#2A5FA5] hover:underline"
                      >
                        {bioExpanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                )}

                {/* Specialties */}
                {(user.partner!.specialty ?? []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Specialities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(user.partner!.specialty ?? []).map((s) => (
                        <span key={s} className="text-xs bg-blue-50 text-[#2A5FA5] border border-blue-100 px-2.5 py-1 rounded-md font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services */}
                {(user.partner!.services ?? []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
                      <Handshake className="h-3 w-3" /> Services
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(user.partner!.services ?? []).map((s) => (
                        <span key={s} className="text-xs bg-green-50 text-[#0F6E56] border border-green-100 px-2.5 py-1 rounded-md font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {(user.partner!.certifications ?? []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
                      <Award className="h-3 w-3" /> Certifications
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(user.partner!.certifications ?? []).map((c) => (
                        <span key={c} className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-md font-medium">
                          <ShieldCheck className="h-3 w-3 shrink-0" />{c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Website */}
                {website && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Website</p>
                    <a
                      href={website.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
                    >
                      <Globe className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      {website.domain}
                      <ExternalLink className="h-2.5 w-2.5 text-gray-300 shrink-0" />
                    </a>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* User bio */}
                {bioText && (
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">About</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{bioTruncated}</p>
                    {bioText.length > 240 && (
                      <button
                        onClick={() => setBioExpanded(!bioExpanded)}
                        className="mt-1.5 text-xs font-semibold text-[#0F6E56] hover:underline"
                      >
                        {bioExpanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                )}

                {/* User interests */}
                {user.interests.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Interests
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.interests.map((interest) => (
                        <span key={interest} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social links */}
                {(website || user.socialLinks.linkedin || user.socialLinks.twitter || user.socialLinks.github) && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Links</p>
                    <div className="flex flex-wrap gap-2">
                      {website && (
                        <a
                          href={website.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
                        >
                          <Globe className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {website.domain}
                          <ExternalLink className="h-2.5 w-2.5 text-gray-300 shrink-0" />
                        </a>
                      )}
                      {[
                        { key: "linkedin", label: "LinkedIn", href: user.socialLinks.linkedin },
                        { key: "twitter",  label: "X / Twitter", href: user.socialLinks.twitter },
                        { key: "github",   label: "GitHub", href: user.socialLinks.github },
                      ]
                        .filter((item) => !!item.href)
                        .map(({ key, label, href }) => (
                          <a
                            key={key}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
                          >
                            <Link2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            {label}
                            <ExternalLink className="h-2.5 w-2.5 text-gray-300 shrink-0" />
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-3">

          {/* Profile Strength / Partner Profile (own) */}
          {isSelf && isPartner && user.partner && (
            <PartnerSelfSidebar partner={user.partner} />
          )}
          {isSelf && !isPartner && <ProfileStrength user={user} />}

          {/* Profile views link (own) */}
          {isSelf && (
            <Link href="/app/profile/views" className="block">
              <div className="bg-white rounded-xl border border-gray-200 px-4 py-3.5 flex items-center justify-between hover:border-[#0F6E56]/30 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <Eye className="h-4 w-4 text-[#0F6E56]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Profile views</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">See who viewed you</p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#0F6E56] transition-colors" />
              </div>
            </Link>
          )}

          {/* Network link (own) */}
          {isSelf && (
            <Link href="/app/network" className="block">
              <div className="bg-white rounded-xl border border-gray-200 px-4 py-3.5 flex items-center justify-between hover:border-[#0F6E56]/30 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Network className="h-4 w-4 text-[#2A5FA5]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Your network</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {followerCount} followers · {followingCount} following
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#2A5FA5] transition-colors" />
              </div>
            </Link>
          )}

          {/* Partner CTA (other partner) */}
          {!isSelf && isPartner && user.partner?.approved && (
            <div className="rounded-xl overflow-hidden border border-blue-100 shadow-sm">
              <div
                className="p-4 text-white"
                style={{ background: "linear-gradient(135deg, #1e3f6b 0%, #2A5FA5 100%)" }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Handshake className="h-4 w-4 text-blue-200" />
                  <h3 className="text-sm font-semibold">Need migration help?</h3>
                </div>
                <p className="text-xs text-blue-200 leading-relaxed mb-3">
                  {displayName ?? "This partner"} can guide your team through EU software migration.
                </p>
                <RequestHelpButton
                  source="partner_profile"
                  partnerUserId={user.id}
                  partnerName={user.partner.companyName}
                  label="Request migration help"
                  className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-white text-xs font-semibold text-[#2A5FA5] transition-colors hover:bg-blue-50"
                />
              </div>
              {(user.partner.specialty ?? []).length > 0 && (
                <div className="bg-white px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(user.partner.specialty ?? []).slice(0, 4).map((s) => (
                      <span key={s} className="text-[11px] bg-blue-50 text-[#2A5FA5] px-2 py-0.5 rounded-md font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* People also viewed */}
          {!isSelf && <PeopleAlsoViewed profiles={suggestedProfiles} />}
        </div>
      </div>
    </div>
  );
}
