"use client";

import { useState, useTransition, useRef } from "react";
import { ArrowRight, CheckCircle2, Loader2, Sparkles, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { ToolIcon } from "@/components/shared/tool-icon";

interface ShareExperienceModalProps {
  fromTool: string;         // slug
  toTool: string;           // slug
  fromToolName: string;
  toToolName: string;
  /** Partner company name — shown in client template */
  partnerName?: string | null;
  /** Client's description/goals — used to enrich the template */
  context?: string | null;
  /** Whether the current user is posting as a partner */
  isPartnerMode?: boolean;
  onClose: () => void;
}

function buildStory({
  fromToolName,
  toToolName,
  partnerName,
  context,
  isPartnerMode,
}: {
  fromToolName: string;
  toToolName: string;
  partnerName?: string | null;
  context?: string | null;
  isPartnerMode?: boolean;
}) {
  if (isPartnerMode) {
    const lines = [
      `We just helped a client successfully migrate from ${fromToolName} to ${toToolName}.`,
    ];
    if (context) lines.push(`\nThe client's goal: ${context}`);
    lines.push(
      `\nGreat to see more businesses making the switch to a European software stack. Happy to help anyone considering the same move!`
    );
    return lines.join("\n");
  }

  const lines = [
    `We just completed our migration from ${fromToolName} to ${toToolName}!`,
  ];
  if (context) lines.push(`\n${context}`);
  if (partnerName) lines.push(`\nWe worked with ${partnerName} throughout the process — highly recommend them.`);
  lines.push(
    `\nIf you're considering the same switch, feel free to ask — happy to share what we learned.`
  );
  return lines.join("\n");
}

function buildTags(fromTool: string, toTool: string, isPartnerMode?: boolean) {
  const base = [fromTool, toTool, "migration", "eusoftware"];
  if (isPartnerMode) base.push("migrationpartner");
  return base.filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
}

export function ShareExperienceModal({
  fromTool,
  toTool,
  fromToolName,
  toToolName,
  partnerName,
  context,
  isPartnerMode,
  onClose,
}: ShareExperienceModalProps) {
  const [story, setStory] = useState(() =>
    buildStory({ fromToolName, toToolName, partnerName, context, isPartnerMode })
  );
  const [tags, setTags] = useState<string[]>(() =>
    buildTags(fromTool, toTool, isPartnerMode)
  );
  const [tagInput, setTagInput] = useState("");
  const [posted, setPosted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "");
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function handlePost() {
    if (!story.trim()) return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("fromTool", fromTool);
        fd.set("toTool", toTool);
        fd.set("story", story.trim());
        fd.set("linkUrl", "");
        fd.set("tags", JSON.stringify(tags));

        const res = await fetch("/api/posts", { method: "POST", body: fd });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "Failed to post");
        }
        setPosted(true);
        toast.success("Your experience has been shared to the feed!");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to post");
      }
    });
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <Sparkles className="h-4 w-4 text-[#0F6E56]" />
          <div>
            <p className="text-sm font-bold text-gray-900">Share your migration experience</p>
            <p className="text-xs text-gray-400">Help others in the community learn from this switch</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {posted ? (
          /* Success state */
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 border border-green-100">
              <CheckCircle2 className="h-7 w-7 text-[#0F6E56]" />
            </div>
            <p className="text-base font-bold text-gray-900">Posted to the feed!</p>
            <p className="text-sm text-gray-500">Your experience is now live and helping the community.</p>
            <button
              onClick={onClose}
              className="mt-2 rounded-lg bg-[#0F6E56] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0a5c47] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Migration path (readonly) */}
            <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
              <ToolIcon slug={fromTool} size="sm" />
              <span className="text-sm font-semibold text-gray-700">{fromToolName}</span>
              <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
              <ToolIcon slug={toTool} size="sm" />
              <span className="text-sm font-semibold text-[#0F6E56]">{toToolName}</span>
              <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0F6E56]">
                Completed
              </span>
            </div>

            {/* Story textarea */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span>Your story</span>
                <span className={story.length > 1200 ? "text-red-500" : "text-gray-300"}>
                  {story.length}/1500
                </span>
              </label>
              <textarea
                ref={textareaRef}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={8}
                maxLength={1500}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 leading-relaxed outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10"
                placeholder="Share what you learned from this migration…"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Tags <span className="font-normal text-gray-300">({tags.length}/5)</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 px-2.5 py-2 focus-within:border-[#0F6E56] focus-within:ring-2 focus-within:ring-[#0F6E56]/10">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                  >
                    <Tag className="h-2.5 w-2.5 text-gray-400" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => { if (tagInput) addTag(tagInput); }}
                    placeholder={tags.length === 0 ? "Add tags…" : ""}
                    className="min-w-[80px] flex-1 bg-transparent text-xs outline-none placeholder:text-gray-300"
                  />
                )}
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Press Enter or comma to add · Backspace to remove last</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePost}
                disabled={isPending || story.trim().length < 20}
                className="ml-auto flex items-center gap-2 rounded-lg bg-[#0F6E56] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0a5c47] transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Post to feed
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
