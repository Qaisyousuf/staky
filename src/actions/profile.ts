"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Record profile view ───────────────────────────────────────────────────────

export async function recordProfileView(profileId: string) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  // Skip own view
  if (viewerId === profileId) return;

  // Determine viewer's current mode (partner or user)
  let viewerMode = "user";
  if (viewerId) {
    // Authenticated: dedup within 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.profileView.findFirst({
      where: { viewerId, profileId, createdAt: { gte: yesterday } },
    });
    if (existing) return;

    const viewerRecord = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { activeMode: true, partner: { select: { approved: true } } },
    });
    if (viewerRecord?.activeMode === "partner" && viewerRecord?.partner?.approved) {
      viewerMode = "partner";
    }
  }

  // Fetch profile owner's active mode so the notification lands in the right inbox
  const profileOwner = await prisma.user.findUnique({
    where: { id: profileId },
    select: { activeMode: true, partner: { select: { approved: true } } },
  });
  const recipientMode =
    profileOwner?.activeMode === "partner" && profileOwner?.partner?.approved
      ? "partner"
      : "user";

  await prisma.$executeRaw`
    INSERT INTO profile_views (id, "viewerId", "profileId", "viewerMode", "createdAt")
    VALUES (gen_random_uuid()::text, ${viewerId}, ${profileId}, ${viewerMode}, NOW())
  `;

  // Notify the profile owner (only for authenticated viewers).
  // Use raw SQL to bypass Prisma client enum validation in case the
  // generated client hasn't picked up the PROFILE_VIEW enum value yet.
  if (viewerId) {
    try {
      await prisma.$executeRaw`
        INSERT INTO notifications (id, "recipientId", "recipientMode", "senderId", type, read, "createdAt", "senderMode")
        VALUES (
          gen_random_uuid()::text,
          ${profileId},
          ${recipientMode},
          ${viewerId},
          'PROFILE_VIEW'::"NotificationType",
          false,
          NOW(),
          ${viewerMode}
        )
      `;
    } catch {
      // Non-critical — don't fail the view record if notification fails
    }
  }
}

// ─── Get profile views (own profile only) ─────────────────────────────────────

export async function getProfileViews(userId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== userId) throw new Error("Unauthorized");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalCount, thirtyDayViews, recentViewers] = await Promise.all([
    prisma.profileView.count({ where: { profileId: userId } }),
    prisma.profileView.findMany({
      where: { profileId: userId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.profileView.findMany({
      where: { profileId: userId, viewerId: { not: null } },
      include: {
        viewer: {
          select: {
            id: true, name: true, image: true, title: true, company: true,
            partner: { select: { companyName: true, logoUrl: true, approved: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // Build 30-day bar chart data
  const dailyCounts: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyCounts[d.toISOString().slice(0, 10)] = 0;
  }
  thirtyDayViews.forEach((v) => {
    const key = v.createdAt.toISOString().slice(0, 10);
    if (key in dailyCounts) dailyCounts[key]++;
  });
  const last30Days = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

  // Deduplicate by viewerId, keep most recent
  const seenViewers = new Set<string>();
  const uniqueViewers = recentViewers.filter((v) => {
    if (!v.viewerId || seenViewers.has(v.viewerId)) return false;
    seenViewers.add(v.viewerId);
    return true;
  });

  return {
    totalCount,
    last30Days,
    recentViewers: uniqueViewers.map((v) => ({
      id: v.id,
      viewerId: v.viewerId,
      viewerMode: (v as { viewerMode?: string }).viewerMode ?? "user",
      createdAt: v.createdAt.toISOString(),
      viewer: v.viewer,
    })),
  };
}

// ─── Suggested profiles ────────────────────────────────────────────────────────

export async function getSuggestedProfiles(excludeIds: string[]) {
  return prisma.user.findMany({
    where: {
      id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
      suspended: false,
    },
    select: {
      id: true,
      name: true,
      image: true,
      title: true,
      company: true,
      role: true,
      activeMode: true,
      partner: { select: { companyName: true, logoUrl: true, approved: true } },
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });
}

// ─── Network data ──────────────────────────────────────────────────────────────

export async function getNetworkData(userId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== userId) throw new Error("Unauthorized");

  const [follows, followers, connections] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: { id: true, name: true, image: true, title: true, company: true, role: true, activeMode: true,
            partner: { select: { companyName: true, logoUrl: true, rating: true, approved: true } },
          },
        },
      },
    }),
    prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: { id: true, name: true, image: true, title: true, company: true, role: true, activeMode: true,
            partner: { select: { companyName: true, logoUrl: true, rating: true, approved: true } },
          },
        },
      },
    }),
    prisma.connection.findMany({
      where: { OR: [{ userId }, { targetId: userId }] },
      include: {
        user: {
          select: {
            id: true, name: true, image: true, title: true, company: true, role: true, activeMode: true,
            partner: { select: { companyName: true, logoUrl: true, rating: true, approved: true } },
          },
        },
        target: {
          select: {
            id: true, name: true, image: true, title: true, company: true, role: true, activeMode: true,
            partner: { select: { companyName: true, logoUrl: true, rating: true, approved: true } },
          },
        },
      },
    }),
  ]);

  const followingIds = new Set(follows.map((f) => f.followingId));

  return {
    followers: followers.map((f) => ({
      ...f.follower,
      isFollowingBack: followingIds.has(f.followerId),
    })),
    following: follows.map((f) => f.following),
    connections: connections.map((c) => ({
      ...(c.userId === userId ? c.target : c.user),
    })),
  };
}
