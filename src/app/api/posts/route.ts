import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
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

const utapi = new UTApi();

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Determine if posting in partner mode
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      activeMode: true,
      partner: { select: { approved: true } },
    },
  });
  const postedAsPartner =
    dbUser?.activeMode === "partner" && dbUser?.partner?.approved === true;

  try {
    const formData = await request.formData();
    const fromTool = String(formData.get("fromTool") ?? "");
    const toTool = String(formData.get("toTool") ?? "");
    const story = String(formData.get("story") ?? "");
    const rawVisibility = String(formData.get("visibility") ?? "public");
    const visibility = ["public", "community", "private"].includes(rawVisibility) ? rawVisibility : "public";
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
    const mergedTags = Array.from(new Set([...explicitTags, ...hashtags])).slice(0, 5);

    // Upload images to UploadThing (works in serverless environments)
    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      const renamedFiles = imageFiles.map((file) => {
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        return new File([file], `${Date.now()}-${randomUUID()}.${extension}`, { type: file.type });
      });
      const results = await utapi.uploadFiles(renamedFiles);
      for (const result of results) {
        if (result.error) {
          return NextResponse.json({ error: "Image upload failed. Please try again." }, { status: 500 });
        }
        imageUrls.push(result.data.ufsUrl);
      }
    }

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
        postedAsPartner,
        visibility,
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
