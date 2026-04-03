"use server";

import { prisma } from "@/lib/prisma";

export type AppNotificationType =
  | "LIKE"
  | "COMMENT"
  | "REPLY"
  | "FOLLOW"
  | "CONNECT"
  | "RECOMMENDATION"
  | "SAVE"
  | "SHARE"
  | "REQUEST_RECEIVED"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "REQUEST_ACTIVE"
  | "REQUEST_COMPLETED"
  | "REQUEST_MESSAGE"
  | "PROFILE_VIEW";

export async function createNotification(input: {
  recipientId: string;
  senderId?: string | null;
  senderMode?: string;
  type: AppNotificationType;
  postId?: string | null;
  commentId?: string | null;
  requestId?: string | null;
}) {
  if (!input.recipientId) return;
  if (input.senderId && input.recipientId === input.senderId) return;

  try {
    await prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        senderId: input.senderId ?? null,
        senderMode: input.senderMode ?? "user",
        type: input.type as never,
        postId: input.postId ?? null,
        commentId: input.commentId ?? null,
        requestId: input.requestId ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    // Keep request actions working even if the NotificationType enum
    // has not been migrated yet in the current database/client.
    if (
      message.includes("Expected NotificationType") ||
      message.includes("Invalid value for argument `type`")
    ) {
      return;
    }

    throw error;
  }
}
