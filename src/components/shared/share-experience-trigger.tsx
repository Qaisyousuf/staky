"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { ShareExperienceModal } from "./share-experience-modal";

interface ShareExperienceTriggerProps {
  fromTool: string;
  toTool: string;
  fromToolName: string;
  toToolName: string;
  partnerName?: string | null;
  context?: string | null;
  isPartnerMode?: boolean;
}

export function ShareExperienceTrigger(props: ShareExperienceTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-green-100 shadow-sm">
            <Sparkles className="h-4 w-4 text-[#0F6E56]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {props.isPartnerMode ? "Share this success story" : "Share your migration experience"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {props.isPartnerMode
                ? "Help other businesses see what's possible — post this migration to the feed."
                : "Help others in the community by sharing what you learned from this switch."}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#0F6E56] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a5c47] transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Share
        </button>
      </div>

      {open && (
        <ShareExperienceModal
          {...props}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
