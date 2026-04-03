import { redirect, notFound } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Globe, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { getRequestStatusMeta } from "@/lib/request-utils";
import { RequestConversation } from "./request-conversation";
import { RequestTimeline } from "./request-timeline";

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

  const fromTool = TOOLS[request.fromTool];
  const toTool = TOOLS[request.toTool];
  const status = getRequestStatusMeta(request.status as Parameters<typeof getRequestStatusMeta>[0]);

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
          <span className={`ml-auto inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${status.cls}`}>
            {status.label}
          </span>
        </div>

        {request.description && (
          <p className="text-sm text-gray-700 leading-relaxed">{request.description}</p>
        )}

        {request.userGoals && (
          <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Goals &amp; context</p>
            <p className="text-sm text-gray-700 leading-relaxed">{request.userGoals}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {request.urgency && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Urgency</p>
              <p className="mt-0.5 text-xs font-medium capitalize text-gray-700">{request.urgency}</p>
            </div>
          )}
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Submitted</p>
            <p className="mt-0.5 text-xs font-medium text-gray-700">
              {request.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Status timeline */}
      <RequestTimeline status={request.status as Parameters<typeof getRequestStatusMeta>[0]} />

      {/* Partner info */}
      {request.partner ? (
        <div className="rounded-[22px] border border-blue-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Assigned partner</p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <BriefcaseBusiness className="h-5 w-5 text-[#2A5FA5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{request.partner.companyName}</p>
              {request.partner.country && <p className="text-xs text-gray-400">{request.partner.country}</p>}
            </div>
            {request.partner.website && (
              <a
                href={request.partner.website.startsWith("http") ? request.partner.website : `https://${request.partner.website}`}
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

      {/* Cancel button (only if active) */}
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
