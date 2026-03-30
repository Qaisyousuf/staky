import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppFeedPosts } from "@/actions/feed";
import type { AppFeedFilter } from "@/actions/feed";
import { getSuggestedProfiles } from "@/actions/profile";
import { FeedClient } from "./feed-client";

export const metadata: Metadata = {
  title: "Feed — Staky",
  description: "Your personalized EU migration feed.",
};

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const VALID_FILTERS = new Set<AppFeedFilter>(["all", "following", "community", "partners"]);

export default async function AppFeedPage({
  searchParams,
}: {
  searchParams: { filter?: string; post?: string; comment?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const userName = session.user.name ?? "";
  const userInitials = getInitials(userName);

  // Fetch avatar from DB (base64 images don't fit in JWT)
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  const userImage = dbUser?.image ?? null;

  const rawFilter = searchParams.filter as AppFeedFilter | undefined;
  const filter: AppFeedFilter = rawFilter && VALID_FILTERS.has(rawFilter) ? rawFilter : "all";

  // Timestamp this render — used as key + new-posts poll baseline
  const loadedAt = new Date().toISOString();

  const [feedResult, suggestedUsers] = await Promise.all([
    getAppFeedPosts({ filter }),
    getSuggestedProfiles([userId]),
  ]);

  return (
    <FeedClient
      key={loadedAt}
      initialPosts={feedResult.posts}
      initialLikedIds={feedResult.likedIds}
      initialSavedIds={feedResult.savedIds}
      initialRecommendedIds={feedResult.recommendedIds}
      initialFollowingIds={feedResult.followingIds}
      initialHasMore={feedResult.hasMore}
      initialNextCursor={feedResult.nextCursor}
      filter={filter}
      currentUserId={userId}
      currentUserImage={userImage}
      userName={userName}
      userInitials={userInitials}
      loadedAt={loadedAt}
      targetPostId={searchParams.post}
      targetCommentId={searchParams.comment}
      suggestedUsers={suggestedUsers}
    />
  );
}
