"use server";

import { auth } from "@/lib/auth";
import { normalizeUrl, validatePostInput } from "@/lib/post-utils";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createPost(data: {
  fromTool: string;
  toTool: string;
  story: string;
  imageUrls?: string[];
  linkUrl?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const senderId = session.user.id;

  // Determine sender's active mode and display name
  const senderRecord = await prisma.user.findUnique({
    where: { id: senderId },
    select: {
      name: true,
      activeMode: true,
      partner: { select: { approved: true, companyName: true } },
    },
  });
  const senderMode =
    senderRecord?.activeMode === "partner" && senderRecord?.partner?.approved
      ? "partner"
      : "user";

  const normalizedLinkUrl = normalizeUrl(data.linkUrl ?? "");
  const { story, hashtags } = validatePostInput({
    story: data.story,
    imageCount: data.imageUrls?.length ?? 0,
    linkUrl: normalizedLinkUrl,
    fromTool: data.fromTool,
    toTool: data.toTool,
  });

  const post = await prisma.alternativePost.create({
    data: {
      authorId: senderId,
      fromTool: data.fromTool,
      toTool: data.toTool,
      story,
      tags: hashtags,
      imageUrls: data.imageUrls ?? [],
      linkUrl: normalizedLinkUrl,
      postedAsPartner: senderMode === "partner",
    },
  });

  // Fan-out NEW_POST notifications to all other non-suspended users.
  // Each user gets one notification directed at their current activeMode.
  try {
    const recipients = await prisma.user.findMany({
      where: { id: { not: senderId }, suspended: false },
      select: { id: true, activeMode: true },
    });

    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map((r) => ({
          recipientId: r.id,
          recipientMode: r.activeMode,
          senderId,
          senderMode,
          postId: post.id,
          type: "NEW_POST" as const,
          read: false,
        })),
        skipDuplicates: true,
      });
    }
  } catch {
    // Non-critical — don't fail the post if notification fan-out errors
  }

  revalidatePath("/feed");
}
