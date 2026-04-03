"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { status: "PENDING", label: "Submitted" },
  { status: "UNDER_REVIEW", label: "Under review" },
  { status: "MATCHED", label: "Partner assigned" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "COMPLETED", label: "Completed" },
] as const;

type RequestStatus = "PENDING" | "UNDER_REVIEW" | "MATCHED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const ORDER: Record<RequestStatus, number> = {
  PENDING: 0,
  UNDER_REVIEW: 1,
  MATCHED: 2,
  ACCEPTED: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
  CANCELLED: -1,
};

export function RequestTimeline({ status }: { status: RequestStatus }) {
  const currentOrder = ORDER[status] ?? 0;
  const isCancelled = status === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="rounded-[22px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
        This request was cancelled.
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Progress</p>
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const stepOrder = ORDER[step.status as RequestStatus];
          const done = stepOrder < currentOrder;
          const active = stepOrder === currentOrder;

          return (
            <div key={step.status} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {idx > 0 && (
                  <div className={cn("h-0.5 flex-1", done || active ? "bg-[#0F6E56]" : "bg-gray-200")} />
                )}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                    done
                      ? "border-[#0F6E56] bg-[#0F6E56] text-white"
                      : active
                      ? "border-[#0F6E56] bg-white text-[#0F6E56]"
                      : "border-gray-200 bg-white text-gray-300"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <span>{idx + 1}</span>}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn("h-0.5 flex-1", done ? "bg-[#0F6E56]" : "bg-gray-200")} />
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-center text-[10px] font-medium leading-tight",
                  active ? "text-[#0F6E56]" : done ? "text-gray-500" : "text-gray-300"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
