"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface LoginPromptButtonProps {
  action: string; // e.g. "like this post"
  className?: string;
  children: React.ReactNode;
  onClick?: () => void; // optional real action when logged in
}

export function LoginPromptButton({ action, className, children, onClick }: LoginPromptButtonProps) {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Already logged in — just run the action (or no-op for now)
  if (status === "authenticated") {
    return (
      <button type="button" className={className} onClick={onClick}>
        {children}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={className}
      >
        {children}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-52 rounded-xl border border-gray-200 bg-white shadow-lg p-3 text-center">
          {/* Arrow */}
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 block h-3 w-3 rotate-45 border-b border-r border-gray-200 bg-white" />
          <p className="text-xs text-gray-600 mb-2">
            Sign in to {action}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full rounded-lg bg-[#0F6E56] hover:bg-[#0d5f4a] text-white text-xs font-medium py-1.5 transition-colors"
          >
            Sign in
          </Link>
          <p className="mt-1.5 text-[10px] text-gray-400">
            No account?{" "}
            <Link href="/signup" className="text-[#0F6E56] hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
