"use client";

import { useState, useTransition } from "react";
import { Mail, MailOpen, Trash2, MessageCircle, Building2, FileText, AlertCircle, Inbox } from "lucide-react";
import { adminMarkContactRead, adminDeleteContact } from "@/actions/contact";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  read: boolean;
  createdAt: Date;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TOPIC_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  general:     { label: "General",     icon: MessageCircle, color: "bg-blue-50 text-blue-600" },
  partnership: { label: "Partnership", icon: Building2,     color: "bg-purple-50 text-purple-600" },
  press:       { label: "Press",       icon: FileText,      color: "bg-amber-50 text-amber-600" },
  bug:         { label: "Bug report",  icon: AlertCircle,   color: "bg-red-50 text-red-600" },
};

function TopicBadge({ topic }: { topic: string }) {
  const cfg = TOPIC_CONFIG[topic] ?? { label: topic, icon: MessageCircle, color: "bg-gray-100 text-gray-600" };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.color}`}>
      <Icon className="h-3 w-3 shrink-0" />
      {cfg.label}
    </span>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function ContactRowActions({ id, read }: { id: string; read: boolean }) {
  const [isPending, start] = useTransition();

  return (
    <div className="flex items-center gap-1">
      {!read && (
        <button
          onClick={() => start(() => adminMarkContactRead(id))}
          disabled={isPending}
          title="Mark as read"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
        >
          <MailOpen className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        onClick={() => {
          if (confirm("Delete this message?")) start(() => adminDeleteContact(id));
        }}
        disabled={isPending}
        title="Delete"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Expanded message ─────────────────────────────────────────────────────────

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function ContactTab({ submissions }: { submissions: ContactSubmission[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const unread = submissions.filter((s) => !s.read).length;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">{submissions.length} total messages</span>
        {unread > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#0F6E56]/10 px-2 py-0.5 text-xs font-semibold text-[#0F6E56]">
            <Mail className="h-3 w-3" />
            {unread} unread
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <Inbox className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">No contact submissions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(0,0,0,0.04)]">
            {/* Column headers */}
            <div className="hidden grid-cols-[20px_1fr_1fr_auto_auto_auto_auto] gap-4 bg-gray-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400 lg:grid">
              <span />
              <span>Sender</span>
              <span>Message</span>
              <span>Topic</span>
              <span>Date</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {submissions.map((sub) => (
              <>
                <div
                  key={sub.id}
                  onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
                  className={`flex cursor-pointer flex-col gap-3 px-5 py-4 transition-colors hover:bg-[#FAFAF9] lg:grid lg:grid-cols-[20px_1fr_1fr_auto_auto_auto_auto] lg:items-center lg:gap-4 ${
                    !sub.read ? "bg-[#0F6E56]/[0.02]" : ""
                  }`}
                >
                  {/* Unread dot */}
                  <div className="hidden items-center lg:flex">
                    {!sub.read && (
                      <span className="h-2 w-2 rounded-full bg-[#0F6E56]" />
                    )}
                  </div>

                  {/* Sender */}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${!sub.read ? "text-gray-900" : "text-gray-700"}`}>
                      {sub.name}
                    </p>
                    <p className="truncate text-[11px] text-gray-400">{sub.email}</p>
                  </div>

                  {/* Message preview */}
                  <div className="min-w-0">
                    <p className="truncate text-sm text-gray-500">{sub.message}</p>
                  </div>

                  {/* Topic */}
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <TopicBadge topic={sub.topic} />
                  </div>

                  {/* Date */}
                  <div className="shrink-0 text-xs text-gray-400">
                    {new Date(sub.createdAt).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      sub.read ? "bg-gray-100 text-gray-400" : "bg-green-50 text-green-700"
                    }`}>
                      {sub.read ? "Read" : "New"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <ContactRowActions id={sub.id} read={sub.read} />
                  </div>
                </div>

                {/* Expanded message */}
                {expanded === sub.id && (
                  <div key={`${sub.id}-msg`} className="border-t border-gray-50 px-5 pb-4 pt-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {sub.message}
                    </div>
                    <a
                      href={`mailto:${sub.email}?subject=Re: ${sub.topic}`}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6E56] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="h-3 w-3" />
                      Reply to {sub.email}
                    </a>
                  </div>
                )}
              </>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
