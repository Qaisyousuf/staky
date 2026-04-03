"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ApplyAsPartnerData = {
  companyName: string;
  country: string;
  specialty: string;
  pricing?: string;
  description?: string;
  website?: string;
};

export type PartnerModeState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function applyAsPartner(data: ApplyAsPartnerData): Promise<PartnerModeState> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  const specialtyList = data.specialty
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!data.companyName.trim() || !data.country.trim() || specialtyList.length === 0) {
    return { status: "error", message: "Company name, country, and specialty are required" };
  }

  await prisma.partner.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      companyName: data.companyName.trim(),
      country: data.country.trim(),
      specialty: specialtyList,
      services: [],
      certifications: [],
      pricing: data.pricing?.trim() || null,
      description: data.description?.trim() || null,
      website: data.website?.trim() || null,
      approved: false,
    },
    update: {
      companyName: data.companyName.trim(),
      country: data.country.trim(),
      specialty: specialtyList,
      pricing: data.pricing?.trim() || null,
      description: data.description?.trim() || null,
      website: data.website?.trim() || null,
      approved: false,
    },
  });

  // Notify all admins about the new application
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  const { createNotification } = await import("@/lib/notifications");
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        recipientId: admin.id,
        senderId: session.user.id,
        type: "PARTNER_APPLICATION",
      })
    )
  );

  revalidatePath("/app/settings");
  return { status: "success" };
}

export async function updatePartnerLogo(logoBase64: string): Promise<PartnerModeState> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  await prisma.partner.update({
    where: { userId: session.user.id },
    data: { logoUrl: logoBase64 },
  });

  revalidatePath("/app/settings");
  revalidatePath("/app/dashboard");
  return { status: "success" };
}

export async function setActiveMode(mode: "user" | "partner"): Promise<PartnerModeState> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  if (mode === "partner") {
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: { approved: true },
    });
    if (!partner?.approved) {
      return { status: "error", message: "Partner account not approved" };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeMode: mode },
  });

  revalidatePath("/app/dashboard");
  return { status: "success" };
}
