"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function addStackItem(toolName: string, category?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;
  // Always read from DB — JWT activeMode can lag after a mode switch
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { activeMode: true } });
  const mode = dbUser?.activeMode ?? "user";

  // Get or create the user's stack for this mode
  let stack = await prisma.stack.findUnique({ where: { userId_mode: { userId, mode } } });
  if (!stack) {
    stack = await prisma.stack.create({ data: { userId, mode } });
  }

  // Prevent duplicates (case-insensitive)
  const existing = await prisma.stackItem.findFirst({
    where: {
      stackId: stack.id,
      toolName: { equals: toolName, mode: "insensitive" },
    },
  });
  if (existing) return { ok: true, duplicate: true };

  const agg = await prisma.stackItem.aggregate({
    where: { stackId: stack.id },
    _max: { order: true },
  });

  const item = await prisma.stackItem.create({
    data: {
      stackId: stack.id,
      toolName,
      category: category ?? null,
      order: (agg._max.order ?? 0) + 1,
    },
  });

  revalidatePath("/app/my-stack");
  revalidatePath("/app/dashboard");
  return { ok: true, id: item.id };
}

export async function removeStackItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { activeMode: true } });
  const mode = dbUser?.activeMode ?? "user";

  // Verify ownership before deleting (scoped to active mode)
  const item = await prisma.stackItem.findFirst({
    where: { id: itemId, stack: { userId: session.user.id, mode } },
  });
  if (!item) throw new Error("Stack item not found");

  await prisma.stackItem.delete({ where: { id: itemId } });

  revalidatePath("/app/my-stack");
  revalidatePath("/app/dashboard");
}
