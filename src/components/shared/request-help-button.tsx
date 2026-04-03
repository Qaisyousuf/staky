"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";
import { createMigrationRequest } from "@/actions/requests";
import { TOOLS } from "@/data/mock-data";
import { buildRequestSummary, type RequestSource, type RequestSwitch } from "@/lib/request-utils";
import { cn } from "@/lib/utils";

interface RequestHelpButtonProps {
  source: RequestSource;
  partnerUserId?: string;
  partnerName?: string | null;
  switches?: RequestSwitch[];
  isAuthenticated?: boolean;
  label?: string;
  className?: string;
  sentClassName?: string;
  guestHref?: string;
}

export function RequestHelpButton({
  source,
  partnerUserId,
  partnerName,
  switches = [],
  isAuthenticated = true,
  label = "Get help switching",
  className,
  sentClassName,
  guestHref = "/login",
}: RequestHelpButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [isPending, startTransition] = useTransition();

  const previewSummary = useMemo(
    () => buildRequestSummary({ source, switches, partnerName }),
    [partnerName, source, switches]
  );

  if (!isAuthenticated) {
    return (
      <Link href={guestHref} className={className}>
        {label}
      </Link>
    );
  }

  const handleSend = () => {
    startTransition(async () => {
      try {
        const result = await createMigrationRequest({ source, partnerUserId, switches, urgency });
        setSent(true);
        setOpen(false);
        router.push(`/app/requests/${result.requestId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to send request.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => !sent && setOpen(true)}
        disabled={isPending || sent}
        className={cn(
          sent
            ? "inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2 text-xs font-semibold text-[#0F6E56]"
            : className,
          isPending && "opacity-70"
        )}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : sent ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : null}
        {sent ? "Request sent" : label}
      </button>

      {error && !open && (
        <p className="mt-2 text-xs text-amber-600">{error}</p>
      )}

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Send request</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  Your request is built automatically from your profile and stack.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Auto-generated preview */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium text-gray-700">{previewSummary}</p>
              {switches.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {switches.slice(0, 4).map((item) => (
                    <span
                      key={`${item.fromTool}-${item.toTool}`}
                      className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-600"
                    >
                      {TOOLS[item.fromTool]?.name ?? item.fromTool}
                      <ArrowRight className="mx-1 h-3 w-3 text-gray-300" />
                      {TOOLS[item.toTool]?.name ?? item.toTool}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Urgency — simple dropdown, no typing needed */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-gray-700">How urgent is this?</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#0F6E56] focus:outline-none"
              >
                <option value="low">Low — no rush</option>
                <option value="medium">Medium — within a few weeks</option>
                <option value="high">High — within a week</option>
                <option value="urgent">Urgent — as soon as possible</option>
              </select>
            </div>

            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isPending}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg bg-[#0F6E56] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0d5f4a]",
                  sentClassName
                )}
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
