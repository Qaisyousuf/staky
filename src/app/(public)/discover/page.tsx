import { getPublishedAlternatives } from "@/actions/tools";
import { DiscoverClient } from "./discover-client";

export const metadata = {
  title: "Discover EU Alternatives — Staky",
  description: "Find European software alternatives to popular US tools.",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const alternatives = await getPublishedAlternatives();

  return (
    <DiscoverClient
      alternatives={alternatives}
      initialCategory={searchParams.category ?? "All"}
      initialQuery={searchParams.q ?? ""}
    />
  );
}
