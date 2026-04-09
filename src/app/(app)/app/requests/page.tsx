import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, ChevronRight, Inbox } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ToolIcon } from "@/components/shared/tool-icon";
import {
  getRequestStatusMeta,
  type MigrationTask,
  type RequestSwitch,
} from "@/lib/request-utils";

export const metadata = { title: "Requests – Staky" };

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const requests = await prisma.migrationRequest.findMany({
    where: { userId: session.user.id },
    include: {
      partner: { select: { companyName: true, country: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const slugs = Array.from(new Set(requests.flatMap((r) => {
    const sw = (r.switches as { fromTool: string; toTool: string }[] | null) ?? [];
    const p = sw[0] ?? { fromTool: r.fromTool, toTool: r.toTool };
    return [p.fromTool, p.toTool];
  }))];
  const dbTools = slugs.length > 0
    ? await prisma.softwareTool.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, name: true, logoUrl: true, color: true, abbr: true },
      })
    : [];
  const toolBySlug = new Map(dbTools.map((t) => [t.slug, t]));

  const pendingCount  = requests.filter((r) => r.status === "PENDING").length;
  const activeCount   = requests.filter((r) => ["MATCHED", "PROPOSAL_SENT", "ACCEPTED", "IN_PROGRESS"].includes(r.status)).length;
  const completedCount = requests.filter((r) => r.status === "COMPLETED").length;

  return (
    <div className="mx-auto max-w-4xl space-y-5">

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">My Requests</h1>
          <p className="mt-0.5 text-sm text-gray-500">Track your migration help requests and partner responses.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-600 shadow-sm">
            {pendingCount} pending
          </span>
          <span className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 font-medium text-[#0F6E56] shadow-sm">
            {activeCount} active
          </span>
          <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-medium text-[#2A5FA5] shadow-sm">
            {completedCount} done
          </span>
        </div>
      </div>

      {/* List */}
      {requests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <Inbox className="mx-auto mb-3 h-7 w-7 text-gray-200" />
          <p className="text-sm font-medium text-gray-600">No requests yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Send a request from your stack or a partner profile to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {requests.map((request, idx) => {
            const status = getRequestStatusMeta(request.status);
            const switches = (request.switches as RequestSwitch[] | null) ?? [];
            const primary = switches[0] ?? { fromTool: request.fromTool, toTool: request.toTool };
            const extraSwitches = switches.length > 1 ? switches.length - 1 : 0;

            const fromName = toolBySlug.get(primary.fromTool)?.name ?? primary.fromTool;
            const toName   = toolBySlug.get(primary.toTool)?.name   ?? primary.toTool;

            const tasks    = (request.phases as MigrationTask[] | null) ?? [];
            const done     = tasks.filter((t) => t.status === "done").length;
            const pct      = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : null;
            const inProg   = tasks.filter((t) => t.status === "in_progress").length;

            const isCancelled = request.status === "CANCELLED";

            return (
              <Link
                key={request.id}
                href={`/app/requests/${request.id}`}
                className={`group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/80 ${
                  idx > 0 ? "border-t border-gray-100" : ""
                } ${isCancelled ? "opacity-50" : ""}`}
              >
                {/* Tool icons */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <ToolIcon toolData={toolBySlug.get(primary.fromTool)} size="sm" />
                  <ArrowRight className="h-3 w-3 text-gray-300" />
                  <ToolIcon toolData={toolBySlug.get(primary.toTool)} size="sm" />
                </div>

                {/* Switch label + extras */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-gray-800">
                      {fromName} → {toName}
                    </span>
                    {extraSwitches > 0 && (
                      <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                        +{extraSwitches} more
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {/* Partner */}
                    {request.partner ? (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <BriefcaseBusiness className="h-3 w-3" />
                        {request.partner.companyName}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">Awaiting partner match</span>
                    )}
                    {/* Date */}
                    <span className="text-[11px] text-gray-300">·</span>
                    <span className="text-[11px] text-gray-400">{formatDate(request.createdAt)}</span>
                  </div>
                </div>

                {/* Progress bar (inline) */}
                {pct !== null && !isCancelled && (
                  <div className="hidden w-24 shrink-0 sm:block">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400 tabular-nums">{done}/{tasks.length}</span>
                      {inProg > 0 && (
                        <span className="text-[10px] text-[#2A5FA5]">{inProg} active</span>
                      )}
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#0F6E56] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Status badge */}
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.cls}`}
                >
                  {status.label}
                </span>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-400" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
