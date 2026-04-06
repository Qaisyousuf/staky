"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Zap, Handshake, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{
        backgroundColor: "#f6f4ee",
        backgroundImage: "radial-gradient(circle at top, rgba(22,163,74,0.10), transparent 40%)",
      }}
    >
      {/* Logo */}
      <p className="mb-10 text-2xl font-bold tracking-[-0.04em] text-[#1a201b]">
        Staky<span className="text-[#0F6E56]">.</span>
      </p>

      {/* Greeting */}
      <div className="mb-6 text-center">
        <h1 className="text-[1.6rem] font-semibold tracking-[-0.02em] text-[#151a16]">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-[rgba(0,0,0,0.45)]">
          Choose how you want to continue
        </p>
      </div>

      {/* Mode cards */}
      <div className="flex w-full max-w-sm flex-col gap-3">

        {/* Switcher */}
        <button
          type="button"
          onClick={() => handleSelect("user")}
          disabled={isPending}
          className={cn(
            "group relative flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-left shadow-sm transition-all",
            "hover:border-[#0F6E56]/40 hover:shadow-md",
            selecting === "user" && isPending
              ? "border-[#0F6E56]/40 shadow-md"
              : "border-[#e4ddcf]",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          <span className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
            selecting === "user" && isPending ? "bg-[#0F6E56]" : "bg-[#eef6f2] group-hover:bg-[#0F6E56]"
          )}>
            {selecting === "user" && isPending
              ? <Loader2 className="h-5 w-5 animate-spin text-white" />
              : <Zap className="h-5 w-5 text-[#0F6E56] group-hover:text-white transition-colors" />
            }
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#151a16]">Switcher</p>
            <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.4)] leading-snug">
              Discover EU alternatives and track your migration
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#0F6E56]" />
        </button>

        {/* Partner */}
        <button
          type="button"
          onClick={() => handleSelect("partner")}
          disabled={isPending}
          className={cn(
            "group relative flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-left shadow-sm transition-all",
            "hover:border-[#2A5FA5]/40 hover:shadow-md",
            selecting === "partner" && isPending
              ? "border-[#2A5FA5]/40 shadow-md"
              : "border-[#e4ddcf]",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          <span className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
            selecting === "partner" && isPending ? "bg-[#2A5FA5]" : "bg-[#eef3fb] group-hover:bg-[#2A5FA5]"
          )}>
            {selecting === "partner" && isPending
              ? <Loader2 className="h-5 w-5 animate-spin text-white" />
              : <Handshake className="h-5 w-5 text-[#2A5FA5] group-hover:text-white transition-colors" />
            }
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#151a16]">Partner</p>
            <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.4)] leading-snug">
              Manage leads and help businesses switch to EU software
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#2A5FA5]" />
        </button>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-[11px] text-[rgba(0,0,0,0.3)]">
        You can switch between accounts anytime from the menu
      </p>
    </div>
  );
}
