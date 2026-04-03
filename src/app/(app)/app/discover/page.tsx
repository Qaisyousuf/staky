import { AppDiscoverClient } from "./discover-client";

export const metadata = { title: "Discover EU Alternatives — Staky" };

export default function AppDiscoverPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  return (
    <AppDiscoverClient
      initialCategory={searchParams.category ?? "All"}
      initialQuery={searchParams.q ?? ""}
    />
  );
}
