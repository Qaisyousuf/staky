"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { encrypt, decrypt } from "@/lib/encryption";
import type { ConfigItem } from "@/lib/config-templates";

// ─── Partner: save draft items (before sending) ───────────────────────────────

export async function saveConfigItems(requestId: string, items: ConfigItem[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, partnerId: partner.id },
    select: { id: true, configSentAt: true },
  });
  if (!request) throw new Error("Not your lead");
  if (request.configSentAt) throw new Error("Already sent to client — cannot edit");

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { configItems: items as never },
  });

  revalidatePath(`/app/leads/${requestId}`);
  return { ok: true };
}

// ─── Partner: send config request to client ───────────────────────────────────

export async function sendConfigRequest(requestId: string, items: ConfigItem[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, partnerId: partner.id },
    select: { id: true, userId: true, configSentAt: true },
  });
  if (!request) throw new Error("Not your lead");
  if (request.configSentAt) throw new Error("Already sent");
  if (!items.length) throw new Error("No items to send");

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { configItems: items as never, configSentAt: new Date() },
  });

  await createNotification({
    type: "CONFIG_REQUEST_SENT",
    recipientId: request.userId,
    recipientMode: "user",
    senderId: session.user.id,
    senderMode: "partner",
    requestId,
  });

  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath(`/app/requests/${requestId}`);
  return { ok: true };
}

// ─── Client: submit all answers (first submission) ────────────────────────────

export async function submitConfigAnswers(
  requestId: string,
  answers: { id: string; answer: string; isSecret: boolean }[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, userId: session.user.id },
    include: { partner: { select: { userId: true } } },
  });
  if (!request) throw new Error("Not your request");
  if (!request.configItems) throw new Error("No configuration request found");

  const items = request.configItems as ConfigItem[];
  const answersMap = new Map(answers.map((a) => [a.id, a]));

  const updated = items.map((item) => {
    const a = answersMap.get(item.id);
    if (!a?.answer.trim()) return item;
    return {
      ...item,
      answer: a.isSecret ? encrypt(a.answer.trim()) : a.answer.trim(),
      status: "answered" as const,
      answeredAt: new Date().toISOString(),
      partnerNote: undefined,
    };
  });

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { configItems: updated as never },
  });

  if (request.partner?.userId) {
    await createNotification({
      type: "CONFIG_SUBMITTED",
      recipientId: request.partner.userId,
      recipientMode: "partner",
      senderId: session.user.id,
      senderMode: "user",
      requestId,
    });
  }

  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath(`/app/leads/${requestId}`);
  return { ok: true };
}

// ─── Client: re-submit a single item after revision request ───────────────────

export async function resubmitConfigItem(
  requestId: string,
  itemId: string,
  answer: string,
  isSecret: boolean
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, userId: session.user.id },
    select: { configItems: true },
  });
  if (!request?.configItems) throw new Error("Not found");

  const items = request.configItems as ConfigItem[];
  const updated = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          answer: isSecret ? encrypt(answer.trim()) : answer.trim(),
          status: "answered" as const,
          answeredAt: new Date().toISOString(),
          partnerNote: undefined,
        }
      : item
  );

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { configItems: updated as never },
  });

  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath(`/app/leads/${requestId}`);
  return { ok: true };
}

// ─── Partner: approve or request revision on a single item ────────────────────

export async function reviewConfigItem(
  requestId: string,
  itemId: string,
  action: "approve" | "revision",
  note?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, partnerId: partner.id },
    select: { configItems: true },
  });
  if (!request?.configItems) throw new Error("Not found");

  const items = request.configItems as ConfigItem[];
  const updated = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          status: action === "approve" ? ("approved" as const) : ("revision" as const),
          partnerNote: action === "revision" ? (note ?? "") : undefined,
        }
      : item
  );

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { configItems: updated as never },
  });

  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath(`/app/requests/${requestId}`);
  return { ok: true };
}

// ─── Partner: decrypt and return a secret answer ──────────────────────────────
// Only callable by the partner who owns the request.

export async function revealSecretAnswer(requestId: string, itemId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, partnerId: partner.id },
    select: { configItems: true },
  });
  if (!request?.configItems) throw new Error("Not found");

  const item = (request.configItems as ConfigItem[]).find((i) => i.id === itemId);
  if (!item) throw new Error("Item not found");
  if (item.type !== "secret") throw new Error("Not a secret item");
  if (!item.answer) throw new Error("No answer submitted yet");

  return { ok: true, value: decrypt(item.answer) };
}
