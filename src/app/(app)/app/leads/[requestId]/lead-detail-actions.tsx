"use client";

import { useTransition } from "react";
import { CheckCircle2, Loader2, PlayCircle, UserCheck, XCircle } from "lucide-react";
import { acceptLead, rejectLead, updateLeadStatus } from "@/actions/partner";

interface Props {
  requestId: string;
  status: string;
  isOwned: boolean;
}

export function LeadDetailActions({ requestId, status, isOwned }: Props) {
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => { try { await fn(); } catch {} });

  if (!isOwned && status === "PENDING") {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => run(() => acceptLead(requestId))}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          Accept request
        </button>
      </div>
    );
  }

  if (isOwned && ["PENDING", "UNDER_REVIEW", "MATCHED"].includes(status)) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => run(() => rejectLead(requestId))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 transition-colors"
        >
          <XCircle className="h-4 w-4" /> Reject
        </button>
        <button
          onClick={() => run(() => acceptLead(requestId))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          Accept
        </button>
      </div>
    );
  }

  if (isOwned && status === "ACCEPTED") {
    return (
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => run(() => rejectLead(requestId))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 transition-colors"
        >
          <XCircle className="h-4 w-4" /> Reject
        </button>
        <button
          onClick={() => run(() => updateLeadStatus(requestId, "IN_PROGRESS"))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-[#2A5FA5] hover:bg-[#244d8a] disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          Start work
        </button>
      </div>
    );
  }

  if (isOwned && status === "IN_PROGRESS") {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => run(() => updateLeadStatus(requestId, "COMPLETED"))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Mark complete
        </button>
      </div>
    );
  }

  return null;
}
