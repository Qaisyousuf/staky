"use client";

import { useTransition } from "react";
import { CheckCircle2, Loader2, PlayCircle, UserCheck, XCircle } from "lucide-react";
import { claimLead, updateLeadStatus } from "@/actions/partner";

interface LeadActionsProps {
  requestId: string;
  status: string;
  isOwned: boolean;
}

export function LeadActions({ requestId, status, isOwned }: LeadActionsProps) {
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => { try { await fn(); } catch {} });

  // Open lead — claim button
  if (status === "PENDING" && !isOwned) {
    return (
      <div className="flex items-center justify-end pt-1">
        <button
          onClick={() => run(() => claimLead(requestId))}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          Claim lead
        </button>
      </div>
    );
  }

  // Matched — start or decline
  if (status === "MATCHED" && isOwned) {
    return (
      <div className="flex items-center gap-2 justify-end pt-1">
        <button
          onClick={() => run(() => updateLeadStatus(requestId, "CANCELLED"))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 transition-colors"
        >
          <XCircle className="h-3.5 w-3.5" /> Decline
        </button>
        <button
          onClick={() => run(() => updateLeadStatus(requestId, "IN_PROGRESS"))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-[#2A5FA5] hover:bg-[#244d8a] disabled:opacity-50 px-4 py-1.5 text-xs font-medium text-white transition-colors"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
          Start project
        </button>
      </div>
    );
  }

  // In progress — mark complete or cancel
  if (status === "IN_PROGRESS" && isOwned) {
    return (
      <div className="flex items-center gap-2 justify-end pt-1">
        <button
          onClick={() => run(() => updateLeadStatus(requestId, "CANCELLED"))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 transition-colors"
        >
          <XCircle className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          onClick={() => run(() => updateLeadStatus(requestId, "COMPLETED"))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-4 py-1.5 text-xs font-medium text-white transition-colors"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Mark complete
        </button>
      </div>
    );
  }

  return null;
}
