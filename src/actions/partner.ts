"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function acceptLead(requestId: string) {
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
  if (!["PENDING", "UNDER_REVIEW", "MATCHED"].includes(request.status)) {
    throw new Error("Request cannot be accepted at this stage");
  }
  if (request.partnerId && request.partnerId !== partner.id) {
    throw new Error("Request is assigned to another partner");
  }

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { partnerId: partner.id, status: "ACCEPTED" },
  });

  await createNotification({
    recipientId: request.userId,
    senderId: session.user.id,
    type: "REQUEST_ACCEPTED",
    requestId,
  });

  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/notifications");
  return { ok: true };
}

export async function rejectLead(requestId: string) {
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
  if (!["PENDING", "UNDER_REVIEW", "MATCHED", "ACCEPTED"].includes(request.status)) {
    throw new Error("This request can no longer be rejected");
  }

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });

  await createNotification({
    recipientId: request.userId,
    senderId: session.user.id,
    type: "REQUEST_REJECTED",
    requestId,
  });

  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/notifications");
  return { ok: true };
}

export async function updateLeadStatus(
  requestId: string,
  status: "IN_PROGRESS" | "COMPLETED"
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

  await createNotification({
    recipientId: request.userId,
    senderId: session.user.id,
    type: status === "IN_PROGRESS" ? "REQUEST_ACTIVE" : "REQUEST_COMPLETED",
    requestId,
  });

  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/notifications");
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

  revalidatePath("/app/company-profile");
  revalidatePath("/app/partners");
  revalidatePath("/app/dashboard");
  return { ok: true };
}
