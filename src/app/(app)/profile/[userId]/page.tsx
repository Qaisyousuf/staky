import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSuggestedProfiles } from "@/actions/profile";
import { ProfileClient } from "./profile-client";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { userId: string };
}): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true, bio: true },
  });
  if (!user) return { title: "Profile — Staky" };
  return {
    title: `${user.name ?? "Anonymous"} — Staky`,
    description: user.bio ?? `View ${user.name ?? "this user"}'s profile on Staky`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  const [user, followerCount, followingCount, isFollowing, isConnected] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: params.userId },
        select: {
          id: true,
          name: true,
          image: true,
          coverImage: true,
          bio: true,
          title: true,
          company: true,
          location: true,
          role: true,
          verified: true,
          plan: true,
          createdAt: true,
          socialLinks: true,
          interests: true,
          partner: {
            select: {
              companyName: true,
              country: true,
              specialty: true,
              rating: true,
              projectCount: true,
              approved: true,
              logoUrl: true,
              website: true,
            },
          },
        },
      }),
      prisma.follow.count({ where: { followingId: params.userId } }),
      prisma.follow.count({ where: { followerId: params.userId } }),
      currentUserId
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: params.userId,
              },
            },
          })
        : Promise.resolve(null),
      currentUserId
        ? prisma.connection.findFirst({
            where: {
              OR: [
                { userId: currentUserId, targetId: params.userId },
                { userId: params.userId, targetId: currentUserId },
              ],
            },
          })
        : Promise.resolve(null),
    ]);

  if (!user) notFound();

  const connectionCount =
    user.role === "PARTNER"
      ? await prisma.connection.count({
          where: { OR: [{ userId: params.userId }, { targetId: params.userId }] },
        })
      : null;

  const suggestedProfiles = await getSuggestedProfiles([
    params.userId,
    ...(currentUserId ? [currentUserId] : []),
  ]);

  const socialLinks = (user.socialLinks ?? {}) as {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };

  return (
    <ProfileClient
      user={{ ...user, createdAt: user.createdAt.toISOString(), socialLinks }}
      followerCount={followerCount}
      followingCount={followingCount}
      isFollowing={!!isFollowing}
      isConnected={!!isConnected}
      connectionCount={connectionCount}
      currentUserId={currentUserId}
      isSelf={currentUserId === params.userId}
      suggestedProfiles={suggestedProfiles}
    />
  );
}
