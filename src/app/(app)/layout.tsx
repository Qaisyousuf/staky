import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [userRecord, rawNotifications, rawMessages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    }),
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        read: true,
        createdAt: true,
        postId: true,
        commentId: true,
        sender: { select: { id: true, name: true, image: true, role: true } },
      },
    }),
    // Last 20 received messages, dedupe by sender below
    prisma.message.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        content: true,
        read: true,
        createdAt: true,
        sender: { select: { id: true, name: true, image: true, role: true } },
      },
    }),
  ]);

  // Enrich notifications with post fromTool/toTool
  const postIds = Array.from(new Set(rawNotifications.map((n) => n.postId).filter(Boolean) as string[]));
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

  // Dedupe messages: keep most recent per sender (up to 5 conversations)
  const seenSenders = new Set<string>();
  const recentMessages = rawMessages
    .filter((m) => {
      if (seenSenders.has(m.sender.id)) return false;
      seenSenders.add(m.sender.id);
      return true;
    })
    .slice(0, 5)
    .map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));

  const unreadMessageCount = rawMessages.filter((m) => !m.read).length;

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: userRecord?.image ?? null,
    role: session.user.role,
  };

  return (
    <AppShell
      user={user}
      notifications={notifications}
      recentMessages={recentMessages}
      unreadMessageCount={unreadMessageCount}
    >
      {children}
    </AppShell>
  );
}
