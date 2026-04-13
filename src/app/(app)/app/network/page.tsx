import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNetworkData, getSuggestedProfiles, getProfileViews } from "@/actions/profile";
import { NetworkClient } from "./network-client";

export const metadata = { title: "Network — Staky" };

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const validTabs = ["followers", "following", "connections", "views"] as const;
  const tab = validTabs.includes(searchParams.tab as (typeof validTabs)[number])
    ? (searchParams.tab as (typeof validTabs)[number])
    : "followers";

  const [user, followerCount, followingCount, networkData, profileViewsData] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
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
          activeMode: true,
          verified: true,
          interests: true,
          partner: {
            select: {
              companyName: true,
              logoUrl: true,
              coverImage: true,
              specialty: true,
              description: true,
              country: true,
              rating: true,
              approved: true,
            },
          },
        },
      }),
      // Counts are persona-scoped via the activeMode field read inside getNetworkData
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      getNetworkData(userId),
      getProfileViews(userId),
    ]);

  if (!user) redirect("/login");

  const connectionCount = networkData.connections.length;
  const excludeIds = [userId, ...networkData.following.map((u) => u.id)];
  const suggestedProfiles = await getSuggestedProfiles(excludeIds);

  // Weekly view count from last30Days data
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyViews = profileViewsData.last30Days
    .filter((d) => new Date(d.date) >= sevenDaysAgo)
    .reduce((sum, d) => sum + d.count, 0);

  return (
    <NetworkClient
      tab={tab}
      currentUser={{
        id: user.id,
        name: user.name,
        image: user.image,
        coverImage: user.coverImage ?? null,
        bio: user.bio ?? null,
        title: user.title ?? null,
        company: user.company ?? null,
        location: user.location ?? null,
        role: user.role,
        activeMode: user.activeMode,
        verified: user.verified,
        interests: user.interests,
        followerCount,
        followingCount,
        connectionCount,
        partner: user.partner
          ? {
              companyName: user.partner.companyName,
              logoUrl: user.partner.logoUrl ?? null,
              coverImage: user.partner.coverImage ?? null,
              specialty: user.partner.specialty ?? [],
              description: user.partner.description ?? null,
              country: user.partner.country ?? null,
              rating: user.partner.rating,
              approved: user.partner.approved,
            }
          : null,
      }}
      profileViews={{
        totalCount: profileViewsData.totalCount,
        weeklyCount: weeklyViews,
        last30Days: profileViewsData.last30Days,
        recentViewers: profileViewsData.recentViewers,
      }}
      followers={networkData.followers}
      following={networkData.following}
      connections={networkData.connections}
      suggestedProfiles={suggestedProfiles}
    />
  );
}
