import { PartnersClient } from "./partners-client";

export const metadata = {
  title: "Migration Partners — Staky",
  description: "Vetted EU specialists who handle end-to-end migrations from audit to hypercare.",
};

export default function PublicPartnersPage({
  searchParams,
}: {
  searchParams: { q?: string; spec?: string };
}) {
  return (
    <PartnersClient
      initialQuery={searchParams.q ?? ""}
      initialSpec={searchParams.spec ?? ""}
    />
  );
}
