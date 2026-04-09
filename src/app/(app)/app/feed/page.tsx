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

  const [feedResult, followingRows, stackItems, trendingAlts, composerTools] = await Promise.all([
    getAppFeedPosts({ filter }),
    prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    prisma.stackItem.findMany({ where: { stack: { userId } }, orderBy: { order: "asc" }, take: 8 }),
    prisma.softwareAlternative.findMany({
      where: { published: true },
      orderBy: { switcherCount: "desc" },
      take: 5,
      include: {
        fromTool: { select: { name: true, logoUrl: true, color: true, abbr: true, country: true } },
        toTool:   { select: { name: true, logoUrl: true, color: true, abbr: true, country: true } },
      },
    }),
    prisma.softwareTool.findMany({
      where: { published: true },
      select: { slug: true, name: true, origin: true, logoUrl: true, color: true, abbr: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const followingIds = followingRows.map((r) => r.followingId);
  const suggestedUsers = await getSuggestedProfiles([userId, ...followingIds]);

  // Fetch DB tool records for stack items by name
  const stackToolNames = stackItems.map((i) => i.toolName);
  const dbStackTools = await prisma.softwareTool.findMany({
    where: { name: { in: stackToolNames } },
    select: { name: true, logoUrl: true, color: true, abbr: true, country: true },
  });
  const toolByName = new Map(dbStackTools.map((t) => [t.name, t]));
  const stackTools = stackItems
    .map((i) => toolByName.get(i.toolName))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

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
      stackTools={stackTools}
      trendingAlts={trendingAlts}
      composerUsTools={composerTools.filter((t) => t.origin === "us")}
      composerEuTools={composerTools.filter((t) => t.origin === "eu")}
    />
  );
}
