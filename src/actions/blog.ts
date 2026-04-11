"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const AUTHOR_SELECT = {
  id: true, name: true, image: true, title: true, bio: true,
} as const;

/* ── Public queries ───────────────────────────────────────────────────────── */

export async function getPublishedBlogPosts(category?: string) {
  return prisma.blogPost.findMany({
    where: {
      published: true,
      ...(category && category !== "all" ? { category } : {}),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, title: true, slug: true, excerpt: true,
      coverImage: true, category: true, tags: true,
      readingTime: true, views: true, featured: true,
      createdAt: true,
      author: { select: AUTHOR_SELECT },
    },
  });
}

export async function getBlogPost(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug, published: true },
    select: {
      id: true, title: true, slug: true, excerpt: true,
      content: true, coverImage: true, category: true,
      tags: true, readingTime: true, views: true,
      featured: true, createdAt: true, updatedAt: true,
      author: { select: AUTHOR_SELECT },
    },
  });
}

export async function getBlogCategories(): Promise<string[]> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { category: true },
    distinct: ["category"],
  });
  return posts.map((p: { category: string }) => p.category);
}

export async function incrementBlogViews(slug: string) {
  await prisma.blogPost.update({
    where: { slug },
    data: { views: { increment: 1 } },
  });
}

export async function getRelatedBlogPosts(slug: string, category: string) {
  // First try same category, then fall back to any recent posts
  const same = await prisma.blogPost.findMany({
    where: { published: true, category, slug: { not: slug } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true, title: true, slug: true, excerpt: true,
      coverImage: true, category: true, readingTime: true, createdAt: true,
      author: { select: AUTHOR_SELECT },
    },
  });

  if (same.length >= 4) return same;

  // Fill up from other categories
  const existingSlugs = [slug, ...same.map((p: { slug: string }) => p.slug)];
  const others = await prisma.blogPost.findMany({
    where: { published: true, slug: { notIn: existingSlugs } },
    orderBy: { createdAt: "desc" },
    take: 6 - same.length,
    select: {
      id: true, title: true, slug: true, excerpt: true,
      coverImage: true, category: true, readingTime: true, createdAt: true,
      author: { select: AUTHOR_SELECT },
    },
  });

  return [...same, ...others];
}

/* ── Admin queries ────────────────────────────────────────────────────────── */

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Forbidden");
  return session.user.id;
}

export async function adminGetBlogPosts() {
  await ensureAdmin();
  return prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, category: true,
      published: true, featured: true, views: true,
      readingTime: true, createdAt: true,
      excerpt: true, content: true, coverImage: true, tags: true,
      author: { select: { id: true, name: true, image: true } },
    },
  });
}

export interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  readingTime: number;
  published: boolean;
  featured: boolean;
}

export async function adminCreateBlogPost(data: BlogPostFormData) {
  const authorId = await ensureAdmin();
  const post = await prisma.blogPost.create({
    data: { ...data, authorId },
  });
  revalidatePath("/blog");
  revalidatePath("/app/admin");
  return post;
}

export async function adminUpdateBlogPost(id: string, data: Partial<BlogPostFormData>) {
  await ensureAdmin();
  const post = await prisma.blogPost.update({ where: { id }, data });
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/app/admin");
  return post;
}

export async function adminDeleteBlogPost(id: string) {
  await ensureAdmin();
  const post = await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/blog");
  revalidatePath("/app/admin");
  return post;
}

export async function adminToggleBlogPublished(id: string) {
  await ensureAdmin();
  const post = await prisma.blogPost.findUnique({ where: { id }, select: { published: true, slug: true } });
  if (!post) throw new Error("Not found");
  await prisma.blogPost.update({ where: { id }, data: { published: !post.published } });
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/app/admin");
}

export async function adminToggleBlogFeatured(id: string) {
  await ensureAdmin();
  const post = await prisma.blogPost.findUnique({ where: { id }, select: { featured: true, slug: true } });
  if (!post) throw new Error("Not found");
  await prisma.blogPost.update({ where: { id }, data: { featured: !post.featured } });
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/app/admin");
}
