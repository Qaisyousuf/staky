"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Handshake, Building2, Globe, Tag,
  FileText, CheckCircle2, Clock, ArrowLeftRight, Loader2, Camera, X,
  Search, BadgeCheck, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { applyAsPartner, lookupCVR, setActiveMode, updatePartnerLogo } from "@/actions/partner-mode";

interface PartnerInfo {
  companyName: string;
  country: string;
  approved: boolean;
  rating: number;
  projectCount: number;
  logoUrl?: string | null;
}

// ─── Image compression (square crop for logo) ─────────────────────────────────

function compressLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const SIZE = 256;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas unavailable")); return; }
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Company logo editor ──────────────────────────────────────────────────────

function LogoEditor({
  logoUrl,
  companyName,
  onLogoChange,
}: {
  logoUrl: string | null | undefined;
  companyName: string;
  onLogoChange: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const initials = companyName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "P";

  const processFile = useCallback(async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Image must be under 8 MB."); return; }
    setProcessing(true);
    try {
      const dataUrl = await compressLogo(file);
      onLogoChange(dataUrl);
    } catch {
      setError("Failed to process image. Please try another file.");
    } finally {
      setProcessing(false);
    }
  }, [onLogoChange]);

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <div className="relative shrink-0">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={companyName} className="h-16 w-16 rounded-xl object-cover border border-gray-200" />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-[#2A5FA5] flex items-center justify-center text-white text-lg font-black select-none">
            {initials}
          </div>
        )}
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5 text-gray-400" />
            {logoUrl ? "Change logo" : "Upload logo"}
          </button>
          {logoUrl && (
            <button
              type="button"
              onClick={() => onLogoChange(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-400">PNG, JPG or WebP · max 8 MB · square crop applied</p>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

interface PartnerTabProps {
  partner: PartnerInfo | null;
}

// ─── State A — Application form ───────────────────────────────────────────────

type CvrInfo = {
  name: string;
  fullLocation: string;
  industrydesc: string | null;
  companytype: string | null;
  employees: string | null;
  email: string | null;
  phone: string | null;
  startdate: string | null;
};

function ApplicationForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [isLookingUp, startLookup] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cvrStatus, setCvrStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [cvrInfo, setCvrInfo] = useState<CvrInfo | null>(null);
  const [cvrError, setCvrError] = useState<string>("");

  const [form, setForm] = useState({
    companyName: "",
    country: "Denmark",
    cvr: "",
    specialty: "",
    description: "",
    website: "",
  });

  const inputClass = "w-full py-2.5 px-3 text-sm rounded-lg border border-gray-200 bg-white outline-none transition-colors focus:border-[#0F6E56]";

  const handleCvrLookup = () => {
    setCvrStatus("idle");
    setCvrInfo(null);
    setCvrError("");
    startLookup(async () => {
      const result = await lookupCVR(form.cvr);
      if (result.status === "found") {
        setCvrStatus("valid");
        setCvrInfo(result);
        // Auto-fill known fields; suggest industry as specialty
        setForm((f) => ({
          ...f,
          companyName: result.name,
          country: result.city ? `${result.city}, Denmark` : "Denmark",
          specialty: f.specialty || result.industrydesc || "",
          website: f.website || (result.email ? `https://${result.email.split("@")[1] ?? ""}` : ""),
        }));
      } else if (result.status === "not_found") {
        setCvrStatus("invalid");
        setCvrError("CVR not found in the Danish Business Register.");
      } else {
        setCvrStatus("invalid");
        setCvrError("Could not reach the CVR registry. Please try again.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await applyAsPartner(form);
      if (result.status === "error") {
        setError(result.message);
      } else {
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
        <Handshake className="h-5 w-5 text-[#2A5FA5] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#2A5FA5]">Become a Migration Partner</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Enter your Danish CVR number to verify your business. Valid companies are instantly approved.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CVR lookup */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          CVR number <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="12345678"
              maxLength={8}
              value={form.cvr}
              onChange={(e) => {
                setForm((f) => ({ ...f, cvr: e.target.value.replace(/\D/g, "") }));
                setCvrStatus("idle");
                setCvrInfo(null);
                setCvrError("");
              }}
              className={cn(
                inputClass, "pl-9 font-mono tracking-widest",
                cvrStatus === "valid" && "border-green-400 bg-green-50/30",
                cvrStatus === "invalid" && "border-red-300 bg-red-50/30"
              )}
              required
            />
          </div>
          <button
            type="button"
            onClick={handleCvrLookup}
            disabled={isLookingUp || form.cvr.length !== 8}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isLookingUp ? "Looking up…" : "Look up"}
          </button>
        </div>

        {/* CVR result card */}
        {cvrStatus === "valid" && cvrInfo && (
          <div className="mt-2 rounded-xl border border-green-200 bg-green-50/50 px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-semibold text-green-800">{cvrInfo.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-gray-500">
              {cvrInfo.fullLocation && <span><span className="font-medium text-gray-700">Address:</span> {cvrInfo.fullLocation}</span>}
              {cvrInfo.industrydesc && <span><span className="font-medium text-gray-700">Industry:</span> {cvrInfo.industrydesc}</span>}
              {cvrInfo.companytype && <span><span className="font-medium text-gray-700">Type:</span> {cvrInfo.companytype}</span>}
              {cvrInfo.employees && <span><span className="font-medium text-gray-700">Employees:</span> {cvrInfo.employees}</span>}
              {cvrInfo.startdate && <span><span className="font-medium text-gray-700">Founded:</span> {cvrInfo.startdate}</span>}
              {cvrInfo.phone && <span><span className="font-medium text-gray-700">Phone:</span> {cvrInfo.phone}</span>}
            </div>
            <p className="text-[11px] text-green-700">Fields below have been pre-filled — review and adjust if needed.</p>
          </div>
        )}
        {cvrStatus === "invalid" && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {cvrError}
          </p>
        )}
        {cvrStatus === "idle" && (
          <p className="mt-1 text-[11px] text-gray-400">
            Verified against the Danish Business Register (virk.dk). Fields are auto-filled after lookup.
          </p>
        )}
      </div>

      {/* Company name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Company name <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Auto-filled after CVR lookup"
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            className={`${inputClass} pl-9`}
            required
          />
        </div>
      </div>

      {/* Location + Website */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Location <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Copenhagen, Denmark"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className={`${inputClass} pl-9`}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Website <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="https://yourcompany.com"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>
      </div>

      {/* Specialty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Specialty <span className="text-red-400">*</span>{" "}
          <span className="font-normal text-gray-400">(comma-separated)</span>
        </label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Nextcloud, self-hosting, GDPR compliance"
            value={form.specialty}
            onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
            className={`${inputClass} pl-9`}
            required
          />
        </div>
        {cvrInfo?.industrydesc && form.specialty === cvrInfo.industrydesc && (
          <p className="mt-1 text-[11px] text-amber-600">Suggested from CVR industry — add more specific services if you&apos;d like.</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
          <textarea
            rows={3}
            placeholder="Tell us about your company and migration experience…"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={`${inputClass} pl-9 resize-none`}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-[#2A5FA5] hover:bg-[#244d8a] text-white text-sm font-semibold px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Handshake className="h-4 w-4" />}
        {isPending ? "Verifying &amp; activating…" : "Submit application"}
      </button>
    </form>
  );
}

// ─── State B — Pending review ─────────────────────────────────────────────────

function PendingState({ onResubmit }: { onResubmit: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
          <Clock className="h-5 w-5 text-amber-600" />
        </span>
        <div>
          <p className="text-sm font-bold text-amber-800">Application under review</p>
          <p className="text-xs text-amber-600 mt-1 leading-relaxed">
            Your partner application has been received. Our team will review it within 2–3 business days.
            You&apos;ll be notified by email once approved.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">What happens next?</h3>
        <div className="space-y-3">
          {[
            { label: "Application submitted", done: true },
            { label: "Team review (2–3 business days)", done: false },
            { label: "Account activation", done: false },
            { label: "Partner dashboard access", done: false },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-3">
              <span className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                done ? "bg-[#0F6E56]" : "bg-gray-100"
              )}>
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                )}
              </span>
              <span className={cn("text-sm", done ? "text-gray-900 font-medium" : "text-gray-400")}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onResubmit}
        className="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
      >
        Update application details
      </button>
    </div>
  );
}

// ─── State C — Approved ───────────────────────────────────────────────────────

function ApprovedState({ partner }: { partner: PartnerInfo }) {
  const router = useRouter();
  const { update } = useSession();
  const [isSwitching, startSwitching] = useTransition();
  const [isSavingLogo, startSavingLogo] = useTransition();
  const [logoUrl, setLogoUrl] = useState<string | null>(partner.logoUrl ?? null);
  const [logoSaved, setLogoSaved] = useState(false);

  const handleActivate = () => {
    startSwitching(async () => {
      await setActiveMode("partner");
      await update();
      router.push("/app/dashboard");
    });
  };

  const handleSaveLogo = () => {
    startSavingLogo(async () => {
      await updatePartnerLogo(logoUrl ?? "");
      setLogoSaved(true);
      setTimeout(() => setLogoSaved(false), 3000);
    });
  };

  const logoDirty = logoUrl !== (partner.logoUrl ?? null);

  return (
    <div className="space-y-5">
      {/* Approved banner */}
      <div className="flex items-start gap-4 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
          <CheckCircle2 className="h-5 w-5 text-[#0F6E56]" />
        </span>
        <div>
          <p className="text-sm font-bold text-green-800">Partner account approved</p>
          <p className="text-xs text-green-600 mt-1">
            You can now switch between Switcher and Partner mode at any time.
          </p>
        </div>
      </div>

      {/* Company logo */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Company logo</h3>
        <LogoEditor
          logoUrl={logoUrl}
          companyName={partner.companyName}
          onLogoChange={(url) => { setLogoUrl(url); setLogoSaved(false); }}
        />
        {(logoDirty || logoSaved) && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveLogo}
              disabled={isSavingLogo || !logoDirty}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2A5FA5] hover:bg-[#244d8a] text-white text-xs font-semibold px-4 py-2 transition-colors disabled:opacity-50"
            >
              {isSavingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {isSavingLogo ? "Saving…" : "Save logo"}
            </button>
            {logoSaved && (
              <span className="flex items-center gap-1.5 text-xs text-[#0F6E56] font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>
        )}
      </div>

      {/* Partner details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Partner details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Company</p>
            <p className="font-medium text-gray-900">{partner.companyName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Country</p>
            <p className="font-medium text-gray-900">{partner.country}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Rating</p>
            <p className="font-medium text-gray-900">
              {partner.rating > 0 ? partner.rating.toFixed(1) : "No rating yet"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Projects</p>
            <p className="font-medium text-gray-900">{partner.projectCount}</p>
          </div>
        </div>
      </div>

      {/* Switch mode */}
      <button
        onClick={handleActivate}
        disabled={isSwitching}
        className="inline-flex items-center gap-2 rounded-xl bg-[#2A5FA5] hover:bg-[#244d8a] text-white text-sm font-semibold px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
        {isSwitching ? "Switching…" : "Switch to Partner mode"}
      </button>
    </div>
  );
}

// ─── Main PartnerTab ──────────────────────────────────────────────────────────

export function PartnerTab({ partner }: PartnerTabProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const showApproved = partner?.approved === true;
  const showPending = partner && !partner.approved && !showForm && !justSubmitted;
  const showFormState = !justSubmitted && (!partner || showForm) && !showApproved;

  const handleSuccess = () => {
    setShowForm(false);
    setJustSubmitted(true);
    router.refresh(); // re-fetch server component so partner data loads
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-base font-bold text-gray-900">Partner Programme</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Apply to become a migration partner and help businesses switch to EU software.
        </p>
      </div>

      {justSubmitted && !partner && (
        <div className="flex items-start gap-4 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
            <CheckCircle2 className="h-5 w-5 text-[#0F6E56]" />
          </span>
          <div>
            <p className="text-sm font-bold text-green-800">Partner account approved!</p>
            <p className="text-xs text-green-600 mt-1 leading-relaxed">
              Your CVR was verified and your account is now active. Refresh the page to access your partner settings.
            </p>
          </div>
        </div>
      )}
      {showApproved && partner && <ApprovedState partner={partner} />}
      {showPending && <PendingState onResubmit={() => { setJustSubmitted(false); setShowForm(true); }} />}
      {showFormState && <ApplicationForm onSuccess={handleSuccess} />}
    </div>
  );
}
