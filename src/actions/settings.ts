"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(data: {
  name: string;
  bio: string;
  title: string;
  company: string;
  location?: string;
  image: string;
  coverImage?: string;
  socialLinks: { linkedin: string; twitter: string; github: string; website: string };
  interests: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name.trim() || null,
      bio: data.bio.trim() || null,
      title: data.title.trim() || null,
      company: data.company.trim() || null,
      location: data.location?.trim() || null,
      image: data.image.trim() || null,
      coverImage: data.coverImage?.trim() || null,
      socialLinks: data.socialLinks,
      interests: data.interests,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

// ─── Notification settings ────────────────────────────────────────────────────

export async function updateNotificationSettings(data: {
  inAppLikes: boolean;
  inAppComments: boolean;
  inAppReplies: boolean;
  inAppFollows: boolean;
  inAppConnects: boolean;
  inAppRecommendations: boolean;
  inAppSaves: boolean;
  inAppShares: boolean;
  emailLikes: boolean;
  emailComments: boolean;
  emailReplies: boolean;
  emailFollows: boolean;
  emailConnects: boolean;
  emailRecommendations: boolean;
  emailSaves: boolean;
  emailShares: boolean;
  emailDigest: "REAL_TIME" | "DAILY" | "WEEKLY" | "OFF";
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.notificationSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  revalidatePath("/settings");
  return { ok: true };
}

// ─── Privacy ──────────────────────────────────────────────────────────────────

export async function updatePrivacy(data: {
  profileVisibility: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { profileVisibility: data.profileVisibility },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function exportData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      posts: { select: { id: true, fromTool: true, toTool: true, story: true, tags: true, createdAt: true } },
      comments: { select: { id: true, content: true, createdAt: true } },
      likes: { select: { postId: true, createdAt: true } },
      savedPosts: { select: { postId: true, createdAt: true } },
      following: { select: { followingId: true, createdAt: true } },
      connections: { select: { targetId: true, createdAt: true } },
      stack: { include: { items: true } },
    },
  });

  // Return serialised export (caller converts to JSON download)
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      profile: {
        name: user?.name,
        email: user?.email,
        bio: user?.bio,
        title: user?.title,
        company: user?.company,
        interests: user?.interests,
        createdAt: user?.createdAt,
      },
      posts: user?.posts,
      comments: user?.comments,
      likes: user?.likes,
      savedPosts: user?.savedPosts,
      following: user?.following,
      connections: user?.connections,
      stack: user?.stack,
    },
    null,
    2
  );
}

// ─── Account ──────────────────────────────────────────────────────────────────

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) throw new Error("No password set on this account");

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new Error("Current password is incorrect");

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  return { ok: true };
}

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.user.delete({ where: { id: session.user.id } });
  redirect("/");
}
