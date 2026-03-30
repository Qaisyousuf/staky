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

  const normalizedLinkUrl = normalizeUrl(data.linkUrl ?? "");
  const { story, hashtags } = validatePostInput({
    story: data.story,
    imageCount: data.imageUrls?.length ?? 0,
    linkUrl: normalizedLinkUrl,
    fromTool: data.fromTool,
    toTool: data.toTool,
  });

  await prisma.alternativePost.create({
    data: {
      authorId: session.user.id,
      fromTool: data.fromTool,
      toTool: data.toTool,
      story,
      tags: hashtags,
      imageUrls: data.imageUrls ?? [],
      linkUrl: normalizedLinkUrl,
    },
  });

  revalidatePath("/feed");
}
