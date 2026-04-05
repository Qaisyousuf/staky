"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Loader2, RotateCcw } from "lucide-react";
import { togglePhase } from "@/actions/partner";
import { cn } from "@/lib/utils";
import type { MigrationPhase } from "@/lib/request-utils";

function ProgressRing({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0 -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#0F6E56"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        className="transition-all duration-500"
      />
      <text
        x="36"
        y="36"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#0F6E56"
        className="rotate-90"
        style={{ transform: "rotate(90deg)", transformOrigin: "36px 36px" }}
      >
        {pct}%
      </text>
    </svg>
  );
}

function PhaseCard({
  phase,
  index,
  isActive,
  requestId,
}: {
  phase: MigrationPhase;
  index: number;
  isActive: boolean;
  requestId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteValue, setNoteValue] = useState(phase.notes ?? "");

  const complete = (notes?: string) =>
    startTransition(async () => {
      await togglePhase(requestId, phase.id, true, notes);
      setShowNoteInput(false);
    });

  const undo = () =>
    startTransition(async () => {
      await togglePhase(requestId, phase.id, false);
    });

  if (phase.done) {
    return (
      <div className="group rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 transition-colors">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0F6E56]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#0F6E56]">
                {index + 1}. {phase.label}
              </span>
              <span className="ml-auto shrink-0 text-[11px] tabular-nums text-gray-400">
                {phase.completedAt &&
                  new Date(phase.completedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
              </span>
            </div>
            {phase.notes && (
              <p className="mt-1 text-xs text-[#0F6E56]/70 leading-relaxed">{phase.notes}</p>
            )}
          </div>
          <button
            onClick={undo}
            disabled={isPending}
            className="ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Mark as undone"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 px-4 py-3.5 transition-all",
        isActive
          ? "border-[#2A5FA5] bg-blue-50/60 shadow-sm"
          : "border-gray-100 bg-white hover:border-gray-200"
      )}
    >
      <div className="flex items-center gap-3">
        {isActive ? (
          <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2A5FA5] opacity-20" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#2A5FA5]" />
          </span>
        ) : (
          <Circle className="h-5 w-5 shrink-0 text-gray-300" />
        )}
        <span
          className={cn(
            "flex-1 text-sm font-medium",
            isActive ? "text-[#2A5FA5] font-semibold" : "text-gray-500"
          )}
        >
          {index + 1}. {phase.label}
        </span>
        {isActive && (
          <span className="shrink-0 rounded-full bg-[#2A5FA5]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2A5FA5]">
            Current
          </span>
        )}
      </div>

      {isActive && (
        <div className="mt-3 pl-8">
          {showNoteInput ? (
            <div className="space-y-2">
              <textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="Add a completion note (optional)..."
                rows={2}
                className="w-full resize-none rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2A5FA5]/30"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => complete(noteValue)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0F6E56] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0d5f4a] disabled:opacity-50 transition-colors"
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Mark complete
                </button>
                <button
                  onClick={() => setShowNoteInput(false)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNoteInput(true)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-[#2A5FA5]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#2A5FA5] hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Mark complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MigrationPhasesEditor({
  requestId,
  phases,
}: {
  requestId: string;
  phases: MigrationPhase[];
}) {
  const done = phases.filter((p) => p.done).length;
  const pct = phases.length > 0 ? Math.round((done / phases.length) * 100) : 0;
  const activeIndex = phases.findIndex((p) => !p.done);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-4">
        <ProgressRing pct={pct} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">Migration Phases</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {done} of {phases.length} phases completed
          </p>
          {done === phases.length && (
            <p className="mt-1 text-xs font-semibold text-[#0F6E56]">
              All phases done — ready to mark complete
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-black tabular-nums text-[#0F6E56]">{done}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            / {phases.length}
          </p>
        </div>
      </div>

      {/* Phase cards */}
      <div className="space-y-2 p-4">
        {phases.map((phase, idx) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            index={idx}
            isActive={idx === activeIndex}
            requestId={requestId}
          />
        ))}
      </div>
    </div>
  );
}
