"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_REQUEST_STATUSES,
  buildRequestContextKey,
  buildRequestSummary,
  buildSwitchesFromStack,
  normalizeRequestSwitches,
  type RequestSource,
  type RequestSwitch,
} from "@/lib/request-utils";

export async function createMigrationRequest(input: {
  source: RequestSource;
  partnerUserId?: string;
  switches?: RequestSwitch[];
  urgency?: string;
  userGoals?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Please sign in before sending a request.");
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { activeMode: true },
  });
  const activeMode = userRecord?.activeMode ?? "user";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      stacks: {
        where: { mode: activeMode },
        include: {
          items: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const partner = input.partnerUserId
    ? await prisma.partner.findUnique({
        where: { userId: input.partnerUserId },
      })
    : null;

  if (input.partnerUserId && !partner) {
    throw new Error("Partner profile not found.");
  }

  const explicitSwitches = normalizeRequestSwitches(input.switches ?? []);
  const stackSwitches = buildSwitchesFromStack(user.stacks[0]?.items.map((item) => item.toolName) ?? []);
  const switches = explicitSwitches.length > 0 ? explicitSwitches : stackSwitches;

  if (switches.length === 0) {
    throw new Error("Add tools to your stack before requesting help.");
  }

  const contextKey = buildRequestContextKey({
    source: input.source,
    partnerId: partner?.id ?? null,
    switches,
  });

  const existing = await prisma.migrationRequest.findFirst({
    where: {
      userId: user.id,
      partnerId: partner?.id ?? null,
      contextKey,
      status: { in: ACTIVE_REQUEST_STATUSES },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existing) {
    return {
      created: false,
      requestId: existing.id,
      status: existing.status,
    };
  }

  const summary = buildRequestSummary({
    source: input.source,
    switches,
    partnerName: partner?.companyName,
  });

  const primarySwitch = switches[0];

  const request = await prisma.migrationRequest.create({
    data: {
      userId: user.id,
      partnerId: partner?.id ?? null,
      fromTool: primarySwitch.fromTool,
      toTool: primarySwitch.toTool,
      description: summary,
      userGoals: input.userGoals?.trim() || null,
      urgency: input.urgency || null,
      requestSource: input.source,
      contextKey,
      switches: switches as never,
      budget: null,
      teamSize: null,
      status: "PENDING",
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (partner) {
    await createNotification({
      recipientId: partner.userId,
      recipientMode: "partner",  // lands in partner's partner inbox
      senderId: user.id,
      senderMode: "user",        // sent by the switcher
      type: "REQUEST_RECEIVED",
      requestId: request.id,
    });
  }

  revalidatePath("/app/requests");
  revalidatePath("/app/leads");
  revalidatePath("/app/notifications");
  revalidatePath("/app/my-stack");
  revalidatePath("/app/partners");
  revalidatePath("/app/feed");

  if (input.partnerUserId) {
    revalidatePath(`/app/profile/${input.partnerUserId}`);
  }

  return {
    created: true,
    requestId: request.id,
    status: request.status,
  };
}

export async function respondToProposal(requestId: string, accept: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const request = await prisma.migrationRequest.findUnique({
    where: { id: requestId },
    include: { partner: { select: { userId: true } } },
  });
  if (!request || request.userId !== session.user.id) throw new Error("Not your request");
  if (request.status !== "PROPOSAL_SENT") throw new Error("No pending proposal");

  if (accept) {
    await prisma.migrationRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });
    if (request.partner) {
      await createNotification({
        recipientId: request.partner.userId,
        recipientMode: "partner",
        senderId: session.user.id,
        senderMode: "user",
        type: "PROPOSAL_ACCEPTED",
        requestId,
      });
    }
  } else {
    // Decline — revert to MATCHED so partner can revise and send a new proposal
    await prisma.migrationRequest.update({
      where: { id: requestId },
      data: { status: "MATCHED", proposal: null },
    });
    if (request.partner) {
      await createNotification({
        recipientId: request.partner.userId,
        recipientMode: "partner",
        senderId: session.user.id,
        senderMode: "user",
        type: "PROPOSAL_DECLINED",
        requestId,
      });
    }
  }

  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/requests");
  revalidatePath(`/app/leads/${requestId}`);
  revalidatePath("/app/leads");
  revalidatePath("/app/notifications");
  return { ok: true };
}
