"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Record profile view ───────────────────────────────────────────────────────

export async function recordProfileView(profileId: string) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  // Skip own view
  if (viewerId === profileId) return;

  if (viewerId) {
    // Authenticated: dedup within 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.profileView.findFirst({
      where: { viewerId, profileId, createdAt: { gte: yesterday } },
    });
    if (existing) return;
  }

  await prisma.profileView.create({ data: { profileId, viewerId } });
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
          select: { id: true, name: true, image: true, title: true, company: true },
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
          select: { id: true, name: true, image: true, title: true, company: true, role: true },
        },
      },
    }),
    prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: { id: true, name: true, image: true, title: true, company: true, role: true },
        },
      },
    }),
    prisma.connection.findMany({
      where: { OR: [{ userId }, { targetId: userId }] },
      include: {
        user: {
          select: {
            id: true, name: true, image: true, title: true, company: true, role: true,
            partner: { select: { companyName: true, rating: true } },
          },
        },
        target: {
          select: {
            id: true, name: true, image: true, title: true, company: true, role: true,
            partner: { select: { companyName: true, rating: true } },
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
