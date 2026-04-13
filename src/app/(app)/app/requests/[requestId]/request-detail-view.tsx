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
  Trash2,
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
import { cancelMigrationRequest, deleteRequest } from "./request-detail-actions";
import { ShareExperienceTrigger } from "@/components/shared/share-experience-trigger";
import type { InvoiceLineItem, InvoiceStatusType } from "@/lib/invoice-utils";
import type { ConfigItem } from "@/lib/config-templates";
import type { MigrationTask, MigrationProposal, TaskPriority } from "@/lib/request-utils";
import type { DbTool } from "@/components/shared/tool-icon";

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_SHADOW = "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)";
const CARD_BORDER = "1.5px solid rgba(0,0,0,0.06)";
const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

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
  fromToolData: Pick<DbTool, "logoUrl" | "color" | "abbr"> | null;
  toToolData: Pick<DbTool, "logoUrl" | "color" | "abbr"> | null;
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
  low:    "bg-[rgba(0,0,0,0.04)] text-[#5C6B5E] border-[rgba(0,0,0,0.06)]",
  medium: "bg-[#EBF1FA] text-[#2A5FA5] border-[rgba(42,95,165,0.15)]",
  high:   "bg-orange-50 text-orange-600 border-orange-200",
  urgent: "bg-red-50 text-red-600 border-red-200",
};

// ── Tab types ─────────────────────────────────────────────────────────────────

type TabId = "overview" | "progress" | "config" | "invoice" | "messages";
interface TabDef { id: TabId; label: string; icon: React.ElementType; badge?: string }

// ── Main component ────────────────────────────────────────────────────────────

export function RequestDetailView(props: RequestDetailViewProps) {
  const {
    requestId, currentUserId, requestRef,
    fromTool, toTool, fromToolName, toToolName, fromToolData, toToolData,
    status, statusCls, statusLabel, urgency,
    description, userGoals, createdAt, targetDate,
    tasks, proposal, configItems, configSentAt, invoice, messages,
    partner, canCancel,
  } = props;

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const doneCount  = tasks.filter((t) => t.status === "done").length;
  const hasInvoice = !!invoice && invoice.status !== "DRAFT" && invoice.status !== "CANCELLED";
  const hasConfig  = !!configSentAt && !!configItems;
  const hasPartner = !!partner;
  const daysSince  = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);

  const revisionCount = configItems?.filter((i) => i.status === "revision").length ?? 0;
  const pendingCount  = configItems?.filter((i) => i.status === "pending").length ?? 0;
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
    <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8" style={{ fontFamily: F }}>

      {/* Back link */}
      <Link
        href="/app/requests"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5C6B5E] transition-colors hover:text-[#1B2B1F]"
      >
        <ArrowLeft className="h-4 w-4" />
        Requests
      </Link>

      {/* ══ Project header ══ */}
      <div
        className="overflow-hidden rounded-2xl bg-white mb-4"
        style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
      >
        {/* Accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-[#0F6E56] via-[#2A5FA5] to-[#0F6E56]" />

        <div className="px-4 sm:px-6 py-4 sm:py-5">

          {/* Migration path + status */}
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            {/* From → To chips */}
            <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
              {/* From */}
              <div
                className="flex items-center gap-2 sm:gap-3 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 min-w-0"
                style={{ background: "rgba(0,0,0,0.03)", border: CARD_BORDER }}
              >
                <ToolIcon
                  slug={fromTool}
                  toolData={fromToolData ? { name: fromToolName, ...fromToolData } : undefined}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#9BA39C]">From</p>
                  <p className="text-[12px] sm:text-[13px] font-bold text-[#1B2B1F] truncate max-w-[90px] sm:max-w-none">{fromToolName}</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[#C8D0CA]" />
              {/* To */}
              <div
                className="flex items-center gap-2 sm:gap-3 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 min-w-0"
                style={{ background: "#EAF3EE", border: "1.5px solid rgba(15,110,86,0.12)" }}
              >
                <ToolIcon
                  slug={toTool}
                  toolData={toToolData ? { name: toToolName, ...toToolData } : undefined}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F6E56]">To</p>
                  <p className="text-[12px] sm:text-[13px] font-bold text-[#0F6E56] truncate max-w-[90px] sm:max-w-none">{toToolName}</p>
                </div>
              </div>
            </div>

            {/* Status + urgency */}
            <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
              <span className={cn("rounded-xl border px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[12px] font-bold tracking-wide whitespace-nowrap", statusCls)}>
                {statusLabel}
              </span>
              {urgency && urgency !== "normal" && (
                <span className={cn(
                  "flex items-center gap-1 rounded-full border px-2 sm:px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  urgency === "urgent" ? "border-red-200 bg-red-50 text-red-600" : "border-orange-200 bg-orange-50 text-orange-600"
                )}>
                  <AlertTriangle className="h-3 w-3" /> {urgency}
                </span>
              )}
            </div>
          </div>

          {/* REQ ID + date */}
          <div className="mt-2.5 sm:mt-3 flex items-center gap-2 flex-wrap">
            <code className="font-mono text-[10px] sm:text-[11px] font-semibold tracking-[0.15em] sm:tracking-[0.18em] text-[#9BA39C]">
              {requestRef}
            </code>
            <span className="text-[#C8D0CA]">·</span>
            <span className="text-[11px] sm:text-[12px] text-[#9BA39C]">
              Submitted {new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          {/* Description / goals */}
          {(description || userGoals) && (
            <div className="mt-3 space-y-2">
              {description && (
                <p className="text-[13px] leading-relaxed text-[#5C6B5E]">{description}</p>
              )}
              {userGoals && (
                <div
                  className="rounded-xl py-2.5 pl-3.5 pr-3"
                  style={{ borderLeft: "3px solid rgba(15,110,86,0.4)", background: "#EAF3EE" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F6E56]">Your goals</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[#5C6B5E]">{userGoals}</p>
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

      {/* ══ Main area ══ */}

      {/* Mobile tab bar — outside the flex row so it stacks above content */}
      <div className="md:hidden mb-3">
        <div
          className="flex overflow-x-auto gap-1.5 rounded-2xl p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ background: "rgba(0,0,0,0.04)", border: CARD_BORDER }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold whitespace-nowrap transition-all",
                  isActive ? "bg-white text-[#0F6E56]" : "text-[#5C6B5E] hover:text-[#1B2B1F] hover:bg-white/60"
                )}
                style={isActive ? { boxShadow: "0 1px 4px rgba(0,0,0,0.10)" } : {}}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: "rgba(0,0,0,0.07)", color: "#5C6B5E" }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-4">

        {/* Desktop sidebar nav */}
        <nav
          className="hidden md:flex w-52 shrink-0 flex-col rounded-2xl bg-white py-2 sticky top-6"
          style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
        >
          <p className="mb-1 px-4 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9BA39C]">
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
                  "mx-1.5 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all text-left",
                  isActive ? "text-[#0F6E56]" : "text-[#5C6B5E] hover:bg-[#F7F9F8] hover:text-[#1B2B1F]"
                )}
                style={isActive ? { background: "#EAF3EE" } : {}}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                  style={isActive ? { background: "#0F6E56" } : { background: "rgba(0,0,0,0.05)" }}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-[#9BA39C]")} />
                </div>
                <span className="flex-1">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                    style={isActive
                      ? { background: "rgba(15,110,86,0.15)", color: "#0F6E56" }
                      : { background: "rgba(0,0,0,0.06)", color: "#5C6B5E" }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-4">

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">

              {/* Left */}
              <div className="space-y-4">
                <RequestTimeline status={requestStatus} />

                {/* Proposal */}
                {proposal && (
                  <div
                    className="overflow-hidden rounded-2xl"
                    style={{ border: "1.5px solid rgba(124,58,237,0.15)", boxShadow: CARD_SHADOW }}
                  >
                    <div
                      className="flex items-center gap-2 px-5 py-3.5 border-b"
                      style={{ background: "linear-gradient(to right, #faf5ff, #f5f3ff)", borderColor: "rgba(124,58,237,0.1)" }}
                    >
                      <Send className="h-4 w-4 text-violet-500" />
                      <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600 flex-1">
                        Partner proposal
                      </p>
                      <span className="font-mono text-[11px] text-violet-400">
                        {new Date(proposal.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <div className="p-5 space-y-3 bg-white">
                      {proposal.timeline && (
                        <div className="rounded-xl px-3 py-2.5" style={{ border: "1.5px solid rgba(124,58,237,0.1)", background: "#faf5ff" }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Timeline</p>
                          <p className="mt-1 text-[13px] font-semibold text-[#1B2B1F]">{proposal.timeline}</p>
                        </div>
                      )}
                      {proposal.budgetRange && (
                        <div className="rounded-xl px-3 py-2.5" style={{ border: "1.5px solid rgba(124,58,237,0.1)", background: "#faf5ff" }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Budget range</p>
                          <p className="mt-1 text-[13px] font-semibold text-[#1B2B1F]">{proposal.budgetRange}</p>
                        </div>
                      )}
                      {proposal.approach && (
                        <div className="rounded-xl px-3 py-2.5" style={{ border: "1.5px solid rgba(124,58,237,0.1)", background: "#faf5ff" }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Approach</p>
                          <p className="mt-1 text-[13px] leading-relaxed text-[#5C6B5E]">{proposal.approach}</p>
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

                {/* Cancel / Delete */}
                {canCancel && <CancelSection requestId={requestId} />}
                {["CANCELLED", "COMPLETED"].includes(status) && (
                  <DeleteSection requestId={requestId} />
                )}

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
                  <div
                    className="bg-white rounded-2xl overflow-hidden"
                    style={{ border: "1.5px solid rgba(42,95,165,0.12)", boxShadow: CARD_SHADOW }}
                  >
                    <div className="px-4 pt-3.5 pb-2.5 border-b border-[rgba(0,0,0,0.04)]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9BA39C]">Partner</p>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EBF1FA]">
                          <BriefcaseBusiness className="h-5 w-5 text-[#2A5FA5]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-[#1B2B1F] truncate">{partner.companyName}</p>
                          {partner.country && (
                            <p className="text-[12px] text-[#9BA39C]">{partner.country}</p>
                          )}
                        </div>
                      </div>
                      {partner.website && (
                        <a
                          href={partner.website.startsWith("http") ? partner.website : `https://${partner.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-[#2A5FA5] transition-colors hover:bg-[#EBF1FA]"
                          style={{ border: "1.5px solid rgba(42,95,165,0.12)", background: "rgba(42,95,165,0.04)" }}
                        >
                          <Globe className="h-3.5 w-3.5 shrink-0" />
                          {partner.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className="bg-white rounded-2xl overflow-hidden"
                    style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
                  >
                    <div className="px-4 pt-3.5 pb-2.5 border-b border-[rgba(0,0,0,0.04)]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9BA39C]">Partner</p>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(0,0,0,0.05)" }}>
                          <BriefcaseBusiness className="h-5 w-5 text-[#9BA39C]" />
                        </div>
                        <p className="text-[13px] text-[#5C6B5E] leading-snug">
                          Matching in progress — we&apos;ll notify you once assigned.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Request metadata */}
                <div
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
                >
                  <div className="px-4 pt-3.5 pb-2.5 border-b border-[rgba(0,0,0,0.04)]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9BA39C]">Details</p>
                  </div>
                  <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                    <MetaRow
                      label="Submitted"
                      value={new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    />
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
                          <span className="text-[12px] text-[#5C6B5E]">Progress</span>
                          <span className="font-mono text-[12px] font-bold text-[#1B2B1F]">{doneCount}/{tasks.length}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0}%`,
                              background: doneCount === tasks.length ? "#0F6E56" : "#2A5FA5",
                            }}
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
          )}

          {/* ── Progress ── */}
          {activeTab === "progress" && tasks.length > 0 && (
            <div
              className="overflow-hidden rounded-2xl bg-white"
              style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
            >
              {/* Header with progress ring */}
              <div className="flex items-center gap-4 border-b border-[rgba(0,0,0,0.05)] px-5 py-4">
                {(() => {
                  const pct = Math.round((doneCount / tasks.length) * 100);
                  const r = 20;
                  const circ = 2 * Math.PI * r;
                  const color = pct === 100 ? "#0F6E56" : "#2A5FA5";
                  return (
                    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0 -rotate-90">
                      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5" />
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
                  <p className="text-[14px] font-bold text-[#1B2B1F]">Migration progress</p>
                  <p className="mt-0.5 text-[12px] text-[#9BA39C]">
                    {doneCount} of {tasks.length} tasks completed by your partner
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-[12px]">
                  {[
                    { label: "Todo",   count: tasks.filter(t => t.status === "todo").length,        color: "#9BA39C" },
                    { label: "Active", count: tasks.filter(t => t.status === "in_progress").length, color: "#2A5FA5" },
                    { label: "Done",   count: doneCount,                                            color: "#0F6E56" },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-1">
                      <span className="font-bold tabular-nums" style={{ color }}>{count}</span>
                      <span className="text-[#9BA39C]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 w-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div
                  className="h-full bg-[#0F6E56] transition-all duration-500"
                  style={{ width: `${Math.round((doneCount / tasks.length) * 100)}%` }}
                />
              </div>

              {/* Task rows */}
              <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                {[
                  ...tasks.filter(t => t.status === "in_progress"),
                  ...tasks.filter(t => t.status === "todo"),
                  ...tasks.filter(t => t.status === "done"),
                ].map((task) => {
                  const priorityMeta = task.priority ? PRIORITY_BADGE[task.priority as TaskPriority] : null;
                  const statusPill =
                    task.status === "done"        ? "bg-[#EAF3EE] text-[#0F6E56] border-[rgba(15,110,86,0.15)]"
                    : task.status === "in_progress" ? "bg-[#EBF1FA] text-[#2A5FA5] border-[rgba(42,95,165,0.15)]"
                    : "bg-[rgba(0,0,0,0.04)] text-[#5C6B5E] border-[rgba(0,0,0,0.06)]";
                  const statusLabel =
                    task.status === "done" ? "Done" : task.status === "in_progress" ? "Active" : "Todo";

                  return (
                    <div key={task.id} className="px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        {/* Status dot */}
                        <div className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                          task.status === "done"
                            ? "border-[#0F6E56] bg-[#0F6E56] text-white"
                            : task.status === "in_progress"
                            ? "border-[#2A5FA5]"
                            : "border-[rgba(0,0,0,0.18)]"
                        )}>
                          {task.status === "done" && <Check className="h-3 w-3" />}
                          {task.status === "in_progress" && <span className="h-2 w-2 rounded-full bg-[#2A5FA5]" />}
                        </div>

                        {/* Task content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={cn(
                              "text-[13px] font-semibold",
                              task.status === "done" ? "text-[#9BA39C] line-through" : "text-[#1B2B1F]"
                            )}>
                              {task.title}
                            </span>
                            {priorityMeta && task.status !== "done" && (
                              <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold capitalize", priorityMeta)}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="mt-0.5 text-[12px] text-[#9BA39C] leading-relaxed">{task.description}</p>
                          )}
                          {(task.estimatedTime || (task.status === "done" && task.completedAt)) && (
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                              {task.estimatedTime && (
                                <span className="flex items-center gap-1 text-[11px] text-[#9BA39C]">
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
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    green:   { bg: "#EAF3EE", color: "#0F6E56", border: "rgba(15,110,86,0.15)" },
    blue:    { bg: "#EBF1FA", color: "#2A5FA5", border: "rgba(42,95,165,0.15)" },
    red:     { bg: "#FEF2F2", color: "#dc2626", border: "rgba(220,38,38,0.15)" },
    amber:   { bg: "#FFFBEB", color: "#b45309", border: "rgba(180,83,9,0.15)"  },
    default: { bg: "rgba(0,0,0,0.04)", color: "#5C6B5E", border: "rgba(0,0,0,0.06)" },
  };
  const c = colors[accent ?? "default"];
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
      style={{ background: c.bg, color: c.color, border: `1.5px solid ${c.border}` }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function MetaRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[12px] text-[#5C6B5E]">{label}</span>
      <span className={cn("text-[12px] font-semibold text-[#1B2B1F]", valueColor)}>{value}</span>
    </div>
  );
}

function CancelSection({ requestId }: { requestId: string }) {
  return (
    <form action={cancelMigrationRequest.bind(null, requestId)}>
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50"
        style={{ border: "1.5px solid rgba(220,38,38,0.2)" }}
      >
        <XCircle className="h-4 w-4" /> Cancel request
      </button>
    </form>
  );
}

function DeleteSection({ requestId }: { requestId: string }) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div
        className="rounded-2xl px-4 py-3.5"
        style={{ border: "1.5px solid rgba(220,38,38,0.2)", background: "#FEF2F2" }}
      >
        <p className="text-[13px] font-semibold text-red-700 mb-3">Delete this request permanently?</p>
        <div className="flex items-center gap-2">
          <form action={deleteRequest.bind(null, requestId)}>
            <button
              type="submit"
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Yes, delete
            </button>
          </form>
          <button
            onClick={() => setConfirm(false)}
            className="h-8 px-3.5 rounded-xl text-[12px] font-semibold text-[#5C6B5E] hover:bg-[#F7F9F8] transition-colors"
            style={{ border: "1.5px solid rgba(0,0,0,0.06)" }}
          >
            Keep
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 text-[13px] font-semibold text-[#9BA39C] hover:text-red-500 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" /> Delete request
    </button>
  );
}
