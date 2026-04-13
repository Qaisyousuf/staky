import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StackAnalyzer } from "./stack-analyzer";

export const metadata = { title: "My Stack — Staky" };

export default async function MyStackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Always read from DB — JWT activeMode can lag after a mode switch
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { activeMode: true } });
  const activeMode = dbUser?.activeMode ?? "user";

  const [stack, requests, dbPartners, availableTools, dbAlts] = await Promise.all([
    prisma.stack.findUnique({
      where: { userId_mode: { userId, mode: activeMode } },
      include: { items: { orderBy: { order: "asc" }, select: { id: true, toolName: true, category: true } } },
    }),
    prisma.migrationRequest.findMany({
      where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      select: { partner: { select: { id: true } }, switches: true },
    }),
    prisma.partner.findMany({
      where: { approved: true, userId: { not: userId } },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
    }),
    prisma.softwareTool.findMany({
      where: { published: true },
      select: { slug: true, name: true, origin: true, logoUrl: true, color: true, abbr: true, category: true, country: true },
      orderBy: { name: "asc" },
    }),
    prisma.softwareAlternative.findMany({
      where: { published: true, fromTool: { origin: "us" } },
      select: {
        fromTool: { select: { slug: true } },
        toTool: { select: { slug: true } },
      },
    }),
  ]);

  const requestedPartnerIds = new Set(
    requests.map((r) => r.partner?.id).filter(Boolean) as string[]
  );

  // Build per-tool sent pairs: "partnerId:fromToolSlug" — lets each card know
  // exactly which partners were already requested for that specific tool.
  const sentPairs: string[] = [];
  for (const req of requests) {
    if (!req.partner?.id) continue;
    const sw = (req.switches as Array<{ fromTool?: string }> | null) ?? [];
    for (const s of sw) {
      if (s.fromTool) sentPairs.push(`${req.partner.id}:${s.fromTool}`);
    }
  }

  const partners = dbPartners.map((p) => ({
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
  }));

  const alternatives = dbAlts.map((a) => ({ fromSlug: a.fromTool.slug, toSlug: a.toTool.slug }));

  return <StackAnalyzer initialItems={stack?.items ?? []} partners={partners} allTools={availableTools} alternatives={alternatives} sentPairs={sentPairs} />;
}
