"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function sendRequestMessage(requestId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message cannot be empty");

  // Verify the user is a participant (user who submitted or assigned partner)
  const request = await prisma.migrationRequest.findUnique({
    where: { id: requestId },
    include: { partner: { select: { userId: true } } },
  });
  if (!request) throw new Error("Request not found");

  const isUser = request.userId === session.user.id;
  const isPartner = request.partner?.userId === session.user.id;
  if (!isUser && !isPartner) throw new Error("Not a participant");

  const message = await prisma.requestMessage.create({
    data: {
      requestId,
      senderId: session.user.id,
      content: trimmed,
    },
    include: {
      sender: { select: { id: true, name: true, image: true, role: true } },
    },
  });

  // Notify the other party
  const recipientId = isUser ? request.partner?.userId : request.userId;
  if (recipientId) {
    await createNotification({
      recipientId,
      recipientMode: isUser ? "partner" : "user",
      senderId: session.user.id,
      senderMode: isUser ? "user" : "partner",
      type: "REQUEST_MESSAGE",
      requestId,
    });
  }

  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath(`/app/leads/${requestId}`);

  return message;
}

export async function getRequestMessages(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const request = await prisma.migrationRequest.findUnique({
    where: { id: requestId },
    include: { partner: { select: { userId: true } } },
  });
  if (!request) throw new Error("Request not found");

  const isUser = request.userId === session.user.id;
  const isPartner = request.partner?.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isUser && !isPartner && !isAdmin) throw new Error("Not a participant");

  return prisma.requestMessage.findMany({
    where: { requestId },
    include: {
      sender: { select: { id: true, name: true, image: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
