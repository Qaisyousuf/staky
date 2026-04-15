"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, type AppNotificationType } from "@/lib/notifications";

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function getSenderMode(userId: string): Promise<string> {
  const record = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      activeMode: true,
      partner: { select: { approved: true } },
    },
  });
  const isPartnerMode =
    record?.activeMode === "partner" && record?.partner?.approved === true;
  return isPartnerMode ? "partner" : "user";
}

async function notify(
  recipientId: string,
  senderId: string,
  type: AppNotificationType,
  postId?: string,
  commentId?: string,
  senderMode?: string,
  recipientMode?: string
) {
  await createNotification({
    recipientId,
    recipientMode,
    senderId,
    senderMode,
    type,
    postId,
    commentId,
  });
}

// ─── Like ─────────────────────────────────────────────────────────────────────

export async function toggleLike(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;
  const senderMode = await getSenderMode(userId);

  const existing = await prisma.like.findUnique({
    where: { postId_userId_senderMode: { postId, userId, senderMode } },
  });

  if (existing) {
    await prisma.like.delete({ where: { postId_userId_senderMode: { postId, userId, senderMode } } });
    const count = await prisma.like.count({ where: { postId } });
    return { liked: false, count };
  }

  await prisma.like.create({ data: { postId, userId, senderMode } });
  const post = await prisma.alternativePost.findUnique({
    where: { id: postId },
    select: { authorId: true, postedAsPartner: true },
  });
  if (post) {
    const recipientMode = post.postedAsPartner ? "partner" : "user";
    await notify(post.authorId, userId, "LIKE", postId, undefined, senderMode, recipientMode);
  }
  const count = await prisma.like.count({ where: { postId } });
  return { liked: true, count };
}

// ─── Save ─────────────────────────────────────────────────────────────────────

export async function toggleSave(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;
  const senderMode = await getSenderMode(userId);

  const existing = await prisma.savedPost.findUnique({
    where: { postId_userId_senderMode: { postId, userId, senderMode } },
  });

  if (existing) {
    await prisma.savedPost.delete({ where: { postId_userId_senderMode: { postId, userId, senderMode } } });
    const count = await prisma.savedPost.count({ where: { postId } });
    return { saved: false, count };
  }

  await prisma.savedPost.create({ data: { postId, userId, senderMode } });
  const post = await prisma.alternativePost.findUnique({
    where: { id: postId },
    select: { authorId: true, postedAsPartner: true },
  });
  if (post) {
    const recipientMode = post.postedAsPartner ? "partner" : "user";
    await notify(post.authorId, userId, "SAVE", postId, undefined, senderMode, recipientMode);
  }
  const count = await prisma.savedPost.count({ where: { postId } });
  return { saved: true, count };
}

// ─── Recommend ────────────────────────────────────────────────────────────────

export async function toggleRecommend(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;
  const senderMode = await getSenderMode(userId);

  const existing = await prisma.recommendation.findUnique({
    where: { postId_userId_senderMode: { postId, userId, senderMode } },
  });

  if (existing) {
    await prisma.recommendation.delete({ where: { postId_userId_senderMode: { postId, userId, senderMode } } });
    const count = await prisma.recommendation.count({ where: { postId } });
    return { recommended: false, count };
  }

  await prisma.recommendation.create({ data: { postId, userId, senderMode } });
  const post = await prisma.alternativePost.findUnique({
    where: { id: postId },
    select: { authorId: true, postedAsPartner: true },
  });
  if (post) {
    const recipientMode = post.postedAsPartner ? "partner" : "user";
    await notify(post.authorId, userId, "RECOMMENDATION", postId, undefined, senderMode, recipientMode);
  }
  const count = await prisma.recommendation.count({ where: { postId } });
  return { recommended: true, count };
}

// ─── Follow ───────────────────────────────────────────────────────────────────

/**
 * Toggle follow for targetUserId.
 * @param followingMode - which persona of the target to follow ("user"|"partner").
 *   If omitted, falls back to the target's current activeMode from DB.
 */
export async function toggleFollow(targetUserId: string, followingMode?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const followerId = session.user.id;

  // Read both modes from DB (authoritative — JWT can lag after mode switch)
  const [followerRecord, targetRecord] = await Promise.all([
    prisma.user.findUnique({ where: { id: followerId }, select: { activeMode: true, partner: { select: { approved: true } } } }),
    prisma.user.findUnique({ where: { id: targetUserId }, select: { activeMode: true } }),
  ]);
  const followerMode = (followerRecord?.activeMode === "partner" && followerRecord?.partner?.approved) ? "partner" : "user";
  // Use the explicitly provided followingMode, or fall back to target's current mode
  const resolvedFollowingMode = followingMode ?? (targetRecord?.activeMode ?? "user");

  // Block only same-user same-mode (cross-persona of the same owner is allowed)
  if (followerId === targetUserId && followerMode === resolvedFollowingMode) {
    throw new Error("Cannot follow yourself");
  }

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followerMode_followingId_followingMode: {
        followerId, followerMode, followingId: targetUserId, followingMode: resolvedFollowingMode,
      },
    },
  });

  if (existing) {
    await prisma.follow.delete({
      where: {
        followerId_followerMode_followingId_followingMode: {
          followerId, followerMode, followingId: targetUserId, followingMode: resolvedFollowingMode,
        },
      },
    });
    return { following: false };
  }

  await prisma.follow.create({ data: { followerId, followerMode, followingId: targetUserId, followingMode: resolvedFollowingMode } });
  await notify(targetUserId, followerId, "FOLLOW", undefined, undefined, followerMode, resolvedFollowingMode);
  return { following: true };
}

// ─── Connect ──────────────────────────────────────────────────────────────────

/**
 * Toggle connection request for targetUserId.
 * @param targetMode - which persona of the target to connect with ("user"|"partner").
 *   If omitted, falls back to the target's current activeMode from DB.
 */
export async function toggleConnect(targetUserId: string, targetMode?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  // Read both modes from DB (authoritative — JWT can lag after mode switch)
  const [userRecord, targetRecord] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { activeMode: true, partner: { select: { approved: true } } } }),
    prisma.user.findUnique({ where: { id: targetUserId }, select: { activeMode: true } }),
  ]);
  const requesterMode = (userRecord?.activeMode === "partner" && userRecord?.partner?.approved) ? "partner" : "user";
  const resolvedTargetMode = targetMode ?? (targetRecord?.activeMode ?? "user");

  // Block only same-user same-mode
  if (userId === targetUserId && requesterMode === resolvedTargetMode) {
    throw new Error("Cannot connect with yourself");
  }

  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { userId, requesterMode, targetId: targetUserId, targetMode: resolvedTargetMode },
        { userId: targetUserId, targetId: userId },
      ],
    },
  });

  if (existing) {
    await prisma.connection.delete({ where: { id: existing.id } });
    return { connected: false };
  }

  await prisma.connection.create({ data: { userId, requesterMode, targetId: targetUserId, targetMode: resolvedTargetMode } });
  await notify(targetUserId, userId, "CONNECT", undefined, undefined, requesterMode, resolvedTargetMode);
  return { connected: true };
}

// ─── Comments ─────────────────────────────────────────────────────────────────

const COMMENT_AUTHOR_SELECT = {
  id: true,
  name: true,
  role: true,
  image: true,
  partner: { select: { companyName: true, logoUrl: true } },
} as const;

export async function addComment(
  postId: string,
  content: string,
  parentId?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;
  if (!content.trim()) throw new Error("Comment cannot be empty");

  const senderMode = await getSenderMode(userId);

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: userId,
      content: content.trim(),
      parentId: parentId ?? null,
      senderMode,
    },
    include: { author: { select: COMMENT_AUTHOR_SELECT } },
  });

  const post = await prisma.alternativePost.findUnique({
    where: { id: postId },
    select: { authorId: true, postedAsPartner: true },
  });
  if (post) {
    const recipientMode = post.postedAsPartner ? "partner" : "user";
    await notify(post.authorId, userId, "COMMENT", postId, comment.id, senderMode, recipientMode);
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { authorId: true, senderMode: true },
    });
    if (parent && parent.authorId !== userId) {
      // Deliver the reply notification to whichever persona the parent commenter was using
      const replyRecipientMode = (parent as { senderMode?: string | null }).senderMode ?? "user";
      await notify(parent.authorId, userId, "REPLY", postId, comment.id, senderMode, replyRecipientMode);
    }
  }

  revalidatePath("/feed");
  return {
    id: comment.id,
    content: comment.content,
    senderMode,
    createdAt: comment.createdAt.toISOString(),
    author: comment.author,
    replies: [] as typeof comment[],
  };
}

export async function getPostComments(postId: string) {
  const rows = await prisma.comment.findMany({
    where: { postId, parentId: null },
    include: {
      author: { select: COMMENT_AUTHOR_SELECT },
      replies: {
        include: { author: { select: COMMENT_AUTHOR_SELECT } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Serialize dates for safe transfer
  return rows.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    replies: c.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  }));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return;
  // Read activeMode from DB (authoritative) rather than the JWT which may lag after a mode switch
  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { activeMode: true },
  });
  const activeMode = userRecord?.activeMode ?? "user";
  await prisma.notification.updateMany({
    where: { recipientId: session.user.id, recipientMode: activeMode, read: false },
    data: { read: true },
  });
  revalidatePath("/app/dashboard");
  revalidatePath("/app/notifications");
}

export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: session.user.id },
    data: { read: true },
  });
  revalidatePath("/app/notifications");
}
