import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PartnersClient } from "./partners-client";
import type { PublicPartner } from "./partners-client";

export const metadata = {
  title: "Migration Partners — Staky",
  description: "Find certified EU migration partners to help you switch your software stack.",
};

export default async function PublicPartnersPage() {
  const [session, rawPartners] = await Promise.all([
    auth(),
    prisma.partner.findMany({
      where: { approved: true },
      orderBy: [{ projectCount: "desc" }, { rating: "desc" }],
      select: {
        id: true,
        companyName: true,
        country: true,
        specialty: true,
        services: true,
        logoUrl: true,
        rating: true,
        projectCount: true,
        description: true,
        website: true,
      },
    }),
  ]);

  const partners: PublicPartner[] = rawPartners.map((p) => ({
    ...p,
    services: (p.services as string[]) ?? [],
  }));

  return (
    <PartnersClient
      isAuthenticated={!!session?.user?.id}
      partners={partners}
    />
  );
}
