"use client";

import { useTransition } from "react";
import { CheckCircle2, Loader2, PlayCircle, Send, UserCheck, XCircle } from "lucide-react";
import { acceptLead, rejectLead, startWork, updateLeadStatus } from "@/actions/partner";

interface LeadActionsProps {
  requestId: string;
  status: string;
  isOwned: boolean;
}

export function LeadActions({ requestId, status, isOwned }: LeadActionsProps) {
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => { try { await fn(); } catch {} });

  const rejectBtn = (
    <button
      onClick={() => run(() => rejectLead(requestId))}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 transition-colors"
    >
      <XCircle className="h-3.5 w-3.5" /> Reject
    </button>
  );

  const acceptBtn = (label = "Accept") => (
    <button
      onClick={() => run(() => acceptLead(requestId))}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition-colors"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
      {label}
    </button>
  );

  // Open request (no partner yet) — just Accept
  if (status === "PENDING" && !isOwned) {
    return (
      <div className="flex items-center justify-end pt-1">
        {acceptBtn("Accept request")}
      </div>
    );
  }

  // Admin pre-assigned or under review — Accept + Reject
  if ((status === "PENDING" || status === "UNDER_REVIEW" || status === "MATCHED") && isOwned) {
    return (
      <div className="flex items-center gap-2 justify-end pt-1">
        {rejectBtn}
        {acceptBtn("Accept")}
      </div>
    );
  }

  // Proposal sent — accept or reject from list card
  if (status === "PROPOSAL_SENT" && isOwned) {
    return (
      <div className="flex items-center gap-2 justify-end pt-1">
        <span className="flex items-center gap-1 text-[11px] font-medium text-violet-600 mr-auto">
          <Send className="h-3 w-3" /> Proposal sent
        </span>
        {rejectBtn}
        {acceptBtn("Accept")}
      </div>
    );
  }

  // Accepted — Reject or Start work
  if (status === "ACCEPTED" && isOwned) {
    return (
      <div className="flex items-center gap-2 justify-end pt-1">
        {rejectBtn}
        <button
          onClick={() => run(() => startWork(requestId))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-[#2A5FA5] hover:bg-[#244d8a] disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition-colors"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
          Start work
        </button>
      </div>
    );
  }

  if (status === "IN_PROGRESS" && isOwned) {
    return (
      <div className="flex items-center justify-end pt-1">
        <button
          onClick={() => run(() => updateLeadStatus(requestId, "COMPLETED"))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition-colors"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Mark complete
        </button>
      </div>
    );
  }

  return null;
}
