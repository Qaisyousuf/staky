import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppFeedPosts } from "@/actions/feed";
import type { AppFeedFilter } from "@/actions/feed";
import { getSuggestedProfiles } from "@/actions/profile";
import { TOOLS } from "@/data/mock-data";
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

  // Fetch avatar + activeMode + partner info from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      image: true,
      activeMode: true,
      partner: { select: { approved: true, companyName: true, logoUrl: true } },
    },
  });
  const userImage = dbUser?.image ?? null;
  const isPartnerMode =
    dbUser?.activeMode === "partner" && dbUser?.partner?.approved === true;
  const partnerName = dbUser?.partner?.companyName ?? null;
  const partnerLogoUrl = dbUser?.partner?.logoUrl ?? null;

  const rawFilter = searchParams.filter as AppFeedFilter | undefined;
  const filter: AppFeedFilter = rawFilter && VALID_FILTERS.has(rawFilter) ? rawFilter : "all";

  // Timestamp this render — used as key + new-posts poll baseline
  const loadedAt = new Date().toISOString();

  const TOOL_NAME_TO_SLUG = Object.fromEntries(
    Object.entries(TOOLS).map(([slug, t]) => [t.name.toLowerCase(), slug])
  );

  const [feedResult, followingRows, stackItems] = await Promise.all([
    getAppFeedPosts({ filter }),
    prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    prisma.stackItem.findMany({ where: { stack: { userId } }, orderBy: { order: "asc" }, take: 8 }),
  ]);

  const followingIds = followingRows.map((r) => r.followingId);
  const suggestedUsers = await getSuggestedProfiles([userId, ...followingIds]);

  const stackSlugs = stackItems
    .map((i) => TOOL_NAME_TO_SLUG[i.toolName.toLowerCase()])
    .filter((s): s is string => Boolean(s));

  return (
    <FeedClient
      key={loadedAt}
      initialPosts={feedResult.posts}
      initialLikedIds={feedResult.likedIds}
      initialSavedIds={feedResult.savedIds}
      initialRecommendedIds={feedResult.recommendedIds}
      initialFollowingIds={feedResult.followingIds}
      initialConnectedIds={feedResult.connectedIds}
      initialHasMore={feedResult.hasMore}
      initialNextCursor={feedResult.nextCursor}
      filter={filter}
      currentUserId={userId}
      currentUserImage={userImage}
      userName={userName}
      userInitials={userInitials}
      isPartnerMode={isPartnerMode}
      partnerName={partnerName}
      partnerLogoUrl={partnerLogoUrl}
      loadedAt={loadedAt}
      targetPostId={searchParams.post}
      targetCommentId={searchParams.comment}
      suggestedUsers={suggestedUsers}
      stackSlugs={stackSlugs}
    />
  );
}
