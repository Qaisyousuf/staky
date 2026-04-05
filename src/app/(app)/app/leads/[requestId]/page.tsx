import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  Zap,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { cn } from "@/lib/utils";
import {
  getRequestStatusMeta,
  type MigrationTask,
  type MigrationProposal,
} from "@/lib/request-utils";
import { RequestTimeline } from "../../requests/[requestId]/request-timeline";
import { RequestConversation } from "../../requests/[requestId]/request-conversation";
import { LeadDetailActions } from "./lead-detail-actions";
import { TaskBoard } from "./task-board";
import { ProjectActivity } from "./project-activity";
import { InvoicePanel } from "./invoice-panel";
import type { InvoiceLineItem } from "@/lib/invoice-utils";

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
  const status = getRequestStatusMeta(request.status as Parameters<typeof getRequestStatusMeta>[0]);
  const tasks = (request.phases as MigrationTask[] | null) ?? [];
  const proposal = request.proposal as MigrationProposal | null;
  const showWorkspace = isOwned && ["ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(request.status);
  const showProposal = isOwned && proposal && ["PROPOSAL_SENT", "ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(request.status);

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const daysSince = Math.floor((Date.now() - request.createdAt.getTime()) / 86400000);
  const etaInfo = request.targetDate ? daysUntil(request.targetDate) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-4">

      {/* ── Banner header ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Top strip */}
        <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-2.5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="font-mono text-[10px] text-gray-300">REQ</span>
            <span className="font-mono text-[11px] font-semibold text-gray-500 tracking-widest">
              #{request.id.slice(-8).toUpperCase()}
            </span>
            <span className="mx-1 text-gray-200">·</span>
            <span>
              Opened{" "}
              {request.createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span
              className={cn(
                "ml-auto inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                status.cls
              )}
            >
              {status.label}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="px-5 py-4">
          {/* Migration path */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <ToolIcon slug={request.fromTool} size="md" />
              <span className="text-sm font-bold text-gray-800">{fromTool?.name ?? request.fromTool}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300" />
            <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2">
              <ToolIcon slug={request.toTool} size="md" />
              <span className="text-sm font-bold text-[#0F6E56]">{toTool?.name ?? request.toTool}</span>
            </div>
            {request.urgency && request.urgency !== "normal" && (
              <span className={cn(
                "ml-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                request.urgency === "urgent" ? "bg-red-50 text-red-600 border border-red-200" : "bg-orange-50 text-orange-600 border border-orange-200"
              )}>
                <AlertTriangle className="h-3 w-3" /> {request.urgency}
              </span>
            )}
          </div>

          {/* Description / goals */}
          {(request.description || request.userGoals) && (
            <div className="mt-3 space-y-1.5">
              {request.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{request.description}</p>
              )}
              {request.userGoals && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Client goals
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">{request.userGoals}</p>
                </div>
              )}
            </div>
          )}

          {/* Stats strip */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2">
              <Clock className="h-4 w-4 shrink-0 text-gray-300" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Age</p>
                <p className="text-sm font-bold tabular-nums text-gray-800">{daysSince}d</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2">
              <Zap className="h-4 w-4 shrink-0 text-gray-300" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Tasks</p>
                <p className="text-sm font-bold tabular-nums text-gray-800">
                  {tasks.length === 0 ? "—" : `${doneTasks}/${tasks.length}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2">
              <MessageSquare className="h-4 w-4 shrink-0 text-gray-300" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Messages</p>
                <p className="text-sm font-bold tabular-nums text-gray-800">{request.messages.length}</p>
              </div>
            </div>

            <div className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2",
              etaInfo?.overdue ? "border-red-100 bg-red-50" : etaInfo ? "border-green-100 bg-green-50" : "border-gray-100"
            )}>
              <CalendarDays className={cn("h-4 w-4 shrink-0", etaInfo?.overdue ? "text-red-400" : etaInfo ? "text-[#0F6E56]" : "text-gray-300")} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">ETA</p>
                <p className={cn("text-sm font-bold", etaInfo?.overdue ? "text-red-600" : etaInfo ? "text-[#0F6E56]" : "text-gray-400")}>
                  {etaInfo?.label ?? "Not set"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <RequestTimeline status={request.status as Parameters<typeof getRequestStatusMeta>[0]} />

      {/* ── Proposal ── */}
      {showProposal && (
        <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Send className="h-4 w-4 text-violet-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
              Your proposal
            </p>
            <span className="ml-auto font-mono text-[11px] text-violet-400">
              {new Date(proposal!.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {proposal!.timeline && (
              <div className="rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Timeline</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">{proposal!.timeline}</p>
              </div>
            )}
            {proposal!.budgetRange && (
              <div className="rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Budget range</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">{proposal!.budgetRange}</p>
              </div>
            )}
          </div>
          {proposal!.approach && (
            <div className="mt-2 rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Approach</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{proposal!.approach}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <LeadDetailActions requestId={request.id} status={request.status} isOwned={isOwned} />
      </div>

      {/* ── Workspace: 2-column ── */}
      {showWorkspace ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          {/* Left: tasks */}
          <TaskBoard
            requestId={request.id}
            tasks={tasks}
            readonly={request.status === "COMPLETED"}
          />

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Client */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Client
              </p>
              <div className="flex items-start gap-3">
                {request.user.image ? (
                  <Image
                    src={request.user.image}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#2A5FA5]">
                    {request.user.name?.[0] ?? "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{request.user.name ?? "Unknown"}</p>
                  <div className="mt-1 space-y-0.5 text-[11px] text-gray-400">
                    <a href={`mailto:${request.user.email}`} className="flex items-center gap-1 hover:text-[#2A5FA5] transition-colors">
                      <Mail className="h-3 w-3" /> {request.user.email}
                    </a>
                    {request.user.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {request.user.company}
                      </span>
                    )}
                    {request.user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {request.user.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity */}
            <ProjectActivity
              request={{
                createdAt: request.createdAt,
                updatedAt: request.updatedAt,
                status: request.status,
                tasks,
                proposal,
                messages: request.messages,
              }}
              partnerName={partner.companyName}
              clientName={request.user.name ?? "Client"}
            />
          </div>
        </div>
      ) : (
        /* Pre-workspace: just client info */
        isOwned && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Client</p>
            <div className="flex items-start gap-3">
              {request.user.image ? (
                <Image src={request.user.image} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#2A5FA5]">
                  {request.user.name?.[0] ?? "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{request.user.name ?? "Unknown"}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                  <a href={`mailto:${request.user.email}`} className="flex items-center gap-1 hover:text-[#2A5FA5]">
                    <Mail className="h-3.5 w-3.5" /> {request.user.email}
                  </a>
                  {request.user.company && (
                    <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {request.user.company}</span>
                  )}
                  {request.user.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {request.user.location}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* ── Invoice ── */}
      {isOwned && showWorkspace && (
        <InvoicePanel
          requestId={request.id}
          partnerId={partner.id}
          clientId={request.userId}
          requestRef={`REQ #${request.id.slice(-8).toUpperCase()}`}
          fromToolName={fromTool?.name ?? request.fromTool}
          toToolName={toTool?.name ?? request.toTool}
          invoice={
            latestInvoice
              ? {
                  id: latestInvoice.id,
                  invoiceNumber: latestInvoice.invoiceNumber,
                  status: latestInvoice.status as "DRAFT" | "SENT" | "VIEWED" | "PAID" | "CANCELLED",
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
              : null
          }
        />
      )}

      {/* ── Conversation ── */}
      {isOwned && (
        <RequestConversation
          requestId={request.id}
          currentUserId={session.user.id}
          initialMessages={request.messages}
        />
      )}
    </div>
  );
}
