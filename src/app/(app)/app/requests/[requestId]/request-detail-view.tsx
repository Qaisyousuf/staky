"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Globe,
  Hash,
  MessageSquare,
  Receipt,
  Send,
  Terminal,
  Timer,
  XCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolIcon } from "@/components/shared/tool-icon";
import { RequestTimeline } from "./request-timeline";
import { RequestConversation } from "./request-conversation";
import { ProposalActions } from "./proposal-actions";
import { InvoiceView } from "./invoice-view";
import { ConfigForm } from "./config-form";
import { cancelMigrationRequest } from "./request-detail-actions";
import { ShareExperienceTrigger } from "@/components/shared/share-experience-trigger";
import type { InvoiceLineItem, InvoiceStatusType } from "@/lib/invoice-utils";
import type { ConfigItem } from "@/lib/config-templates";
import type { MigrationTask, MigrationProposal, TaskPriority } from "@/lib/request-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SerializedMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string | null; image: string | null; role: string };
}

export interface SerializedInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatusType;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxPercent: number;
  total: number;
  currency: string;
  dueDate: string | null;
  notes: string | null;
  sentAt: string | null;
  paidAt: string | null;
}

export interface RequestDetailViewProps {
  requestId: string;
  currentUserId: string;
  requestRef: string;

  fromTool: string;
  toTool: string;
  fromToolName: string;
  toToolName: string;
  status: string;
  statusCls: string;
  statusLabel: string;
  urgency: string | null;
  description: string | null;
  userGoals: string | null;
  createdAt: string;
  targetDate: string | null;

  tasks: MigrationTask[];
  proposal: MigrationProposal | null;
  configItems: ConfigItem[] | null;
  configSentAt: string | null;
  invoice: SerializedInvoice | null;
  messages: SerializedMessage[];

  partner: {
    companyName: string;
    country: string | null;
    website: string | null;
  } | null;

  canCancel: boolean;
}

// ── Priority colours ──────────────────────────────────────────────────────────

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-500 border-gray-200",
  medium: "bg-blue-50 text-[#2A5FA5] border-blue-200",
  high: "bg-orange-50 text-orange-600 border-orange-200",
  urgent: "bg-red-50 text-red-600 border-red-200",
};

// ── Tab types ─────────────────────────────────────────────────────────────────

type TabId = "overview" | "progress" | "config" | "invoice" | "messages";
interface TabDef { id: TabId; label: string; icon: React.ElementType; badge?: string }

// ── Main component ────────────────────────────────────────────────────────────

export function RequestDetailView(props: RequestDetailViewProps) {
  const {
    requestId, currentUserId, requestRef,
    fromTool, toTool, fromToolName, toToolName,
    status, statusCls, statusLabel, urgency,
    description, userGoals, createdAt, targetDate,
    tasks, proposal, configItems, configSentAt, invoice, messages,
    partner, canCancel,
  } = props;

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const hasInvoice = !!invoice && invoice.status !== "DRAFT" && invoice.status !== "CANCELLED";
  const hasConfig = !!configSentAt && !!configItems;
  const hasPartner = !!partner;
  const daysSince = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);

  // Pending config revisions
  const revisionCount = configItems?.filter((i) => i.status === "revision").length ?? 0;
  const pendingCount = configItems?.filter((i) => i.status === "pending").length ?? 0;
  const configBadge = revisionCount > 0
    ? `${revisionCount} revision${revisionCount > 1 ? "s" : ""}`
    : pendingCount > 0
    ? `${pendingCount} pending`
    : undefined;

  const tabs: TabDef[] = [
    { id: "overview", label: "Overview", icon: Hash },
    ...(tasks.length > 0
      ? [{ id: "progress" as TabId, label: "Progress", badge: `${doneCount}/${tasks.length}`, icon: Zap }]
      : []),
    ...(hasConfig
      ? [{ id: "config" as TabId, label: "Config", badge: configBadge, icon: ClipboardList }]
      : []),
    ...(hasInvoice
      ? [{ id: "invoice" as TabId, label: "Invoice", icon: Receipt }]
      : []),
    ...(hasPartner
      ? [{ id: "messages" as TabId, label: "Messages", badge: messages.length > 0 ? String(messages.length) : undefined, icon: MessageSquare }]
      : []),
  ];

  const requestStatus = status as "PENDING" | "UNDER_REVIEW" | "MATCHED" | "PROPOSAL_SENT" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

  return (
    <div className="mx-auto max-w-5xl">

      {/* Back link */}
      <Link
        href="/app/requests"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Requests
      </Link>

      {/* ══ Project header ══ */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-[3px] bg-gradient-to-r from-[#0F6E56] via-[#2A5FA5] to-[#0F6E56]" />
        <div className="px-6 py-5">

          {/* Migration path + status */}
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex flex-1 min-w-0 items-center gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 min-w-0">
                <ToolIcon slug={fromTool} size="md" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">From</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{fromToolName}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-gray-300" />
              <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3 min-w-0">
                <ToolIcon slug={toTool} size="md" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-green-500">To</p>
                  <p className="text-sm font-bold text-[#0F6E56] truncate">{toToolName}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className={cn("rounded-lg border px-3 py-1.5 text-xs font-bold tracking-wide", statusCls)}>
                {statusLabel}
              </span>
              {urgency && urgency !== "normal" && (
                <span className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  urgency === "urgent" ? "border-red-200 bg-red-50 text-red-600" : "border-orange-200 bg-orange-50 text-orange-600"
                )}>
                  <AlertTriangle className="h-3 w-3" /> {urgency}
                </span>
              )}
            </div>
          </div>

          {/* REQ ID + date */}
          <div className="mt-3 flex items-center gap-2">
            <code className="font-mono text-[11px] font-semibold tracking-[0.18em] text-gray-400">
              {requestRef}
            </code>
            <span className="text-gray-300">·</span>
            <span className="text-[11px] text-gray-400">
              Submitted {new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          {/* Description / goals */}
          {(description || userGoals) && (
            <div className="mt-3 space-y-2">
              {description && <p className="text-sm leading-relaxed text-gray-600">{description}</p>}
              {userGoals && (
                <div className="rounded-lg border-l-2 border-[#0F6E56]/30 bg-green-50/40 py-2 pl-3 pr-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-500">Your goals</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{userGoals}</p>
                </div>
              )}
            </div>
          )}

          {/* Stat pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatPill icon={Clock} label={`${daysSince}d ago`} />
            {tasks.length > 0 && (
              <StatPill icon={Zap} label={`${doneCount}/${tasks.length} tasks done`} accent={doneCount === tasks.length ? "green" : "blue"} />
            )}
            {hasConfig && (
              <StatPill
                icon={ClipboardList}
                label={revisionCount > 0 ? `${revisionCount} revision${revisionCount > 1 ? "s" : ""} needed` : pendingCount > 0 ? `${pendingCount} to fill` : "Config complete"}
                accent={revisionCount > 0 ? "red" : pendingCount > 0 ? "amber" : "green"}
              />
            )}
            {hasInvoice && (
              <StatPill icon={Receipt} label={invoice!.status === "PAID" ? "Invoice paid" : "Invoice received"} accent={invoice!.status === "PAID" ? "green" : "amber"} />
            )}
            {messages.length > 0 && (
              <StatPill icon={MessageSquare} label={`${messages.length} messages`} />
            )}
            {targetDate && (
              <StatPill icon={CalendarDays} label={`Due ${new Date(targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`} accent="green" />
            )}
          </div>
        </div>
      </div>

      {/* ══ Main area: left nav + content ══ */}
      <div className="mt-4 flex items-start gap-4">

        {/* Left sidebar nav */}
        <nav className="hidden md:flex w-52 shrink-0 flex-col rounded-xl border border-gray-200 bg-white py-2 shadow-sm sticky top-6">
          <p className="mb-1 px-4 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Sections
          </p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "mx-1.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  isActive ? "bg-green-50 text-[#0F6E56]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#0F6E56]" : "text-gray-400")} />
                <span className="flex-1">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    isActive ? "bg-green-100 text-[#0F6E56]" : "bg-gray-100 text-gray-500"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile tab bar */}
        <div className="md:hidden mb-2 w-full">
          <div className="flex overflow-x-auto gap-1 rounded-xl border border-gray-200 bg-white p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                    isActive ? "bg-green-50 text-[#0F6E56]" : "text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-4">

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <>
              {/* 2-col: left = pipeline + proposal | right = partner + meta */}
              <div className="grid gap-4 lg:grid-cols-[1fr_260px]">

                {/* Left */}
                <div className="space-y-4">
                  <RequestTimeline status={requestStatus} />

                  {/* Proposal */}
                  {proposal && (
                    <div className="overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 shadow-sm">
                      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-violet-100">
                        <Send className="h-4 w-4 text-violet-500" />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600">
                          Partner proposal
                        </p>
                        <span className="ml-auto font-mono text-[11px] text-violet-400">
                          {new Date(proposal.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <div className="p-5 space-y-3">
                        {proposal.timeline && (
                          <div className="rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Timeline</p>
                            <p className="mt-1 text-sm font-semibold text-gray-800">{proposal.timeline}</p>
                          </div>
                        )}
                        {proposal.budgetRange && (
                          <div className="rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Budget range</p>
                            <p className="mt-1 text-sm font-semibold text-gray-800">{proposal.budgetRange}</p>
                          </div>
                        )}
                        {proposal.approach && (
                          <div className="rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Approach</p>
                            <p className="mt-1 text-sm leading-relaxed text-gray-700">{proposal.approach}</p>
                          </div>
                        )}
                        {status === "PROPOSAL_SENT" && (
                          <div className="pt-1">
                            <ProposalActions requestId={requestId} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cancel (pre-assignment) */}
                  {canCancel && <CancelSection requestId={requestId} />}

                  {/* Share experience */}
                  {status === "COMPLETED" && partner && (
                    <ShareExperienceTrigger
                      fromTool={fromTool}
                      toTool={toTool}
                      fromToolName={fromToolName}
                      toToolName={toToolName}
                      partnerName={partner.companyName}
                      context={userGoals ?? description ?? null}
                      isPartnerMode={false}
                    />
                  )}
                </div>

                {/* Right sidebar */}
                <div className="space-y-3">
                  {/* Partner card */}
                  {partner ? (
                    <div className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
                      <div className="border-b border-gray-50 px-4 pt-3.5 pb-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Partner</p>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <BriefcaseBusiness className="h-5 w-5 text-[#2A5FA5]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{partner.companyName}</p>
                            {partner.country && (
                              <p className="text-[11px] text-gray-400">{partner.country}</p>
                            )}
                          </div>
                        </div>
                        {partner.website && (
                          <a
                            href={partner.website.startsWith("http") ? partner.website : `https://${partner.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-[#2A5FA5] hover:bg-blue-50 transition-colors"
                          >
                            <Globe className="h-3.5 w-3.5 shrink-0" /> {partner.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="border-b border-gray-50 px-4 pt-3.5 pb-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Partner</p>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                            <BriefcaseBusiness className="h-5 w-5 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500 leading-snug">
                            Matching in progress — we&apos;ll notify you once assigned.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Request metadata */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-50 px-4 pt-3.5 pb-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Details</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      <MetaRow label="Submitted" value={new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
                      {urgency && urgency !== "normal" && (
                        <MetaRow
                          label="Urgency"
                          value={urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                          valueColor={urgency === "urgent" ? "text-red-600" : "text-orange-600"}
                        />
                      )}
                      {tasks.length > 0 && (
                        <div className="px-4 py-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-gray-500">Progress</span>
                            <span className="font-mono text-xs font-bold text-gray-700">{doneCount}/{tasks.length}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", doneCount === tasks.length ? "bg-[#0F6E56]" : "bg-[#2A5FA5]")}
                              style={{ width: `${tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {targetDate && (
                        <MetaRow
                          label="Target date"
                          value={new Date(targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          valueColor="text-[#0F6E56]"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Progress ── */}
          {activeTab === "progress" && tasks.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Header with progress ring */}
              <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-4">
                {(() => {
                  const pct = Math.round((doneCount / tasks.length) * 100);
                  const r = 20;
                  const circ = 2 * Math.PI * r;
                  const color = pct === 100 ? "#0F6E56" : "#2A5FA5";
                  return (
                    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0 -rotate-90">
                      <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
                      <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="5"
                        strokeLinecap="round" strokeDasharray={circ}
                        strokeDashoffset={circ * (1 - pct / 100)} />
                      <text x="26" y="26" dominantBaseline="central" textAnchor="middle"
                        fontSize="10" fontWeight="800" fill={color}
                        style={{ transform: "rotate(90deg)", transformOrigin: "26px 26px" }}>
                        {pct}%
                      </text>
                    </svg>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">Migration progress</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {doneCount} of {tasks.length} tasks completed by your partner
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs">
                  {[
                    { label: "Todo", count: tasks.filter(t => t.status === "todo").length, cls: "text-gray-500" },
                    { label: "Active", count: tasks.filter(t => t.status === "in_progress").length, cls: "text-[#2A5FA5]" },
                    { label: "Done", count: doneCount, cls: "text-[#0F6E56]" },
                  ].map(({ label, count, cls }) => (
                    <div key={label} className="flex items-center gap-1">
                      <span className={cn("font-bold tabular-nums", cls)}>{count}</span>
                      <span className="text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1 w-full bg-gray-100">
                <div className="h-full bg-[#0F6E56] transition-all duration-500"
                  style={{ width: `${Math.round((doneCount / tasks.length) * 100)}%` }} />
              </div>
              {/* Task rows */}
              <div className="divide-y divide-gray-50">
                {[
                  ...tasks.filter(t => t.status === "in_progress"),
                  ...tasks.filter(t => t.status === "todo"),
                  ...tasks.filter(t => t.status === "done"),
                ].map((task) => {
                  const priorityMeta = task.priority ? PRIORITY_BADGE[task.priority as TaskPriority] : null;
                  const statusPill =
                    task.status === "done" ? "bg-green-50 text-[#0F6E56] border-green-200"
                    : task.status === "in_progress" ? "bg-blue-50 text-[#2A5FA5] border-blue-200"
                    : "bg-gray-100 text-gray-500 border-gray-200";
                  const statusLabel = task.status === "done" ? "Done" : task.status === "in_progress" ? "Active" : "Todo";
                  return (
                    <div key={task.id} className="px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                          task.status === "done" ? "border-[#0F6E56] bg-[#0F6E56] text-white"
                          : task.status === "in_progress" ? "border-[#2A5FA5]"
                          : "border-gray-300"
                        )}>
                          {task.status === "done" && <Check className="h-3 w-3" />}
                          {task.status === "in_progress" && <span className="h-2 w-2 rounded-full bg-[#2A5FA5]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={cn("text-sm font-semibold", task.status === "done" ? "text-gray-400 line-through" : "text-gray-800")}>
                              {task.title}
                            </span>
                            {priorityMeta && task.status !== "done" && (
                              <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold capitalize", priorityMeta)}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{task.description}</p>
                          )}
                          {(task.estimatedTime || (task.status === "done" && task.completedAt)) && (
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                              {task.estimatedTime && (
                                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                  <Timer className="h-3 w-3" /> {task.estimatedTime}
                                </span>
                              )}
                              {task.status === "done" && task.completedAt && (
                                <span className="flex items-center gap-1 text-[11px] text-[#0F6E56]">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Completed {new Date(task.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                </span>
                              )}
                            </div>
                          )}
                          {task.techNote && (
                            <div className="mt-2 flex items-start gap-2 rounded-xl border border-gray-700/20 bg-gray-950 px-3 py-2">
                              <Terminal className="mt-0.5 h-3 w-3 shrink-0 text-green-400" />
                              <code className="font-mono text-[11px] leading-relaxed text-green-300 break-all">{task.techNote}</code>
                            </div>
                          )}
                        </div>
                        <span className={cn("shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold", statusPill)}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Config ── */}
          {activeTab === "config" && hasConfig && (
            <ConfigForm
              requestId={requestId}
              fromToolName={fromToolName}
              toToolName={toToolName}
              configItems={configItems!}
              configSentAt={configSentAt!}
            />
          )}

          {/* ── Invoice ── */}
          {activeTab === "invoice" && hasInvoice && partner && (
            <InvoiceView
              invoice={invoice!}
              requestRef={requestRef}
              fromToolName={fromToolName}
              toToolName={toToolName}
              partnerName={partner.companyName}
              partnerCountry={partner.country}
              clientName=""
              clientEmail=""
              clientCompany={null}
            />
          )}

          {/* ── Messages ── */}
          {activeTab === "messages" && hasPartner && (
            <RequestConversation
              requestId={requestId}
              currentUserId={currentUserId}
              initialMessages={messages.map((m) => ({ ...m, createdAt: new Date(m.createdAt) }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon, label, accent,
}: {
  icon: React.ElementType;
  label: string;
  accent?: "green" | "blue" | "red" | "amber" | "default";
}) {
  const colors: Record<string, string> = {
    green: "border-green-100 bg-green-50 text-[#0F6E56]",
    blue: "border-blue-100 bg-blue-50 text-[#2A5FA5]",
    red: "border-red-100 bg-red-50 text-red-600",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    default: "border-gray-100 bg-gray-50 text-gray-600",
  };
  return (
    <span className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", colors[accent ?? "default"])}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function MetaRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={cn("text-xs font-semibold text-gray-700", valueColor)}>{value}</span>
    </div>
  );
}

function CancelSection({ requestId }: { requestId: string }) {
  return (
    <form action={cancelMigrationRequest.bind(null, requestId)}>
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
      >
        <XCircle className="h-4 w-4" /> Cancel request
      </button>
    </form>
  );
}
