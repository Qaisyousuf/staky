"use client";

import { useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { respondToProposal } from "@/actions/requests";

export function ProposalActions({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();

  const run = (accept: boolean) =>
    startTransition(async () => {
      try {
        await respondToProposal(requestId, accept);
      } catch {}
    });

  return (
    <div className="flex items-center justify-end gap-2 pt-3 border-t border-violet-200 mt-4">
      <p className="flex-1 text-xs text-gray-500">
        Review the proposal above and let the partner know if you want to proceed.
      </p>
      <button
        onClick={() => run(false)}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:text-gray-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        Decline
      </button>
      <button
        onClick={() => run(true)}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-xl bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition-colors"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        Accept proposal
      </button>
    </div>
  );
}
