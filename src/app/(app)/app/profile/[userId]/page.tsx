import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSuggestedProfiles } from "@/actions/profile";
import { ProfileClient } from "./profile-client";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { userId: string };
}): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true, bio: true, activeMode: true, partner: { select: { companyName: true, approved: true } } },
  });
  if (!user) return { title: "Profile — Staky" };
  const showAsPartner = user.activeMode === "partner" && user.partner?.approved;
  const displayName = showAsPartner ? (user.partner!.companyName ?? user.name) : user.name;
  return {
    title: `${displayName ?? "Anonymous"} — Staky`,
    description: user.bio ?? `View ${displayName ?? "this user"}'s profile on Staky`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: { userId: string };
  searchParams: { from?: string; asPartner?: string; asUser?: string };
}) {
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  // Read viewer's current mode from DB (JWT can be stale after mode switch)
  const viewerRecord = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { activeMode: true, partner: { select: { approved: true } } },
      })
    : null;
  const viewerMode = (viewerRecord?.activeMode === "partner" && viewerRecord?.partner?.approved)
    ? "partner"
    : "user";

  // Fetch the target user first — we need it to determine which persona is being viewed
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      image: true,
      coverImage: true,
      bio: true,
      title: true,
      company: true,
      location: true,
      role: true,
      verified: true,
      plan: true,
      activeMode: true,
      createdAt: true,
      socialLinks: true,
      interests: true,
      partner: {
        select: {
          companyName: true,
          country: true,
          specialty: true,
          services: true,
          certifications: true,
          description: true,
          pricing: true,
          rating: true,
          projectCount: true,
          approved: true,
          featured: true,
          logoUrl: true,
          coverImage: true,
          website: true,
        },
      },
    },
  });

  if (!user) notFound();

  // ?asPartner=1 forces partner view; ?asUser=1 forces user view; otherwise use their current activeMode
  const forcePartnerView = searchParams.asPartner === "1" && !!user.partner?.approved;
  const forceUserView    = searchParams.asUser === "1";
  const showAsPartner = !forceUserView && (forcePartnerView || user.activeMode === "partner") && !!user.partner?.approved;
  // The persona currently on display (used for follow/connect state checks)
  const targetPersonaMode: string = showAsPartner ? "partner" : "user";

  const [followerCount, followingCount, isFollowing, isConnected] =
    await Promise.all([
      // Count all followers of this profile (regardless of follower mode)
      prisma.follow.count({ where: { followingId: params.userId } }),
      // Count all people this profile follows (as their current mode)
      prisma.follow.count({ where: { followerId: params.userId } }),
      // Is the current viewer (in their current mode) following THIS specific persona?
      currentUserId
        ? prisma.follow.findFirst({
            where: {
              followerId: currentUserId,
              followerMode: viewerMode,
              followingId: params.userId,
              followingMode: targetPersonaMode,
            },
          })
        : Promise.resolve(null),
      // Is the current viewer connected to this profile (in their current mode)?
      currentUserId
        ? prisma.connection.findFirst({
            where: {
              OR: [
                { userId: currentUserId, requesterMode: viewerMode, targetId: params.userId, targetMode: targetPersonaMode },
                { userId: params.userId, targetId: currentUserId },
              ],
            },
          })
        : Promise.resolve(null),
    ]);
  const connectionCount =
    showAsPartner
      ? await prisma.connection.count({
          where: { OR: [{ userId: params.userId }, { targetId: params.userId }] },
        })
      : null;

  const suggestedProfiles = await getSuggestedProfiles([
    params.userId,
    ...(currentUserId ? [currentUserId] : []),
  ]);

  const socialLinks = (user.socialLinks ?? {}) as {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };

  return (
    <ProfileClient
      user={{ ...user, activeMode: targetPersonaMode, createdAt: user.createdAt.toISOString(), socialLinks }}
      followerCount={followerCount}
      followingCount={followingCount}
      isFollowing={!!isFollowing}
      isConnected={!!isConnected}
      connectionCount={connectionCount}
      isSelf={currentUserId === params.userId}
      suggestedProfiles={suggestedProfiles}
      backHref={
        searchParams.from === "network"   ? "/app/network" :
        searchParams.from === "views"     ? "/app/profile/views" :
        searchParams.from === "partners"  ? "/app/partners" :
        undefined
      }
    />
  );
}
