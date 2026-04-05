import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock,
  Inbox,
  MapPin,
  MessageSquare,
  PlayCircle,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { LeadActions } from "./lead-actions";
import {
  getRequestSourceLabel,
  getRequestStatusMeta,
  type MigrationPhase,
  type RequestSwitch,
} from "@/lib/request-utils";

export const metadata = { title: "Leads — Staky" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function MigrationPath({ fromTool, toTool }: { fromTool: string; toTool: string }) {
  const from = TOOLS[fromTool];
  const to = TOOLS[toTool];
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <ToolIcon slug={fromTool} size="sm" />
      <span className="text-xs font-medium text-gray-700 truncate">{from?.name ?? fromTool}</span>
      <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
      <ToolIcon slug={toTool} size="sm" />
      <span className="text-xs font-semibold text-[#0F6E56] truncate">{to?.name ?? toTool}</span>
    </div>
  );
}

function SwitchStack({ switches }: { switches: RequestSwitch[] }) {
  if (switches.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {switches.slice(0, 5).map((item) => {
        const from = TOOLS[item.fromTool];
        const to = TOOLS[item.toTool];
        return (
          <span
            key={`${item.fromTool}-${item.toTool}`}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600 font-mono"
          >
            <ToolIcon slug={item.fromTool} size="sm" />
            {from?.name ?? item.fromTool}
            <ArrowRight className="h-2.5 w-2.5 text-gray-300" />
            <ToolIcon slug={item.toTool} size="sm" />
            <span className="font-semibold text-[#0F6E56]">{to?.name ?? item.toTool}</span>
          </span>
        );
      })}
      {switches.length > 5 && (
        <span className="inline-flex items-center rounded-md border border-dashed border-gray-200 px-2 py-0.5 text-[11px] text-gray-400">
          +{switches.length - 5} more
        </span>
      )}
    </div>
  );
}

// ─── Assigned lead card ───────────────────────────────────────────────────────

const STATUS_BORDER: Record<string, string> = {
  PENDING:       "border-l-amber-400",
  UNDER_REVIEW:  "border-l-orange-400",
  MATCHED:       "border-l-purple-400",
  PROPOSAL_SENT: "border-l-violet-400",
  ACCEPTED:      "border-l-[#2A5FA5]",
  IN_PROGRESS:   "border-l-[#0F6E56]",
  COMPLETED:     "border-l-gray-300",
  CANCELLED:     "border-l-red-300",
};

function AssignedLeadCard({
  request,
}: {
  request: {
    id: string;
    fromTool: string;
    toTool: string;
    description: string | null;
    requestSource: string | null;
    urgency: string | null;
    targetDate: Date | null;
    phases: MigrationPhase[] | null;
    status: "PENDING" | "UNDER_REVIEW" | "MATCHED" | "PROPOSAL_SENT" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; name: string | null; company: string | null; email: string; location: string | null };
    switches: RequestSwitch[];
  };
}) {
  const status = getRequestStatusMeta(request.status);
  const borderColor = STATUS_BORDER[request.status] ?? "border-l-gray-200";

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-gray-200 border-l-[3px] bg-white shadow-sm transition-shadow hover:shadow-md",
        borderColor
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Migration path */}
          <MigrationPath fromTool={request.fromTool} toTool={request.toTool} />

          {/* Client info row */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
            {request.user.name && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 text-gray-400" />
                <span className="font-medium text-gray-700">{request.user.name}</span>
              </span>
            )}
            {request.user.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-gray-400" />
                {request.user.company}
              </span>
            )}
            {request.user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                {request.user.location}
              </span>
            )}
            {request.requestSource && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
                {getRequestSourceLabel(request.requestSource)}
              </span>
            )}
          </div>
        </div>

        {/* Right meta */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", status.cls)}>
            {status.label}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <Clock className="h-3 w-3" />
            {timeAgo(request.updatedAt)}
          </span>
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <div className="mx-5 mb-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
          <p className="text-xs leading-relaxed text-gray-600 line-clamp-2">{request.description}</p>
        </div>
      )}

      {/* Switch stack */}
      {request.switches.length > 0 && (
        <div className="px-5 pb-3">
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            <Sparkles className="h-3 w-3" /> Migration scope
          </p>
          <SwitchStack switches={request.switches} />
        </div>
      )}

      {/* Phase progress */}
      {request.phases && request.phases.length > 0 && (
        <div className="px-5 pb-3">
          {(() => {
            const done = request.phases!.filter((p) => p.done).length;
            const total = request.phases!.length;
            const pct = Math.round((done / total) * 100);
            return (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#0F6E56] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-gray-500">
                  {done}/{total} phases
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Target date */}
      {request.targetDate && (
        <div className="px-5 pb-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-[#0F6E56] font-medium">
            <CalendarDays className="h-3 w-3" />
            Target:{" "}
            {request.targetDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      )}

      {/* Contact + urgency */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-2.5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-gray-400">{request.user.email}</span>
          {request.urgency && (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              request.urgency === "urgent" ? "bg-red-50 text-red-600" :
              request.urgency === "high" ? "bg-orange-50 text-orange-600" :
              "bg-gray-100 text-gray-500"
            )}>
              {request.urgency === "urgent" && <AlertTriangle className="h-2.5 w-2.5" />}
              {request.urgency}
            </span>
          )}
        </div>
        <Link
          href={`/app/leads/${request.id}`}
          className="flex items-center gap-1 text-[11px] font-medium text-[#2A5FA5] hover:underline"
        >
          <MessageSquare className="h-3.5 w-3.5" /> Open
        </Link>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 px-5 py-3">
        <LeadActions requestId={request.id} status={request.status} isOwned />
      </div>
    </div>
  );
}

// ─── Open request row ─────────────────────────────────────────────────────────

function OpenRequestRow({
  request,
}: {
  request: {
    id: string;
    fromTool: string;
    toTool: string;
    description: string | null;
    requestSource: string | null;
    urgency: string | null;
    createdAt: Date;
    user: { id: string; name: string | null; company: string | null; location: string | null; email: string };
    switches: RequestSwitch[];
  };
}) {
  return (
    <div className="group flex items-center gap-4 border-b border-gray-50 px-5 py-3.5 last:border-0 hover:bg-gray-50/60 transition-colors">
      {/* Migration path */}
      <div className="w-48 shrink-0">
        <MigrationPath fromTool={request.fromTool} toTool={request.toTool} />
      </div>

      {/* Client */}
      <div className="min-w-0 flex-1 flex items-center gap-3 text-[11px] text-gray-500">
        {request.user.name ? (
          <span className="flex items-center gap-1 font-medium text-gray-700 truncate">
            <User className="h-3 w-3 text-gray-400 shrink-0" />
            {request.user.name}
          </span>
        ) : (
          <span className="text-gray-400 italic">Anonymous</span>
        )}
        {request.user.company && (
          <span className="hidden sm:flex items-center gap-1 truncate">
            <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
            {request.user.company}
          </span>
        )}
        {request.user.location && (
          <span className="hidden md:flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
            {request.user.location}
          </span>
        )}
        {request.urgency && request.urgency !== "normal" && (
          <span className={cn(
            "shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
            request.urgency === "urgent" ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
          )}>
            {request.urgency}
          </span>
        )}
      </div>

      {/* Switch count */}
      {request.switches.length > 0 && (
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
          <Sparkles className="h-3 w-3" />
          {request.switches.length} tool{request.switches.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Time */}
      <span className="shrink-0 text-[11px] text-gray-400 tabular-nums w-14 text-right">
        {timeAgo(request.createdAt)}
      </span>

      {/* Claim */}
      <div className="shrink-0 w-28">
        <LeadActions requestId={request.id} status="PENDING" isOwned={false} />
      </div>
    </div>
  );
}

// ─── Pipeline bar ─────────────────────────────────────────────────────────────

function PipelineBar({
  pending,
  active,
  closed,
}: {
  pending: number;
  active: number;
  closed: number;
}) {
  const total = pending + active + closed || 1;
  const stages = [
    { label: "Pending", count: pending, color: "bg-amber-400", text: "text-amber-700" },
    { label: "Active", count: active, color: "bg-[#2A5FA5]", text: "text-[#2A5FA5]" },
    { label: "Closed", count: closed, color: "bg-gray-300", text: "text-gray-500" },
  ];
  return (
    <div className="space-y-2">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        {stages.map((s) => (
          <div
            key={s.label}
            className={cn("h-full transition-all", s.color)}
            style={{ width: `${(s.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex items-center gap-4">
        {stages.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={cn("h-2 w-2 rounded-full", s.color)} />
            <span className="text-[11px] text-gray-500">{s.label}</span>
            <span className={cn("text-[11px] font-bold tabular-nums", s.text)}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") redirect("/app/dashboard");

  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (!partner) redirect("/app/dashboard");

  const [assignedRequests, openRequests] = await Promise.all([
    prisma.migrationRequest.findMany({
      where: { partnerId: partner.id },
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, company: true, email: true, location: true } },
      },
    }),
    prisma.migrationRequest.findMany({
      where: { status: "PENDING", partnerId: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: { select: { id: true, name: true, company: true, email: true, location: true } },
      },
    }),
  ]);

  const pendingAssigned = assignedRequests.filter((r) =>
    ["PENDING", "UNDER_REVIEW", "MATCHED", "PROPOSAL_SENT"].includes(r.status)
  );
  const activeAssigned = assignedRequests.filter((r) =>
    ["ACCEPTED", "IN_PROGRESS"].includes(r.status)
  );
  const closedAssigned = assignedRequests.filter((r) =>
    ["COMPLETED", "CANCELLED"].includes(r.status)
  );

  type AssignedRequest = (typeof assignedRequests)[number];
  type OpenRequest = (typeof openRequests)[number];

  function toAssigned(r: AssignedRequest) {
    return {
      ...r,
      status: r.status as "PENDING" | "UNDER_REVIEW" | "MATCHED" | "PROPOSAL_SENT" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
      switches: (r.switches as RequestSwitch[] | null) ?? [],
      phases: (r.phases as MigrationPhase[] | null),
      targetDate: r.targetDate ?? null,
    };
  }

  function toOpen(r: OpenRequest) {
    return {
      ...r,
      switches: (r.switches as RequestSwitch[] | null) ?? [],
    };
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* ── Header ── */}
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <TrendingUp className="h-4 w-4 text-[#2A5FA5]" />
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Lead Pipeline</h1>
            </div>
            <p className="text-xs text-gray-400">
              Migration requests matched to{" "}
              <span className="font-semibold text-gray-600">{partner.companyName}</span>
            </p>
          </div>
          <div className="lg:w-72">
            <PipelineBar
              pending={pendingAssigned.length + openRequests.length}
              active={activeAssigned.length}
              closed={closedAssigned.length}
            />
          </div>
        </div>

        {!partner.approved && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700">
              <span className="font-semibold">Pending verification —</span>{" "}
              your profile is under review. You can still claim and respond to requests.
            </p>
          </div>
        )}
      </div>

      {/* ── Your pipeline ── */}
      {(pendingAssigned.length > 0 || activeAssigned.length > 0) && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
            <CircleDot className="h-3.5 w-3.5" /> Your pipeline
          </h2>

          {pendingAssigned.length > 0 && (
            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                Awaiting your response · {pendingAssigned.length}
              </p>
              {pendingAssigned.map((r) => (
                <AssignedLeadCard key={r.id} request={toAssigned(r)} />
              ))}
            </div>
          )}

          {activeAssigned.length > 0 && (
            <div className="space-y-3">
              <p className="px-1 text-[11px] font-semibold text-[#2A5FA5] uppercase tracking-wide flex items-center gap-1.5">
                <PlayCircle className="h-3.5 w-3.5" /> In progress · {activeAssigned.length}
              </p>
              {activeAssigned.map((r) => (
                <AssignedLeadCard key={r.id} request={toAssigned(r)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Open marketplace ── */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
          <Inbox className="h-3.5 w-3.5" /> Open requests · {openRequests.length}
        </h2>
        {openRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-14 text-center">
            <Inbox className="mx-auto mb-3 h-7 w-7 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No open requests right now</p>
            <p className="mt-1 text-xs text-gray-400">New migration requests will appear here as they come in.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto] border-b border-gray-100 bg-gray-50/60 px-5 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Request
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 w-28 text-right pr-1">
                Action
              </span>
            </div>
            {openRequests.map((r) => (
              <OpenRequestRow key={r.id} request={toOpen(r)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Closed ── */}
      {closedAssigned.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-1 text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors select-none">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Closed · {closedAssigned.length}
            <span className="text-[10px] normal-case font-normal text-gray-300 group-open:hidden">(click to expand)</span>
          </summary>
          <div className="mt-3 space-y-3">
            {closedAssigned.map((r) => (
              <AssignedLeadCard key={r.id} request={toAssigned(r)} />
            ))}
          </div>
        </details>
      )}

    </div>
  );
}
