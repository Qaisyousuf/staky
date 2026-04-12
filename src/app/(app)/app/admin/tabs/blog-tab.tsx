"use client";

import type React from "react";
import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  PlusCircle, Pencil, Trash2, Eye, Star, StarOff,
  Globe, EyeOff, X, Loader2, FileText, BookOpen,
  Heading2, Heading3, Bold, Italic, List, ListOrdered, Quote, Code2, Link2, Minus,
} from "lucide-react";
import {
  adminCreateBlogPost,
  adminUpdateBlogPost,
  adminDeleteBlogPost,
  adminToggleBlogPublished,
  adminToggleBlogFeatured,
  type BlogPostFormData,
} from "@/actions/blog";

/* ── Types ────────────────────────────────────────────────────────────────── */

type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  tags: string[];
  category: string;
  published: boolean;
  featured: boolean;
  views: number;
  readingTime: number;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null };
};

/* ── Constants ────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  "General",
  "Migration Guides",
  "Case Study",
  "Tutorial",
  "Product",
  "Engineering",
  "Community",
  "Opinion",
  "Interview",
  "News",
  "Announcement",
];

const EMPTY_FORM: BlogPostFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  category: "General",
  tags: [],
  readingTime: 5,
  published: false,
  featured: false,
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function parseInlinePreview(text: string) {
  const parts = text.split(/(\[([^\]]+)\]\(([^)]+)\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return parts.map((part, index) => {
    if (!part) return null;
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) return <span key={index} className="text-[#0F6E56] underline underline-offset-2">{linkMatch[1]}</span>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded-md border border-[#DCE7DF] bg-[#F7FAF7] px-1.5 py-0.5 font-mono text-[0.9em] text-[#275843]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function BlogPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      nodes.push(<h2 key={i} className="mt-7 mb-3 text-[22px] font-bold text-[#1B2B1F]">{parseInlinePreview(line.slice(3))}</h2>);
    } else if (line.startsWith("### ")) {
      nodes.push(<h3 key={i} className="mt-6 mb-2 text-[18px] font-semibold text-[#1B2B1F]">{parseInlinePreview(line.slice(4))}</h3>);
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="my-4 space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-[14px] leading-7 text-[#415146]">
              <span className="mt-[10px] h-1.5 w-1.5 rounded-full bg-[#0F6E56]" />
              <span>{parseInlinePreview(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} className="my-4 space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-[14px] leading-7 text-[#415146]">
              <span className="mt-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-[#0F6E56]/10 text-[11px] font-semibold text-[#0F6E56]">
                {idx + 1}
              </span>
              <span>{parseInlinePreview(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.startsWith("> ")) {
      nodes.push(
        <blockquote key={i} className="my-5 rounded-r-xl border-l-4 border-[#0F6E56] bg-[#F3F8F3] px-4 py-3 text-[14px] italic leading-7 text-[#415146]">
          {parseInlinePreview(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <div key={`code-${i}`} className="my-6 overflow-hidden rounded-[20px] border border-[#213127] bg-[#121A14] shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#182119] px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#314637]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#314637]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#314637]" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              {lang || "code"}
            </span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-[12px] leading-6 text-[#D7E7DB]">
            <code className="font-mono">
              {codeLines.map((codeLine, lineIndex) => (
                <div key={lineIndex} className="grid grid-cols-[32px_1fr] gap-3">
                  <span className="select-none text-right text-white/22">{lineIndex + 1}</span>
                  <span>{codeLine || " "}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      );
      continue;
    } else if (line.trim() === "---") {
      nodes.push(<div key={i} className="my-6 h-px bg-[#E4E9E1]" />);
    } else if (line.trim() !== "") {
      const paragraphLines = [line.trim()];
      while (
        i + 1 < lines.length &&
        lines[i + 1].trim() !== "" &&
        !lines[i + 1].startsWith("## ") &&
        !lines[i + 1].startsWith("### ") &&
        !lines[i + 1].startsWith("- ") &&
        !/^\d+\.\s/.test(lines[i + 1]) &&
        !lines[i + 1].startsWith("> ") &&
        lines[i + 1].trim() !== "---"
      ) {
        paragraphLines.push(lines[i + 1].trim());
        i++;
      }
      nodes.push(<p key={i} className="my-4 text-[14px] leading-7 text-[#415146]">{parseInlinePreview(paragraphLines.join(" "))}</p>);
    }

    i++;
  }

  if (nodes.length === 0) {
    return <p className="text-[13px] leading-6 text-gray-400">Start writing to preview your article structure.</p>;
  }

  return <div>{nodes}</div>;
}

/* ── Modal ────────────────────────────────────────────────────────────────── */

type ModalProps = {
  mode: "create" | "edit";
  initial: BlogPostFormData;
  onClose: () => void;
  onSave: (data: BlogPostFormData) => Promise<void>;
  saving: boolean;
};

function PostModal({ mode, initial, onClose, onSave, saving }: ModalProps) {
  const [form, setForm] = useState<BlogPostFormData>(initial);
  const [tagsInput, setTagsInput] = useState(initial.tags.join(", "));
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function set<K extends keyof BlogPostFormData>(key: K, value: BlogPostFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(title: string) {
    set("title", title);
    if (!slugManuallyEdited) {
      set("slug", slugify(title));
    }
  }

  function handleContentChange(content: string) {
    set("content", content);
    set("readingTime", estimateReadingTime(content));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({ ...form, tags });
  }

  function updateContent(next: string) {
    set("content", next);
    set("readingTime", estimateReadingTime(next));
  }

  function wrapSelection(prefix: string, suffix = prefix, placeholder = "text") {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = form.content.slice(start, end) || placeholder;
    const next = `${form.content.slice(0, start)}${prefix}${selected}${suffix}${form.content.slice(end)}`;
    updateContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }

  function prefixLines(prefix: string, placeholder: string) {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = form.content.slice(start, end) || placeholder;
    const transformed = selected.split("\n").map((line) => (line.trim() ? `${prefix}${line}` : line)).join("\n");
    const next = `${form.content.slice(0, start)}${transformed}${form.content.slice(end)}`;
    updateContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + transformed.length);
    });
  }

  function insertBlock(block: string) {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const prefix = start > 0 && form.content[start - 1] !== "\n" ? "\n\n" : "";
    const suffix = end < form.content.length && form.content[end] !== "\n" ? "\n\n" : "";
    const next = `${form.content.slice(0, start)}${prefix}${block}${suffix}${form.content.slice(end)}`;
    updateContent(next);
    requestAnimationFrame(() => {
      const cursor = start + prefix.length + block.length;
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  function insertCodeBlock() {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = form.content.slice(start, end).trim();
    const snippet = selected || "const migration = 'ready';";
    const prefix = start > 0 && form.content[start - 1] !== "\n" ? "\n\n" : "";
    const suffix = end < form.content.length && form.content[end] !== "\n" ? "\n\n" : "";
    const block = `\`\`\`ts\n${snippet}\n\`\`\``;
    const next = `${form.content.slice(0, start)}${prefix}${block}${suffix}${form.content.slice(end)}`;
    updateContent(next);
    requestAnimationFrame(() => {
      const codeStart = start + prefix.length + "```ts\n".length;
      el.focus();
      el.setSelectionRange(codeStart, codeStart + snippet.length);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-[2px] p-4">
      <div className="relative my-8 w-full max-w-2xl rounded-[20px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.05)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-[#0F6E56]" />
            <h2 className="text-[16px] font-semibold text-gray-900">
              {mode === "create" ? "New blog post" : "Edit blog post"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Title
            </label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. How we migrated from Slack to Element"
              className="w-full rounded-[10px] border border-gray-200 px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/10"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Slug
            </label>
            <input
              required
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                set("slug", e.target.value);
              }}
              placeholder="my-blog-post-slug"
              className="w-full rounded-[10px] border border-gray-200 px-3.5 py-2.5 text-[14px] font-mono text-gray-700 placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/10"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Will be accessible at /blog/{form.slug || "slug"}
            </p>
          </div>

          {/* Category + Reading time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-[10px] border border-gray-200 px-3.5 py-2.5 text-[14px] text-gray-900 focus:border-[#0F6E56] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/10 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Reading time (min)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={form.readingTime}
                onChange={(e) => set("readingTime", parseInt(e.target.value) || 5)}
                className="w-full rounded-[10px] border border-gray-200 px-3.5 py-2.5 text-[14px] text-gray-900 focus:border-[#0F6E56] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/10"
              />
              <p className="mt-1 text-[11px] text-gray-400">Auto-calculated from content</p>
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Cover image URL <span className="font-normal normal-case text-gray-400">(optional)</span>
            </label>
            <input
              type="url"
              value={form.coverImage ?? ""}
              onChange={(e) => set("coverImage", e.target.value || undefined)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-[10px] border border-gray-200 px-3.5 py-2.5 text-[14px] text-gray-700 placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/10"
            />
            {form.coverImage && (
              <div className="mt-2 relative h-24 w-40 overflow-hidden rounded-lg border border-gray-100">
                <Image src={form.coverImage} alt="Cover preview" fill className="object-cover" />
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Excerpt
            </label>
            <textarea
              required
              rows={2}
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="A short description shown in post cards and SEO meta…"
              className="w-full rounded-[10px] border border-gray-200 px-3.5 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/10 resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Content
            </label>
            <div className="mb-2 overflow-hidden rounded-[14px] border border-gray-200 bg-white">
              <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(0,0,0,0.05)] bg-gray-50 px-3 py-2.5">
                {[
                  { label: "H2", icon: Heading2, action: () => prefixLines("## ", "Section heading") },
                  { label: "H3", icon: Heading3, action: () => prefixLines("### ", "Subheading") },
                  { label: "Bold", icon: Bold, action: () => wrapSelection("**") },
                  { label: "Italic", icon: Italic, action: () => wrapSelection("*") },
                  { label: "List", icon: List, action: () => prefixLines("- ", "List item") },
                  { label: "Numbered", icon: ListOrdered, action: () => prefixLines("1. ", "First item") },
                  { label: "Quote", icon: Quote, action: () => prefixLines("> ", "Quote") },
                  { label: "Code", icon: Code2, action: () => insertCodeBlock() },
                  { label: "Link", icon: Link2, action: () => wrapSelection("[", "](https://example.com)", "Link text") },
                  { label: "Divider", icon: Minus, action: () => insertBlock("---") },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-600 transition-colors hover:border-[#0F6E56]/30 hover:text-[#0F6E56]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <div>
                <div className="border-b border-[rgba(0,0,0,0.05)]">
                  <div className="border-b border-[rgba(0,0,0,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Write
                  </div>
                  <textarea
                    ref={contentRef}
                    rows={16}
                    value={form.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Write your article here...&#10;&#10;Use the toolbar for headings, lists, quotes, links, and formatting."
                    className="w-full resize-y border-0 px-4 py-3 text-[13px] font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                  />
                </div>
                <div className="bg-[#FBFCFA]">
                  <div className="border-b border-[rgba(0,0,0,0.05)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                    Preview
                  </div>
                  <div className="max-h-[376px] overflow-y-auto px-4 py-3">
                    <BlogPreview content={form.content} />
                  </div>
                </div>
              </div>
            </div>
            <textarea
              required
              rows={12}
              value={form.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Write your article here…&#10;&#10;Supports basic markdown-like syntax:&#10;## Heading 2   ### Heading 3&#10;**bold**   *italic*   `code`&#10;- List item&#10;> Blockquote"
              className="hidden"
            />
            <p className="mt-2 text-[11px] text-gray-400">
              Use the toolbar to insert headings, lists, quotes, links, code, and dividers without typing markdown manually.
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              Tags <span className="font-normal normal-case text-gray-400">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="migration, slack, open-source"
              className="w-full rounded-[10px] border border-gray-200 px-3.5 py-2.5 text-[14px] text-gray-700 placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/10"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 rounded-[12px] border border-gray-100 bg-gray-50 px-5 py-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => set("published", !form.published)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  form.published ? "bg-[#0F6E56]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                    form.published ? "translate-x-[18px]" : "translate-x-[3px]"
                  }`}
                />
              </button>
              <span className="text-[13px] font-medium text-gray-700">Published</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => set("featured", !form.featured)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  form.featured ? "bg-amber-400" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                    form.featured ? "translate-x-[18px]" : "translate-x-[3px]"
                  }`}
                />
              </button>
              <span className="text-[13px] font-medium text-gray-700">Featured</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border border-gray-200 px-5 py-2.5 text-[14px] font-medium text-gray-600 transition-colors hover:bg-[#FAFAF9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-[10px] bg-[#0F6E56] px-6 py-2.5 text-[14px] font-semibold text-white transition-opacity disabled:opacity-70"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create post" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function BlogTab({ posts: initialPosts }: { posts: BlogPostRow[] }) {
  const router = useRouter();
  const posts = initialPosts;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Derived stats ── */
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
  const published = posts.filter((p) => p.published).length;
  const drafts = posts.filter((p) => !p.published).length;

  /* ── Helpers ── */

  function refresh() {
    startTransition(() => router.refresh());
  }

  function openCreate() {
    setEditingPost(null);
    setModalOpen(true);
  }

  function openEdit(post: BlogPostRow) {
    setEditingPost(post);
    setModalOpen(true);
  }

  async function handleSave(data: BlogPostFormData) {
    setSaving(true);
    try {
      if (editingPost) {
        await adminUpdateBlogPost(editingPost.id, data);
      } else {
        await adminCreateBlogPost(data);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminDeleteBlogPost(id);
      setConfirmDeleteId(null);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  async function handleTogglePublished(id: string) {
    startTransition(async () => {
      await adminToggleBlogPublished(id);
      router.refresh();
    });
  }

  async function handleToggleFeatured(id: string) {
    startTransition(async () => {
      await adminToggleBlogFeatured(id);
      router.refresh();
    });
  }

  /* ── Render ── */

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total posts", value: posts.length, icon: FileText, color: "text-gray-600" },
          { label: "Published", value: published, icon: Globe, color: "text-[#0F6E56]" },
          { label: "Drafts", value: drafts, icon: EyeOff, color: "text-amber-500" },
          { label: "Total views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-[14px] bg-white border border-gray-100 p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-[12px] font-medium text-gray-500">{label}</span>
            </div>
            <p className="text-[22px] font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-[16px] bg-white border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.05)] bg-gray-50">
          <h2 className="text-[14px] font-semibold text-gray-800">All posts</h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-[10px] bg-[#0F6E56] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New Post
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-[14px] font-medium text-gray-500">No blog posts yet</p>
            <p className="text-[13px] text-gray-400 mt-1">Create your first post to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(0,0,0,0.04)]">
            {posts.map((post) => (
              <div key={post.id} className="flex items-start gap-4 px-5 py-4 hover:bg-[#FAFAF9]/50 transition-colors">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-medium text-gray-900 truncate">
                      {post.title}
                    </span>
                    {post.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                        <Star className="h-2.5 w-2.5" />
                        Featured
                      </span>
                    )}
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        post.published
                          ? "bg-green-50 text-[#0F6E56]"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[12px] text-gray-400">
                    <span className="font-medium text-gray-500">{post.category}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.views.toLocaleString()} views
                    </span>
                    <span>·</span>
                    <span>{post.readingTime} min read</span>
                    <span>·</span>
                    <span>{formatDate(post.createdAt)}</span>
                    <span>·</span>
                    <span className="truncate">{post.author.name ?? "Unknown"}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-400 font-mono truncate">/blog/{post.slug}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTogglePublished(post.id)}
                    title={post.published ? "Unpublish" : "Publish"}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    {post.published ? <EyeOff className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(post.id)}
                    title={post.featured ? "Unfeature" : "Feature"}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-amber-50 ${
                      post.featured ? "text-amber-500" : "text-gray-400 hover:text-amber-500"
                    }`}
                  >
                    {post.featured ? <Star className="h-3.5 w-3.5 fill-current" /> : <StarOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => openEdit(post)}
                    title="Edit"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {confirmDeleteId === post.id ? (
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting}
                        className="rounded-lg bg-red-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-[#FAFAF9]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(post.id)}
                      title="Delete"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <PostModal
          mode={editingPost ? "edit" : "create"}
          initial={
            editingPost
              ? {
                  title: editingPost.title,
                  slug: editingPost.slug,
                  excerpt: editingPost.excerpt,
                  content: editingPost.content,
                  coverImage: editingPost.coverImage ?? undefined,
                  category: editingPost.category,
                  tags: editingPost.tags,
                  readingTime: editingPost.readingTime,
                  published: editingPost.published,
                  featured: editingPost.featured,
                }
              : EMPTY_FORM
          }
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
