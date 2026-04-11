"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/* ── Public ──────────────────────────────────────────────────────────────── */

export async function getPublishedJobs() {
  return prisma.jobPosting.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublishedJob(id: string) {
  return prisma.jobPosting.findFirst({
    where: { id, published: true },
  });
}

export async function submitJobApplication(data: {
  jobId: string;
  name: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  portfolioUrl: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.name.trim() || !data.email.trim()) {
      return { success: false, error: "Please fill in all required fields." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const job = await prisma.jobPosting.findFirst({
      where: { id: data.jobId, published: true },
      select: { id: true, title: true },
    });
    if (!job) return { success: false, error: "This position is no longer available." };

    await prisma.jobApplication.create({
      data: {
        jobId:        data.jobId,
        name:         data.name.trim(),
        email:        data.email.trim(),
        phone:        data.phone.trim() || null,
        linkedinUrl:  data.linkedinUrl.trim() || null,
        portfolioUrl: data.portfolioUrl.trim() || null,
        message:      data.message.trim() || null,
      },
    });

    // Notify all admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    for (const admin of admins) {
      const notifId = randomUUID();
      await prisma.$executeRaw`
        INSERT INTO notifications (id, "recipientId", "recipientMode", "senderMode", type, "read", "createdAt")
        VALUES (
          ${notifId}, ${admin.id}, 'user', 'user',
          'JOB_APPLICATION_RECEIVED'::"NotificationType",
          false, NOW()
        )
      `;
    }

    revalidatePath("/app/admin");
    return { success: true };
  } catch (err) {
    console.error("Job application error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/* ── Admin ───────────────────────────────────────────────────────────────── */

async function ensureAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") throw new Error("Forbidden");
}

export async function adminGetJobs() {
  await ensureAdmin();
  return prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
}

export async function adminGetApplications(jobId?: string) {
  await ensureAdmin();
  return prisma.jobApplication.findMany({
    where: jobId ? { jobId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { job: { select: { title: true } } },
  });
}

export type JobFormData = {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  published: boolean;
};

export async function adminCreateJob(data: JobFormData) {
  await ensureAdmin();
  await prisma.jobPosting.create({
    data: {
      title:       data.title.trim(),
      department:  data.department.trim(),
      location:    data.location.trim(),
      type:        data.type,
      description: data.description.trim(),
      published:   data.published,
    },
  });
  revalidatePath("/careers");
  revalidatePath("/app/admin");
}

export async function adminUpdateJob(id: string, data: JobFormData) {
  await ensureAdmin();
  await prisma.jobPosting.update({
    where: { id },
    data: {
      title:       data.title.trim(),
      department:  data.department.trim(),
      location:    data.location.trim(),
      type:        data.type,
      description: data.description.trim(),
      published:   data.published,
    },
  });
  revalidatePath("/careers");
  revalidatePath(`/careers/${id}`);
  revalidatePath("/app/admin");
}

export async function adminToggleJobPublished(id: string, published: boolean) {
  await ensureAdmin();
  await prisma.jobPosting.update({ where: { id }, data: { published } });
  revalidatePath("/careers");
  revalidatePath("/app/admin");
}

export async function adminDeleteJob(id: string) {
  await ensureAdmin();
  await prisma.jobPosting.delete({ where: { id } });
  revalidatePath("/careers");
  revalidatePath("/app/admin");
}

export async function adminDeleteApplication(id: string) {
  await ensureAdmin();
  await prisma.jobApplication.delete({ where: { id } });
  revalidatePath("/app/admin");
}
