"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Guard ────────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (session.user.role !== "ADMIN") throw new Error("Not authorized");
  return session.user.id;
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  await requireAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    userCount,
    postCount,
    partnerCount,
    pendingPartners,
    openRequests,
    newUsersToday,
    pendingPosts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.alternativePost.count(),
    prisma.partner.count({ where: { approved: true } }),
    prisma.partner.count({ where: { approved: false } }),
    prisma.migrationRequest.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.alternativePost.count({ where: { published: false } }),
  ]);

  return {
    userCount,
    postCount,
    partnerCount,
    pendingPartners,
    openRequests,
    newUsersToday,
    pendingPosts,
  };
}

export async function getPendingPosts() {
  await requireAdmin();

  return prisma.alternativePost.findMany({
    where: { published: false },
    include: { author: { select: { id: true, name: true, image: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getRecentRequests() {
  await requireAdmin();

  return prisma.migrationRequest.findMany({
    include: {
      user: { select: { id: true, name: true, image: true, email: true } },
      partner: { select: { id: true, companyName: true, logoUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function adminGetPosts(filter: "all" | "published" | "unpublished" | "featured" = "all") {
  await requireAdmin();

  const where =
    filter === "published"
      ? { published: true }
      : filter === "unpublished"
      ? { published: false }
      : filter === "featured"
      ? { featured: true }
      : {};

  return prisma.alternativePost.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, image: true, role: true } },
      _count: { select: { likes: true, recommendations: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminModeratePost(
  postId: string,
  action: "publish" | "unpublish" | "feature" | "unfeature" | "delete"
) {
  await requireAdmin();

  if (action === "delete") {
    await prisma.alternativePost.delete({ where: { id: postId } });
  } else {
    await prisma.alternativePost.update({
      where: { id: postId },
      data:
        action === "publish"
          ? { published: true }
          : action === "unpublish"
          ? { published: false }
          : action === "feature"
          ? { featured: true }
          : { featured: false },
    });
  }

  revalidatePath("/app/admin");
  revalidatePath("/app/feed");
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function adminGetComments() {
  await requireAdmin();

  const comments = await prisma.comment.findMany({
    include: {
      author: { select: { id: true, name: true, image: true } },
      post: { select: { id: true, fromTool: true, toTool: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get report counts per comment
  const commentIds = comments.map((c) => c.id);
  const reports = await prisma.report.groupBy({
    by: ["targetId"],
    where: { targetType: "comment", targetId: { in: commentIds } },
    _count: { _all: true },
  });
  const reportMap = Object.fromEntries(reports.map((r) => [r.targetId, r._count._all]));

  return comments.map((c) => ({ ...c, reportCount: reportMap[c.id] ?? 0 }));
}

export async function adminModerateComment(
  commentId: string,
  action: "hide" | "show" | "delete"
) {
  await requireAdmin();

  if (action === "delete") {
    await prisma.comment.delete({ where: { id: commentId } });
  } else {
    await prisma.comment.update({
      where: { id: commentId },
      data: { hidden: action === "hide" },
    });
  }

  revalidatePath("/app/admin");
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export async function adminGetRequests() {
  await requireAdmin();

  return prisma.migrationRequest.findMany({
    include: {
      user: { select: { id: true, name: true, image: true, email: true } },
      partner: { select: { id: true, companyName: true, logoUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminUpdateRequest(
  requestId: string,
  action: "cancel" | "reopen" | "review"
) {
  await requireAdmin();

  const status =
    action === "cancel" ? "CANCELLED" :
    action === "review" ? "UNDER_REVIEW" :
    "PENDING";

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { status },
  });

  revalidatePath("/app/admin");
}

export async function adminMatchPartner(requestId: string, partnerUserId: string) {
  await requireAdmin();

  const partner = await prisma.partner.findUnique({ where: { userId: partnerUserId } });
  if (!partner) throw new Error("Partner not found");

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { partnerId: partner.id, status: "MATCHED" },
  });

  const { createNotification } = await import("@/lib/notifications");
  await createNotification({
    recipientId: partnerUserId,
    recipientMode: "partner",
    type: "REQUEST_RECEIVED",
    requestId,
  });

  revalidatePath("/app/admin");
  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${requestId}`);
}

// ─── Partners ─────────────────────────────────────────────────────────────────

export async function adminGetPartners() {
  await requireAdmin();

  return prisma.partner.findMany({
    include: {
      user: { select: { id: true, name: true, image: true, email: true, role: true } },
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminManagePartner(
  partnerId: string,
  action: "approve" | "reject" | "feature" | "unfeature" | "delete"
) {
  const adminId = await requireAdmin();
  const { createNotification } = await import("@/lib/notifications");

  if (action === "delete") {
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (partner) {
      await prisma.partner.delete({ where: { id: partnerId } });
      await prisma.user.update({
        where: { id: partner.userId },
        data: { role: "USER", activeMode: "user" },
      });
      await createNotification({
        recipientId: partner.userId,
        senderId: adminId,
        type: "PARTNER_DELETED",
      });
    }
  } else {
    const partner = await prisma.partner.update({
      where: { id: partnerId },
      data:
        action === "approve"
          ? { approved: true }
          : action === "reject"
          ? { approved: false }
          : action === "feature"
          ? { featured: true }
          : { featured: false },
    });

    if (action === "approve") {
      await prisma.user.update({
        where: { id: partner.userId },
        data: { role: "PARTNER" },
      });
      await createNotification({
        recipientId: partner.userId,
        senderId: adminId,
        type: "PARTNER_APPROVED",
      });
    } else if (action === "reject") {
      await createNotification({
        recipientId: partner.userId,
        senderId: adminId,
        type: "PARTNER_REJECTED",
      });
    }
  }

  revalidatePath("/app/admin");
  revalidatePath("/app/partners");
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function adminGetUsers() {
  await requireAdmin();

  return prisma.user.findMany({
    include: {
      partner: { select: { id: true, companyName: true, approved: true } },
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminManageUser(
  userId: string,
  action: "suspend" | "activate" | "makeAdmin" | "makePartner" | "makeUser"
) {
  const adminId = await requireAdmin();

  // Prevent acting on self
  if (userId === adminId) throw new Error("Cannot modify your own account");

  if (action === "suspend" || action === "activate") {
    await prisma.user.update({
      where: { id: userId },
      data: { suspended: action === "suspend" },
    });
  } else {
    const role =
      action === "makeAdmin"
        ? "ADMIN"
        : action === "makePartner"
        ? "PARTNER"
        : "USER";
    await prisma.user.update({ where: { id: userId }, data: { role } });
  }

  revalidatePath("/app/admin");
}

export async function adminDeleteUser(userId: string) {
  const adminId = await requireAdmin();

  if (userId === adminId) throw new Error("Cannot delete your own account");

  // prisma cascades (onDelete: Cascade on all User relations) will remove
  // all posts, comments, likes, follows, connections, notifications, stacks,
  // migration requests, invoices, partner record, etc.
  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/app/admin");
}

// ─── Reports (analytics) ──────────────────────────────────────────────────────

export async function adminGetReports() {
  await requireAdmin();

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // User growth: group by month
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  // Post activity: group by month
  const posts = await prisma.alternativePost.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  });

  // Top posts by engagement
  const topPosts = await prisma.alternativePost.findMany({
    where: { published: true },
    include: {
      author: { select: { id: true, name: true, image: true } },
      _count: { select: { likes: true, recommendations: true, comments: true } },
    },
    orderBy: [{ likes: { _count: "desc" } }],
    take: 10,
  });

  // Partner leaderboard
  const partners = await prisma.partner.findMany({
    where: { approved: true },
    include: {
      user: { select: { name: true, image: true } },
      _count: { select: { leads: true } },
    },
    orderBy: [{ projectCount: "desc" }, { rating: "desc" }],
    take: 10,
  });

  // Build monthly buckets
  const monthBuckets = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      month: d.toLocaleString("en", { month: "short" }),
      year: d.getFullYear(),
      key: `${d.getFullYear()}-${d.getMonth()}`,
    };
  });

  function groupByMonth(items: { createdAt: Date }[]) {
    const map: Record<string, number> = {};
    for (const item of items) {
      const key = `${item.createdAt.getFullYear()}-${item.createdAt.getMonth()}`;
      map[key] = (map[key] ?? 0) + 1;
    }
    return monthBuckets.map((b) => ({ ...b, count: map[b.key] ?? 0 }));
  }

  return {
    userGrowth: groupByMonth(users),
    postActivity: groupByMonth(posts),
    topPosts,
    partnerLeaderboard: partners,
  };
}
