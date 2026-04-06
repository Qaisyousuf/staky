import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOOLS } from "@/data/mock-data";
import { getRequestStatusMeta, type MigrationTask, type MigrationProposal } from "@/lib/request-utils";
import { markInvoiceViewed } from "@/actions/invoice";
import type { InvoiceLineItem, InvoiceStatusType } from "@/lib/invoice-utils";
import type { ConfigItem } from "@/lib/config-templates";
import { RequestDetailView } from "./request-detail-view";

export default async function RequestDetailPage({
  params,
}: {
  params: { requestId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const request = await prisma.migrationRequest.findUnique({
    where: { id: params.requestId },
    include: {
      partner: {
        select: {
          id: true,
          companyName: true,
          logoUrl: true,
          country: true,
          website: true,
          userId: true,
        },
      },
      messages: {
        include: { sender: { select: { id: true, name: true, image: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request || request.userId !== session.user.id) notFound();

  const invoice = await prisma.invoice.findFirst({
    where: { requestId: params.requestId },
    orderBy: { createdAt: "desc" },
  });

  // Auto-mark viewed when client opens the page
  if (invoice?.status === "SENT") {
    await markInvoiceViewed(invoice.id);
  }

  const fromTool = TOOLS[request.fromTool];
  const toTool = TOOLS[request.toTool];
  const status = getRequestStatusMeta(request.status as Parameters<typeof getRequestStatusMeta>[0]);
  const tasks = (request.phases as MigrationTask[] | null) ?? [];
  const proposal = request.proposal as MigrationProposal | null;

  const requestRef = `REQ #${params.requestId.slice(-8).toUpperCase()}`;

  return (
    <RequestDetailView
      requestId={request.id}
      currentUserId={session.user.id}
      requestRef={requestRef}
      fromTool={request.fromTool}
      toTool={request.toTool}
      fromToolName={fromTool?.name ?? request.fromTool}
      toToolName={toTool?.name ?? request.toTool}
      status={request.status}
      statusCls={status.cls}
      statusLabel={status.label}
      urgency={request.urgency}
      description={request.description}
      userGoals={request.userGoals}
      createdAt={request.createdAt.toISOString()}
      targetDate={request.targetDate?.toISOString() ?? null}
      tasks={tasks}
      proposal={proposal}
      configItems={request.configItems ? (request.configItems as unknown as ConfigItem[]) : null}
      configSentAt={request.configSentAt?.toISOString() ?? null}
      invoice={
        invoice && invoice.status !== "DRAFT" && invoice.status !== "CANCELLED"
          ? {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status as InvoiceStatusType,
              lineItems: invoice.lineItems as unknown as InvoiceLineItem[],
              subtotal: invoice.subtotal,
              taxPercent: invoice.taxPercent,
              total: invoice.total,
              currency: invoice.currency,
              dueDate: invoice.dueDate?.toISOString() ?? null,
              notes: invoice.notes,
              sentAt: invoice.sentAt?.toISOString() ?? null,
              paidAt: invoice.paidAt?.toISOString() ?? null,
            }
          : null
      }
      messages={request.messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        senderId: m.senderId,
        sender: {
          id: m.sender.id,
          name: m.sender.name,
          image: m.sender.image,
          role: m.sender.role,
        },
      }))}
      partner={
        request.partner
          ? {
              companyName: request.partner.companyName,
              country: request.partner.country,
              website: request.partner.website,
            }
          : null
      }
      canCancel={["PENDING", "UNDER_REVIEW"].includes(request.status)}
    />
  );
}
