import { DiscoverClient } from "./discover-client";

export const metadata = {
  title: "Discover EU Alternatives — Staky",
  description: "Find European software alternatives to popular US tools.",
};

export default function DiscoverPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  return (
    <DiscoverClient
      initialCategory={searchParams.category ?? "All"}
      initialQuery={searchParams.q ?? ""}
    />
  );
}
