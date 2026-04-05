"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  PlayCircle,
  Send,
  UserCheck,
  XCircle,
} from "lucide-react";
import {
  acceptLead,
  rejectLead,
  sendProposal,
  startWork,
  updateLeadStatus,
} from "@/actions/partner";

interface Props {
  requestId: string;
  status: string;
  isOwned: boolean;
}

export function LeadDetailActions({ requestId, status, isOwned }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [timeline, setTimeline] = useState("");
  const [approach, setApproach] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch {}
    });

  // Open marketplace request — accept only
  if (!isOwned && status === "PENDING") {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => run(() => acceptLead(requestId))}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
          Accept request
        </button>
      </div>
    );
  }

  // Assigned but not yet responded — send proposal or accept directly
  if (isOwned && ["PENDING", "UNDER_REVIEW", "MATCHED"].includes(status)) {
    if (showProposalForm) {
      return (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            Send a proposal to the client
          </p>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500">
              Estimated timeline
            </label>
            <input
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="e.g. 2–3 weeks"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500">
              Approach
            </label>
            <textarea
              value={approach}
              onChange={(e) => setApproach(e.target.value)}
              placeholder="Briefly describe your migration approach and what the client can expect..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-500">
              Budget range{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              placeholder="e.g. €1,500 – €3,000"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setShowProposalForm(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!timeline && !approach) return;
                run(() => sendProposal(requestId, { timeline, approach, budgetRange }));
                setShowProposalForm(false);
              }}
              disabled={isPending || (!timeline && !approach)}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send proposal
            </button>
          </div>
        </div>
      );
    }

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
          onClick={() => setShowProposalForm(true)}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl border border-violet-300 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition-colors"
        >
          <Send className="h-4 w-4" /> Send proposal
        </button>
        <button
          onClick={() => run(() => acceptLead(requestId))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
          Accept
        </button>
      </div>
    );
  }

  // Proposal sent — waiting for client, partner can accept or reject
  if (isOwned && status === "PROPOSAL_SENT") {
    return (
      <div className="space-y-2.5">
        <p className="text-right text-xs text-gray-400">
          Proposal sent · accept when ready to proceed
        </p>
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
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
            Accept & proceed
          </button>
        </div>
      </div>
    );
  }

  // Accepted — start work, optionally set target date
  if (isOwned && status === "ACCEPTED") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
          <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
          <label className="shrink-0 text-xs font-semibold text-gray-500">
            Target completion date
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/30"
          />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => run(() => rejectLead(requestId))}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 transition-colors"
          >
            <XCircle className="h-4 w-4" /> Reject
          </button>
          <button
            onClick={() => run(() => startWork(requestId, targetDate || undefined))}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl bg-[#2A5FA5] hover:bg-[#244d8a] disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Start work
          </button>
        </div>
      </div>
    );
  }

  // In progress — mark complete
  if (isOwned && status === "IN_PROGRESS") {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => run(() => updateLeadStatus(requestId, "COMPLETED"))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Mark complete
        </button>
      </div>
    );
  }

  return null;
}
