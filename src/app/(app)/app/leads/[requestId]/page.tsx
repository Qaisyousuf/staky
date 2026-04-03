import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Building2, Mail, MapPin } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { getRequestStatusMeta } from "@/lib/request-utils";
import { RequestTimeline } from "../../requests/[requestId]/request-timeline";
import { RequestConversation } from "../../requests/[requestId]/request-conversation";
import { LeadDetailActions } from "./lead-detail-actions";

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
  // Partner can view if assigned to them, or if it's an open pending request
  const isOwned = request.partnerId === partner.id;
  const isOpen = request.status === "PENDING" && !request.partnerId;
  if (!isOwned && !isOpen) notFound();

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

      {/* Actions */}
      <LeadDetailActions requestId={request.id} status={request.status} isOwned={isOwned} />

      {/* User info (only if owned) */}
      {isOwned && (
        <div className="rounded-[22px] border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Client</p>
          <div className="flex items-start gap-3">
            {request.user.image ? (
              <Image
                src={request.user.image}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full shrink-0 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-200 text-sm font-semibold text-[#2A5FA5]">
                {request.user.name?.[0] ?? "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{request.user.name ?? "Unknown"}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                <a href={`mailto:${request.user.email}`} className="flex items-center gap-1 hover:text-[#2A5FA5]">
                  <Mail className="h-3.5 w-3.5" /> {request.user.email}
                </a>
                {request.user.company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> {request.user.company}
                  </span>
                )}
                {request.user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {request.user.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversation — only if owned */}
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
