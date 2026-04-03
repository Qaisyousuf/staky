"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ApplyAsPartnerData = {
  companyName: string;
  country: string;
  cvr: string;
  specialty: string;
  pricing?: string;
  description?: string;
  website?: string;
};

// ─── CVR lookup (public cvrapi.dk) ────────────────────────────────────────────

export type CvrResult =
  | { status: "found"; name: string; city: string; address: string }
  | { status: "not_found" }
  | { status: "error" };

export async function lookupCVR(cvr: string): Promise<CvrResult> {
  const cleaned = cvr.replace(/\s/g, "");
  if (!/^\d{8}$/.test(cleaned)) return { status: "not_found" };

  try {
    const res = await fetch(
      `https://cvrapi.dk/api?vat=${cleaned}&country=dk`,
      { headers: { "User-Agent": "Staky/1.0 (staky.dk)" }, next: { revalidate: 0 } }
    );
    if (!res.ok) return { status: "not_found" };
    const data = await res.json();
    if (data.error || !data.name) return { status: "not_found" };
    return { status: "found", name: data.name, city: data.city ?? "", address: data.address ?? "" };
  } catch {
    return { status: "error" };
  }
}

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

  const cvrCleaned = data.cvr.replace(/\s/g, "");

  if (!data.companyName.trim() || !data.country.trim() || specialtyList.length === 0) {
    return { status: "error", message: "Company name, country, and specialty are required" };
  }
  if (!/^\d{8}$/.test(cvrCleaned)) {
    return { status: "error", message: "CVR number must be exactly 8 digits" };
  }

  // Validate CVR against the Danish Business Register
  const cvrResult = await lookupCVR(cvrCleaned);
  if (cvrResult.status === "not_found") {
    return { status: "error", message: "CVR number not found in the Danish Business Register. Please check and try again." };
  }
  if (cvrResult.status === "error") {
    return { status: "error", message: "Could not reach the CVR registry right now. Please try again in a moment." };
  }

  // CVR is valid — auto-approve
  await prisma.partner.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      companyName: data.companyName.trim(),
      country: data.country.trim(),
      cvr: cvrCleaned,
      specialty: specialtyList,
      services: [],
      certifications: [],
      pricing: data.pricing?.trim() || null,
      description: data.description?.trim() || null,
      website: data.website?.trim() || null,
      approved: true,
    },
    update: {
      companyName: data.companyName.trim(),
      country: data.country.trim(),
      cvr: cvrCleaned,
      specialty: specialtyList,
      pricing: data.pricing?.trim() || null,
      description: data.description?.trim() || null,
      website: data.website?.trim() || null,
      approved: true,
    },
  });

  // Upgrade user role to PARTNER
  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: "PARTNER" },
  });

  const { createNotification } = await import("@/lib/notifications");

  // Notify user that their application was auto-approved
  await createNotification({
    recipientId: session.user.id,
    type: "PARTNER_APPROVED",
  });

  // Notify admins (FYI)
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
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
