"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera, Link2, Globe, MapPin,
  CheckCircle2, AlertCircle, Save, Loader2, Building2, X, Trash2, ImageIcon,
} from "lucide-react";
import { updateProfile } from "@/actions/settings";
import type { SettingsUser } from "../settings-shell";

// ─── Shared field components ──────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = "text",
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#0F6E56] bg-white transition-colors"
    />
  );
}

function TagInput({ tags, onChange, placeholder }: {
  tags: string[]; onChange: (t: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const add = (v: string) => {
    const t = v.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]); setInput("");
  };
  const remove = (t: string) => onChange(tags.filter((x) => x !== t));
  return (
    <div
      onClick={() => ref.current?.focus()}
      className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 min-h-[42px] cursor-text focus-within:border-[#0F6E56] transition-colors"
    >
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {t}
          <button type="button" onClick={(e) => { e.stopPropagation(); remove(t); }} className="opacity-50 hover:opacity-100">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={ref}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); }
          else if (e.key === "Backspace" && !input && tags.length > 0) remove(tags[tags.length - 1]);
        }}
        onBlur={() => input.trim() && add(input)}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] text-sm text-gray-700 placeholder:text-gray-400 outline-none bg-transparent"
      />
    </div>
  );
}

// ─── Image compression ────────────────────────────────────────────────────────

function compressImage(
  file: File,
  opts: { width: number; height: number; quality: number; crop?: "square" } = { width: 400, height: 400, quality: 0.88, crop: "square" }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = opts.width;
        canvas.height = opts.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas unavailable")); return; }

        if (opts.crop === "square") {
          // Centre-crop to square
          const min = Math.min(img.width, img.height);
          const sx = (img.width - min) / 2;
          const sy = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, opts.width, opts.height);
        } else {
          // Fit within bounds maintaining aspect ratio
          const scale = Math.min(opts.width / img.width, opts.height / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (opts.width - w) / 2, (opts.height - h) / 2, w, h);
        }
        resolve(canvas.toDataURL("image/jpeg", opts.quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Avatar editor ────────────────────────────────────────────────────────────

function AvatarEditor({
  image,
  name,
  onImageChange,
}: {
  image: string;
  name: string;
  onImageChange: (dataUrl: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [fileError, setFileError] = useState("");

  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  const processFile = useCallback(
    async (file: File) => {
      setFileError("");
      if (!file.type.startsWith("image/")) {
        setFileError("Please choose an image file (JPG, PNG, WebP, GIF).");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setFileError("File is too large. Maximum size is 8 MB.");
        return;
      }
      setProcessing(true);
      try {
        const dataUrl = await compressImage(file, { width: 400, height: 400, quality: 0.88, crop: "square" });
        onImageChange(dataUrl);
      } catch {
        setFileError("Could not process this image. Please try another file.");
      } finally {
        setProcessing(false);
      }
    },
    [onImageChange]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-6">
      {/* ── Circle ── */}
      <div className="relative shrink-0 group">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#0F6E56] to-[#1a9070] opacity-0 group-hover:opacity-25 transition-opacity duration-300 blur-sm pointer-events-none" />

        <div className="relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#0F6E56] to-[#1a9070] flex items-center justify-center text-white text-2xl font-bold select-none">
              {initials}
            </div>
          )}

          {/* Hover overlay — click opens picker */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 cursor-pointer"
            aria-label="Change photo"
          >
            {processing ? (
              <Loader2 className="h-5 w-5 text-white animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
            ) : (
              <>
                <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <span className="text-[10px] font-semibold text-white tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Change
                </span>
              </>
            )}
          </button>
        </div>

        {/* Green camera badge */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={processing}
          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#0F6E56] hover:bg-[#0d5f4a] shadow-md border-2 border-white text-white transition-colors disabled:opacity-60"
          title="Upload photo"
        >
          {processing
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Camera className="h-3 w-3" />}
        </button>
      </div>

      {/* ── Info ── */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{name || "Your name"}</p>
        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP · max 8 MB</p>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={processing}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-gray-200 hover:border-[#0F6E56] hover:text-[#0F6E56] px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors disabled:opacity-50"
        >
          <Camera className="h-3.5 w-3.5" />
          Upload photo
        </button>

        {image && (
          <button
            onClick={() => { onImageChange(""); setFileError(""); }}
            className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Remove photo
          </button>
        )}

        {fileError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {fileError}
          </p>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
}

// ─── Cover editor ─────────────────────────────────────────────────────────────

function CoverEditor({
  coverImage,
  onCoverChange,
}: {
  coverImage: string;
  onCoverChange: (dataUrl: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [fileError, setFileError] = useState("");

  const processFile = useCallback(
    async (file: File) => {
      setFileError("");
      if (!file.type.startsWith("image/")) {
        setFileError("Please choose an image file (JPG, PNG, WebP).");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setFileError("File is too large. Maximum size is 8 MB.");
        return;
      }
      setProcessing(true);
      try {
        const dataUrl = await compressImage(file, { width: 1200, height: 300, quality: 0.85 });
        onCoverChange(dataUrl);
      } catch {
        setFileError("Could not process this image. Please try another file.");
      } finally {
        setProcessing(false);
      }
    },
    [onCoverChange]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="relative h-20 w-full rounded-lg overflow-hidden border border-gray-200">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#0F6E56] to-[#1a9070] flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-white/50" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={processing}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 hover:border-[#0F6E56] hover:text-[#0F6E56] px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors disabled:opacity-50"
        >
          {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {processing ? "Processing…" : "Upload cover photo"}
        </button>
        {coverImage && (
          <button
            onClick={() => { onCoverChange(""); setFileError(""); }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        )}
      </div>

      {fileError && (
        <p className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {fileError}
        </p>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function ProfileTab({ user }: { user: SettingsUser }) {
  const [form, setForm] = useState({
    name: user.name,
    image: user.image,
    coverImage: user.coverImage,
    bio: user.bio,
    title: user.title,
    company: user.company,
    location: user.location,
    linkedin: user.socialLinks.linkedin,
    twitter: user.socialLinks.twitter,
    github: user.socialLinks.github,
    website: user.socialLinks.website,
    interests: user.interests,
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const set = (key: string) => (val: string | string[]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateProfile({
          name: form.name,
          bio: form.bio,
          title: form.title,
          company: form.company,
          location: form.location,
          image: form.image,
          coverImage: form.coverImage,
          socialLinks: {
            linkedin: form.linkedin,
            twitter: form.twitter,
            github: form.github,
            website: form.website,
          },
          interests: form.interests,
        });
        // Re-render server components so new image/name propagate everywhere
        router.refresh();
        setSaved(true);
        setError("");
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setError("Failed to save. Please try again.");
      }
    });
  };

  const isPartner = user.role === "PARTNER";

  return (
    <div className="space-y-4">
      {/* Cover photo */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Cover photo</h2>
        <p className="text-xs text-gray-400 mb-4">
          Displayed at the top of your public profile · JPG, PNG, WebP · max 8 MB
        </p>
        <CoverEditor
          coverImage={form.coverImage}
          onCoverChange={set("coverImage") as (v: string) => void}
        />
      </section>

      {/* Avatar */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Profile photo</h2>
        <p className="text-xs text-gray-400 mb-5">
          Your photo is shown on your posts, comments, and profile page
        </p>
        <AvatarEditor
          image={form.image}
          name={form.name}
          onImageChange={set("image") as (v: string) => void}
        />
      </section>

      {/* Personal info */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Personal information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name">
            <TextInput value={form.name} onChange={set("name") as (v: string) => void} placeholder="Alex Dupont" />
          </Field>
          <Field label="Email">
            <input
              disabled value={user.email}
              className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
            />
          </Field>
        </div>
        <Field label="Bio" hint="Shown on your public profile · max 200 chars">
          <textarea
            value={form.bio}
            onChange={(e) => set("bio")(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="I'm a CTO helping European companies migrate from US SaaS to GDPR-compliant alternatives…"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 outline-none focus:border-[#0F6E56] resize-none bg-white transition-colors"
          />
          <p className="text-[11px] text-gray-400">{form.bio.length}/200</p>
        </Field>
        <Field label="Location" hint="City and country · e.g. Berlin, Germany">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={form.location}
              onChange={(e) => set("location")(e.target.value)}
              placeholder="Berlin, Germany"
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 outline-none focus:border-[#0F6E56] bg-white transition-colors"
            />
          </div>
        </Field>
      </section>

      {/* Work info */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Work</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Job title">
            <TextInput value={form.title} onChange={set("title") as (v: string) => void} placeholder="CTO, Developer, Product Manager…" />
          </Field>
          <Field label="Company / Organisation">
            <TextInput value={form.company} onChange={set("company") as (v: string) => void} placeholder="Acme GmbH" />
          </Field>
        </div>
      </section>

      {/* Social links */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Social links</h2>
        {[
          { key: "linkedin", icon: Link2,  placeholder: "https://linkedin.com/in/yourprofile", label: "LinkedIn" },
          { key: "twitter",  icon: Link2,  placeholder: "https://x.com/yourhandle",           label: "X / Twitter" },
          { key: "github",   icon: Link2,  placeholder: "https://github.com/yourusername",    label: "GitHub" },
          { key: "website",  icon: Globe,  placeholder: "https://yourwebsite.eu",             label: "Website" },
        ].map(({ key, icon: Icon, placeholder, label }) => (
          <Field key={key} label={label}>
            <div className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="url"
                value={form[key as keyof typeof form] as string}
                onChange={(e) => set(key)(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 outline-none focus:border-[#0F6E56] bg-white transition-colors"
              />
            </div>
          </Field>
        ))}
      </section>

      {/* Interests */}
      {!isPartner && (
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Interests &amp; expertise</h2>
          <p className="text-xs text-gray-400">Used to personalise your feed and recommendations</p>
          <TagInput
            tags={form.interests}
            onChange={set("interests") as (v: string[]) => void}
            placeholder="e.g. GDPR, Self-hosting, DevOps, Open Source…"
          />
          <p className="text-[11px] text-gray-400">Press Enter or comma to add · Backspace to remove</p>
        </section>
      )}

      {/* Partner info (read-only link) */}
      {isPartner && user.partner && (
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                <Building2 className="h-4 w-4 text-[#2A5FA5]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{user.partner.companyName}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {user.partner.country} · {user.partner.projectCount} projects ·{" "}
                  {user.partner.approved ? (
                    <span className="text-[#0F6E56]">Approved</span>
                  ) : (
                    <span className="text-amber-600">Pending approval</span>
                  )}
                </p>
              </div>
            </div>
            <Link
              href="/app/company-profile"
              className="text-xs font-medium text-[#2A5FA5] hover:underline shrink-0"
            >
              Edit company profile →
            </Link>
          </div>
        </section>
      )}

      {/* Save bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white/90 backdrop-blur px-5 py-3 shadow-sm">
        {error ? (
          <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>
        ) : saved ? (
          <p className="text-sm text-[#0F6E56] flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 shrink-0" />Profile saved</p>
        ) : (
          <p className="text-sm text-gray-400">Unsaved changes</p>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition-colors shrink-0"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
