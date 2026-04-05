"use client";

import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    status: "PENDING",
    label: "Submitted",
    short: "Sub",
    desc: "Request received and queued for review by our team.",
  },
  {
    status: "UNDER_REVIEW",
    label: "Under review",
    short: "Review",
    desc: "Our team is evaluating your request and finding the best partner match.",
  },
  {
    status: "MATCHED",
    label: "Partner assigned",
    short: "Matched",
    desc: "A migration partner has been assigned and is reviewing your request.",
  },
  {
    status: "PROPOSAL_SENT",
    label: "Proposal sent",
    short: "Proposal",
    desc: "Your partner has submitted a proposal — review and accept to proceed.",
  },
  {
    status: "ACCEPTED",
    label: "Accepted",
    short: "Accepted",
    desc: "Proposal accepted. Partner is preparing to start the migration.",
  },
  {
    status: "IN_PROGRESS",
    label: "In progress",
    short: "Active",
    desc: "Migration is actively underway.",
  },
  {
    status: "COMPLETED",
    label: "Completed",
    short: "Done",
    desc: "Migration completed successfully.",
  },
] as const;

type RequestStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "MATCHED"
  | "PROPOSAL_SENT"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

const ORDER: Record<RequestStatus, number> = {
  PENDING: 0,
  UNDER_REVIEW: 1,
  MATCHED: 2,
  PROPOSAL_SENT: 3,
  ACCEPTED: 4,
  IN_PROGRESS: 5,
  COMPLETED: 6,
  CANCELLED: -1,
};

export function RequestTimeline({ status }: { status: RequestStatus }) {
  const currentIdx = ORDER[status] ?? 0;
  const isCancelled = status === "CANCELLED";
  const isCompleted = status === "COMPLETED";
  const pct = Math.round(((currentIdx + (isCompleted ? 1 : 0.5)) / STAGES.length) * 100);
  const currentStage = STAGES[currentIdx];

  if (isCancelled) {
    return (
      <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
        <div className="h-[3px] bg-red-400" />
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
            <span className="text-sm font-bold text-red-500">✕</span>
          </div>
          <div>
            <p className="text-sm font-bold text-red-700">Request cancelled</p>
            <p className="text-[11px] text-red-400">This migration request was cancelled.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Gradient progress bar at top */}
      <div className="h-[3px] w-full bg-gray-100">
        <div
          className={cn(
            "h-full transition-all duration-700",
            isCompleted
              ? "bg-[#0F6E56]"
              : "bg-gradient-to-r from-[#0F6E56] to-[#2A5FA5]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            Migration pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 tabular-nums">
            {currentIdx + 1} / {STAGES.length}
          </span>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
              isCompleted
                ? "border-green-200 bg-green-50 text-[#0F6E56]"
                : status === "PROPOSAL_SENT"
                ? "border-violet-200 bg-violet-50 text-violet-600"
                : status === "IN_PROGRESS"
                ? "border-blue-200 bg-blue-50 text-[#2A5FA5]"
                : "border-gray-200 bg-gray-50 text-gray-600"
            )}
          >
            {isCompleted ? "Complete" : currentStage?.label}
          </span>
        </div>
      </div>

      {/* Stage track */}
      <div className="px-5 py-4">
        <div className="flex items-start">
          {STAGES.map((stage, idx) => {
            const done = idx < currentIdx || isCompleted;
            const active = idx === currentIdx && !isCompleted;
            const isProposal = stage.status === "PROPOSAL_SENT";

            return (
              <div key={stage.status} className="flex flex-1 flex-col items-center gap-1.5">
                {/* Track line + indicator */}
                <div className="flex w-full items-center">
                  {/* Left line */}
                  {idx > 0 && (
                    <div
                      className={cn(
                        "h-px flex-1 transition-all duration-500",
                        done || active ? "bg-[#0F6E56]" : "bg-gray-200"
                      )}
                    />
                  )}

                  {/* Indicator */}
                  {done ? (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0F6E56]">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    </div>
                  ) : active ? (
                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                      {/* Pulse ring */}
                      <span
                        className={cn(
                          "absolute inset-0 animate-ping rounded-full opacity-30",
                          isProposal ? "bg-violet-400" : "bg-[#2A5FA5]"
                        )}
                      />
                      <div
                        className={cn(
                          "relative flex h-6 w-6 items-center justify-center rounded-full",
                          isProposal
                            ? "border-2 border-violet-500 bg-violet-50"
                            : "border-2 border-[#2A5FA5] bg-blue-50"
                        )}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            isProposal ? "bg-violet-500" : "bg-[#2A5FA5]"
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    </div>
                  )}

                  {/* Right line */}
                  {idx < STAGES.length - 1 && (
                    <div
                      className={cn(
                        "h-px flex-1 transition-all duration-500",
                        done ? "bg-[#0F6E56]" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-center text-[10px] leading-tight transition-all",
                    active
                      ? isProposal
                        ? "font-bold text-violet-600"
                        : "font-bold text-[#2A5FA5]"
                      : done
                      ? "font-medium text-gray-400"
                      : "font-medium text-gray-300"
                  )}
                >
                  {/* Use short label on smaller screens via truncation */}
                  <span className="hidden sm:inline">{stage.label}</span>
                  <span className="sm:hidden">{stage.short}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current stage description */}
      {currentStage && (
        <div
          className={cn(
            "border-t px-5 py-2.5",
            isCompleted
              ? "border-green-100 bg-green-50/60"
              : status === "IN_PROGRESS"
              ? "border-blue-100 bg-blue-50/40"
              : status === "PROPOSAL_SENT"
              ? "border-violet-100 bg-violet-50/40"
              : "border-gray-100 bg-gray-50/60"
          )}
        >
          <p
            className={cn(
              "text-[11px] leading-relaxed",
              isCompleted
                ? "text-[#0F6E56]"
                : status === "IN_PROGRESS"
                ? "text-[#2A5FA5]"
                : status === "PROPOSAL_SENT"
                ? "text-violet-600"
                : "text-gray-500"
            )}
          >
            {currentStage.desc}
          </p>
        </div>
      )}
    </div>
  );
}
