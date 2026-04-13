"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Record profile view ───────────────────────────────────────────────────────

export async function recordProfileView(profileId: string, viewedPersonaMode?: string) {
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  // Skip own view
  if (viewerId === profileId) return;

  // Determine viewer's current mode (partner or user)
  let viewerMode = "user";
  if (viewerId) {
    // Determine viewerMode first — dedup is per-mode so switching persona creates a new view
    const viewerRecord = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { activeMode: true, partner: { select: { approved: true } } },
    });
    if (viewerRecord?.activeMode === "partner" && viewerRecord?.partner?.approved) {
      viewerMode = "partner";
    }

    // Dedup: only skip if same viewer already viewed in the SAME mode within 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.profileView.findFirst({
      where: { viewerId, profileId, viewerMode, createdAt: { gte: yesterday } },
    });
    if (existing) return;
  }

  // recipientMode = which persona was being viewed (passed from the profile page).
  // Falls back to the profile owner's current activeMode only if not explicitly provided.
  let recipientMode = viewedPersonaMode ?? "user";
  if (!viewedPersonaMode) {
    const profileOwner = await prisma.user.findUnique({
      where: { id: profileId },
      select: { activeMode: true, partner: { select: { approved: true } } },
    });
    recipientMode =
      profileOwner?.activeMode === "partner" && profileOwner?.partner?.approved
        ? "partner"
        : "user";
  }

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

  const [totalCount, thirtyDayViews, recentViewers, partnerViewCount] = await Promise.all([
    prisma.profileView.count({ where: { profileId: userId } }),
    prisma.profileView.findMany({
      where: { profileId: userId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    // No take limit — return all identified viewers
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
    }),
    // Count views that came from a partner persona
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM profile_views
      WHERE "profileId" = ${userId} AND "viewerMode" = 'partner'
    `,
  ]);

  const partnerViews = Number(partnerViewCount[0]?.count ?? 0);

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

  // Deduplicate by viewerId+viewerMode (each persona visit is unique), keep most recent per combo
  const seenKeys = new Set<string>();
  const uniqueViewers = recentViewers.filter((v) => {
    const vm = (v as { viewerMode?: string }).viewerMode ?? "user";
    const key = `${v.viewerId}:${vm}`;
    if (!v.viewerId || seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  return {
    totalCount,
    partnerViews,
    uniqueVisitorCount: new Set(recentViewers.map((v) => v.viewerId).filter(Boolean)).size,
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

  // Always read from DB — JWT activeMode can lag after a mode switch
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeMode: true, partner: { select: { approved: true } } },
  });
  const activeMode = (userRecord?.activeMode === "partner" && userRecord?.partner?.approved) ? "partner" : "user";

  const [follows, followers, connections] = await Promise.all([
    // People this persona follows
    prisma.follow.findMany({
      where: { followerId: userId, followerMode: activeMode },
      include: {
        following: {
          select: { id: true, name: true, image: true, title: true, company: true, role: true, activeMode: true,
            partner: { select: { companyName: true, logoUrl: true, rating: true, approved: true } },
          },
        },
      },
    }),
    // People who follow THIS persona (filter by followingMode so each persona has its own followers list)
    prisma.follow.findMany({
      where: { followingId: userId, followingMode: activeMode },
      include: {
        follower: {
          select: { id: true, name: true, image: true, title: true, company: true, role: true, activeMode: true,
            partner: { select: { companyName: true, logoUrl: true, rating: true, approved: true } },
          },
        },
      },
    }),
    // Connections for this persona (both initiated and received by this persona)
    prisma.connection.findMany({
      where: {
        OR: [
          { userId, requesterMode: activeMode },
          { targetId: userId, targetMode: activeMode },
        ],
      },
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

  // Build a set of (followingId, followingMode) combos so we can check follow-back accurately
  const followingSet = new Set(follows.map((f) => `${f.followingId}:${f.followingMode}`));

  return {
    followers: followers.map((f) => ({
      ...f.follower,
      // followerMode = which persona they used when following you
      followerMode: f.followerMode,
      isFollowingBack: followingSet.has(`${f.followerId}:${f.followerMode}`),
    })),
    following: follows.map((f) => ({
      ...f.following,
      // followingMode = which persona of theirs we followed
      followingMode: f.followingMode,
    })),
    connections: connections.map((c) => {
      const isRequester = c.userId === userId;
      const otherUser   = isRequester ? c.target : c.user;
      // personaMode = which persona of the OTHER user is in this connection
      const personaMode = isRequester ? c.targetMode : c.requesterMode;
      return { ...otherUser, connectionPersonaMode: personaMode };
    }),
  };
}
