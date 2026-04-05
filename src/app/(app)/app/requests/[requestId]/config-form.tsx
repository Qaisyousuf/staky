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
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { submitConfigAnswers, resubmitConfigItem } from "@/actions/config";
import { CONFIG_TYPE_LABELS, type ConfigItem } from "@/lib/config-templates";

interface Props {
  requestId: string;
  fromToolName: string;
  toToolName: string;
  configItems: ConfigItem[];
  configSentAt: string;
}

// ── Secret input with show/hide ───────────────────────────────────────────────

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-lg border border-gray-200 bg-white pr-10 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#2A5FA5] focus:outline-none font-mono"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Single item row (resubmit mode) ───────────────────────────────────────────

function RevisionItem({
  item,
  requestId,
}: {
  item: ConfigItem;
  requestId: string;
}) {
  const [answer, setAnswer] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!answer.trim()) {
      toast.error("Please enter an answer");
      return;
    }
    startTransition(async () => {
      try {
        await resubmitConfigItem(requestId, item.id, answer.trim(), item.type === "secret");
        toast.success("Answer resubmitted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to submit");
      }
    });
  }

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-3.5">
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{item.title}</span>
          <span className="rounded border border-orange-200 bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
            Revision requested
          </span>
        </div>
        {item.description && (
          <p className="mt-0.5 text-[11px] text-gray-500 leading-relaxed">{item.description}</p>
        )}
      </div>

      {/* Partner note */}
      {item.partnerNote && (
        <div className="mb-2.5 flex items-start gap-1.5 rounded-lg border border-orange-200 bg-white px-2.5 py-2">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
          <p className="text-[11px] text-orange-700 leading-relaxed">{item.partnerNote}</p>
        </div>
      )}

      {/* New answer input */}
      {item.type === "secret" ? (
        <SecretInput value={answer} onChange={setAnswer} placeholder="Enter updated value…" />
      ) : item.type === "url" ? (
        <input
          type="url"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#2A5FA5] focus:outline-none"
        />
      ) : (
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Update your answer…"
          rows={2}
          className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-[#2A5FA5] focus:outline-none"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#2A5FA5] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1e4a8a] transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        Resubmit
      </button>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function ConfigForm({
  requestId,
  fromToolName,
  toToolName,
  configItems,
  configSentAt,
}: Props) {
  // Track local answers keyed by item id
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    configItems.forEach((i) => {
      map[i.id] = i.answer && i.status !== "pending" ? "" : "";
    });
    return map;
  });
  const [isPending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState(false);

  const pendingItems = configItems.filter((i) => i.status === "pending");
  const revisionItems = configItems.filter((i) => i.status === "revision");
  const answeredItems = configItems.filter(
    (i) => i.status === "answered" || i.status === "approved"
  );
  const allDone =
    pendingItems.length === 0 &&
    revisionItems.length === 0 &&
    configItems.filter((i) => i.required).every((i) => i.status === "approved");

  function setAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit() {
    const requiredMissing = pendingItems.filter(
      (i) => i.required && !answers[i.id]?.trim()
    );
    if (requiredMissing.length) {
      toast.error(`Please fill in all required fields (${requiredMissing.length} missing)`);
      return;
    }

    const payload = pendingItems
      .filter((i) => answers[i.id]?.trim())
      .map((i) => ({
        id: i.id,
        answer: answers[i.id].trim(),
        isSecret: i.type === "secret",
      }));

    if (!payload.length) {
      toast.error("Please fill in at least one answer");
      return;
    }

    startTransition(async () => {
      try {
        await submitConfigAnswers(requestId, payload);
        toast.success("Configuration submitted to partner");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to submit");
      }
    });
  }

  // ── Count / state ─────────────────────────────────────────────────────────
  const approvedCount = configItems.filter((i) => i.status === "approved").length;
  const totalCount = configItems.length;

  const headerBadge = allDone
    ? "bg-green-50 text-[#0F6E56] border-green-200"
    : revisionItems.length > 0
    ? "bg-orange-50 text-orange-600 border-orange-200"
    : pendingItems.length > 0
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-blue-50 text-[#2A5FA5] border-blue-200";
  const headerLabel = allDone
    ? "Complete"
    : revisionItems.length > 0
    ? `${revisionItems.length} revision${revisionItems.length > 1 ? "s" : ""} needed`
    : pendingItems.length > 0
    ? "Action needed"
    : "Under review";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-5 py-3.5"
        onClick={() => setCollapsed((v) => !v)}
      >
        <ClipboardList className="h-4 w-4 shrink-0 text-[#2A5FA5]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Configuration Required</p>
          <p className="text-[11px] text-gray-400 truncate">
            {fromToolName} → {toToolName} · Your partner needs these details to proceed
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            headerBadge
          )}
        >
          {headerLabel}
        </span>
        <span className="text-[11px] text-gray-400 tabular-nums">
          {approvedCount}/{totalCount}
        </span>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </div>

      {!collapsed && (
        <div className="p-5 space-y-4">
          {/* ── All done ── */}
          {allDone && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-[#0F6E56]" />
              <div>
                <p className="text-sm font-bold text-[#0F6E56]">All done — your partner is reviewing</p>
                <p className="text-xs text-green-700">
                  Everything has been submitted and approved. Your partner will proceed.
                </p>
              </div>
            </div>
          )}

          {/* ── Revision items ── */}
          {revisionItems.length > 0 && (
            <div>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-orange-600">
                Revisions needed ({revisionItems.length})
              </p>
              <div className="space-y-3">
                {revisionItems.map((item) => (
                  <RevisionItem key={item.id} item={item} requestId={requestId} />
                ))}
              </div>
            </div>
          )}

          {/* ── Pending items (fill-in form) ── */}
          {pendingItems.length > 0 && (
            <div>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Fill in the required information ({pendingItems.length} remaining)
              </p>
              <p className="mb-3 text-[11px] text-gray-400">
                Requested on{" "}
                {new Date(configSentAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>

              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                          {item.required && (
                            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
                              Required
                            </span>
                          )}
                          <span className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            {CONFIG_TYPE_LABELS[item.type]}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Input based on type */}
                    {item.type === "secret" ? (
                      <SecretInput
                        value={answers[item.id] ?? ""}
                        onChange={(v) => setAnswer(item.id, v)}
                        placeholder="Enter sensitive value…"
                      />
                    ) : item.type === "url" ? (
                      <input
                        type="url"
                        value={answers[item.id] ?? ""}
                        onChange={(e) => setAnswer(item.id, e.target.value)}
                        placeholder="https://…"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#2A5FA5] focus:outline-none"
                      />
                    ) : item.type === "select" && item.options?.length ? (
                      <select
                        value={answers[item.id] ?? ""}
                        onChange={(e) => setAnswer(item.id, e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#2A5FA5] focus:outline-none"
                      >
                        <option value="">Select an option…</option>
                        {item.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : item.type === "checkbox" ? (
                      <div className="flex gap-4">
                        {["Yes", "No"].map((opt) => (
                          <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="radio"
                              name={`checkbox-${item.id}`}
                              value={opt}
                              checked={answers[item.id] === opt}
                              onChange={() => setAnswer(item.id, opt)}
                              className="accent-[#0F6E56]"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        value={answers[item.id] ?? ""}
                        onChange={(e) => setAnswer(item.id, e.target.value)}
                        placeholder="Enter your answer…"
                        rows={2}
                        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-[#2A5FA5] focus:outline-none"
                      />
                    )}

                    {/* Secret privacy notice */}
                    {item.type === "secret" && (
                      <p className="mt-1.5 text-[10px] text-gray-400">
                        This value will be encrypted and only visible to your partner.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit button */}
              <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg bg-[#0F6E56] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a5a45] transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit configuration
                </button>
              </div>
            </div>
          )}

          {/* ── Already-submitted items (read-only) ── */}
          {answeredItems.length > 0 && (
            <div>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Submitted ({answeredItems.length})
              </p>
              <div className="space-y-2">
                {answeredItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3.5 py-2.5",
                      item.status === "approved"
                        ? "border-green-200 bg-green-50/40"
                        : "border-blue-100 bg-blue-50/30"
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        item.status === "approved" ? "text-[#0F6E56]" : "text-[#2A5FA5]"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700">{item.title}</p>
                      {item.type !== "secret" && item.answer && (
                        <p className="mt-0.5 truncate text-[11px] text-gray-500">{item.answer}</p>
                      )}
                      {item.type === "secret" && (
                        <p className="mt-0.5 font-mono text-[11px] text-gray-400 tracking-widest">
                          ••••••••
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        item.status === "approved"
                          ? "border-green-200 bg-green-100 text-[#0F6E56]"
                          : "border-blue-200 bg-blue-100 text-[#2A5FA5]"
                      )}
                    >
                      {item.status === "approved" ? "Approved" : "Under review"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
