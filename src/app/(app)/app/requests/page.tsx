import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ChevronRight, Inbox, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { getRequestSourceLabel, getRequestStatusMeta, type RequestSwitch } from "@/lib/request-utils";

export const metadata = { title: "Requests â€” Staky" };

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SwitchSummary({ switches }: { switches: RequestSwitch[] }) {
  if (switches.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {switches.slice(0, 4).map((item) => (
        <span
          key={`${item.fromTool}-${item.toTool}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600"
        >
          <ToolIcon slug={item.fromTool} size="sm" />
          {TOOLS[item.fromTool]?.name ?? item.fromTool}
          <ArrowRight className="h-3 w-3 text-gray-300" />
          <ToolIcon slug={item.toTool} size="sm" />
          <span className="font-medium text-[#0F6E56]">{TOOLS[item.toTool]?.name ?? item.toTool}</span>
        </span>
      ))}
    </div>
  );
}

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const requests = await prisma.migrationRequest.findMany({
    where: { userId: session.user.id },
    include: {
      partner: {
        select: {
          id: true,
          companyName: true,
          country: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingCount = requests.filter((request) => request.status === "PENDING").length;
  const activeCount = requests.filter((request) => ["MATCHED", "IN_PROGRESS"].includes(request.status)).length;
  const completedCount = requests.filter((request) => request.status === "COMPLETED").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-[24px] border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Requests</h1>
            <p className="mt-1 text-sm text-gray-500">Track your migration help requests and partner responses.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-[320px]">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Pending</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-green-100 bg-green-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-green-600">Active</p>
              <p className="mt-1 text-lg font-bold text-[#0F6E56]">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#2A5FA5]">Completed</p>
              <p className="mt-1 text-lg font-bold text-[#2A5FA5]">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-200" />
          <p className="text-sm font-medium text-gray-600">No requests yet</p>
          <p className="mt-1 text-xs text-gray-400">Send a request from your stack or a partner profile to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const status = getRequestStatusMeta(request.status);
            const switches = (request.switches as RequestSwitch[] | null) ?? [];
            const switchItems = switches.length > 0 ? switches : [{ fromTool: request.fromTool, toTool: request.toTool }];

            return (
              <article key={request.id} className="rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                      {request.requestSource && (
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                          {getRequestSourceLabel(request.requestSource)}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm font-medium leading-relaxed text-gray-800">
                      {request.description || "Migration help request"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDate(request.createdAt)}</span>
                    <Link href={`/app/requests/${request.id}`} className="inline-flex items-center gap-0.5 text-xs font-medium text-[#0F6E56] hover:underline">
                      View <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    Switch context
                  </div>
                  <SwitchSummary switches={switchItems} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Partner</p>
                    {request.partner ? (
                      <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#2A5FA5]">
                        <BriefcaseBusiness className="h-4 w-4" />
                        {request.partner.companyName}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm font-medium text-gray-700">Open request</p>
                    )}
                    {request.partner?.country && <p className="mt-1 text-xs text-gray-500">{request.partner.country}</p>}
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Progress</p>
                    {request.status === "COMPLETED" ? (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F6E56]">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </div>
                    ) : (
                      <p className="mt-2 text-sm font-medium text-gray-700">{status.label}</p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
