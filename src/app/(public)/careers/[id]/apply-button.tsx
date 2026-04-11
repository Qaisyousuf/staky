"use client";

import { useState } from "react";
import { ApplyModal } from "./apply-modal";

export function ApplyButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-xl px-6 py-3 text-[14px] font-semibold text-white transition-all hover:-translate-y-px"
        style={{
          background: "#0F6E56",
          boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(15,110,86,0.35), 0 8px 24px rgba(15,110,86,0.18)",
        }}
      >
        Apply now
      </button>

      {open && (
        <ApplyModal jobId={jobId} jobTitle={jobTitle} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
