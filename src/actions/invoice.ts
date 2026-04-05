"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import type { InvoiceLineItem } from "@/lib/invoice-utils";
import { calcTotals } from "@/lib/invoice-utils";

export async function createInvoice(
  requestId: string,
  data: {
    lineItems: InvoiceLineItem[];
    taxPercent: number;
    currency: string;
    dueDate?: string | null;
    notes?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const request = await prisma.migrationRequest.findUnique({ where: { id: requestId } });
  if (!request || request.partnerId !== partner.id) throw new Error("Not authorized");

  const { subtotal, total } = calcTotals(data.lineItems, data.taxPercent);

  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({ where: { partnerId: partner.id } });
  const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      requestId,
      partnerId: partner.id,
      clientId: request.userId,
      lineItems: data.lineItems as object[],
      subtotal,
      taxPercent: data.taxPercent,
      total,
      currency: data.currency,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes ?? null,
      status: "DRAFT",
    },
  });

  revalidatePath(`/app/leads/${requestId}`);
  return { success: true, invoice };
}

export async function updateInvoice(
  invoiceId: string,
  data: {
    lineItems: InvoiceLineItem[];
    taxPercent: number;
    currency: string;
    dueDate?: string | null;
    notes?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.partnerId !== partner.id) throw new Error("Not authorized");
  if (invoice.status !== "DRAFT") throw new Error("Can only edit DRAFT invoices");

  const { subtotal, total } = calcTotals(data.lineItems, data.taxPercent);

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      lineItems: data.lineItems as object[],
      subtotal,
      taxPercent: data.taxPercent,
      total,
      currency: data.currency,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes ?? null,
    },
  });

  revalidatePath(`/app/leads/${invoice.requestId}`);
  return { success: true, invoice: updated };
}

export async function sendInvoice(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.partnerId !== partner.id) throw new Error("Not authorized");
  if (invoice.status !== "DRAFT") throw new Error("Invoice already sent");

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "SENT", sentAt: new Date() },
  });

  await createNotification({
    type: "INVOICE_SENT",
    recipientId: invoice.clientId,
    recipientMode: "user",
    senderId: session.user.id,
    senderMode: "partner",
    requestId: invoice.requestId,
  });

  revalidatePath(`/app/leads/${invoice.requestId}`);
  revalidatePath(`/app/requests/${invoice.requestId}`);
  return { success: true, invoice: updated };
}

export async function markInvoiceViewed(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.clientId !== session.user.id) throw new Error("Not authorized");
  if (invoice.status !== "SENT") return { success: true }; // already viewed/paid

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "VIEWED" },
  });

  revalidatePath(`/app/requests/${invoice.requestId}`);
  revalidatePath(`/app/leads/${invoice.requestId}`);
  return { success: true };
}

export async function markInvoicePaid(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) throw new Error("Not a partner");

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.partnerId !== partner.id) throw new Error("Not authorized");
  if (!["SENT", "VIEWED"].includes(invoice.status)) throw new Error("Invoice not in payable state");

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
  });

  // Notify client that partner confirmed payment
  await createNotification({
    type: "INVOICE_PAID",
    recipientId: invoice.clientId,
    recipientMode: "user",
    senderId: session.user.id,
    senderMode: "partner",
    requestId: invoice.requestId,
  });

  revalidatePath(`/app/leads/${invoice.requestId}`);
  revalidatePath(`/app/requests/${invoice.requestId}`);
  return { success: true, invoice: updated };
}

export async function clientConfirmPayment(invoiceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.clientId !== session.user.id) throw new Error("Not authorized");
  if (!["SENT", "VIEWED"].includes(invoice.status)) throw new Error("Invoice already settled");

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
  });

  // Notify partner that client confirmed payment
  const partner = await prisma.partner.findUnique({ where: { id: invoice.partnerId } });
  if (partner) {
    await createNotification({
      type: "INVOICE_PAID",
      recipientId: partner.userId,
      recipientMode: "partner",
      senderId: session.user.id,
      senderMode: "user",
      requestId: invoice.requestId,
    });
  }

  revalidatePath(`/app/requests/${invoice.requestId}`);
  revalidatePath(`/app/leads/${invoice.requestId}`);
  return { success: true, invoice: updated };
}
