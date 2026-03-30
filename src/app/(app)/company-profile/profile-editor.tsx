"use client";

import { useState, useTransition, useRef } from "react";
import {
  Building2,
  Globe,
  MapPin,
  DollarSign,
  Award,
  Wrench,
  Tag,
  Star,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Plus,
  X,
  BadgeCheck,
  Image,
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
  const { chip, focus } = colorMap[color];

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

// ─── Logo preview ─────────────────────────────────────────────────────────────

function LogoPreview({ url, name }: { url: string; name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="h-16 w-16 rounded-xl object-contain border border-gray-200 bg-white p-1"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }

  return (
    <div className="h-16 w-16 rounded-xl bg-[#0F6E56] flex items-center justify-center text-white text-xl font-bold select-none shrink-0">
      {initials}
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
      } catch (err) {
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

          {/* Logo preview + URL */}
          <div className="flex items-start gap-4 mb-5">
            <LogoPreview url={form.logoUrl} name={form.companyName} />
            <div className="flex-1 space-y-3">
              <Field label="Logo URL" error={errors.logoUrl}>
                <Input
                  value={form.logoUrl}
                  onChange={set("logoUrl")}
                  placeholder="https://example.com/logo.png"
                  type="url"
                />
              </Field>
              <p className="text-[11px] text-gray-400">
                Paste a direct link to your company logo (PNG, SVG recommended, min 64×64px)
              </p>
            </div>
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
