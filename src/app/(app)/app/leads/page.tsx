import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ChevronRight,
  CircleDot,
  Inbox,
  MapPin,
  User,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { LeadActions } from "./lead-actions";
import {
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

const STATUS_DOT: Record<string, string> = {
  PENDING:       "bg-amber-400",
  UNDER_REVIEW:  "bg-orange-400",
  MATCHED:       "bg-purple-400",
  PROPOSAL_SENT: "bg-violet-500",
  ACCEPTED:      "bg-[#2A5FA5]",
  IN_PROGRESS:   "bg-[#0F6E56]",
  COMPLETED:     "bg-gray-400",
  CANCELLED:     "bg-red-300",
};

// ─── Assigned lead row ─────────────────────────────────────────────────────────

function AssignedLeadRow({
  request,
  isFirst,
}: {
  request: {
    id: string;
    fromTool: string;
    toTool: string;
    urgency: string | null;
    status: string;
    updatedAt: Date;
    phases: MigrationPhase[] | null;
    switches: RequestSwitch[];
    user: { name: string | null; company: string | null; location: string | null };
  };
  isFirst: boolean;
}) {
  const status = getRequestStatusMeta(request.status as Parameters<typeof getRequestStatusMeta>[0]);
  const dotColor = STATUS_DOT[request.status] ?? "bg-gray-300";

  const fromName = TOOLS[request.fromTool]?.name ?? request.fromTool;
  const toName   = TOOLS[request.toTool]?.name   ?? request.toTool;

  const phases = request.phases ?? [];
  const done   = phases.filter((p) => p.done).length;
  const pct    = phases.length > 0 ? Math.round((done / phases.length) * 100) : null;

  const extra = request.switches.length > 1 ? request.switches.length - 1 : 0;

  return (
    <Link
      href={`/app/leads/${request.id}`}
      className={cn(
        "group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50/80",
        !isFirst && "border-t border-gray-100"
      )}
    >
      {/* Status dot */}
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dotColor)} />

      {/* Tool icons */}
      <div className="flex shrink-0 items-center gap-1.5">
        <ToolIcon slug={request.fromTool} size="sm" />
        <ArrowRight className="h-3 w-3 text-gray-300" />
        <ToolIcon slug={request.toTool} size="sm" />
      </div>

      {/* Switch label */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-800">
            {fromName} → {toName}
          </span>
          {extra > 0 && (
            <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
              +{extra} more
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {request.user.name && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <User className="h-3 w-3 text-gray-400" />
              {request.user.name}
            </span>
          )}
          {request.user.company && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400">
              <Building2 className="h-3 w-3" />
              {request.user.company}
            </span>
          )}
          {request.user.location && (
            <span className="hidden md:flex items-center gap-1 text-[11px] text-gray-400">
              <MapPin className="h-3 w-3" />
              {request.user.location}
            </span>
          )}
        </div>
      </div>

      {/* Phase progress */}
      {pct !== null && (
        <div className="hidden w-24 shrink-0 sm:block">
          <div className="mb-1 flex justify-between text-[10px] text-gray-400">
            <span>{done}/{phases.length} phases</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#0F6E56] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Urgency */}
      {request.urgency && request.urgency !== "normal" && (
        <span className={cn(
          "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase",
          request.urgency === "urgent"
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-orange-200 bg-orange-50 text-orange-600"
        )}>
          {request.urgency}
        </span>
      )}

      {/* Status badge */}
      <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium", status.cls)}>
        {status.label}
      </span>

      {/* Time */}
      <span className="hidden shrink-0 text-[11px] tabular-nums text-gray-400 sm:block">
        {timeAgo(request.updatedAt)}
      </span>

      {/* Chevron */}
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-400" />
    </Link>
  );
}

// ─── Open request row ─────────────────────────────────────────────────────────

function OpenRequestRow({
  request,
  isFirst,
}: {
  request: {
    id: string;
    fromTool: string;
    toTool: string;
    urgency: string | null;
    createdAt: Date;
    switches: RequestSwitch[];
    user: { name: string | null; company: string | null; location: string | null };
  };
  isFirst: boolean;
}) {
  const fromName = TOOLS[request.fromTool]?.name ?? request.fromTool;
  const toName   = TOOLS[request.toTool]?.name   ?? request.toTool;
  const extra    = request.switches.length > 1 ? request.switches.length - 1 : 0;

  return (
    <div className={cn(
      "flex items-center gap-4 px-5 py-3.5",
      !isFirst && "border-t border-gray-100"
    )}>
      {/* Tool icons */}
      <div className="flex shrink-0 items-center gap-1.5">
        <ToolIcon slug={request.fromTool} size="sm" />
        <ArrowRight className="h-3 w-3 text-gray-300" />
        <ToolIcon slug={request.toTool} size="sm" />
      </div>

      {/* Label + client */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-800">
            {fromName} → {toName}
          </span>
          {extra > 0 && (
            <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
              +{extra} more
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {request.user.name && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <User className="h-3 w-3 text-gray-400" />
              {request.user.name}
            </span>
          )}
          {request.user.company && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400">
              <Building2 className="h-3 w-3" />
              {request.user.company}
            </span>
          )}
          {request.user.location && (
            <span className="hidden md:flex items-center gap-1 text-[11px] text-gray-400">
              <MapPin className="h-3 w-3" />
              {request.user.location}
            </span>
          )}
        </div>
      </div>

      {/* Urgency */}
      {request.urgency && request.urgency !== "normal" && (
        <span className={cn(
          "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase",
          request.urgency === "urgent"
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-orange-200 bg-orange-50 text-orange-600"
        )}>
          {request.urgency}
        </span>
      )}

      {/* Time */}
      <span className="hidden shrink-0 text-[11px] tabular-nums text-gray-400 sm:block">
        {timeAgo(request.createdAt)}
      </span>

      {/* Claim action */}
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <LeadActions requestId={request.id} status="PENDING" isOwned={false} />
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
      id: r.id,
      fromTool: r.fromTool,
      toTool: r.toTool,
      urgency: r.urgency,
      status: r.status,
      updatedAt: r.updatedAt,
      phases: (r.phases as MigrationPhase[] | null),
      switches: (r.switches as RequestSwitch[] | null) ?? [],
      user: r.user,
    };
  }

  function toOpen(r: OpenRequest) {
    return {
      id: r.id,
      fromTool: r.fromTool,
      toTool: r.toTool,
      urgency: r.urgency,
      createdAt: r.createdAt,
      switches: (r.switches as RequestSwitch[] | null) ?? [],
      user: r.user,
    };
  }

  const totalAssigned = assignedRequests.length;

  return (
    <div className="mx-auto max-w-4xl space-y-5">

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Lead Pipeline</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Migration requests for{" "}
            <span className="font-semibold text-gray-700">{partner.companyName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 font-medium text-amber-700 shadow-sm">
            {pendingAssigned.length} pending
          </span>
          <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-[#2A5FA5] shadow-sm">
            {activeAssigned.length} active
          </span>
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-500 shadow-sm">
            {totalAssigned} total
          </span>
        </div>
      </div>

      {/* Pending approval banner */}
      {!partner.approved && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Pending verification —</span>{" "}
            your profile is under review. You can still claim and respond to requests.
          </p>
        </div>
      )}

      {/* ── Your pipeline ── */}
      {(pendingAssigned.length > 0 || activeAssigned.length > 0) && (
        <div className="space-y-4">

          {pendingAssigned.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-widest text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Awaiting response · {pendingAssigned.length}
              </p>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {pendingAssigned.map((r, i) => (
                  <AssignedLeadRow key={r.id} request={toAssigned(r)} isFirst={i === 0} />
                ))}
              </div>
            </div>
          )}

          {activeAssigned.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-widest text-[#2A5FA5]">
                <CircleDot className="h-3.5 w-3.5" />
                In progress · {activeAssigned.length}
              </p>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {activeAssigned.map((r, i) => (
                  <AssignedLeadRow key={r.id} request={toAssigned(r)} isFirst={i === 0} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Open marketplace ── */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          <Inbox className="h-3.5 w-3.5" />
          Open requests · {openRequests.length}
        </p>
        {openRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center shadow-sm">
            <Inbox className="mx-auto mb-2 h-6 w-6 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No open requests right now</p>
            <p className="mt-1 text-xs text-gray-400">New migration requests will appear here.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {openRequests.map((r, i) => (
              <OpenRequestRow key={r.id} request={toOpen(r)} isFirst={i === 0} />
            ))}
          </div>
        )}
      </div>

      {/* ── Closed ── */}
      {closedAssigned.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            Closed · {closedAssigned.length}
          </p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white opacity-70 shadow-sm">
            {closedAssigned.map((r, i) => (
              <AssignedLeadRow key={r.id} request={toAssigned(r)} isFirst={i === 0} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
