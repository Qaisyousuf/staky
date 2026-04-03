"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Zap, Handshake, ArrowRight, Loader2 } from "lucide-react";
import { setActiveMode } from "@/actions/partner-mode";

interface ModeSelectClientProps {
  userName: string | null;
  userImage: string | null;
}

export function ModeSelectClient({ userName }: ModeSelectClientProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [selecting, setSelecting] = useState<"user" | "partner" | null>(null);

  const firstName = userName?.split(" ")[0] ?? "there";

  const handleSelect = (mode: "user" | "partner") => {
    setSelecting(mode);
    startTransition(async () => {
      await setActiveMode(mode);
      await update();
      router.push("/app/dashboard");
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="inline-flex items-center justify-center h-5 w-7 rounded bg-[#003399] text-[#FFCC00] text-[9px] font-bold tracking-widest select-none">
            EU
          </span>
          <span className="font-bold text-[17px] text-gray-900 tracking-tight leading-none">
            Staky<span className="text-[#0F6E56]">.</span>
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Which account would you like to use?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Switcher card */}
        <button
          type="button"
          onClick={() => handleSelect("user")}
          disabled={isPending}
          className="flex flex-col items-start gap-3 rounded-xl border-2 border-gray-200 p-5 text-left transition-all hover:border-[#0F6E56] hover:bg-green-50 disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-[#0F6E56] transition-colors">
            {selecting === "user" && isPending ? (
              <Loader2 className="h-5 w-5 text-gray-500 group-hover:text-white animate-spin" />
            ) : (
              <Zap className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-[#0F6E56] transition-colors">
              Switcher
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">
              Browse EU tools and share your journey
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#0F6E56] transition-colors mt-auto self-end" />
        </button>

        {/* Partner card */}
        <button
          type="button"
          onClick={() => handleSelect("partner")}
          disabled={isPending}
          className="flex flex-col items-start gap-3 rounded-xl border-2 border-gray-200 p-5 text-left transition-all hover:border-[#2A5FA5] hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-[#2A5FA5] transition-colors">
            {selecting === "partner" && isPending ? (
              <Loader2 className="h-5 w-5 text-gray-500 group-hover:text-white animate-spin" />
            ) : (
              <Handshake className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-[#2A5FA5] transition-colors">
              Partner
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-snug">
              Manage leads and help businesses migrate
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#2A5FA5] transition-colors mt-auto self-end" />
        </button>
      </div>
    </div>
  );
}
