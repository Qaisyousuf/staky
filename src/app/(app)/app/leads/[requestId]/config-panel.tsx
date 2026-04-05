"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  saveConfigItems,
  sendConfigRequest,
  reviewConfigItem,
  revealSecretAnswer,
} from "@/actions/config";
import { getConfigTemplate, CONFIG_TYPE_LABELS, type ConfigItem } from "@/lib/config-templates";

interface Props {
  requestId: string;
  fromTool: string;
  fromToolName: string;
  toToolName: string;
  configItems: ConfigItem[] | null;
  configSentAt: string | null;
}

// ── Status helpers ────────────────────────────────────────────────────────────

function allRequiredApproved(items: ConfigItem[]) {
  return items.filter((i) => i.required).every((i) => i.status === "approved");
}

function getOverallState(items: ConfigItem[], configSentAt: string | null) {
  if (!configSentAt) return "draft";
  const hasAnswered = items.some((i) => i.status === "answered" || i.status === "approved" || i.status === "revision");
  if (!hasAnswered) return "sent";
  if (allRequiredApproved(items)) return "complete";
  return "reviewing";
}

// ── Reveal button (per item) ──────────────────────────────────────────────────

function RevealButton({ requestId, itemId }: { requestId: string; itemId: string }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReveal() {
    if (revealed) {
      setRevealed(null);
      return;
    }
    setLoading(true);
    try {
      const res = await revealSecretAnswer(requestId, itemId);
      setRevealed(res.value);
    } catch {
      toast.error("Failed to reveal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-1.5 flex items-center gap-2">
      {revealed ? (
        <code className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 font-mono text-xs text-amber-800 break-all select-all">
          {revealed}
        </code>
      ) : (
        <span className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-xs text-gray-400 tracking-widest">
          ••••••••••••
        </span>
      )}
      <button
        onClick={handleReveal}
        disabled={loading}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : revealed ? (
          <><EyeOff className="h-3.5 w-3.5" /> Hide</>
        ) : (
          <><Eye className="h-3.5 w-3.5" /> Reveal</>
        )}
      </button>
    </div>
  );
}

// ── Revision note modal ───────────────────────────────────────────────────────

function RevisionModal({
  onSubmit,
  onCancel,
}: {
  onSubmit: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50 p-3">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-600">
        Revision note for client
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Explain what needs to be corrected…"
        rows={2}
        className="w-full resize-none rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:border-orange-400 focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => onSubmit(note)}
          className="rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          Request revision
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ConfigPanel({
  requestId,
  fromTool,
  fromToolName,
  toToolName,
  configItems,
  configSentAt,
}: Props) {
  const template = getConfigTemplate(fromTool);
  const [items, setItems] = useState<ConfigItem[]>(configItems ?? template);
  const [isPending, startTransition] = useTransition();
  const [revisionFor, setRevisionFor] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const state = getOverallState(items, configSentAt);

  // ── Editing helpers (only in draft state) ─────────────────────────────────

  function updateItem(id: string, patch: Partial<ConfigItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function addItem() {
    const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    setItems((prev) => [
      ...prev,
      { id, title: "", description: "", type: "text", required: false, status: "pending" },
    ]);
  }

  function resetToTemplate() {
    setItems(template);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  function handleSaveDraft() {
    startTransition(async () => {
      try {
        await saveConfigItems(requestId, items);
        toast.success("Draft saved");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  function handleSend() {
    const missing = items.filter((i) => i.required && !i.title.trim());
    if (missing.length) {
      toast.error("All required items must have a title");
      return;
    }
    startTransition(async () => {
      try {
        await sendConfigRequest(requestId, items);
        toast.success("Configuration request sent to client");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to send");
      }
    });
  }

  function handleApprove(itemId: string) {
    startTransition(async () => {
      try {
        await reviewConfigItem(requestId, itemId, "approve");
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, status: "approved", partnerNote: undefined } : i
          )
        );
        toast.success("Answer approved");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleRequestRevision(itemId: string, note: string) {
    startTransition(async () => {
      try {
        await reviewConfigItem(requestId, itemId, "revision", note);
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, status: "revision", partnerNote: note } : i
          )
        );
        setRevisionFor(null);
        toast.success("Revision requested");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  // ── Status badge ─────────────────────────────────────────────────────────

  const stateBadge: Record<string, string> = {
    draft: "bg-gray-100 text-gray-500 border-gray-200",
    sent: "bg-blue-50 text-[#2A5FA5] border-blue-200",
    reviewing: "bg-amber-50 text-amber-700 border-amber-200",
    complete: "bg-green-50 text-[#0F6E56] border-green-200",
  };
  const stateLabel: Record<string, string> = {
    draft: "Draft",
    sent: "Awaiting client",
    reviewing: "In review",
    complete: "Complete",
  };

  const answeredCount = items.filter(
    (i) => i.status === "answered" || i.status === "approved" || i.status === "revision"
  ).length;
  const approvedCount = items.filter((i) => i.status === "approved").length;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-5 py-3.5"
        onClick={() => setCollapsed((v) => !v)}
      >
        <ClipboardList className="h-4 w-4 shrink-0 text-[#2A5FA5]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Configuration Requirements</p>
          <p className="text-[11px] text-gray-400 truncate">
            {fromToolName} → {toToolName}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            stateBadge[state]
          )}
        >
          {stateLabel[state]}
        </span>
        {state !== "draft" && (
          <span className="text-[11px] text-gray-400 tabular-nums">
            {approvedCount}/{items.length}
          </span>
        )}
        {collapsed ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </div>

      {!collapsed && (
        <div className="p-5">
          {/* ── COMPLETE banner ── */}
          {state === "complete" && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-[#0F6E56]" />
              <div>
                <p className="text-sm font-bold text-[#0F6E56]">All configuration approved</p>
                <p className="text-xs text-green-700">
                  All required items have been answered and approved.
                </p>
              </div>
            </div>
          )}

          {/* ── SENT banner ── */}
          {state === "sent" && (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-semibold text-[#2A5FA5]">
                Sent to client — awaiting answers
              </p>
              <p className="text-[11px] text-blue-500 mt-0.5">
                Sent{" "}
                {configSentAt
                  ? new Date(configSentAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })
                  : ""}
              </p>
            </div>
          )}

          {/* ── REVIEWING progress ── */}
          {state === "reviewing" && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">
                  {answeredCount} of {items.length} answered — review each item
                </p>
              </div>
              <span className="text-xs text-amber-600 tabular-nums">
                {approvedCount} approved
              </span>
            </div>
          )}

          {/* ── Item list ── */}
          <div className="space-y-3">
            {items.map((item, idx) => {
              const isEditable = state === "draft";
              const hasAnswer =
                item.status === "answered" ||
                item.status === "approved" ||
                item.status === "revision";

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border p-3.5 transition-colors",
                    item.status === "approved"
                      ? "border-green-200 bg-green-50/50"
                      : item.status === "revision"
                      ? "border-orange-200 bg-orange-50/40"
                      : item.status === "answered"
                      ? "border-blue-200 bg-blue-50/30"
                      : "border-gray-100 bg-gray-50/50"
                  )}
                >
                  {/* Row header */}
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-[10px] font-bold text-gray-400">
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      {isEditable ? (
                        /* Editable title */
                        <input
                          value={item.title}
                          onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          placeholder="Item title *"
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-800 placeholder-gray-400 focus:border-[#2A5FA5] focus:outline-none"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      )}

                      {isEditable ? (
                        <textarea
                          value={item.description ?? ""}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          placeholder="Description / instructions for client (optional)"
                          rows={1}
                          className="mt-1 w-full resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 placeholder-gray-400 focus:border-[#2A5FA5] focus:outline-none"
                        />
                      ) : (
                        item.description && (
                          <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                            {item.description}
                          </p>
                        )
                      )}

                      {/* Type + required selectors (draft only) */}
                      {isEditable && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <select
                            value={item.type}
                            onChange={(e) =>
                              updateItem(item.id, {
                                type: e.target.value as ConfigItem["type"],
                              })
                            }
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-600 focus:outline-none"
                          >
                            <option value="text">Text</option>
                            <option value="url">URL / Link</option>
                            <option value="secret">Secret</option>
                            <option value="select">Choice</option>
                            <option value="checkbox">Yes / No</option>
                          </select>
                          <label className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <input
                              type="checkbox"
                              checked={item.required}
                              onChange={(e) => updateItem(item.id, { required: e.target.checked })}
                              className="h-3 w-3 rounded border-gray-300 accent-[#0F6E56]"
                            />
                            Required
                          </label>
                        </div>
                      )}

                      {/* Answer area (review state) */}
                      {hasAnswer && (
                        <div className="mt-2">
                          {item.type === "secret" ? (
                            <RevealButton requestId={requestId} itemId={item.id} />
                          ) : (
                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 break-words">
                              {item.answer || <span className="text-gray-400 italic">No answer</span>}
                            </div>
                          )}
                          {item.answeredAt && (
                            <p className="mt-1 text-[10px] text-gray-400">
                              Answered{" "}
                              {new Date(item.answeredAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Partner revision note */}
                      {item.status === "revision" && item.partnerNote && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-2">
                          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                          <p className="text-[11px] text-orange-700 leading-relaxed">
                            {item.partnerNote}
                          </p>
                        </div>
                      )}

                      {/* Revision input */}
                      {revisionFor === item.id && (
                        <RevisionModal
                          onSubmit={(note) => handleRequestRevision(item.id, note)}
                          onCancel={() => setRevisionFor(null)}
                        />
                      )}
                    </div>

                    {/* Right side: type badge + status + actions */}
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {/* Type label */}
                      {!isEditable && (
                        <span className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          {CONFIG_TYPE_LABELS[item.type]}
                        </span>
                      )}

                      {/* Required badge */}
                      {item.required && (
                        <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-bold text-gray-400">
                          Required
                        </span>
                      )}

                      {/* Status pill */}
                      {!isEditable && (
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            item.status === "approved"
                              ? "border-green-200 bg-green-100 text-[#0F6E56]"
                              : item.status === "revision"
                              ? "border-orange-200 bg-orange-100 text-orange-600"
                              : item.status === "answered"
                              ? "border-blue-200 bg-blue-100 text-[#2A5FA5]"
                              : "border-gray-200 bg-gray-100 text-gray-500"
                          )}
                        >
                          {item.status === "approved"
                            ? "Approved"
                            : item.status === "revision"
                            ? "Revision sent"
                            : item.status === "answered"
                            ? "Needs review"
                            : "Pending"}
                        </span>
                      )}

                      {/* Review buttons (answered state) */}
                      {item.status === "answered" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={isPending}
                            className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-[11px] font-semibold text-[#0F6E56] hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setRevisionFor(item.id)}
                            disabled={isPending}
                            className="flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-600 hover:bg-orange-100 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Revision
                          </button>
                        </div>
                      )}

                      {/* Undo approve back to answered */}
                      {item.status === "approved" && (
                        <button
                          onClick={() => {
                            startTransition(async () => {
                              try {
                                await reviewConfigItem(requestId, item.id, "revision", "");
                                setItems((prev) =>
                                  prev.map((i) =>
                                    i.id === item.id
                                      ? { ...i, status: "answered", partnerNote: undefined }
                                      : i
                                  )
                                );
                              } catch {
                                toast.error("Failed to undo approval");
                              }
                            });
                          }}
                          disabled={isPending}
                          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Undo
                        </button>
                      )}

                      {/* Delete button (draft only) */}
                      {isEditable && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded-lg p-1 text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Draft actions ── */}
          {state === "draft" && (
            <>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add item
                </button>
                <button
                  onClick={resetToTemplate}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset to template
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <button
                  onClick={handleSaveDraft}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save draft
                </button>
                <button
                  onClick={handleSend}
                  disabled={isPending || items.length === 0}
                  className="flex items-center gap-2 rounded-lg bg-[#2A5FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e4a8a] transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send to client
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
