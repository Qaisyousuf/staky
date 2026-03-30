"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function claimLead(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
  });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("Request not found");
  if (request.status !== "PENDING") throw new Error("Request already claimed");

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { partnerId: partner.id, status: "MATCHED" },
  });

  revalidatePath("/leads");
  return { ok: true };
}

export async function updateLeadStatus(
  requestId: string,
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
  });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, partnerId: partner.id },
  });
  if (!request) throw new Error("Not your lead");

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { status },
  });

  revalidatePath("/leads");
  return { ok: true };
}

// ─── Company profile ──────────────────────────────────────────────────────────

export async function updateCompanyProfile(data: {
  companyName: string;
  country: string;
  description: string;
  pricing: string;
  website: string;
  logoUrl: string;
  specialty: string[];
  services: string[];
  certifications: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
  });
  if (!partner) throw new Error("Not a partner");

  await prisma.partner.update({
    where: { id: partner.id },
    data: {
      companyName: data.companyName.trim(),
      country: data.country.trim(),
      description: data.description.trim() || null,
      pricing: data.pricing.trim() || null,
      website: data.website.trim() || null,
      logoUrl: data.logoUrl.trim() || null,
      specialty: data.specialty,
      services: data.services,
      certifications: data.certifications,
    },
  });

  revalidatePath("/company-profile");
  revalidatePath("/partners");
  revalidatePath("/dashboard");
  return { ok: true };
}
