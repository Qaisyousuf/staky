import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PartnerMatchList } from "./partner-match-list";

export const metadata = { title: "Migration Partners — Staky" };

export default async function AppPartnersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Always read from DB — JWT activeMode can lag after a mode switch
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { activeMode: true } });
  const activeMode = dbUser?.activeMode ?? "user";

  const [stack, requests, dbPartners] = await Promise.all([
    prisma.stack.findUnique({
      where: { userId_mode: { userId, mode: activeMode } },
      include: { items: { select: { toolName: true } } },
    }),
    prisma.migrationRequest.findMany({
      where: { userId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      select: { partner: { select: { id: true } } },
    }),
    prisma.partner.findMany({
      where: { approved: true, userId: { not: userId } },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
    }),
  ]);

  // Switches from stack: resolve tool names → slugs via DB, then find their top EU alternatives
  const stackToolNames = (stack?.items ?? []).map((i) => i.toolName);
  const dbStackTools = stackToolNames.length > 0
    ? await prisma.softwareTool.findMany({
        where: { name: { in: stackToolNames }, origin: "us" },
        select: { slug: true, name: true },
      })
    : [];
  const usToolSlugs = dbStackTools.map((t) => t.slug);
  const stackAlternatives = usToolSlugs.length > 0
    ? await prisma.softwareAlternative.findMany({
        where: { published: true, fromTool: { slug: { in: usToolSlugs } } },
        include: {
        fromTool: { select: { slug: true, name: true, logoUrl: true, color: true, abbr: true } },
        toTool:   { select: { slug: true, name: true, logoUrl: true, color: true, abbr: true } },
      },
        orderBy: { switcherCount: "desc" },
        distinct: ["fromToolId"],
        take: 5,
      })
    : [];
  const switches = stackAlternatives.map((a) => ({
    fromTool: a.fromTool.slug,
    toTool:   a.toTool.slug,
    fromToolData: { name: a.fromTool.name, logoUrl: a.fromTool.logoUrl, color: a.fromTool.color, abbr: a.fromTool.abbr },
    toToolData:   { name: a.toTool.name,   logoUrl: a.toTool.logoUrl,   color: a.toTool.color,   abbr: a.toTool.abbr   },
  }));

  const requestedPartnerIds = new Set(
    requests.map((r) => r.partner?.id).filter(Boolean) as string[]
  );

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
  }));

  return <PartnerMatchList switches={switches} partners={partners} />;
}
