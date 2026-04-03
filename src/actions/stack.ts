"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function addStackItem(toolName: string, category?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  // Get or create the user's stack
  let stack = await prisma.stack.findUnique({ where: { userId } });
  if (!stack) {
    stack = await prisma.stack.create({ data: { userId } });
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

  await prisma.stackItem.create({
    data: {
      stackId: stack.id,
      toolName,
      category: category ?? null,
      order: (agg._max.order ?? 0) + 1,
    },
  });

  revalidatePath("/app/my-stack");
  revalidatePath("/app/dashboard");
  return { ok: true };
}

export async function removeStackItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Verify ownership before deleting
  const item = await prisma.stackItem.findFirst({
    where: { id: itemId, stack: { userId: session.user.id } },
  });
  if (!item) throw new Error("Stack item not found");

  await prisma.stackItem.delete({ where: { id: itemId } });

  revalidatePath("/app/my-stack");
  revalidatePath("/app/dashboard");
}
