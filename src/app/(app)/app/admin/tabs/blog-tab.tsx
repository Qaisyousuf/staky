"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  PlusCircle, Pencil, Trash2, Eye, Star, StarOff,
  Globe, EyeOff, X, Loader2, FileText, BookOpen,
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-[2px] p-4">
      <div className="relative my-8 w-full max-w-2xl rounded-[20px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
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
            <textarea
              required
              rows={12}
              value={form.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Write your article here…&#10;&#10;Supports basic markdown-like syntax:&#10;## Heading 2   ### Heading 3&#10;**bold**   *italic*   `code`&#10;- List item&#10;> Blockquote"
              className="w-full rounded-[10px] border border-gray-200 px-3.5 py-2.5 text-[13px] font-mono text-gray-900 placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/10 resize-y"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Supports: ## heading, ### heading, **bold**, *italic*, `code`, - list, &gt; blockquote, --- divider
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
              className="rounded-[10px] border border-gray-200 px-5 py-2.5 text-[14px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
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
  const [posts] = useState<BlogPostRow[]>(initialPosts);
  const [ startTransition] = useTransition();

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
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
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
          <div className="divide-y divide-gray-50">
            {posts.map((post) => (
              <div key={post.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
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
                        className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-50"
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
