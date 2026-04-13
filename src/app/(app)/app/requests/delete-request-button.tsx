"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteRequest } from "./[requestId]/request-detail-actions";

export function DeleteRequestButton({ requestId }: { requestId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm) { setConfirm(true); return; }
    startTransition(async () => {
      await deleteRequest(requestId);
    });
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirm(false);
  }

  if (confirm) {
    return (
      <div
        className="flex items-center gap-1.5 shrink-0"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <button
          onClick={handleCancel}
          className="h-7 px-2.5 rounded-lg text-[11px] font-semibold text-[#5C6B5E] hover:bg-[#F7F9F8] transition-colors"
          style={{ border: "1.5px solid rgba(0,0,0,0.06)" }}
        >
          Keep
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
          style={{ border: "1.5px solid rgba(220,38,38,0.2)" }}
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          Delete
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="h-7 w-7 rounded-lg flex items-center justify-center text-[#9BA39C] hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
      title="Delete request"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
