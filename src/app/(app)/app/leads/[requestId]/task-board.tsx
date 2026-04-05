"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  AlertCircle,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Loader2,
  Minus,
  Play,
  Plus,
  RefreshCw,
  Terminal,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { addTask, deleteTask, updateTaskStatus } from "@/actions/partner";
import { cn } from "@/lib/utils";
import type { MigrationTask, TaskPriority } from "@/lib/request-utils";

// ─── Priority config ────────────────────────────────────────────

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; icon: React.ReactNode; badge: string }
> = {
  low: {
    label: "Low",
    icon: <Minus className="h-3 w-3" />,
    badge: "bg-gray-100 text-gray-500 border-gray-200",
  },
  medium: {
    label: "Medium",
    icon: <ArrowUp className="h-3 w-3 rotate-45" />,
    badge: "bg-blue-50 text-[#2A5FA5] border-blue-200",
  },
  high: {
    label: "High",
    icon: <ArrowUp className="h-3 w-3" />,
    badge: "bg-orange-50 text-orange-600 border-orange-200",
  },
  urgent: {
    label: "Urgent",
    icon: <AlertCircle className="h-3 w-3" />,
    badge: "bg-red-50 text-red-600 border-red-200",
  },
};

// ─── Status config ──────────────────────────────────────────────

type TaskStatus = MigrationTask["status"];

const STATUS_META: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; pill: string; row: string }
> = {
  todo: {
    label: "Todo",
    icon: <Circle className="h-3.5 w-3.5" />,
    pill: "bg-gray-100 text-gray-600 border-gray-200",
    row: "border-gray-100 bg-white hover:border-gray-200",
  },
  in_progress: {
    label: "In Progress",
    icon: <Clock className="h-3.5 w-3.5" />,
    pill: "bg-blue-50 text-[#2A5FA5] border-blue-200",
    row: "border-[#2A5FA5]/15 bg-blue-50/30 hover:border-[#2A5FA5]/25",
  },
  done: {
    label: "Done",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    pill: "bg-green-50 text-[#0F6E56] border-green-200",
    row: "border-green-100 bg-green-50/30 hover:border-green-200",
  },
};

// ─── Progress ring ─────────────────────────────────────────────

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const color = pct === 100 ? "#0F6E56" : "#2A5FA5";
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
      <circle
        cx="26" cy="26" r={r}
        fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        className="transition-all duration-500"
      />
      <text
        x="26" y="26"
        dominantBaseline="central" textAnchor="middle"
        fontSize="10" fontWeight="800" fill={color}
        style={{ transform: "rotate(90deg)", transformOrigin: "26px 26px" }}
      >
        {pct}%
      </text>
    </svg>
  );
}

// ─── Status dropdown ────────────────────────────────────────────

function StatusDropdown({
  current,
  onSelect,
  disabled,
}: {
  current: TaskStatus;
  onSelect: (s: TaskStatus) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const meta = STATUS_META[current];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
          meta.pill,
          !disabled && "hover:opacity-80 cursor-pointer"
        )}
      >
        {meta.icon}
        {meta.label}
        {!disabled && <ChevronDown className="h-3 w-3 opacity-60" />}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {(["todo", "in_progress", "done"] as TaskStatus[]).map((s) => {
            const m = STATUS_META[s];
            return (
              <button
                key={s}
                onClick={() => { onSelect(s); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold transition-colors hover:bg-gray-50",
                  s === current ? "text-gray-900 bg-gray-50" : "text-gray-600"
                )}
              >
                <span className={cn("flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]", m.pill)}>
                  {m.icon}
                </span>
                {m.label}
                {s === current && <Check className="ml-auto h-3.5 w-3.5 text-gray-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Task row ──────────────────────────────────────────────────

function TaskRow({
  task,
  requestId,
}: {
  task: MigrationTask;
  requestId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const priorityMeta = task.priority ? PRIORITY_META[task.priority] : null;
  const isDone = task.status === "done";

  const setStatus = (status: TaskStatus) =>
    startTransition(async () => {
      try {
        await updateTaskStatus(requestId, task.id, status);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    });

  const remove = () =>
    startTransition(async () => {
      try {
        await deleteTask(requestId, task.id);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete");
      }
    });

  // Quick action button
  const quickAction =
    task.status === "todo"
      ? { label: "Start", icon: <Play className="h-3 w-3" />, next: "in_progress" as TaskStatus, cls: "text-[#2A5FA5] border-[#2A5FA5]/30 bg-blue-50 hover:bg-blue-100" }
      : task.status === "in_progress"
      ? { label: "Complete", icon: <Check className="h-3 w-3" />, next: "done" as TaskStatus, cls: "text-[#0F6E56] border-green-300 bg-green-50 hover:bg-green-100" }
      : { label: "Reopen", icon: <RefreshCw className="h-3 w-3" />, next: "todo" as TaskStatus, cls: "text-gray-500 border-gray-200 bg-gray-50 hover:bg-gray-100" };

  return (
    <div className={cn(
      "group rounded-xl border transition-all",
      STATUS_META[task.status].row,
      isPending && "opacity-50"
    )}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
        </button>

        {/* Title */}
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-sm font-semibold leading-snug",
            isDone ? "text-gray-400 line-through" : "text-gray-800"
          )}>
            {task.title}
          </p>
          {/* inline meta */}
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {priorityMeta && !isDone && (
              <span className={cn("inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-bold", priorityMeta.badge)}>
                {priorityMeta.icon} {priorityMeta.label}
              </span>
            )}
            {task.estimatedTime && (
              <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                <Timer className="h-3 w-3" /> {task.estimatedTime}
              </span>
            )}
            {isDone && task.completedAt && (
              <span className="flex items-center gap-0.5 text-[11px] text-[#0F6E56]">
                <CheckCircle2 className="h-3 w-3" />
                {new Date(task.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>
        </div>

        {/* Status dropdown */}
        <StatusDropdown current={task.status} onSelect={setStatus} disabled={isPending} />

        {/* Quick action */}
        <button
          onClick={() => setStatus(quickAction.next)}
          disabled={isPending}
          className={cn(
            "hidden sm:flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-40",
            quickAction.cls
          )}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : quickAction.icon}
          {quickAction.label}
        </button>

        {/* Delete */}
        <button
          onClick={remove}
          disabled={isPending}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5 text-gray-300 hover:text-red-400 transition-colors" />
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (task.description || task.techNote) && (
        <div className="border-t border-current/10 px-4 pb-3.5 pt-3 space-y-2.5 border-gray-100">
          {task.description && (
            <p className="text-xs leading-relaxed text-gray-500">{task.description}</p>
          )}
          {task.techNote && (
            <div className="flex items-start gap-2 rounded-xl border border-gray-700/20 bg-gray-950 px-3 py-2.5">
              <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
              <code className="font-mono text-[11px] leading-relaxed text-green-300 break-all">
                {task.techNote}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Ticket modal ──────────────────────────────────────────────

function TaskModal({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [techNote, setTechNote] = useState("");
  const [showTech, setShowTech] = useState(false);

  const submit = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        await addTask(requestId, {
          title,
          description: description || undefined,
          priority: priority || undefined,
          estimatedTime: estimatedTime || undefined,
          techNote: techNote || undefined,
        });
        onClose();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add task");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2A5FA5]/10">
              <Plus className="h-4 w-4 text-[#2A5FA5]" />
            </div>
            <p className="text-sm font-bold text-gray-900">New task</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
            placeholder="Task title *"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:border-[#2A5FA5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2A5FA5]/15 transition-colors"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description — what needs to be done? (optional)"
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-[#2A5FA5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2A5FA5]/15 transition-colors"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Priority</p>
              <div className="flex flex-wrap gap-1.5">
                {(["low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => {
                  const m = PRIORITY_META[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(priority === p ? "" : p)}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all",
                        priority === p
                          ? m.badge + " ring-2 ring-offset-1 ring-current"
                          : "border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300"
                      )}
                    >
                      {m.icon} {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Estimated time</p>
              <div className="relative">
                <Timer className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="e.g. 2h, 3 days"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-[#2A5FA5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2A5FA5]/15 transition-colors"
                />
              </div>
            </div>
          </div>

          {showTech ? (
            <div className="rounded-xl border border-gray-700/30 bg-gray-950 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="ml-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Technical note / command
                  </span>
                </div>
                <button onClick={() => { setShowTech(false); setTechNote(""); }} className="text-gray-600 hover:text-gray-400 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 font-mono text-xs text-green-500">$</span>
                <textarea
                  autoFocus
                  value={techNote}
                  onChange={(e) => setTechNote(e.target.value)}
                  placeholder="pg_dump shopify_prod > backup.sql"
                  rows={2}
                  className="flex-1 resize-none bg-transparent font-mono text-[12px] leading-relaxed text-green-300 placeholder-green-900 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <button onClick={() => setShowTech(true)} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-[#2A5FA5] transition-colors">
              <Terminal className="h-3.5 w-3.5" /> Add technical note / command
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            {priority && (
              <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold", PRIORITY_META[priority].badge)}>
                {PRIORITY_META[priority].icon} {PRIORITY_META[priority].label}
              </span>
            )}
            {estimatedTime && (
              <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                <Timer className="h-2.5 w-2.5" /> {estimatedTime}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!title.trim() || isPending}
              className="flex items-center gap-1.5 rounded-xl bg-[#2A5FA5] px-5 py-2 text-sm font-semibold text-white hover:bg-[#244d8a] disabled:opacity-40 transition-colors"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────

export function TaskBoard({
  requestId,
  tasks,
  readonly = false,
}: {
  requestId: string;
  tasks: MigrationTask[];
  readonly?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);

  const todo = tasks.filter((t) => t.status === "todo");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const done = tasks.filter((t) => t.status === "done");
  const total = tasks.length;
  const doneCount = done.length;

  // Display order: in_progress first, then todo, then done
  const ordered = [...inProgress, ...todo, ...done];

  return (
    <>
      {showModal && <TaskModal requestId={requestId} onClose={() => setShowModal(false)} />}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-4">
          {total > 0 ? (
            <ProgressRing done={doneCount} total={total} />
          ) : (
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-gray-200">
              <Plus className="h-5 w-5 text-gray-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Project Tasks</p>
            <p className="mt-0.5 text-xs text-gray-400">
              {total === 0
                ? "No tasks yet"
                : `${doneCount} of ${total} done · ${inProgress.length} in progress`}
            </p>
          </div>
          {!readonly && (
            <button
              onClick={() => setShowModal(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#2A5FA5] px-4 py-2 text-xs font-semibold text-white hover:bg-[#244d8a] transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> New task
            </button>
          )}
        </div>

        {/* Task list */}
        <div className="p-3 space-y-2">
          {total === 0 && !readonly && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-10 text-center rounded-xl border-2 border-dashed border-gray-100 hover:border-[#2A5FA5]/30 hover:bg-blue-50/20 transition-colors group"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 group-hover:border-[#2A5FA5]/40 transition-colors">
                <Plus className="h-5 w-5 text-gray-300 group-hover:text-[#2A5FA5]/60 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-gray-400">Create your first task</p>
              <p className="mt-1 text-xs text-gray-300">Break down this migration into specific steps</p>
            </button>
          )}

          {ordered.map((task) => (
            <TaskRow key={task.id} task={task} requestId={requestId} />
          ))}
        </div>

        {/* Status summary footer (only when tasks exist) */}
        {total > 0 && (
          <div className="flex items-center gap-4 border-t border-gray-50 px-5 py-3">
            {[
              { label: "Todo", count: todo.length, cls: "text-gray-500" },
              { label: "In Progress", count: inProgress.length, cls: "text-[#2A5FA5]" },
              { label: "Done", count: doneCount, cls: "text-[#0F6E56]" },
            ].map(({ label, count, cls }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={cn("text-sm font-bold tabular-nums", cls)}>{count}</span>
                <span className="text-[11px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
