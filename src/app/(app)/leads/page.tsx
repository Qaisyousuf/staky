import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Inbox,
  ArrowRight,
  Building2,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  CircleDot,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import { LeadActions } from "./lead-actions";

export const metadata = { title: "Leads — Staky" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:     { label: "Open lead",    icon: AlertCircle,   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  MATCHED:     { label: "Matched",      icon: CircleDot,     cls: "bg-blue-50 text-[#2A5FA5] border-blue-200" },
  IN_PROGRESS: { label: "In progress",  icon: Clock,         cls: "bg-purple-50 text-purple-700 border-purple-200" },
  COMPLETED:   { label: "Completed",    icon: CheckCircle2,  cls: "bg-green-50 text-[#0F6E56] border-green-200" },
  CANCELLED:   { label: "Cancelled",    icon: XCircle,       cls: "bg-gray-50 text-gray-500 border-gray-200" },
} as const;

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const { label, icon: Icon, cls } = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", cls)}>
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

// ─── Lead card ────────────────────────────────────────────────────────────────

function LeadCard({
  request,
  isOwned,
}: {
  request: {
    id: string;
    fromTool: string;
    toTool: string;
    description: string | null;
    budget: string | null;
    teamSize: string | null;
    status: keyof typeof STATUS_CONFIG;
    createdAt: Date;
    user: { id: string; name: string | null; company: string | null; email: string };
  };
  isOwned: boolean;
}) {
  const from = TOOLS[request.fromTool];
  const to = TOOLS[request.toTool];

  return (
    <article
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4",
        request.status === "PENDING" && "border-l-[3px] border-l-amber-400"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Switch */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <ToolIcon slug={request.fromTool} size="md" />
            <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
            <ToolIcon slug={request.toTool} size="md" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {from?.name ?? request.fromTool} → {to?.name ?? request.toTool}
            </p>
            <p className="text-xs text-gray-400">{timeAgo(request.createdAt)}</p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {request.user.name && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
              {request.user.name[0].toUpperCase()}
            </div>
            {request.user.name}
          </div>
        )}
        {request.user.company && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            {request.user.company}
          </div>
        )}
        {request.teamSize && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            {request.teamSize} team
          </div>
        )}
        {request.budget && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#0F6E56]">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            {request.budget}
          </div>
        )}
      </div>

      {/* Description */}
      {request.description && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {request.description}
        </p>
      )}

      {/* Contact (only if owned) */}
      {isOwned && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
          <Info className="h-4 w-4 text-[#2A5FA5] shrink-0" />
          <span className="text-xs text-[#2A5FA5]">
            Contact: <strong>{request.user.email}</strong>
          </span>
        </div>
      )}

      {/* Actions */}
      <LeadActions
        requestId={request.id}
        status={request.status}
        isOwned={isOwned}
      />
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") redirect("/dashboard");

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
  });
  if (!partner) redirect("/dashboard");

  // My claimed leads + all open leads in parallel
  const [myLeads, openLeads] = await Promise.all([
    prisma.migrationRequest.findMany({
      where: { partnerId: partner.id },
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, company: true, email: true } },
      },
    }),
    prisma.migrationRequest.findMany({
      where: { status: "PENDING", partnerId: null },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, company: true, email: true } },
      },
    }),
  ]);

  const activeLeads = myLeads.filter((l) => l.status !== "COMPLETED" && l.status !== "CANCELLED");
  const closedLeads = myLeads.filter((l) => l.status === "COMPLETED" || l.status === "CANCELLED");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">Migration requests from European companies</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 font-medium text-amber-700">
            <AlertCircle className="h-3 w-3" />
            {openLeads.length} open
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 font-medium text-[#2A5FA5]">
            <Inbox className="h-3 w-3" />
            {activeLeads.length} active
          </span>
        </div>
      </div>

      {/* Approval banner */}
      {!partner.approved && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Profile pending review</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Your partner profile is awaiting admin approval. You can browse open leads but cannot claim them yet.
            </p>
          </div>
        </div>
      )}

      {/* My active leads */}
      {activeLeads.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-[#2A5FA5]" />
            My active leads
          </h2>
          <div className="space-y-3">
            {activeLeads.map((req) => (
              <LeadCard
                key={req.id}
                request={{ ...req, status: req.status as keyof typeof STATUS_CONFIG }}
                isOwned
              />
            ))}
          </div>
        </section>
      )}

      {/* Open leads */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Open leads · available to claim
        </h2>
        {openLeads.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
            <Inbox className="h-8 w-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No open leads right now</p>
            <p className="text-xs text-gray-400 mt-1">New migration requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {openLeads.map((req) => (
              <LeadCard
                key={req.id}
                request={{ ...req, status: req.status as keyof typeof STATUS_CONFIG }}
                isOwned={false}
              />
            ))}
          </div>
        )}
      </section>

      {/* Closed leads */}
      {closedLeads.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
            Completed &amp; cancelled
          </h2>
          <div className="space-y-3">
            {closedLeads.map((req) => (
              <LeadCard
                key={req.id}
                request={{ ...req, status: req.status as keyof typeof STATUS_CONFIG }}
                isOwned
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
