import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDot,
  Inbox,
  MapPin,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { LeadActions } from "./lead-actions";
import { getRequestSourceLabel, getRequestStatusMeta, type RequestSwitch } from "@/lib/request-utils";

export const metadata = { title: "Leads â€” Staky" };

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function SwitchChips({ switches }: { switches: RequestSwitch[] }) {
  if (switches.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {switches.slice(0, 4).map((item) => {
        const fromTool = TOOLS[item.fromTool];
        const toTool = TOOLS[item.toTool];
        return (
          <span
            key={`${item.fromTool}-${item.toTool}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600"
          >
            <ToolIcon slug={item.fromTool} size="sm" />
            {fromTool?.name ?? item.fromTool}
            <ArrowRight className="h-3 w-3 text-gray-300" />
            <ToolIcon slug={item.toTool} size="sm" />
            <span className="font-medium text-[#0F6E56]">{toTool?.name ?? item.toTool}</span>
          </span>
        );
      })}
    </div>
  );
}

function LeadCard({
  request,
  isOwned,
}: {
  request: {
    id: string;
    fromTool: string;
    toTool: string;
    description: string | null;
    requestSource: string | null;
    status: "PENDING" | "UNDER_REVIEW" | "MATCHED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      company: string | null;
      email: string;
      location: string | null;
    };
    switches: RequestSwitch[];
  };
  isOwned: boolean;
}) {
  const fromTool = TOOLS[request.fromTool];
  const toTool = TOOLS[request.toTool];
  const status = getRequestStatusMeta(request.status);

  const href = isOwned ? `/app/leads/${request.id}` : undefined;

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm",
        request.status === "PENDING" && "border-l-[3px] border-l-amber-400",
        href && "cursor-pointer hover:border-gray-300 transition-colors"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <ToolIcon slug={request.fromTool} size="md" />
            <ArrowRight className="h-4 w-4 text-gray-300" />
            <ToolIcon slug={request.toTool} size="md" />
            <p className="text-sm font-semibold text-gray-900">
              {fromTool?.name ?? request.fromTool} → {toTool?.name ?? request.toTool}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", status.cls)}>
              {status.label}
            </span>
            {request.requestSource && (
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                {getRequestSourceLabel(request.requestSource)}
              </span>
            )}
            <span className="text-xs text-gray-400">{timeAgo(request.createdAt)}</span>
          </div>
        </div>
        {href && (
          <Link href={href} className="shrink-0 inline-flex items-center gap-1 text-xs text-[#2A5FA5] hover:underline">
            <MessageSquare className="h-3.5 w-3.5" /> View
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
        {request.user.name && (
          <span className="font-medium text-gray-700">{request.user.name}</span>
        )}
        {request.user.company && (
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-gray-400" />
            {request.user.company}
          </span>
        )}
        {request.user.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            {request.user.location}
          </span>
        )}
      </div>

      {request.description && (
        <p className="text-sm leading-relaxed text-gray-700">{request.description}</p>
      )}

      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          <Sparkles className="h-3.5 w-3.5" />
          Switch context
        </div>
        <SwitchChips switches={request.switches} />
      </div>

      {isOwned && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-[#2A5FA5]">
          Contact: <strong>{request.user.email}</strong>
        </div>
      )}

      <LeadActions requestId={request.id} status={request.status} isOwned={isOwned} />
    </article>
  );
}

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") redirect("/app/dashboard");

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
  });
  if (!partner) redirect("/app/dashboard");

  const [assignedRequests, openRequests] = await Promise.all([
    prisma.migrationRequest.findMany({
      where: { partnerId: partner.id },
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, company: true, email: true, location: true },
        },
      },
    }),
    prisma.migrationRequest.findMany({
      where: { status: "PENDING", partnerId: null },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: {
          select: { id: true, name: true, company: true, email: true, location: true },
        },
      },
    }),
  ]);

  const pendingAssigned = assignedRequests.filter((request) =>
    ["PENDING", "UNDER_REVIEW", "MATCHED"].includes(request.status)
  );
  const acceptedAssigned = assignedRequests.filter((request) =>
    ["ACCEPTED", "IN_PROGRESS"].includes(request.status)
  );
  const closedAssigned = assignedRequests.filter((request) =>
    request.status === "COMPLETED" || request.status === "CANCELLED"
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="rounded-[24px] border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Leads</h1>
            <p className="mt-1 text-sm text-gray-500">Incoming requests from users who want help switching</p>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:w-[360px]">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">Pending</p>
              <p className="mt-1 text-lg font-bold text-amber-800">{pendingAssigned.length + openRequests.length}</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#2A5FA5]">Active</p>
              <p className="mt-1 text-lg font-bold text-[#2A5FA5]">{acceptedAssigned.length}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Closed</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{closedAssigned.length}</p>
            </div>
          </div>
        </div>
      </div>

      {!partner.approved && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Profile pending review</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Your partner profile is awaiting approval. You can review requests, but users will trust accepted leads more once your profile is verified.
            </p>
          </div>
        </div>
      )}

      {pendingAssigned.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Pending requests for you
          </h2>
          <div className="space-y-3">
            {pendingAssigned.map((request) => (
              <LeadCard
                key={request.id}
                isOwned
                request={{
                  ...request,
                  status: request.status as "PENDING" | "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
                  switches: (request.switches as RequestSwitch[] | null) ?? [],
                }}
              />
            ))}
          </div>
        </section>
      )}

      {acceptedAssigned.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CircleDot className="h-4 w-4 text-[#2A5FA5]" />
            Accepted &amp; active
          </h2>
          <div className="space-y-3">
            {acceptedAssigned.map((request) => (
              <LeadCard
                key={request.id}
                isOwned
                request={{
                  ...request,
                  status: request.status as "PENDING" | "UNDER_REVIEW" | "MATCHED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
                  switches: (request.switches as RequestSwitch[] | null) ?? [],
                }}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Inbox className="h-4 w-4 text-[#0F6E56]" />
          Open requests
        </h2>
        {openRequests.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-14 text-center">
            <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">No open requests right now</p>
            <p className="mt-1 text-xs text-gray-400">New one-click migration requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openRequests.map((request) => (
              <LeadCard
                key={request.id}
                isOwned={false}
                request={{
                  ...request,
                  status: request.status as "PENDING" | "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
                  switches: (request.switches as RequestSwitch[] | null) ?? [],
                }}
              />
            ))}
          </div>
        )}
      </section>

      {closedAssigned.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
            Closed
          </h2>
          <div className="space-y-3">
            {closedAssigned.map((request) => (
              <LeadCard
                key={request.id}
                isOwned
                request={{
                  ...request,
                  status: request.status as "PENDING" | "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
                  switches: (request.switches as RequestSwitch[] | null) ?? [],
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
