import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, ChevronRight, ClipboardList } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ToolIcon } from "@/components/shared/tool-icon";
import {
  getRequestStatusMeta,
  type MigrationTask,
  type RequestSwitch,
} from "@/lib/request-utils";
import { DeleteRequestButton } from "./delete-request-button";

export const metadata = { title: "Requests – Staky" };

const CARD_SHADOW = "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)";
const CARD_BORDER = "1.5px solid rgba(0,0,0,0.06)";
const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

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
  })));
  const dbTools = slugs.length > 0
    ? await prisma.softwareTool.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, name: true, logoUrl: true, color: true, abbr: true },
      })
    : [];
  const toolBySlug = new Map(dbTools.map((t) => [t.slug, t]));

  const pendingCount   = requests.filter((r) => r.status === "PENDING").length;
  const activeCount    = requests.filter((r) => ["MATCHED", "PROPOSAL_SENT", "ACCEPTED", "IN_PROGRESS"].includes(r.status)).length;
  const completedCount = requests.filter((r) => r.status === "COMPLETED").length;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6" style={{ fontFamily: F }}>

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F6E56] mb-1">Migrations</p>
          <h1 className="text-[22px] font-black text-[#1B2B1F] leading-tight">My Requests</h1>
          <p className="text-[13px] text-[#5C6B5E] mt-0.5">
            Track your migration help requests and partner responses.
          </p>
        </div>

        {/* Stats strip */}
        <div
          className="flex items-center rounded-2xl overflow-hidden shrink-0 self-start"
          style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
        >
          <div className="px-4 py-3 bg-white text-center border-r border-[rgba(0,0,0,0.05)]">
            <p className="text-[18px] font-black text-[#1B2B1F] leading-none">{pendingCount}</p>
            <p className="text-[10px] text-[#9BA39C] mt-0.5">pending</p>
          </div>
          <div className="px-4 py-3 bg-white text-center border-r border-[rgba(0,0,0,0.05)]">
            <p className="text-[18px] font-black text-[#0F6E56] leading-none">{activeCount}</p>
            <p className="text-[10px] text-[#9BA39C] mt-0.5">active</p>
          </div>
          <div className="px-4 py-3 bg-white text-center">
            <p className="text-[18px] font-black text-[#2A5FA5] leading-none">{completedCount}</p>
            <p className="text-[10px] text-[#9BA39C] mt-0.5">done</p>
          </div>
        </div>
      </div>

      {/* ── List ── */}
      {requests.length === 0 ? (
        <div
          className="bg-white rounded-2xl py-16 text-center"
          style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3EE] mx-auto mb-4">
            <ClipboardList className="h-6 w-6 text-[#0F6E56]" />
          </div>
          <p className="text-[15px] font-bold text-[#1B2B1F]">No requests yet</p>
          <p className="mt-1.5 text-[13px] text-[#9BA39C] max-w-xs mx-auto leading-relaxed">
            Send a request from your stack or a partner profile to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const status = getRequestStatusMeta(request.status);
            const switches = (request.switches as RequestSwitch[] | null) ?? [];
            const primary = switches[0] ?? { fromTool: request.fromTool, toTool: request.toTool };
            const extraSwitches = switches.length > 1 ? switches.length - 1 : 0;

            const fromTool = toolBySlug.get(primary.fromTool);
            const toTool   = toolBySlug.get(primary.toTool);
            const fromName = fromTool?.name ?? primary.fromTool;
            const toName   = toTool?.name   ?? primary.toTool;

            const tasks  = (request.phases as MigrationTask[] | null) ?? [];
            const done   = tasks.filter((t) => t.status === "done").length;
            const pct    = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : null;
            const inProg = tasks.filter((t) => t.status === "in_progress").length;

            const isCancelled = request.status === "CANCELLED";

            return (
              <Link
                key={request.id}
                href={`/app/requests/${request.id}`}
                className="group block bg-white rounded-2xl transition-all hover:-translate-y-0.5"
                style={{
                  border: CARD_BORDER,
                  boxShadow: CARD_SHADOW,
                  opacity: isCancelled ? 0.55 : 1,
                }}
              >
                <div className="px-5 py-4 flex items-center gap-4">

                  {/* Tool icons */}
                  <div className="flex shrink-0 items-center gap-2">
                    <ToolIcon toolData={fromTool} size="sm" />
                    <ArrowRight className="h-3 w-3 text-[#C8D0CA]" />
                    <ToolIcon toolData={toTool} size="sm" />
                  </div>

                  {/* Switch label + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold text-[#1B2B1F] truncate">
                        {fromName} → {toName}
                      </span>
                      {extraSwitches > 0 && (
                        <span
                          className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-[#5C6B5E]"
                          style={{ border: CARD_BORDER, background: "rgba(0,0,0,0.03)" }}
                        >
                          +{extraSwitches} more
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      {request.partner ? (
                        <span className="flex items-center gap-1 text-[12px] text-[#5C6B5E]">
                          <BriefcaseBusiness className="h-3 w-3 text-[#9BA39C]" />
                          {request.partner.companyName}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#9BA39C] italic">Awaiting partner match</span>
                      )}
                      <span className="text-[#C8D0CA]">·</span>
                      <span className="text-[12px] text-[#9BA39C]">{formatDate(request.createdAt)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {pct !== null && !isCancelled && (
                    <div className="hidden w-24 shrink-0 sm:block">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[#9BA39C] tabular-nums">{done}/{tasks.length}</span>
                        {inProg > 0 && (
                          <span className="text-[10px] text-[#2A5FA5] font-medium">{inProg} active</span>
                        )}
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: pct === 100 ? "#0F6E56" : "#2A5FA5",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status badge */}
                  <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${status.cls}`}>
                    {status.label}
                  </span>

                  {/* Delete + Arrow */}
                  <div className="flex items-center gap-1 shrink-0">
                    <DeleteRequestButton requestId={request.id} />
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#C8D0CA] transition-colors group-hover:text-[#9BA39C]" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
