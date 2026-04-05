import { redirect, notFound } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, Globe, Send, Terminal, Timer, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { cn } from "@/lib/utils";
import {
  getRequestStatusMeta,
  type MigrationTask,
  type MigrationProposal,
  type TaskPriority,
} from "@/lib/request-utils";

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-500 border-gray-200",
  medium: "bg-blue-50 text-[#2A5FA5] border-blue-200",
  high: "bg-orange-50 text-orange-600 border-orange-200",
  urgent: "bg-red-50 text-red-600 border-red-200",
};
import { RequestConversation } from "./request-conversation";
import { RequestTimeline } from "./request-timeline";
import { ProposalActions } from "./proposal-actions";
import { ShareExperienceTrigger } from "@/components/shared/share-experience-trigger";
import { InvoiceView } from "./invoice-view";
import { ConfigForm } from "./config-form";
import { markInvoiceViewed } from "@/actions/invoice";
import type { InvoiceLineItem } from "@/lib/invoice-utils";
import type { InvoiceStatusType } from "@/lib/invoice-utils";
import type { ConfigItem } from "@/lib/config-templates";

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
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Header */}
      <div className="rounded-[24px] border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <ToolIcon slug={request.fromTool} size="md" />
          <ArrowRight className="h-4 w-4 text-gray-300" />
          <ToolIcon slug={request.toTool} size="md" />
          <span className="text-sm font-semibold text-gray-900">
            {fromTool?.name ?? request.fromTool} → {toTool?.name ?? request.toTool}
          </span>
          <span
            className={`ml-auto inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${status.cls}`}
          >
            {status.label}
          </span>
        </div>

        {request.description && (
          <p className="text-sm text-gray-700 leading-relaxed">{request.description}</p>
        )}

        {request.userGoals && (
          <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Goals &amp; context
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{request.userGoals}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {request.urgency && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Urgency
              </p>
              <p className="mt-0.5 text-xs font-medium capitalize text-gray-700">
                {request.urgency}
              </p>
            </div>
          )}
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Submitted
            </p>
            <p className="mt-0.5 text-xs font-medium text-gray-700">
              {request.createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          {request.targetDate && (
            <div className="rounded-xl border border-green-100 bg-green-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-green-600">
                Target completion
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[#0F6E56]">
                <CalendarDays className="h-3 w-3" />
                {request.targetDate.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status timeline */}
      <RequestTimeline status={request.status as Parameters<typeof getRequestStatusMeta>[0]} />

      {/* Proposal from partner */}
      {proposal && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Send className="h-4 w-4 text-violet-500" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-600">
              Partner proposal
            </p>
            <span className="ml-auto text-[11px] text-gray-400">
              {new Date(proposal.sentAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <div className="space-y-2.5">
            {proposal.timeline && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  Estimated timeline
                </p>
                <p className="text-sm font-medium text-gray-800">{proposal.timeline}</p>
              </div>
            )}
            {proposal.approach && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  Approach
                </p>
                <p className="text-sm leading-relaxed text-gray-800">{proposal.approach}</p>
              </div>
            )}
            {proposal.budgetRange && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  Budget range
                </p>
                <p className="text-sm font-semibold text-gray-800">{proposal.budgetRange}</p>
              </div>
            )}
          </div>
          {request.status === "PROPOSAL_SENT" && (
            <ProposalActions requestId={request.id} />
          )}
        </div>
      )}

      {/* Migration tasks — read-only for client */}
      {tasks.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-4">
            {/* Progress ring */}
            {(() => {
              const pct = Math.round((doneCount / tasks.length) * 100);
              const r = 20; const circ = 2 * Math.PI * r;
              const color = pct === 100 ? "#0F6E56" : "#2A5FA5";
              return (
                <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0 -rotate-90">
                  <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
                  <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="5"
                    strokeLinecap="round" strokeDasharray={circ}
                    strokeDashoffset={circ * (1 - pct / 100)} />
                  <text x="26" y="26" dominantBaseline="central" textAnchor="middle"
                    fontSize="10" fontWeight="800" fill={color}
                    style={{ transform: "rotate(90deg)", transformOrigin: "26px 26px" }}>
                    {pct}%
                  </text>
                </svg>
              );
            })()}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">Migration Progress</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {doneCount} of {tasks.length} tasks completed by your partner
              </p>
            </div>
            {/* Status summary */}
            <div className="hidden sm:flex items-center gap-3 text-xs">
              {[
                { label: "Todo", count: tasks.filter(t => t.status === "todo").length, cls: "text-gray-500" },
                { label: "Active", count: tasks.filter(t => t.status === "in_progress").length, cls: "text-[#2A5FA5]" },
                { label: "Done", count: doneCount, cls: "text-[#0F6E56]" },
              ].map(({ label, count, cls }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className={cn("font-bold tabular-nums", cls)}>{count}</span>
                  <span className="text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full bg-gray-100">
            <div
              className="h-full bg-[#0F6E56] transition-all duration-500"
              style={{ width: `${Math.round((doneCount / tasks.length) * 100)}%` }}
            />
          </div>

          {/* Task rows */}
          <div className="divide-y divide-gray-50">
            {[...tasks.filter(t => t.status === "in_progress"), ...tasks.filter(t => t.status === "todo"), ...tasks.filter(t => t.status === "done")].map((task) => {
              const priorityMeta = task.priority ? PRIORITY_BADGE[task.priority as TaskPriority] : null;
              const statusPill =
                task.status === "done"
                  ? "bg-green-50 text-[#0F6E56] border-green-200"
                  : task.status === "in_progress"
                  ? "bg-blue-50 text-[#2A5FA5] border-blue-200"
                  : "bg-gray-100 text-gray-500 border-gray-200";
              const statusLabel =
                task.status === "done" ? "Done"
                : task.status === "in_progress" ? "In Progress"
                : "Todo";

              return (
                <div key={task.id} className="px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      task.status === "done"
                        ? "border-[#0F6E56] bg-[#0F6E56] text-white"
                        : task.status === "in_progress"
                        ? "border-[#2A5FA5]"
                        : "border-gray-300"
                    )}>
                      {task.status === "done" && <Check className="h-3 w-3" />}
                      {task.status === "in_progress" && <span className="h-2 w-2 rounded-full bg-[#2A5FA5]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Title + priority */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn(
                          "text-sm font-semibold",
                          task.status === "done" ? "text-gray-400 line-through" : "text-gray-800"
                        )}>
                          {task.title}
                        </span>
                        {priorityMeta && task.status !== "done" && (
                          <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold capitalize", priorityMeta)}>
                            {task.priority}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{task.description}</p>
                      )}

                      {/* Meta strip */}
                      {(task.estimatedTime || (task.status === "done" && task.completedAt)) && (
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          {task.estimatedTime && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Timer className="h-3 w-3" /> {task.estimatedTime}
                            </span>
                          )}
                          {task.status === "done" && task.completedAt && (
                            <span className="flex items-center gap-1 text-[11px] text-[#0F6E56]">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed {new Date(task.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tech note */}
                      {task.techNote && (
                        <div className="mt-2 flex items-start gap-2 rounded-xl border border-gray-700/20 bg-gray-950 px-3 py-2">
                          <Terminal className="mt-0.5 h-3 w-3 shrink-0 text-green-400" />
                          <code className="font-mono text-[11px] leading-relaxed text-green-300 break-all">
                            {task.techNote}
                          </code>
                        </div>
                      )}
                    </div>

                    {/* Status pill */}
                    <span className={cn(
                      "shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold",
                      statusPill
                    )}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Config form — only when partner has sent a config request */}
      {request.configSentAt && request.configItems && (
        <ConfigForm
          requestId={request.id}
          fromToolName={fromTool?.name ?? request.fromTool}
          toToolName={toTool?.name ?? request.toTool}
          configItems={request.configItems as ConfigItem[]}
          configSentAt={request.configSentAt.toISOString()}
        />
      )}

      {/* Invoice — only show if sent/viewed/paid (not draft) */}
      {invoice && invoice.status !== "DRAFT" && invoice.status !== "CANCELLED" && request.partner && (
        <InvoiceView
          invoice={{
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
          }}
          requestRef={`REQ #${params.requestId.slice(-8).toUpperCase()}`}
          fromToolName={fromTool?.name ?? request.fromTool}
          toToolName={toTool?.name ?? request.toTool}
          partnerName={request.partner.companyName}
          partnerCountry={request.partner.country}
          clientName={session.user.name ?? "Client"}
          clientEmail={session.user.email ?? ""}
          clientCompany={null}
        />
      )}

      {/* Partner info */}
      {request.partner ? (
        <div className="rounded-[22px] border border-blue-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Assigned partner
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <BriefcaseBusiness className="h-5 w-5 text-[#2A5FA5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {request.partner.companyName}
              </p>
              {request.partner.country && (
                <p className="text-xs text-gray-400">{request.partner.country}</p>
              )}
            </div>
            {request.partner.website && (
              <a
                href={
                  request.partner.website.startsWith("http")
                    ? request.partner.website
                    : `https://${request.partner.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs text-[#2A5FA5] hover:underline"
              >
                <Globe className="h-3.5 w-3.5" /> Website
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-[22px] border border-gray-200 bg-gray-50 p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Your request is open and will be matched with a qualified partner shortly.
          </p>
        </div>
      )}

      {/* Share experience — only when completed */}
      {request.status === "COMPLETED" && request.partner && (
        <ShareExperienceTrigger
          fromTool={request.fromTool}
          toTool={request.toTool}
          fromToolName={fromTool?.name ?? request.fromTool}
          toToolName={toTool?.name ?? request.toTool}
          partnerName={request.partner.companyName}
          context={request.userGoals ?? request.description ?? null}
          isPartnerMode={false}
        />
      )}

      {/* Cancel button (only if not yet assigned) */}
      {["PENDING", "UNDER_REVIEW"].includes(request.status) && (
        <CancelRequestButton requestId={request.id} />
      )}

      {/* Conversation — only if partner is assigned */}
      {request.partner && (
        <RequestConversation
          requestId={request.id}
          currentUserId={session.user.id}
          initialMessages={request.messages}
        />
      )}
    </div>
  );
}

function CancelRequestButton({ requestId }: { requestId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        const { auth } = await import("@/lib/auth");
        const { prisma } = await import("@/lib/prisma");
        const { revalidatePath } = await import("next/cache");
        const session = await auth();
        if (!session?.user?.id) return;
        const req = await prisma.migrationRequest.findFirst({
          where: { id: requestId, userId: session.user.id },
        });
        if (!req) return;
        await prisma.migrationRequest.update({
          where: { id: requestId },
          data: { status: "CANCELLED" },
        });
        revalidatePath(`/app/requests/${requestId}`);
        revalidatePath("/app/requests");
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
      >
        <XCircle className="h-3.5 w-3.5" /> Cancel request
      </button>
    </form>
  );
}
