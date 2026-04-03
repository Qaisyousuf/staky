"use client";

import { useState, useTransition } from "react";
import {
  Globe, Users, Lock, Download, CheckCircle2,
  AlertCircle, Save, Loader2, Shield, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updatePrivacy, exportData } from "@/actions/settings";

// ─── Visibility option card ───────────────────────────────────────────────────

const VISIBILITY_OPTIONS = [
  {
    value: "PUBLIC",
    icon: Globe,
    label: "Public",
    description: "Anyone on the internet can see your profile, posts, and stack",
    color: "text-[#0F6E56]",
    bg: "bg-green-50",
  },
  {
    value: "CONNECTIONS",
    icon: Users,
    label: "Connections only",
    description: "Only people you're connected with can view your full profile",
    color: "text-[#2A5FA5]",
    bg: "bg-blue-50",
  },
  {
    value: "PRIVATE",
    icon: Lock,
    label: "Private",
    description: "Your profile is hidden. Only you can see your data",
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
] as const;

function VisibilityCard({
  option,
  selected,
  onClick,
}: {
  option: typeof VISIBILITY_OPTIONS[number];
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = option.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors",
        selected
          ? "border-[#0F6E56] bg-green-50/50"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0 mt-0.5", option.bg)}>
        <Icon className={cn("h-4 w-4", option.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{option.label}</span>
          {selected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0F6E56] px-2 py-0.5 text-[10px] font-semibold text-white">
              <CheckCircle2 className="h-2.5 w-2.5" /> Active
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1 leading-snug">{option.description}</p>
      </div>
    </button>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function PrivacyTab({
  profileVisibility,
}: {
  profileVisibility: string;
}) {
  const [visibility, setVisibility] = useState(profileVisibility);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updatePrivacy({ profileVisibility: visibility });
        setSaved(true); setError("");
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setError("Failed to save. Please try again.");
      }
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportData();
      // Trigger browser download
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `staky-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 4000);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Privacy</h2>
        <p className="text-xs text-gray-400 mt-0.5">Control who can see your information</p>
      </div>

      {/* Profile visibility */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Profile visibility</h3>
        </div>
        <p className="text-xs text-gray-500">
          This controls who can view your profile, posts, and stack on Staky.
        </p>
        <div className="space-y-2.5 pt-1">
          {VISIBILITY_OPTIONS.map((opt) => (
            <VisibilityCard
              key={opt.value}
              option={opt}
              selected={visibility === opt.value}
              onClick={() => setVisibility(opt.value)}
            />
          ))}
        </div>
      </section>

      {/* Data export */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Download className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Your data</h3>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed mt-2 mb-4">
          Download a copy of your Staky data including your posts, comments, follows, connections,
          and stack — in JSON format. You can request an export at any time.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Preparing export…" : "Download your data"}
          </button>
          {exportDone && (
            <span className="text-xs text-[#0F6E56] flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Download started
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          File: staky-data-export-{new Date().toISOString().slice(0, 10)}.json
        </p>
      </section>

      {/* GDPR note */}
      <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-[#2A5FA5] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#2A5FA5]">Your GDPR rights</p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              Under GDPR you have the right to access, correct, and delete your personal data.
              To request full deletion, use the <strong>Account</strong> tab. For other requests,
              contact <strong>privacy@staky.eu</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white/90 backdrop-blur px-5 py-3 shadow-sm">
        {error ? (
          <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>
        ) : saved ? (
          <p className="text-sm text-[#0F6E56] flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 shrink-0" />Privacy settings saved</p>
        ) : (
          <p className="text-sm text-gray-400">Changes not yet saved</p>
        )}
        <button
          onClick={handleSave}
          disabled={isPending || visibility === profileVisibility}
          className="flex items-center gap-2 rounded-lg bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition-colors shrink-0"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
