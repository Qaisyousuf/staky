"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  Award,
  Wrench,
  Tag,
  Star,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  X,
  BadgeCheck,
  Camera,
  ImageIcon,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateCompanyProfile } from "@/actions/partner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PartnerData {
  id: string;
  companyName: string;
  country: string;
  description: string;
  pricing: string;
  website: string;
  logoUrl: string;
  coverImage: string;
  specialty: string[];
  services: string[];
  certifications: string[];
  approved: boolean;
  rating: number;
  projectCount: number;
}

// ─── EU countries ─────────────────────────────────────────────────────────────

const EU_COUNTRIES = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
  "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary",
  "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands",
  "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden",
  "United Kingdom", "Switzerland", "Norway", "Iceland",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors",
        error
          ? "border-red-300 focus:border-red-400 bg-red-50"
          : "border-gray-200 focus:border-[#0F6E56] bg-white"
      )}
    />
  );
}

function TagInput({
  tags,
  onChange,
  placeholder,
  color = "green",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  color?: "green" | "blue" | "purple";
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const colorMap = {
    green:  { chip: "bg-green-50 text-[#0F6E56] border-green-200",  focus: "focus:border-[#0F6E56]" },
    blue:   { chip: "bg-blue-50 text-[#2A5FA5] border-blue-200",    focus: "focus:border-[#2A5FA5]" },
    purple: { chip: "bg-purple-50 text-purple-700 border-purple-200", focus: "focus:border-purple-500" },
  };
  const { chip } = colorMap[color];

  const add = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInput("");
  };

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag));

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 min-h-[42px] cursor-text transition-colors",
        "focus-within:border-[#0F6E56]"
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            chip
          )}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove(tag); }}
            className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input.trim() && add(input)}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"
      />
    </div>
  );
}

// ─── Image compression ────────────────────────────────────────────────────────

function compressImage(file: File, width: number, height: number, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas unavailable")); return; }
        // Fill cover proportionally
        const scale = Math.max(width / img.width, height / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        const sx = (width - sw) / 2;
        const sy = (height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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

// ─── Logo uploader ────────────────────────────────────────────────────────────

function LogoUploader({
  logoUrl,
  companyName,
  onChange,
}: {
  logoUrl: string;
  companyName: string;
  onChange: (val: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [fileError, setFileError] = useState("");

  const initials = companyName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const processFile = useCallback(async (file: File) => {
    setFileError("");
    if (!file.type.startsWith("image/")) { setFileError("Please select an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setFileError("Image must be under 8 MB."); return; }
    setProcessing(true);
    try {
      const dataUrl = await compressLogo(file);
      onChange(dataUrl);
    } catch {
      setFileError("Failed to process image. Please try another file.");
    } finally {
      setProcessing(false);
    }
  }, [onChange]);

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <div className="relative shrink-0">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={companyName}
            className="h-16 w-16 rounded-xl object-cover border border-gray-200"
          />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-[#2A5FA5] flex items-center justify-center text-white text-xl font-bold select-none">
            {initials}
          </div>
        )}
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Controls */}
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
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-400">PNG, JPG or WebP · max 8 MB · square crop applied</p>
        {fileError && <p className="text-[11px] text-red-500">{fileError}</p>}
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

// ─── Cover uploader ───────────────────────────────────────────────────────────

function CoverUploader({
  coverImage,
  onChange,
}: {
  coverImage: string;
  onChange: (val: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [fileError, setFileError] = useState("");

  const processFile = useCallback(async (file: File) => {
    setFileError("");
    if (!file.type.startsWith("image/")) { setFileError("Please select an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setFileError("Image must be under 8 MB."); return; }
    setProcessing(true);
    try {
      const dataUrl = await compressImage(file, 1200, 300, 0.85);
      onChange(dataUrl);
    } catch {
      setFileError("Failed to process image. Please try another file.");
    } finally {
      setProcessing(false);
    }
  }, [onChange]);

  return (
    <div className="space-y-2">
      {/* Preview */}
      <div className="relative h-24 w-full rounded-xl overflow-hidden border border-gray-200">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#2A5FA5] to-[#1a4a8a] flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-white/40" />
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={processing}
          className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {processing ? "Processing…" : "Upload cover"}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-[11px] text-gray-400 flex-1">JPG, PNG or WebP · max 8 MB · 1200×300px recommended</p>
        {coverImage && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        )}
      </div>
      {fileError && <p className="text-[11px] text-red-500">{fileError}</p>}
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

// ─── Main editor ──────────────────────────────────────────────────────────────

export function ProfileEditor({ partner }: { partner: PartnerData }) {
  const [form, setForm] = useState({
    companyName: partner.companyName,
    country: partner.country,
    description: partner.description,
    pricing: partner.pricing,
    website: partner.website,
    logoUrl: partner.logoUrl,
    coverImage: partner.coverImage,
    specialty: partner.specialty,
    services: partner.services,
    certifications: partner.certifications,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isPending, startTransition] = useTransition();

  const set = (key: string) => (val: string | string[]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    if (!form.country.trim()) e.country = "Country is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    startTransition(async () => {
      try {
        await updateCompanyProfile(form);
        setSaved(true);
        setSaveError("");
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setSaveError("Failed to save. Please try again.");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visible to clients on the Partners directory</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/app/partners"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            View Profile
          </Link>
          {partner.approved ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-[#0F6E56]">
              <BadgeCheck className="h-3.5 w-3.5" /> Approved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" /> Pending review
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white border border-gray-200 p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 shrink-0">
            <Star className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">
              {partner.rating > 0 ? partner.rating.toFixed(1) : "—"}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Average rating</p>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-[#2A5FA5]" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{partner.projectCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Completed projects</p>
          </div>
        </div>
      </div>

      {/* Form sections */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

        {/* Identity */}
        <div className="p-6">
          <SectionHeader icon={Building2} title="Identity" description="Core company information shown in the directory" />

          {/* Cover image */}
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-700 mb-2">Cover image</p>
            <CoverUploader
              coverImage={form.coverImage}
              onChange={set("coverImage") as (v: string) => void}
            />
          </div>

          {/* Logo upload */}
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-700 mb-3">Company logo</p>
            <LogoUploader
              logoUrl={form.logoUrl}
              companyName={form.companyName}
              onChange={set("logoUrl")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company name" required error={errors.companyName}>
              <Input
                value={form.companyName}
                onChange={set("companyName")}
                placeholder="Acme Migration GmbH"
                error={!!errors.companyName}
              />
            </Field>
            <Field label="Country" required error={errors.country}>
              <select
                value={form.country}
                onChange={(e) => set("country")(e.target.value)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition-colors bg-white appearance-none",
                  errors.country
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-[#0F6E56]"
                )}
              >
                <option value="">Select country…</option>
                {EU_COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Website" error={errors.website}>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => set("website")(e.target.value)}
                  placeholder="https://youragency.eu"
                  className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0F6E56] transition-colors bg-white"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* About */}
        <div className="p-6">
          <SectionHeader icon={Tag} title="About" description="Help clients understand your expertise and approach" />
          <div className="space-y-4">
            <Field label="Company description">
              <textarea
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                placeholder="We specialise in helping European SMEs migrate from US SaaS to compliant EU alternatives. With 5+ years of experience…"
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0F6E56] transition-colors resize-none bg-white"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {form.description.length}/500 chars · shown on your partner card
              </p>
            </Field>
            <Field label="Pricing model">
              <textarea
                value={form.pricing}
                onChange={(e) => set("pricing")(e.target.value)}
                placeholder="e.g. Fixed-fee packages from €2,500 · Hourly rate €120/hr · Free initial consultation"
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0F6E56] transition-colors resize-none bg-white"
              />
            </Field>
          </div>
        </div>

        {/* Specialty */}
        <div className="p-6">
          <SectionHeader
            icon={Wrench}
            title="Specialty tools"
            description="EU tools you are expert in migrating to — shown as chips on your card"
          />
          <TagInput
            tags={form.specialty}
            onChange={set("specialty") as (v: string[]) => void}
            placeholder="Type a tool name and press Enter (e.g. Nextcloud, Penpot)"
            color="green"
          />
          <p className="text-[11px] text-gray-400 mt-2">Press Enter or comma to add · Backspace to remove last</p>
        </div>

        {/* Services */}
        <div className="p-6">
          <SectionHeader
            icon={CheckCircle2}
            title="Services offered"
            description="Specific migration services your company provides"
          />
          <TagInput
            tags={form.services}
            onChange={set("services") as (v: string[]) => void}
            placeholder="e.g. Data migration, Staff training, API integrations…"
            color="blue"
          />
          <p className="text-[11px] text-gray-400 mt-2">Add up to 10 services</p>
        </div>

        {/* Certifications */}
        <div className="p-6">
          <SectionHeader
            icon={Award}
            title="Certifications"
            description="Technical or compliance certifications your team holds"
          />
          <TagInput
            tags={form.certifications}
            onChange={set("certifications") as (v: string[]) => void}
            placeholder="e.g. Nextcloud Certified, ISO 27001, GDPR Practitioner…"
            color="purple"
          />
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white/90 backdrop-blur px-5 py-3 shadow-sm">
        {saveError ? (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" /> {saveError}
          </p>
        ) : saved ? (
          <p className="text-sm text-[#0F6E56] flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Profile saved successfully
          </p>
        ) : (
          <p className="text-sm text-gray-400">Changes are saved to your public profile</p>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition-colors shrink-0"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}
