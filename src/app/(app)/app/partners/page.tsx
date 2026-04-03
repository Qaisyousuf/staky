import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOOLS, MOCK_PARTNERS } from "@/data/mock-data";
import { MIGRATION_ANALYSIS } from "@/data/migration-data";
import { PartnerMatchList } from "./partner-match-list";

export const metadata = { title: "Migration Partners — Staky" };

export default async function AppPartnersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [stack, requests, dbPartners] = await Promise.all([
    prisma.stack.findUnique({
      where: { userId },
      include: { items: { select: { toolName: true } } },
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

  // Switches from stack
  const switches = (stack?.items ?? []).flatMap((item) => {
    const slug = Object.values(TOOLS).find(
      (t) => t.name.toLowerCase() === item.toolName.toLowerCase()
    )?.slug;
    if (!slug || TOOLS[slug]?.origin !== "us") return [];
    const analysis = MIGRATION_ANALYSIS[slug];
    if (!analysis) return [];
    return [{ fromTool: slug, toTool: analysis.euAlternative }];
  });

  const requestedPartnerIds = new Set(
    requests.map((r) => r.partner?.id).filter(Boolean) as string[]
  );

  // Merge DB + mock into a unified shape
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
      responseTime: p.responseTime,
      pricing: p.pricing,
      featured: p.featured,
      verified: p.verified,
      hasRequest: false,
    })),
  ];

  return <PartnerMatchList switches={switches} partners={partners} />;
}
