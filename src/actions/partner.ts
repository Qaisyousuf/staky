"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { type MigrationTask, type MigrationPhase } from "@/lib/request-utils";

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
    recipientMode: "user",
    senderId: session.user.id,
    senderMode: "partner",
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
    recipientMode: "user",
    senderId: session.user.id,
    senderMode: "partner",
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
    recipientMode: "user",
    senderId: session.user.id,
    senderMode: "partner",
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

export async function sendProposal(
  requestId: string,
  input: { timeline: string; approach: string; budgetRange: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, partnerId: partner.id },
  });
  if (!request) throw new Error("Not your lead");
  if (!["PENDING", "UNDER_REVIEW", "MATCHED"].includes(request.status)) {
    throw new Error("Cannot send proposal at this stage");
  }

  const proposal = {
    timeline: input.timeline.trim(),
    approach: input.approach.trim(),
    budgetRange: input.budgetRange.trim(),
    sentAt: new Date().toISOString(),
  };

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { proposal: proposal as never, status: "PROPOSAL_SENT" },
  });

  await createNotification({
    recipientId: request.userId,
    recipientMode: "user",
    senderId: session.user.id,
    senderMode: "partner",
    type: "REQUEST_PROPOSAL",
    requestId,
  });

  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/notifications");
  return { ok: true };
}

export async function startWork(requestId: string, targetDate?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, partnerId: partner.id },
  });
  if (!request) throw new Error("Not your lead");
  if (!["ACCEPTED", "PROPOSAL_SENT"].includes(request.status)) {
    throw new Error("Cannot start work at this stage");
  }

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: {
      status: "IN_PROGRESS",
      ...(targetDate ? { targetDate: new Date(targetDate) } : {}),
    },
  });

  await createNotification({
    recipientId: request.userId,
    recipientMode: "user",
    senderId: session.user.id,
    senderMode: "partner",
    type: "REQUEST_ACTIVE",
    requestId,
  });

  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath("/app/requests");
  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/notifications");
  return { ok: true };
}

export async function addTask(
  requestId: string,
  input: { title: string; description?: string; techNote?: string; priority?: string; estimatedTime?: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, partnerId: partner.id },
    select: { id: true, phases: true },
  });
  if (!request) throw new Error("Not your lead");

  const current = (request.phases as MigrationTask[] | null) ?? [];
  const newTask: MigrationTask = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    techNote: input.techNote?.trim() || undefined,
    priority: (input.priority as MigrationTask["priority"]) || undefined,
    estimatedTime: input.estimatedTime?.trim() || undefined,
    status: "todo",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { phases: [...current, newTask] as never },
  });

  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath(`/app/requests/${requestId}`);
  return { ok: true };
}

export async function updateTaskStatus(
  requestId: string,
  taskId: string,
  status: "todo" | "in_progress" | "done"
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, partnerId: partner.id },
    select: { id: true, phases: true },
  });
  if (!request) throw new Error("Not your lead");

  const current = (request.phases as MigrationTask[] | null) ?? [];
  const updated = current.map((t) =>
    t.id === taskId
      ? {
          ...t,
          status,
          completedAt: status === "done" ? new Date().toISOString() : null,
        }
      : t
  );

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { phases: updated as never },
  });

  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath(`/app/requests/${requestId}`);
  return { ok: true };
}

export async function deleteTask(requestId: string, taskId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, partnerId: partner.id },
    select: { id: true, phases: true },
  });
  if (!request) throw new Error("Not your lead");

  const current = (request.phases as MigrationTask[] | null) ?? [];
  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { phases: current.filter((t) => t.id !== taskId) as never },
  });

  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath(`/app/requests/${requestId}`);
  return { ok: true };
}

// ─── Company profile ──────────────────────────────────────────────────────────

export async function updateCompanyProfile(data: {
  companyName: string;
  country: string;
  description: string;
  website: string;
  logoUrl: string;
  coverImage: string;
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
      website: data.website.trim() || null,
      logoUrl: data.logoUrl.trim() || null,
      coverImage: data.coverImage.trim() || null,
      specialty: data.specialty,
      services: data.services,
      certifications: data.certifications,
    },
  });

  revalidatePath("/app", "layout");
  revalidatePath("/app/partners");
  return { ok: true };
}

// ─── Migration phases ─────────────────────────────────────────────────────────

export async function togglePhase(
  requestId: string,
  phaseId: string,
  done: boolean,
  notes?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, partnerId: partner.id },
    select: { id: true, phases: true },
  });
  if (!request) throw new Error("Not your lead");

  const current = (request.phases as MigrationPhase[] | null) ?? [];
  const updated = current.map((p) =>
    p.id === phaseId
      ? { ...p, done, completedAt: done ? new Date().toISOString() : null, notes: done ? (notes ?? p.notes) : null }
      : p
  );

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { phases: updated as never },
  });

  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath(`/app/requests/${requestId}`);
  return { ok: true };
}
