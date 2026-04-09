import { getPublishedAlternatives } from "@/actions/tools";
import { AppDiscoverClient } from "./discover-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Discover EU Alternatives — Staky" };

export default async function AppDiscoverPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const alternatives = await getPublishedAlternatives();

  return (
    <AppDiscoverClient
      alternatives={alternatives}
      initialCategory={searchParams.category ?? "All"}
      initialQuery={searchParams.q ?? ""}
    />
  );
}
