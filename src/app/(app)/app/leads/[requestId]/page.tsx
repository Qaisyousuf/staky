import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOOLS } from "@/data/mock-data";
import { getRequestStatusMeta, type MigrationTask, type MigrationProposal } from "@/lib/request-utils";
import { LeadDetailView } from "./lead-detail-view";
import type { SerializedInvoice, SerializedMessage } from "./lead-detail-view";
import type { InvoiceLineItem } from "@/lib/invoice-utils";
import type { ConfigItem } from "@/lib/config-templates";

function daysUntil(date: Date) {
  const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: "Due today", overdue: false };
  return { label: `${diff}d left`, overdue: false };
}

export default async function LeadDetailPage({
  params,
}: {
  params: { requestId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") redirect("/app/dashboard");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) redirect("/app/dashboard");

  const request = await prisma.migrationRequest.findUnique({
    where: { id: params.requestId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, company: true, location: true },
      },
      messages: {
        include: { sender: { select: { id: true, name: true, image: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) notFound();
  const isOwned = request.partnerId === partner.id;
  const isOpen = request.status === "PENDING" && !request.partnerId;
  if (!isOwned && !isOpen) notFound();

  const latestInvoice = isOwned
    ? await prisma.invoice.findFirst({
        where: { requestId: params.requestId },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const fromTool = TOOLS[request.fromTool];
  const toTool = TOOLS[request.toTool];
  const statusMeta = getRequestStatusMeta(request.status as Parameters<typeof getRequestStatusMeta>[0]);
  const tasks = (request.phases as MigrationTask[] | null) ?? [];
  const proposal = request.proposal as MigrationProposal | null;
  const showWorkspace = isOwned && ["ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(request.status);
  const showProposal = isOwned && !!proposal && ["PROPOSAL_SENT", "ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(request.status);

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const daysSince = Math.floor((Date.now() - request.createdAt.getTime()) / 86400000);
  const etaInfo = request.targetDate ? daysUntil(request.targetDate) : null;

  // Serialize invoice
  const invoice: SerializedInvoice | null = latestInvoice
    ? {
        id: latestInvoice.id,
        invoiceNumber: latestInvoice.invoiceNumber,
        status: latestInvoice.status as SerializedInvoice["status"],
        lineItems: latestInvoice.lineItems as unknown as InvoiceLineItem[],
        subtotal: latestInvoice.subtotal,
        taxPercent: latestInvoice.taxPercent,
        total: latestInvoice.total,
        currency: latestInvoice.currency,
        dueDate: latestInvoice.dueDate?.toISOString() ?? null,
        notes: latestInvoice.notes,
        sentAt: latestInvoice.sentAt?.toISOString() ?? null,
        paidAt: latestInvoice.paidAt?.toISOString() ?? null,
      }
    : null;

  // Serialize messages
  const messages: SerializedMessage[] = request.messages.map((m) => ({
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
  }));

  return (
    <LeadDetailView
      // IDs
      requestId={request.id}
      partnerId={partner.id}
      clientId={request.userId}
      currentUserId={session.user.id}
      // Meta
      fromTool={request.fromTool}
      toTool={request.toTool}
      fromToolName={fromTool?.name ?? request.fromTool}
      toToolName={toTool?.name ?? request.toTool}
      requestRef={`REQ #${request.id.slice(-8).toUpperCase()}`}
      status={request.status}
      statusCls={statusMeta.cls}
      urgency={request.urgency ?? null}
      description={request.description ?? null}
      userGoals={request.userGoals ?? null}
      createdAt={request.createdAt.toISOString()}
      updatedAt={request.updatedAt.toISOString()}
      targetDate={request.targetDate?.toISOString() ?? null}
      // Flags
      isOwned={isOwned}
      showWorkspace={showWorkspace}
      showProposal={showProposal}
      // Computed
      daysSince={daysSince}
      doneTasks={doneTasks}
      totalTasks={tasks.length}
      messageCount={request.messages.length}
      etaInfo={etaInfo}
      // Content
      tasks={tasks}
      proposal={proposal}
      configItems={(request.configItems as ConfigItem[] | null) ?? null}
      configSentAt={request.configSentAt?.toISOString() ?? null}
      invoice={invoice}
      messages={messages}
      // People
      client={{
        name: request.user.name,
        email: request.user.email ?? "",
        image: request.user.image,
        company: request.user.company,
        location: request.user.location,
      }}
      partnerCompanyName={partner.companyName}
    />
  );
}
