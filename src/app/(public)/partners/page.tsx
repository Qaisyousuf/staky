import { auth } from "@/lib/auth";
import { PartnersClient } from "./partners-client";

export const metadata = {
  title: "Migration Partners — Staky",
  description: "Find certified EU migration partners to help you switch.",
};

export default async function PublicPartnersPage() {
  const session = await auth();
  return <PartnersClient isAuthenticated={!!session?.user?.id} />;
}
