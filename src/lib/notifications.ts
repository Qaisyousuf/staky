"use server";

import { randomUUID } from "crypto";
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
  | "PROFILE_VIEW"
  | "PARTNER_APPLICATION"
  | "PARTNER_APPROVED"
  | "PARTNER_REJECTED"
  | "PARTNER_DELETED";

const PARTNER_TYPES = new Set([
  "PARTNER_APPLICATION",
  "PARTNER_APPROVED",
  "PARTNER_REJECTED",
  "PARTNER_DELETED",
]);

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

  // Partner notification types may not be in the Prisma-generated enum yet
  // (happens when prisma generate couldn't run due to a file lock).
  // Use a raw INSERT so the DB cast handles the enum value directly.
  if (PARTNER_TYPES.has(input.type)) {
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO notifications (id, "recipientId", "senderId", "senderMode", type, "read", "createdAt")
         VALUES ($1, $2, $3, $4, $5::"NotificationType", false, NOW())`,
        randomUUID(),
        input.recipientId,
        input.senderId ?? null,
        input.senderMode ?? "user",
        input.type
      );
    } catch {
      // Best-effort — never block the main action
    }
    return;
  }

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

    if (
      message.includes("Expected NotificationType") ||
      message.includes("Invalid value for argument `type`")
    ) {
      return;
    }

    throw error;
  }
}
