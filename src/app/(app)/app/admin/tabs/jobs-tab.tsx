"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Globe, EyeOff, X, Loader2, Briefcase, ChevronDown, ChevronUp, ExternalLink, Users } from "lucide-react";
import {
  adminCreateJob,
  adminUpdateJob,
  adminDeleteJob,
  adminToggleJobPublished,
  adminDeleteApplication,
  type JobFormData,
} from "@/actions/jobs";

/* ── Types ───────────────────────────────────────────────────────────────── */

type Application = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  message: string | null;
  createdAt: Date;
  job: { title: string };
};

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  published: boolean;
  createdAt: Date;
  _count: { applications: number };
};

/* ── Constants ───────────────────────────────────────────────────────────── */

const DEPARTMENTS = ["Engineering", "Design", "Growth", "Operations", "Marketing", "Sales"];
const JOB_TYPES   = ["Full-time", "Part-time", "Contract", "Internship"];

const EMPTY: JobFormData = {
  title: "", department: "Engineering", location: "", type: "Full-time",
  description: "", published: false,
};

const inputCls = "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#0F6E56] focus:bg-white focus:ring-2 focus:ring-[#0F6E56]/10 transition-all";
const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-1.5";

/* ── Job form modal ──────────────────────────────────────────────────────── */

function JobForm({
  initial,
  onSave,
  onClose,
}: {
  initial: JobFormData & { id?: string };
  onSave: (data: JobFormData & { id?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<JobFormData>({ ...initial });
  const [isPending, start] = useTransition();

  function set(key: keyof JobFormData, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => { await onSave({ ...form, id: initial.id }); onClose(); });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.05)] px-6 py-4">
          <h3 className="text-[15px] font-bold text-gray-900">{initial.id ? "Edit posting" : "New job posting"}</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto space-y-4 p-6">
          <div>
            <label className={labelCls}>Job title</label>
            <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Full-Stack Engineer" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Department</label>
              <select className={inputCls} value={form.department} onChange={(e) => set("department", e.target.value)}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
                {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input className={inputCls} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Copenhagen · Remote" required />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} resize-none leading-relaxed`} rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the role, responsibilities, and requirements…" required />
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <div onClick={() => set("published", !form.published)}
              className={`relative h-5 w-9 rounded-full transition-colors ${form.published ? "bg-[#0F6E56]" : "bg-gray-200"}`}>
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.published ? "translate-x-4" : ""}`} />
            </div>
            <span className="text-[13px] font-medium text-gray-700">{form.published ? "Published" : "Draft"}</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-[#FAFAF9]">Cancel</button>
            <button type="submit" disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
              style={{ background: "#0F6E56" }}>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {initial.id ? "Save changes" : "Create posting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Application row ─────────────────────────────────────────────────────── */

function ApplicationRow({ app }: { app: Application }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, start] = useTransition();

  return (
    <div className="border-t border-gray-50">
      <div
        className="flex cursor-pointer items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#FAFAF9]"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{app.name}</p>
          <p className="text-xs text-gray-400 truncate">{app.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">
            {new Date(app.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm("Delete this application?")) start(() => adminDeleteApplication(app.id)); }}
            disabled={isPending}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-400 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-50 bg-gray-50/50 px-5 py-4 space-y-3">
          {app.phone && (
            <p className="text-[13px] text-gray-600"><span className="font-semibold text-gray-400">Phone:</span> {app.phone}</p>
          )}
          {app.linkedinUrl && (
            <p className="text-[13px]">
              <span className="font-semibold text-gray-400">LinkedIn:</span>{" "}
              <a href={app.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="text-[#0F6E56] hover:underline inline-flex items-center gap-1">
                {app.linkedinUrl} <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          )}
          {app.portfolioUrl && (
            <p className="text-[13px]">
              <span className="font-semibold text-gray-400">Portfolio:</span>{" "}
              <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer"
                className="text-[#0F6E56] hover:underline inline-flex items-center gap-1">
                {app.portfolioUrl} <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          )}
          {app.message && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Cover note</p>
              <p className="text-[13px] leading-relaxed text-gray-600 whitespace-pre-wrap">{app.message}</p>
            </div>
          )}
          <a href={`mailto:${app.email}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0F6E56] hover:underline">
            Reply to {app.email} →
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Main tab ────────────────────────────────────────────────────────────── */

export function JobsTab({ jobs, applications }: { jobs: Job[]; applications: Application[] }) {
  const [editing, setEditing] = useState<(JobFormData & { id?: string }) | null>(null);
  const [view, setView] = useState<"postings" | "applications">("postings");
  const [isPending, start] = useTransition();

  function handleSave(data: JobFormData & { id?: string }) {
    return new Promise<void>((resolve) => {
      start(async () => {
        if (data.id) await adminUpdateJob(data.id, data);
        else await adminCreateJob(data);
        resolve();
      });
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {(["postings", "applications"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors capitalize ${
                view === v ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}>
              {v === "applications" ? `Applications (${applications.length})` : "Postings"}
            </button>
          ))}
        </div>
        {view === "postings" && (
          <button onClick={() => setEditing(EMPTY)}
            className="flex items-center gap-1.5 rounded-lg bg-[#0F6E56] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#0D6050] transition-colors">
            <Plus className="h-3.5 w-3.5" /> New posting
          </button>
        )}
      </div>

      {/* Postings view */}
      {view === "postings" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                <Briefcase className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">No job postings yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[rgba(0,0,0,0.04)]">
              <div className="hidden grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 bg-gray-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 lg:grid">
                <span>Role</span><span>Dept</span><span>Location</span><span>Apps</span><span>Status</span><span>Actions</span>
              </div>
              {jobs.map((job) => (
                <div key={job.id} className="flex flex-col gap-3 px-5 py-4 hover:bg-[#FAFAF9] lg:grid lg:grid-cols-[1fr_auto_auto_auto_auto_auto] lg:items-center lg:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{job.type}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-500">{job.department}</span>
                  <span className="shrink-0 text-xs text-gray-500 max-w-[120px] truncate">{job.location}</span>
                  <span className="shrink-0 flex items-center gap-1 text-xs text-gray-500">
                    <Users className="h-3 w-3" /> {job._count.applications}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    job.published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {job.published ? "Live" : "Draft"}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => start(() => adminToggleJobPublished(job.id, !job.published))} disabled={isPending}
                      title={job.published ? "Unpublish" : "Publish"}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40">
                      {job.published ? <EyeOff className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => setEditing({ ...job })}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { if (confirm("Delete this posting and all its applications?")) start(() => adminDeleteJob(job.id)); }}
                      disabled={isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Applications view */}
      {view === "applications" && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">No applications yet.</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_auto] gap-4 bg-gray-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                <span>Applicant</span><span>Role</span>
              </div>
              {applications.map((app) => (
                <div key={app.id}>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-gray-50">
                    <ApplicationRow app={app} />
                    <span className="shrink-0 pr-5 text-[11px] text-gray-400 truncate max-w-[120px]">
                      {app.job.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <JobForm initial={editing} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
