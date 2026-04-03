import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MOCK_PARTNERS } from "@/data/mock-data";
import { StackAnalyzer } from "./stack-analyzer";

export const metadata = { title: "My Stack — Staky" };

export default async function MyStackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [stack, requests, dbPartners] = await Promise.all([
    prisma.stack.findUnique({
      where: { userId },
      include: { items: { orderBy: { order: "asc" }, select: { id: true, toolName: true, category: true } } },
    }),
    prisma.migrationRequest.findMany({
      where: { userId },
      select: { partner: { select: { id: true } } },
    }),
    prisma.partner.findMany({
      where: { approved: true },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
    }),
  ]);

  const requestedPartnerIds = new Set(
    requests.map((r) => r.partner?.id).filter(Boolean) as string[]
  );

  const partners = [
    ...dbPartners.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.companyName,
      initials: p.companyName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
      color: "#2A5FA5",
      logoUrl: p.logoUrl ?? p.user.image ?? null,
      country: p.country,
      countryFlag: "",
      specialty: p.specialty ?? [],
      rating: p.rating,
      reviewCount: 0,
      projects: p.projectCount,
      responseTime: "",
      pricing: p.pricing ?? "",
      featured: p.featured,
      verified: true,
      hasRequest: requestedPartnerIds.has(p.id),
      isReal: true as const,
    })),
    ...MOCK_PARTNERS.map((p) => ({
      id: p.id,
      userId: p.id,
      name: p.name,
      initials: p.initials,
      color: p.color,
      logoUrl: p.logoUrl ?? null,
      country: p.country,
      countryFlag: p.countryFlag,
      specialty: p.specialty,
      rating: p.rating,
      reviewCount: p.reviewCount,
      projects: p.projects,
      pricing: p.pricing,
      featured: p.featured,
      verified: p.verified,
      hasRequest: false,
      isReal: false as const,
    })),
  ];

  return <StackAnalyzer initialItems={stack?.items ?? []} partners={partners} />;
}
