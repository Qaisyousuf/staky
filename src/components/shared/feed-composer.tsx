"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowRight,
  Plus,
  Loader2,
  Image as ImageIcon,
  FileText,
  Globe,
  Users,
  Link2,
  Trash2,
} from "lucide-react";
import { TOOLS } from "@/data/mock-data";
import { ToolIcon } from "@/components/shared/tool-icon";
import {
  ACCEPTED_POST_IMAGE_TYPES,
  MAX_POST_HASHTAGS,
  MAX_POST_IMAGE_COUNT,
  MAX_POST_IMAGE_SIZE_BYTES,
  normalizeUrl,
  parseHashtags,
} from "@/lib/post-utils";

const US_TOOLS = Object.values(TOOLS).filter((tool) => tool.origin === "us");
const EU_TOOLS = Object.values(TOOLS).filter((tool) => tool.origin === "eu");

type ImageDraft = {
  file: File;
  previewUrl: string;
  key: string;
};

function PostModal({
  userName,
  userInitials,
  userImage,
  isPartnerMode,
  partnerName,
  partnerLogoUrl,
  onClose,
}: {
  userName: string;
  userInitials: string;
  userImage?: string | null;
  isPartnerMode?: boolean;
  partnerName?: string | null;
  partnerLogoUrl?: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<ImageDraft[]>([]);

  const [fromTool, setFromTool] = useState("");
  const [toTool, setToTool] = useState("");
  const [story, setStory] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, []);

  function validateImageFile(file: File) {
    if (!ACCEPTED_POST_IMAGE_TYPES.has(file.type)) {
      return "Images must be JPG, PNG, or WebP.";
    }
    if (file.size > MAX_POST_IMAGE_SIZE_BYTES) {
      return `Each image must be under ${Math.round(MAX_POST_IMAGE_SIZE_BYTES / (1024 * 1024))}MB.`;
    }
    return null;
  }

  function handleImageSelection(fileList: FileList | null) {
    if (!fileList?.length) return;

    setUploadError("");

    const nextFiles = Array.from(fileList);
    if (images.length + nextFiles.length > MAX_POST_IMAGE_COUNT) {
      setUploadError(`You can attach up to ${MAX_POST_IMAGE_COUNT} images.`);
      return;
    }

    const invalidFile = nextFiles.find(validateImageFile);
    if (invalidFile) {
      setUploadError(validateImageFile(invalidFile) ?? "Invalid image.");
      return;
    }

    const drafts = nextFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
    }));

    setImages((current) => [...current, ...drafts]);
  }

  function removeImage(key: string) {
    setImages((current) => {
      const image = current.find((item) => item.key === key);
      if (image) URL.revokeObjectURL(image.previewUrl);
      return current.filter((item) => item.key !== key);
    });
  }

  function addTag() {
    const normalized = tagInput.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
    if (!normalized || tags.includes(normalized) || tags.length >= MAX_POST_HASHTAGS) return;
    setTags((current) => [...current, normalized]);
    setTagInput("");
  }

  async function handleSubmit() {
    setError("");
    setUploadError("");

    const normalizedLinkUrl = normalizeUrl(linkUrl);
    const hashtagCount = parseHashtags(story).length;

    if (!fromTool) return setError("Select the tool you're switching from.");
    if (!toTool) return setError("Select the EU tool you're switching to.");
    if (fromTool === toTool) return setError("From and To tools must be different.");
    if (!story.trim() && images.length === 0 && !normalizedLinkUrl) {
      return setError("Add text, an image, or a link before posting.");
    }
    if (linkUrl.trim() && !normalizedLinkUrl) {
      return setError("Enter a valid http:// or https:// link.");
    }
    if (hashtagCount > MAX_POST_HASHTAGS) {
      return setError(`Use up to ${MAX_POST_HASHTAGS} hashtags.`);
    }

    setIsPending(true);

    try {
      const formData = new FormData();
      formData.set("fromTool", fromTool);
      formData.set("toTool", toTool);
      formData.set("story", story);
      formData.set("linkUrl", normalizedLinkUrl ?? "");
      formData.set("tags", JSON.stringify(tags));

      for (const image of images) {
        formData.append("images", image.file);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        const message = payload.error ?? "Unable to create post.";
        if (message.toLowerCase().includes("image")) {
          setUploadError(message);
        } else {
          setError(message);
        }
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
        onClick={(event) => event.target === overlayRef.current && onClose()}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl pointer-events-auto overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Create a post</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[78vh] space-y-5 overflow-y-auto px-5 py-4">
            <div className="flex items-center gap-3">
              {isPartnerMode ? (
                partnerLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={partnerLogoUrl} alt={partnerName ?? ""} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A5FA5] text-sm font-bold text-white shrink-0 select-none">
                    {(partnerName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                )
              ) : userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userImage} alt={userName} className="h-10 w-10 rounded-full object-cover shrink-0" />
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0F6E56] text-sm font-bold text-white shrink-0">
                  {userInitials}
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{isPartnerMode ? (partnerName ?? userName) : userName}</p>
                {isPartnerMode ? (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#2A5FA5]">
                    Migration Partner
                  </span>
                ) : (
                  <p className="text-xs text-gray-400">Share with everyone</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Switching from
                </label>
                <div className="relative">
                  <select
                    value={fromTool}
                    onChange={(event) => setFromTool(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-700 transition-colors focus:border-[#0F6E56] focus:outline-none"
                  >
                    <option value="">Select tool…</option>
                    {US_TOOLS.map((tool) => (
                      <option key={tool.slug} value={tool.slug}>
                        {tool.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                </div>
              </div>

              <div className="shrink-0 pt-5">
                {fromTool && toTool ? (
                  <div className="flex items-center gap-1.5">
                    <ToolIcon slug={fromTool} size="sm" />
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    <ToolIcon slug={toTool} size="sm" />
                  </div>
                ) : (
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                )}
              </div>

              <div className="flex-1">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Switching to (EU)
                </label>
                <div className="relative">
                  <select
                    value={toTool}
                    onChange={(event) => setToTool(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm text-gray-700 transition-colors focus:border-[#0F6E56] focus:outline-none"
                  >
                    <option value="">Select EU tool…</option>
                    {EU_TOOLS.map((tool) => (
                      <option key={tool.slug} value={tool.slug}>
                        {tool.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
                </div>
              </div>
            </div>

            <div>
              <textarea
                value={story}
                onChange={(event) => setStory(event.target.value)}
                placeholder="Share your migration story — what you switched, how it went, what you learned…"
                rows={6}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed text-gray-700 transition-colors placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none"
              />
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-[11px] text-gray-400">
                  Write your migration story.
                </p>
                <p className="text-[10px] text-gray-400">{story.length} chars</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Tags <span className="normal-case font-normal text-gray-400">(up to 5)</span>
              </label>
              {tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-gray-600"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setTags((current) => current.filter((item) => item !== tag))}
                        className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-gray-300"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {tags.length < MAX_POST_HASHTAGS && (
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="e.g. gdpr, self-hosted, cost-saving"
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Add a link
              </label>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://example.com/migration-guide"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-700 transition-colors placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Images
                  </p>
                  <p className="text-[11px] text-gray-400">
                    JPG, PNG, or WebP up to {Math.round(MAX_POST_IMAGE_SIZE_BYTES / (1024 * 1024))}MB each
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <ImageIcon className="h-4 w-4 text-blue-500" />
                  Add image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleImageSelection(event.target.files);
                    event.target.value = "";
                  }}
                />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image) => (
                    <div key={image.key} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.previewUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(image.key)}
                        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white transition-colors hover:bg-black/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(error || uploadError) && (
              <div className="space-y-2">
                {error && (
                  <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-500">
                    {error}
                  </p>
                )}
                {uploadError && (
                  <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-500">
                    {uploadError}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-[#0F6E56] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0d5f4a] disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting…
                </>
              ) : (
                "Post"
              )}
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
}: {
  userName: string;
  userInitials: string;
  userImage?: string | null;
  isPartnerMode?: boolean;
  partnerName?: string | null;
  partnerLogoUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);

  const partnerInitials = (partnerName ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-3">
          {isPartnerMode ? (
            partnerLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={partnerLogoUrl} alt={partnerName ?? ""} className="h-10 w-10 rounded-xl object-cover shrink-0 select-none" />
            ) : (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A5FA5] text-xs font-bold text-white shrink-0 select-none">
                {partnerInitials}
              </span>
            )
          ) : userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImage} alt={userName} className="h-10 w-10 rounded-full object-cover shrink-0 select-none" />
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0F6E56] text-xs font-bold text-white shrink-0 select-none">
              {userInitials}
            </span>
          )}
          <button
            onClick={() => setOpen(true)}
            className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-left text-sm text-gray-400 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            {isPartnerMode ? `Post as ${partnerName ?? "your company"}…` : "Share your EU migration story…"}
          </button>
        </div>
        <div className="flex items-center gap-1 border-t border-gray-100 pt-3">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <ImageIcon className="h-4 w-4 text-blue-400" />
            Photo
          </button>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <FileText className="h-4 w-4 text-orange-400" />
            Story
          </button>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <Globe className="h-4 w-4 text-green-500" />
            EU Tool
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
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function FeedComposerGuest() {
  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-100 shrink-0">
          <Users className="h-5 w-5 text-gray-400" />
        </div>
        <Link
          href="/signup"
          className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:border-gray-400 hover:bg-gray-50"
        >
          Share your EU migration story…
        </Link>
      </div>
      <div className="flex items-center gap-1 border-t border-gray-100 pt-3">
        <Link
          href="/signup"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ImageIcon className="h-4 w-4 text-blue-400" />
          Photo
        </Link>
        <Link
          href="/signup"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <FileText className="h-4 w-4 text-orange-400" />
          Story
        </Link>
        <Link
          href="/signup"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <Globe className="h-4 w-4 text-green-500" />
          EU Tool
        </Link>
      </div>
    </div>
  );
}
