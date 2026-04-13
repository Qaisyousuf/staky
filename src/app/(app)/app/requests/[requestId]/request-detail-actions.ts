"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function cancelMigrationRequest(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, userId: session.user.id },
    select: { id: true },
  });

  if (!request) return;

  await prisma.migrationRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });

  revalidatePath(`/app/requests/${requestId}`);
  revalidatePath("/app/requests");
}

export async function deleteRequest(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const request = await prisma.migrationRequest.findFirst({
    where: { id: requestId, userId: session.user.id },
    select: { id: true },
  });

  if (!request) return;

  await prisma.migrationRequest.delete({ where: { id: requestId } });

  revalidatePath("/app/requests");
  redirect("/app/requests");
}
