import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileEditor } from "./profile-editor";

export const metadata = { title: "Company Profile — Staky" };

export default async function CompanyProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") redirect("/app/dashboard");

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
  });
  if (!partner) redirect("/app/dashboard");

  return (
    <ProfileEditor
      partner={{
        id: partner.id,
        companyName: partner.companyName,
        country: partner.country,
        description: partner.description ?? "",
        pricing: partner.pricing ?? "",
        website: partner.website ?? "",
        logoUrl: partner.logoUrl ?? "",
        specialty: partner.specialty ?? [],
        services: partner.services ?? [],
        certifications: partner.certifications ?? [],
        approved: partner.approved,
        rating: partner.rating,
        projectCount: partner.projectCount,
      }}
    />
  );
}
