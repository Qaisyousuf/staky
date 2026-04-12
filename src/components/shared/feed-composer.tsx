"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowRight,
  Loader2,
  Image as ImageIcon,
  FileText,
  Globe,
  Users,
  Link2,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { ToolIcon, type DbTool } from "@/components/shared/tool-icon";
import {
  ACCEPTED_POST_IMAGE_TYPES,
  MAX_POST_IMAGE_COUNT,
  MAX_POST_IMAGE_SIZE_BYTES,
  normalizeUrl,
} from "@/lib/post-utils";

type ComposerAlt = {
  id: string;
  fromTool: { slug: string; name: string; logoUrl?: string | null; color: string; abbr: string };
  toTool:   { slug: string; name: string; logoUrl?: string | null; color: string; abbr: string };
};

type ImageDraft = { file: File; previewUrl: string; key: string };

function PostModal({
  userName,
  userInitials,
  userImage,
  isPartnerMode,
  partnerName,
  partnerLogoUrl,
  alternatives,
  onClose,
}: {
  userName: string;
  userInitials: string;
  userImage?: string | null;
  isPartnerMode?: boolean;
  partnerName?: string | null;
  partnerLogoUrl?: string | null;
  alternatives: ComposerAlt[];
  onClose: () => void;
}) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<ImageDraft[]>([]);

  const [selectedAltId, setSelectedAltId] = useState("");
  const [story, setStory] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const selectedAlt = alternatives.find((a) => a.id === selectedAltId) ?? null;

  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => {
    return () => { for (const img of imagesRef.current) URL.revokeObjectURL(img.previewUrl); };
  }, []);

  function handleImageSelection(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploadError("");
    const nextFiles = Array.from(fileList);
    if (images.length + nextFiles.length > MAX_POST_IMAGE_COUNT) {
      setUploadError(`You can attach up to ${MAX_POST_IMAGE_COUNT} images.`);
      return;
    }
    for (const file of nextFiles) {
      if (!ACCEPTED_POST_IMAGE_TYPES.has(file.type)) { setUploadError("Images must be JPG, PNG, or WebP."); return; }
      if (file.size > MAX_POST_IMAGE_SIZE_BYTES) { setUploadError(`Each image must be under ${Math.round(MAX_POST_IMAGE_SIZE_BYTES / (1024 * 1024))}MB.`); return; }
    }
    const drafts = nextFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
    }));
    setImages((c) => [...c, ...drafts]);
  }

  function removeImage(key: string) {
    setImages((c) => {
      const img = c.find((i) => i.key === key);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return c.filter((i) => i.key !== key);
    });
  }

  async function handleSubmit() {
    setError(""); setUploadError("");
    const normalizedLinkUrl = normalizeUrl(linkUrl);
    if (linkUrl.trim() && !normalizedLinkUrl) return setError("Enter a valid http:// or https:// link.");
    if (!story.trim() && images.length === 0 && !normalizedLinkUrl) return setError("Add text, an image, or a link before posting.");

    setIsPending(true);
    try {
      const formData = new FormData();
      formData.set("fromTool", selectedAlt?.fromTool.slug ?? "");
      formData.set("toTool", selectedAlt?.toTool.slug ?? "");
      formData.set("story", story);
      formData.set("linkUrl", normalizedLinkUrl ?? "");
      formData.set("tags", "[]");
      for (const img of images) formData.append("images", img.file);

      const res = await fetch("/api/posts", { method: "POST", body: formData });
      const payload = await res.json() as { error?: string };
      if (!res.ok) {
        const msg = payload.error ?? "Unable to create post.";
        if (msg.toLowerCase().includes("image")) setUploadError(msg);
        else setError(msg);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setUploadError("Image upload failed. Try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={(e) => e.target === overlayRef.current && onClose()}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl pointer-events-auto overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              {isPartnerMode ? (
                partnerLogoUrl
                  ? <img src={partnerLogoUrl} alt="" className="h-9 w-9 rounded-xl object-cover shrink-0" /> // eslint-disable-line @next/next/no-img-element
                  : <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#2A5FA5] text-xs font-bold text-white shrink-0">{(partnerName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
              ) : userImage
                ? <img src={userImage} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" /> // eslint-disable-line @next/next/no-img-element
                : <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0F6E56] text-xs font-bold text-white shrink-0">{userInitials}</span>
              }
              <div>
                <p className="text-sm font-semibold text-gray-900">{isPartnerMode ? (partnerName ?? userName) : userName}</p>
                <p className="text-[11px] text-gray-400">{isPartnerMode ? "Posting as partner" : "Share with everyone"}</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[76vh] space-y-4 overflow-y-auto px-5 py-4">

            {/* Single alternatives dropdown — first */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Migration path <span className="normal-case font-normal text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                {/* Preview icons when selected */}
                {selectedAlt && (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                    <ToolIcon toolData={selectedAlt.fromTool as DbTool} size="sm" plain className="h-4 w-4 object-contain" />
                    <ArrowRight className="h-3 w-3 text-[#0F6E56]" />
                    <ToolIcon toolData={selectedAlt.toTool as DbTool} size="sm" plain className="h-4 w-4 object-contain" />
                  </span>
                )}
                <select
                  value={selectedAltId}
                  onChange={(e) => setSelectedAltId(e.target.value)}
                  className={`w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pr-9 text-[13px] text-gray-700 transition-colors focus:border-[#0F6E56] focus:outline-none ${selectedAlt ? "pl-[86px]" : "pl-3"}`}
                >
                  <option value="">No migration path selected</option>
                  {alternatives.map((alt) => (
                    <option key={alt.id} value={alt.id}>
                      {alt.fromTool.name} → {alt.toTool.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Story textarea — after dropdown */}
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder={isPartnerMode ? "Share your migration expertise…" : "Share your migration story…"}
              rows={5}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-[14px] leading-relaxed text-gray-700 transition-colors placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none"
            />

            {/* Link */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Add a link <span className="normal-case font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/migration-guide"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-[13px] text-gray-700 transition-colors placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none"
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Images <span className="normal-case font-normal text-gray-400">JPG, PNG, WebP · max {Math.round(MAX_POST_IMAGE_SIZE_BYTES / (1024 * 1024))}MB each</span>
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                  Add photo
                </button>
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple className="hidden"
                  onChange={(e) => { handleImageSelection(e.target.files); e.target.value = ""; }} />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {images.map((img) => (
                    <div key={img.key} className="relative overflow-hidden rounded-xl border border-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt="" className="w-full object-cover" style={{ maxHeight: 160 }} />
                      <button type="button" onClick={() => removeImage(img.key)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(error || uploadError) && (
              <div className="space-y-1.5">
                {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[12px] text-red-500">{error}</p>}
                {uploadError && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[12px] text-red-500">{uploadError}</p>}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-[#0F6E56] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0d5f4a] disabled:opacity-60"
            >
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Posting…</> : "Post"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function FeedComposer({
  userName,
  userInitials,
  userImage,
  isPartnerMode,
  partnerName,
  partnerLogoUrl,
  alternatives = [],
}: {
  userName: string;
  userInitials: string;
  userImage?: string | null;
  isPartnerMode?: boolean;
  partnerName?: string | null;
  partnerLogoUrl?: string | null;
  alternatives?: ComposerAlt[];
  // Legacy props kept for compatibility — unused
  usTools?: unknown[];
  euTools?: unknown[];
}) {
  const [open, setOpen] = useState(false);
  const partnerInitials = (partnerName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <div
        className="mb-3 rounded-2xl bg-white p-4"
        style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-3">
          {isPartnerMode ? (
            partnerLogoUrl
              ? <img src={partnerLogoUrl} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0 select-none" /> // eslint-disable-line @next/next/no-img-element
              : <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A5FA5] text-xs font-bold text-white shrink-0 select-none">{partnerInitials}</span>
          ) : userImage
            ? <img src={userImage} alt="" className="h-10 w-10 rounded-full object-cover shrink-0 select-none" /> // eslint-disable-line @next/next/no-img-element
            : <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0F6E56] text-xs font-bold text-white shrink-0 select-none">{userInitials}</span>
          }
          <button
            onClick={() => setOpen(true)}
            className="flex-1 rounded-full border border-[#e1dbcf] bg-[#fbfaf6] px-4 py-2.5 text-left text-[14px] text-[#8a9288] transition-colors hover:border-[#d5cebe] hover:bg-white"
          >
            {isPartnerMode ? `Post as ${partnerName ?? "your company"}…` : "Share your EU migration story…"}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-1 border-t border-[#eee7db] pt-3">
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-[#667065] hover:bg-[#fbfaf6] hover:text-[#1B2B1F]">
            <ImageIcon className="h-4 w-4 text-blue-400" /> Photo
          </button>
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-[#667065] hover:bg-[#fbfaf6] hover:text-[#1B2B1F]">
            <FileText className="h-4 w-4 text-orange-400" /> Story
          </button>
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-[#667065] hover:bg-[#fbfaf6] hover:text-[#1B2B1F]">
            <Globe className="h-4 w-4 text-green-500" /> EU Tool
          </button>
        </div>
      </div>

      {open && (
        <PostModal
          userName={userName}
          userInitials={userInitials}
          userImage={userImage}
          isPartnerMode={isPartnerMode}
          partnerName={partnerName}
          partnerLogoUrl={partnerLogoUrl}
          alternatives={alternatives}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function FeedComposerGuest() {
  return (
    <div
      className="mb-3 rounded-2xl bg-white p-4"
      style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e1dbcf] bg-[#fbfaf6] shrink-0">
          <Users className="h-5 w-5 text-gray-400" />
        </div>
        <Link
          href="/signup"
          className="flex-1 rounded-full border border-[#e1dbcf] bg-[#fbfaf6] px-4 py-2.5 text-[14px] text-[#8a9288] hover:border-[#d5cebe] hover:bg-white"
        >
          Share your EU migration story…
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-1 border-t border-[#eee7db] pt-3">
        <Link href="/signup" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-[#667065] hover:bg-[#fbfaf6] hover:text-[#1B2B1F]">
          <ImageIcon className="h-4 w-4 text-blue-400" /> Photo
        </Link>
        <Link href="/signup" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-[#667065] hover:bg-[#fbfaf6] hover:text-[#1B2B1F]">
          <FileText className="h-4 w-4 text-orange-400" /> Story
        </Link>
        <Link href="/signup" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-[#667065] hover:bg-[#fbfaf6] hover:text-[#1B2B1F]">
          <Globe className="h-4 w-4 text-green-500" /> EU Tool
        </Link>
      </div>
    </div>
  );
}
