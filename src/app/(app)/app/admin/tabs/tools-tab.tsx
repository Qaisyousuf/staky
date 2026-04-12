"use client";

import { useState, useTransition } from "react";
import {
  Package2, Plus, Pencil, Trash2, ChevronRight,
  Globe, Loader2, RefreshCw,
} from "lucide-react";
import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import {
  createTool, updateTool, deleteTool,
  createAlternative, updateAlternative, deleteAlternative,
  fetchToolMeta,
} from "@/actions/tools";
import { cn } from "@/lib/utils";

// ─── UploadThing ──────────────────────────────────────────────────────────────

const UploadButton = generateUploadButton<OurFileRouter>();

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOL_CATEGORIES = [
  "Communication", "Productivity", "Design", "Cloud Storage",
  "Video Calls", "Development", "Email Marketing", "Project Management",
  "CRM", "Analytics", "Security", "DevOps", "HR", "Finance",
  "E-commerce", "AI", "Database",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool = {
  id: string; slug: string; name: string; logoUrl: string | null;
  origin: string; country: string | null; color: string; abbr: string;
  category: string | null; description: string | null; website: string | null;
  published: boolean;
};

type Alternative = {
  id: string; fromToolId: string; toToolId: string; category: string;
  description: string | null; license: string | null; published: boolean;
  fromTool: Tool; toTool: Tool;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ToolLogo({ tool }: { tool: Pick<Tool, "logoUrl" | "abbr" | "color" | "name"> }) {
  if (tool.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={tool.logoUrl} alt={tool.name}
        className="w-7 h-7 rounded object-contain bg-white border border-gray-100" />
    );
  }
  return (
    <span
      className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ backgroundColor: tool.color }}
    >
      {tool.abbr}
    </span>
  );
}

// ─── Category chip selector ───────────────────────────────────────────────────

function CategoryChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TOOL_CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat === value ? "" : cat)}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
            value === cat
              ? "bg-[#0F6E56] text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ─── Default form states ──────────────────────────────────────────────────────

const defaultToolForm = {
  website: "",
  slug: "", name: "", logoUrl: "", origin: "us" as "us" | "eu",
  country: "", color: "#888888", abbr: "", category: "",
  description: "", published: true,
};

const defaultAltForm = {
  fromToolId: "", toToolId: "", category: "",
  description: "", license: "", published: true,
};

// ─── Main component ───────────────────────────────────────────────────────────

export function ToolsTab({
  initialTools,
  initialAlternatives,
}: {
  initialTools: Tool[];
  initialAlternatives: Alternative[];
}) {
  const [view, setView] = useState<"tools" | "alternatives">("tools");
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [alternatives, setAlternatives] = useState<Alternative[]>(initialAlternatives);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Tool form
  const [toolForm, setToolForm] = useState(defaultToolForm);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [showToolForm, setShowToolForm] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Alt form
  const [altForm, setAltForm] = useState(defaultAltForm);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [showAltForm, setShowAltForm] = useState(false);

  const usTools = tools.filter((t) => t.origin === "us");
  const euTools = tools.filter((t) => t.origin === "eu");

  // ── Website fetch ──────────────────────────────────────────────────────────

  async function handleFetchMeta() {
    if (!toolForm.website.trim()) return;
    setIsFetching(true);
    setError(null);
    try {
      const meta = await fetchToolMeta(toolForm.website.trim());
      setToolForm((prev) => ({
        ...prev,
        name: meta.name || prev.name,
        slug: editingToolId ? prev.slug : (meta.slug || prev.slug),
        abbr: meta.abbr || prev.abbr,
        description: meta.description || prev.description,
        logoUrl: meta.logoUrl || prev.logoUrl,
        website: meta.website || prev.website,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not fetch website info");
    } finally {
      setIsFetching(false);
    }
  }

  // ── Tool handlers ──────────────────────────────────────────────────────────

  function patchTool<K extends keyof typeof defaultToolForm>(key: K, value: (typeof defaultToolForm)[K]) {
    setToolForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !editingToolId) next.slug = slugify(String(value));
      return next;
    });
  }

  function openAddTool() {
    setToolForm(defaultToolForm);
    setEditingToolId(null);
    setShowToolForm(true);
    setError(null);
  }

  function openEditTool(tool: Tool) {
    setToolForm({
      website: tool.website ?? "", slug: tool.slug, name: tool.name,
      logoUrl: tool.logoUrl ?? "", origin: tool.origin as "us" | "eu",
      country: tool.country ?? "", color: tool.color, abbr: tool.abbr,
      category: tool.category ?? "", description: tool.description ?? "",
      published: tool.published,
    });
    setEditingToolId(tool.id);
    setShowToolForm(true);
    setError(null);
  }

  function cancelToolForm() {
    setShowToolForm(false);
    setEditingToolId(null);
    setError(null);
  }

  function saveTool() {
    setError(null);
    startTransition(async () => {
      try {
        if (editingToolId) {
          const updated = await updateTool(editingToolId, toolForm);
          setTools((prev) => prev.map((t) => (t.id === editingToolId ? (updated as Tool) : t)));
        } else {
          const created = await createTool(toolForm);
          setTools((prev) => [...prev, created as Tool]);
        }
        cancelToolForm();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleDeleteTool(id: string) {
    if (!window.confirm("Delete this tool? All associated alternatives will also be deleted.")) return;
    startTransition(async () => {
      try {
        await deleteTool(id);
        setTools((prev) => prev.filter((t) => t.id !== id));
        setAlternatives((prev) => prev.filter((a) => a.fromToolId !== id && a.toToolId !== id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  // ── Alternative handlers ───────────────────────────────────────────────────

  function openAddAlt() {
    setAltForm(defaultAltForm);
    setEditingAltId(null);
    setShowAltForm(true);
    setError(null);
  }

  function openEditAlt(alt: Alternative) {
    setAltForm({
      fromToolId: alt.fromToolId, toToolId: alt.toToolId,
      category: alt.category, description: alt.description ?? "",
      license: alt.license ?? "", published: alt.published,
    });
    setEditingAltId(alt.id);
    setShowAltForm(true);
    setError(null);
  }

  function cancelAltForm() {
    setShowAltForm(false);
    setEditingAltId(null);
    setError(null);
  }

  function saveAlternative() {
    setError(null);
    startTransition(async () => {
      try {
        const fromTool = tools.find((t) => t.id === altForm.fromToolId)!;
        const toTool = tools.find((t) => t.id === altForm.toToolId)!;
        if (editingAltId) {
          const updated = await updateAlternative(editingAltId, altForm);
          setAlternatives((prev) =>
            prev.map((a) =>
              a.id === editingAltId
                ? { ...(updated as Omit<Alternative, "fromTool" | "toTool">), fromTool, toTool }
                : a
            )
          );
        } else {
          const created = await createAlternative(altForm);
          setAlternatives((prev) => [
            ...prev,
            { ...(created as Omit<Alternative, "fromTool" | "toTool">), fromTool, toTool },
          ]);
        }
        cancelAltForm();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleDeleteAlt(id: string) {
    if (!window.confirm("Delete this alternative?")) return;
    startTransition(async () => {
      try {
        await deleteAlternative(id);
        setAlternatives((prev) => prev.filter((a) => a.id !== id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package2 className="h-5 w-5 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Tool Registry</h2>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {(["tools", "alternatives"] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setShowToolForm(false); setShowAltForm(false); setError(null); }}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize",
                view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {v === "tools" ? `Tools (${tools.length})` : `Alternatives (${alternatives.length})`}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── TOOLS ─────────────────────────────────────────────────────────── */}
      {view === "tools" && (
        <div className="space-y-4">
          {showToolForm && (
            <ToolForm
              form={toolForm}
              isEditing={!!editingToolId}
              isPending={isPending}
              isFetching={isFetching}
              onChange={patchTool}
              onLogoUpload={(url) => patchTool("logoUrl", url)}
              onFetchMeta={handleFetchMeta}
              onSave={saveTool}
              onCancel={cancelToolForm}
            />
          )}

          <div className="bg-white rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.05)]">
              <span className="text-sm font-medium text-gray-700">All tools</span>
              {!showToolForm && (
                <button
                  onClick={openAddTool}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#0F6E56] hover:text-[#0a5642] transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add Tool
                </button>
              )}
            </div>

            {tools.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No tools yet. Add one above.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {tools.map((tool) => (
                  <div key={tool.id} className="flex items-center gap-3 px-4 py-3">
                    <ToolLogo tool={tool} />
                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{tool.slug}</span>
                      <span className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded uppercase",
                        tool.origin === "eu" ? "bg-blue-50 text-[#2A5FA5]" : "bg-red-50 text-red-600"
                      )}>
                        {tool.origin}{tool.origin === "eu" && tool.country ? ` · ${tool.country.toUpperCase()}` : ""}
                      </span>
                      {tool.category && <span className="text-xs text-gray-400">{tool.category}</span>}
                      {!tool.published && <span className="text-xs text-gray-400 italic">hidden</span>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditTool(tool)}
                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteTool(tool.id)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ALTERNATIVES ──────────────────────────────────────────────────── */}
      {view === "alternatives" && (
        <div className="space-y-4">
          {showAltForm && (
            <AlternativeForm
              form={altForm}
              isEditing={!!editingAltId}
              isPending={isPending}
              usTools={usTools}
              euTools={euTools}
              onChange={(key, value) => setAltForm((prev) => ({ ...prev, [key]: value }))}
              onSave={saveAlternative}
              onCancel={cancelAltForm}
            />
          )}

          <div className="bg-white rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.05)]">
              <span className="text-sm font-medium text-gray-700">All alternatives</span>
              {!showAltForm && (
                <button
                  onClick={openAddAlt}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#0F6E56] hover:text-[#0a5642] transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add Alternative
                </button>
              )}
            </div>

            {alternatives.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                {usTools.length === 0 || euTools.length === 0
                  ? "Add at least one US and one EU tool first."
                  : "No alternatives yet. Add one above."}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {alternatives.map((alt) => (
                  <div key={alt.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                      <ToolLogo tool={alt.fromTool} />
                      <span className="text-sm font-medium text-gray-700">{alt.fromTool.name}</span>
                      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                      <ToolLogo tool={alt.toTool} />
                      <span className="text-sm font-medium text-gray-700">{alt.toTool.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{alt.category}</span>
                      {alt.license && <span className="text-xs text-gray-400">{alt.license}</span>}
                      {!alt.published && <span className="text-xs text-gray-400 italic">hidden</span>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditAlt(alt)}
                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteAlt(alt.id)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool Form ─────────────────────────────────────────────────────────────────

function ToolForm({
  form, isEditing, isPending, isFetching,
  onChange, onLogoUpload, onFetchMeta, onSave, onCancel,
}: {
  form: typeof defaultToolForm;
  isEditing: boolean;
  isPending: boolean;
  isFetching: boolean;
  onChange: <K extends keyof typeof defaultToolForm>(key: K, value: (typeof defaultToolForm)[K]) => void;
  onLogoUpload: (url: string) => void;
  onFetchMeta: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-semibold text-gray-900 mb-5">
        {isEditing ? "Edit Tool" : "Add Tool"}
      </h3>

      <div className="space-y-5">
        {/* ── Website fetch ─────────────────────────────────────────────── */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Website URL</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="url"
                value={form.website}
                onChange={(e) => onChange("website", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onFetchMeta()}
                placeholder="https://gitea.io"
                className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
              />
            </div>
            <button
              type="button"
              onClick={onFetchMeta}
              disabled={isFetching || !form.website.trim()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {isFetching
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching…</>
                : <><RefreshCw className="h-3.5 w-3.5" /> Fetch info</>
              }
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">Paste the tool website and click &quot;Fetch info&quot; to auto-fill the fields below.</p>
        </div>

        {/* ── Core fields ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="e.g. Gitea"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => onChange("slug", e.target.value)}
              placeholder="e.g. gitea"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
            />
          </div>

          {/* Origin */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Origin *</label>
            <div className="flex gap-2">
              {(["us", "eu"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => onChange("origin", o)}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-lg border transition-colors uppercase",
                    form.origin === o
                      ? o === "eu"
                        ? "bg-blue-50 border-[#2A5FA5] text-[#2A5FA5]"
                        : "bg-red-50 border-red-400 text-red-600"
                      : "border-gray-200 text-gray-500 hover:bg-[#FAFAF9]"
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Country (EU only) */}
          {form.origin === "eu" ? (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Country (ISO 2-letter)</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => onChange("country", e.target.value.toLowerCase().slice(0, 2))}
                placeholder="de"
                maxLength={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
              />
            </div>
          ) : <div />}

          {/* Abbr + Color */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Abbreviation * (2 chars max)</label>
            <input
              type="text"
              value={form.abbr}
              onChange={(e) => onChange("abbr", e.target.value.slice(0, 2).toUpperCase())}
              maxLength={2}
              placeholder="GT"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Badge color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => onChange("color", e.target.value)}
                className="h-9 w-14 rounded border border-gray-200 cursor-pointer"
              />
              <span className="text-sm font-mono text-gray-500">{form.color}</span>
              {form.abbr && (
                <span className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: form.color }}>
                  {form.abbr}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Category</label>
          <CategoryChips value={form.category} onChange={(v) => onChange("category", v)} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            rows={2}
            placeholder="Short description of the tool…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
          />
        </div>

        {/* Logo */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Logo</label>

          <div className="flex items-start gap-4">
            {/* Preview */}
            {form.logoUrl && (
              <div className="flex flex-col items-center gap-1 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logoUrl} alt="Preview"
                  className="w-12 h-12 rounded-lg object-contain border border-gray-200 bg-white p-1" />
                <button type="button" onClick={() => onLogoUpload("")}
                  className="text-[10px] text-red-500 hover:text-red-700">
                  Remove
                </button>
              </div>
            )}

            <div className="flex-1 space-y-2">
              {/* Direct URL input */}
              <div>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => onLogoUpload(e.target.value)}
                  placeholder="Paste URL — e.g. from dashboardicons.com"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Get high-quality icons at{" "}
                  <a href="https://dashboardicons.com" target="_blank" rel="noopener noreferrer"
                    className="text-[#0F6E56] hover:underline">
                    dashboardicons.com
                  </a>
                  {" "}→ right-click icon → Copy image address
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or upload</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Upload button */}
              <UploadButton
                endpoint="toolLogo"
                onClientUploadComplete={(res) => { if (res?.[0]) onLogoUpload(res[0].ufsUrl); }}
                onUploadError={(err) => console.error(err)}
                appearance={{
                  button: "bg-[#0F6E56] hover:bg-[#0a5642] text-white text-xs font-medium px-3 py-2 rounded-lg ut-uploading:opacity-60",
                  allowedContent: "hidden",
                }}
              />
            </div>
          </div>
        </div>

        {/* Published */}
        <div className="flex items-center gap-2">
          <input id="tool-published" type="checkbox" checked={form.published}
            onChange={(e) => onChange("published", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#0F6E56] focus:ring-[#0F6E56]" />
          <label htmlFor="tool-published" className="text-sm text-gray-700 cursor-pointer">Published</label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
        <button
          onClick={onSave}
          disabled={isPending || !form.name || !form.slug || !form.abbr}
          className="px-4 py-2 bg-[#0F6E56] text-white text-sm font-medium rounded-lg hover:bg-[#0a5642] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving…" : isEditing ? "Save Changes" : "Create Tool"}
        </button>
        <button onClick={onCancel} disabled={isPending}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Alternative Form ──────────────────────────────────────────────────────────

function AlternativeForm({
  form, isEditing, isPending, usTools, euTools, onChange, onSave, onCancel,
}: {
  form: typeof defaultAltForm;
  isEditing: boolean;
  isPending: boolean;
  usTools: Tool[];
  euTools: Tool[];
  onChange: (key: keyof typeof defaultAltForm, value: string | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-semibold text-gray-900 mb-5">
        {isEditing ? "Edit Alternative" : "Add Alternative"}
      </h3>

      <div className="space-y-5">
        {/* From / To selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From (US tool) *</label>
            <select
              value={form.fromToolId}
              onChange={(e) => onChange("fromToolId", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
            >
              <option value="">Select US tool…</option>
              {usTools.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To (EU tool) *</label>
            <select
              value={form.toToolId}
              onChange={(e) => onChange("toToolId", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
            >
              <option value="">Select EU tool…</option>
              {euTools.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {/* Category chips */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Category *</label>
          <CategoryChips value={form.category} onChange={(v) => onChange("category", v)} />
        </div>

        {/* License */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">License</label>
          <select
            value={form.license}
            onChange={(e) => onChange("license", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
          >
            <option value="">— Select license —</option>
            <optgroup label="Open Source">
              <option>MIT</option>
              <option>Apache 2.0</option>
              <option>GPL v2</option>
              <option>GPL v3</option>
              <option>AGPL v3</option>
              <option>LGPL</option>
              <option>BSD 2-Clause</option>
              <option>BSD 3-Clause</option>
              <option>MPL 2.0</option>
              <option>Open Source</option>
            </optgroup>
            <optgroup label="Commercial">
              <option>SaaS</option>
              <option>Freemium</option>
              <option>Proprietary</option>
              <option>Source Available</option>
            </optgroup>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            rows={2}
            placeholder="Why is this a good alternative?…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20 focus:border-[#0F6E56]"
          />
        </div>

        {/* Published */}
        <div className="flex items-center gap-2">
          <input id="alt-published" type="checkbox" checked={form.published}
            onChange={(e) => onChange("published", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#0F6E56] focus:ring-[#0F6E56]" />
          <label htmlFor="alt-published" className="text-sm text-gray-700 cursor-pointer">Published</label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
        <button
          onClick={onSave}
          disabled={isPending || !form.fromToolId || !form.toToolId || !form.category}
          className="px-4 py-2 bg-[#0F6E56] text-white text-sm font-medium rounded-lg hover:bg-[#0a5642] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving…" : isEditing ? "Save Changes" : "Create Alternative"}
        </button>
        <button onClick={onCancel} disabled={isPending}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
