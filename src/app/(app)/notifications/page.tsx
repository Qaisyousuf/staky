import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Fetch all notifications with sender + post data
  const rawNotifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      read: true,
      createdAt: true,
      postId: true,
      commentId: true,
      sender: { select: { id: true, name: true, image: true, role: true } },
    },
  });

  // Enrich with post data in one query
  const postIds = Array.from(new Set(
    rawNotifications.map((n) => n.postId).filter(Boolean) as string[]
  ));
  const posts =
    postIds.length > 0
      ? await prisma.alternativePost.findMany({
          where: { id: { in: postIds } },
          select: { id: true, fromTool: true, toTool: true },
        })
      : [];
  const postMap = Object.fromEntries(posts.map((p) => [p.id, p]));

  const notifications = rawNotifications.map((n) => ({
    id: n.id,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    postId: n.postId,
    commentId: n.commentId,
    sender: n.sender,
    post: n.postId ? (postMap[n.postId] ?? null) : null,
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  return <NotificationsClient notifications={notifications} unreadCount={unreadCount} />;
}
