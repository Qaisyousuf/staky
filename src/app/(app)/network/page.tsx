import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getNetworkData, getSuggestedProfiles } from "@/actions/profile";
import { NetworkClient } from "./network-client";

export const metadata = { title: "Network — Staky" };

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const validTabs = ["followers", "following", "connections"] as const;
  const tab = validTabs.includes(searchParams.tab as typeof validTabs[number])
    ? (searchParams.tab as typeof validTabs[number])
    : "followers";

  const networkData = await getNetworkData(session.user.id);

  const excludeIds = [
    session.user.id,
    ...networkData.following.map((u) => u.id),
  ];

  const suggestedProfiles = await getSuggestedProfiles(excludeIds);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Network</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your connections and followers</p>
      </div>
      <NetworkClient
        initialTab={tab}
        followers={networkData.followers}
        following={networkData.following}
        connections={networkData.connections}
        suggestedProfiles={suggestedProfiles}
      />
    </div>
  );
}
