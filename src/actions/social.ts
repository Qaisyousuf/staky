"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Internal helper ──────────────────────────────────────────────────────────

type NotifType =
  | "LIKE" | "COMMENT" | "REPLY" | "FOLLOW"
  | "CONNECT" | "RECOMMENDATION" | "SAVE" | "SHARE";

async function notify(
  recipientId: string,
  senderId: string,
  type: NotifType,
  postId?: string,
  commentId?: string
) {
  if (recipientId === senderId) return;
  await prisma.notification.create({
    data: {
      recipientId,
      senderId,
      type,
      postId: postId ?? null,
      commentId: commentId ?? null,
    },
  });
}

// ─── Like ─────────────────────────────────────────────────────────────────────

export async function toggleLike(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { postId_userId: { postId, userId } } });
    const count = await prisma.like.count({ where: { postId } });
    return { liked: false, count };
  }

  await prisma.like.create({ data: { postId, userId } });
  const post = await prisma.alternativePost.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (post) await notify(post.authorId, userId, "LIKE", postId);
  const count = await prisma.like.count({ where: { postId } });
  return { liked: true, count };
}

// ─── Save ─────────────────────────────────────────────────────────────────────

export async function toggleSave(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const existing = await prisma.savedPost.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.savedPost.delete({ where: { postId_userId: { postId, userId } } });
    const count = await prisma.savedPost.count({ where: { postId } });
    return { saved: false, count };
  }

  await prisma.savedPost.create({ data: { postId, userId } });
  const post = await prisma.alternativePost.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (post) await notify(post.authorId, userId, "SAVE", postId);
  const count = await prisma.savedPost.count({ where: { postId } });
  return { saved: true, count };
}

// ─── Recommend ────────────────────────────────────────────────────────────────

export async function toggleRecommend(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const existing = await prisma.recommendation.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.recommendation.delete({ where: { postId_userId: { postId, userId } } });
    const count = await prisma.recommendation.count({ where: { postId } });
    return { recommended: false, count };
  }

  await prisma.recommendation.create({ data: { postId, userId } });
  const post = await prisma.alternativePost.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (post) await notify(post.authorId, userId, "RECOMMENDATION", postId);
  const count = await prisma.recommendation.count({ where: { postId } });
  return { recommended: true, count };
}

// ─── Follow ───────────────────────────────────────────────────────────────────

export async function toggleFollow(targetUserId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const followerId = session.user.id;
  if (followerId === targetUserId) throw new Error("Cannot follow yourself");

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: targetUserId } },
  });

  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId: targetUserId } },
    });
    return { following: false };
  }

  await prisma.follow.create({ data: { followerId, followingId: targetUserId } });
  await notify(targetUserId, followerId, "FOLLOW");
  return { following: true };
}

// ─── Connect ──────────────────────────────────────────────────────────────────

export async function toggleConnect(targetUserId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;
  if (userId === targetUserId) throw new Error("Cannot connect with yourself");

  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { userId, targetId: targetUserId },
        { userId: targetUserId, targetId: userId },
      ],
    },
  });

  if (existing) {
    await prisma.connection.delete({ where: { id: existing.id } });
    return { connected: false };
  }

  await prisma.connection.create({ data: { userId, targetId: targetUserId } });
  await notify(targetUserId, userId, "CONNECT");
  return { connected: true };
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function addComment(
  postId: string,
  content: string,
  parentId?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;
  if (!content.trim()) throw new Error("Comment cannot be empty");

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: userId,
      content: content.trim(),
      parentId: parentId ?? null,
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  const post = await prisma.alternativePost.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (post) await notify(post.authorId, userId, "COMMENT", postId, comment.id);

  if (parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { authorId: true },
    });
    if (parent && parent.authorId !== userId) {
      await notify(parent.authorId, userId, "REPLY", postId, comment.id);
    }
  }

  revalidatePath("/feed");
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: comment.author,
    replies: [] as typeof comment[],
  };
}

export async function getPostComments(postId: string) {
  const rows = await prisma.comment.findMany({
    where: { postId, parentId: null },
    include: {
      author: { select: { id: true, name: true, role: true, image: true } },
      replies: {
        include: { author: { select: { id: true, name: true, role: true, image: true } } },
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
  await prisma.notification.updateMany({
    where: { recipientId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
}

export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: session.user.id },
    data: { read: true },
  });
  revalidatePath("/notifications");
}
