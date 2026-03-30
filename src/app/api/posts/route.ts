import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  ACCEPTED_POST_IMAGE_TYPES,
  fetchLinkMetadata,
  getUrlDomain,
  MAX_POST_IMAGE_COUNT,
  MAX_POST_IMAGE_SIZE_BYTES,
  normalizeUrl,
  validatePostInput,
} from "@/lib/post-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const fromTool = String(formData.get("fromTool") ?? "");
    const toTool = String(formData.get("toTool") ?? "");
    const story = String(formData.get("story") ?? "");
    const normalizedLinkUrl = normalizeUrl(String(formData.get("linkUrl") ?? ""));
    const explicitTags = (() => {
      const raw = formData.get("tags");
      if (typeof raw !== "string" || !raw.trim()) return [];
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
          .map((value) => String(value).trim().toLowerCase().replace(/^#/, ""))
          .filter(Boolean)
          .slice(0, 5);
      } catch {
        return [];
      }
    })();
    const imageFiles = formData
      .getAll("images")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (imageFiles.length > MAX_POST_IMAGE_COUNT) {
      return NextResponse.json(
        { error: `You can attach up to ${MAX_POST_IMAGE_COUNT} images.` },
        { status: 400 }
      );
    }

    for (const file of imageFiles) {
      if (!ACCEPTED_POST_IMAGE_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: "Images must be JPG, PNG, or WebP." },
          { status: 400 }
        );
      }
      if (file.size > MAX_POST_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Each image must be under ${Math.round(MAX_POST_IMAGE_SIZE_BYTES / (1024 * 1024))}MB.` },
          { status: 400 }
        );
      }
    }

    const { story: cleanStory, hashtags } = validatePostInput({
      story,
      imageCount: imageFiles.length,
      linkUrl: normalizedLinkUrl,
      fromTool,
      toTool,
    });
    const mergedTags = [...new Set([...explicitTags, ...hashtags])].slice(0, 5);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "posts");
    await mkdir(uploadsDir, { recursive: true });

    const imageUrls = await Promise.all(
      imageFiles.map(async (file) => {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
        const targetPath = path.join(uploadsDir, fileName);
        const arrayBuffer = await file.arrayBuffer();
        await writeFile(targetPath, Buffer.from(arrayBuffer));
        return `/uploads/posts/${fileName}`;
      })
    );

    const linkMetadata = normalizedLinkUrl ? await fetchLinkMetadata(normalizedLinkUrl) : null;
    const linkDomain = normalizedLinkUrl
      ? linkMetadata?.domain || getUrlDomain(normalizedLinkUrl)
      : null;

    const post = await prisma.alternativePost.create({
      data: {
        authorId: session.user.id,
        fromTool,
        toTool,
        story: cleanStory,
        tags: mergedTags,
        imageUrls,
        linkUrl: normalizedLinkUrl,
        linkDomain,
        linkTitle: linkMetadata?.title || null,
        linkDescription: linkMetadata?.description || null,
        linkImage: linkMetadata?.image || null,
      },
      select: { id: true },
    });

    revalidatePath("/feed");
    revalidatePath("/my-posts");

    return NextResponse.json({ ok: true, postId: post.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
