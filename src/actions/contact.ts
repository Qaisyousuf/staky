"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/* ── Public ────────────────────────────────────────────────────────────────── */

export async function submitContact(data: {
  name: string;
  email: string;
  topic: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.name.trim() || !data.email.trim() || !data.message.trim()) {
      return { success: false, error: "Please fill in all fields." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    await prisma.contactSubmission.create({
      data: {
        name:    data.name.trim(),
        email:   data.email.trim(),
        topic:   data.topic,
        message: data.message.trim(),
      },
    });

    // Notify all admins (raw SQL — bypasses stale Prisma client for new enum value)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    for (const admin of admins) {
      const notifId = randomUUID();
      await prisma.$executeRaw`
        INSERT INTO notifications (id, "recipientId", "recipientMode", "senderMode", type, "read", "createdAt")
        VALUES (
          ${notifId},
          ${admin.id},
          'user',
          'user',
          'CONTACT_RECEIVED'::"NotificationType",
          false,
          NOW()
        )
      `;
    }

    revalidatePath("/app/admin");
    return { success: true };
  } catch (err) {
    console.error("Contact submission error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/* ── Admin ─────────────────────────────────────────────────────────────────── */

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Forbidden");
}

export async function adminGetContactSubmissions() {
  await ensureAdmin();
  return prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function adminMarkContactRead(id: string) {
  await ensureAdmin();
  await prisma.contactSubmission.update({
    where: { id },
    data: { read: true },
  });
  revalidatePath("/app/admin");
}

export async function adminDeleteContact(id: string) {
  await ensureAdmin();
  await prisma.contactSubmission.delete({ where: { id } });
  revalidatePath("/app/admin");
}
