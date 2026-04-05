"use client";

import { useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock,
  Hash,
  Mail,
  MapPin,
  MessageSquare,
  Receipt,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolIcon } from "@/components/shared/tool-icon";
import { RequestTimeline } from "../../requests/[requestId]/request-timeline";
import { RequestConversation } from "../../requests/[requestId]/request-conversation";
import { LeadDetailActions } from "./lead-detail-actions";
import { TaskBoard } from "./task-board";
import { ProjectActivity } from "./project-activity";
import { InvoicePanel } from "./invoice-panel";
import { ConfigPanel } from "./config-panel";
import { ShareExperienceTrigger } from "@/components/shared/share-experience-trigger";
import type { InvoiceLineItem } from "@/lib/invoice-utils";
import type { ConfigItem } from "@/lib/config-templates";
import type { MigrationTask, MigrationProposal } from "@/lib/request-utils";

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
  status: "DRAFT" | "SENT" | "VIEWED" | "PAID" | "CANCELLED";
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

export interface LeadDetailViewProps {
  // IDs
  requestId: string;
  partnerId: string;
  clientId: string;
  currentUserId: string;

  // Request meta
  fromTool: string;
  toTool: string;
  fromToolName: string;
  toToolName: string;
  requestRef: string;
  status: string;
  statusCls: string;
  urgency: string | null;
  description: string | null;
  userGoals: string | null;
  createdAt: string;
  updatedAt: string;
  targetDate: string | null;

  // Flags
  isOwned: boolean;
  showWorkspace: boolean;
  showProposal: boolean;

  // Computed
  daysSince: number;
  doneTasks: number;
  totalTasks: number;
  messageCount: number;
  etaInfo: { label: string; overdue: boolean } | null;

  // Content
  tasks: MigrationTask[];
  proposal: MigrationProposal | null;
  configItems: ConfigItem[] | null;
  configSentAt: string | null;
  invoice: SerializedInvoice | null;
  messages: SerializedMessage[];

  // People
  client: {
    name: string | null;
    email: string;
    image: string | null;
    company: string | null;
    location: string | null;
  };
  partnerCompanyName: string;
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

type TabId = "overview" | "tasks" | "config" | "invoice" | "messages";

interface TabDef {
  id: TabId;
  label: string;
  badge?: string;
  icon: React.ElementType;
}

// ── Main component ────────────────────────────────────────────────────────────

export function LeadDetailView(props: LeadDetailViewProps) {
  const {
    requestId, partnerId, clientId, currentUserId,
    fromTool, toTool, fromToolName, toToolName, requestRef,
    status, statusCls, urgency, description, userGoals,
    createdAt, updatedAt, targetDate,
    isOwned, showWorkspace, showProposal,
    daysSince, doneTasks, totalTasks, messageCount, etaInfo,
    tasks, proposal, configItems, configSentAt, invoice, messages,
    client, partnerCompanyName,
  } = props;

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Build tab list based on available sections
  const configApproved = configItems?.filter((i) => i.status === "approved").length ?? 0;
  const configTotal = configItems?.length ?? 0;

  const tabs: TabDef[] = [
    { id: "overview", label: "Overview", icon: Hash },
    ...(showWorkspace
      ? [{ id: "tasks" as TabId, label: "Tasks", badge: `${doneTasks}/${totalTasks}`, icon: Zap }]
      : []),
    ...(showWorkspace && isOwned
      ? [{ id: "config" as TabId, label: "Config", badge: configItems ? `${configApproved}/${configTotal}` : undefined, icon: ClipboardList }]
      : []),
    ...(showWorkspace && isOwned
      ? [{ id: "invoice" as TabId, label: "Invoice", icon: Receipt }]
      : []),
    ...(isOwned
      ? [{ id: "messages" as TabId, label: "Messages", badge: messageCount > 0 ? String(messageCount) : undefined, icon: MessageSquare }]
      : []),
  ];

  // Deserialize dates for components that need them
  const activityRequest = {
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
    status,
    tasks,
    proposal,
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: new Date(m.createdAt),
      sender: m.sender,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl">

      {/* ══ Project header ══ */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Gradient accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-[#2A5FA5] via-[#0F6E56] to-[#2A5FA5]" />

        <div className="px-6 py-5">
          <div className="flex flex-wrap items-start gap-4">
            {/* Migration path */}
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

            {/* Status + urgency */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className={cn("rounded-lg border px-3 py-1.5 text-xs font-bold tracking-wide", statusCls)}>
                {status.replace(/_/g, " ")}
              </span>
              {urgency && urgency !== "normal" && (
                <span className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  urgency === "urgent"
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-orange-200 bg-orange-50 text-orange-600"
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
              Opened{" "}
              {new Date(createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Description / goals */}
          {(description || userGoals) && (
            <div className="mt-3 space-y-2">
              {description && (
                <p className="text-sm leading-relaxed text-gray-600">{description}</p>
              )}
              {userGoals && (
                <div className="rounded-lg border-l-2 border-[#2A5FA5]/30 bg-blue-50/40 py-2 pl-3 pr-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Client goals</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{userGoals}</p>
                </div>
              )}
            </div>
          )}

          {/* Stats pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatPill icon={Clock} label={`${daysSince}d old`} />
            {totalTasks > 0 && (
              <StatPill icon={Zap} label={`${doneTasks}/${totalTasks} tasks`} accent={doneTasks === totalTasks ? "green" : "blue"} />
            )}
            {configItems && (
              <StatPill icon={ClipboardList} label={`${configApproved}/${configTotal} config`} accent={configApproved === configTotal ? "green" : "default"} />
            )}
            <StatPill icon={MessageSquare} label={`${messageCount} messages`} />
            {etaInfo && (
              <StatPill icon={CalendarDays} label={etaInfo.label} accent={etaInfo.overdue ? "red" : "green"} />
            )}
          </div>
        </div>
      </div>

      {/* ══ Main area: left nav + content ══ */}
      <div className="mt-4 flex items-start gap-4">

        {/* Left sidebar nav */}
        <nav className="hidden md:flex w-52 shrink-0 flex-col rounded-xl border border-gray-200 bg-white py-2 shadow-sm sticky top-6">
          {/* Nav label */}
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
                  isActive
                    ? "bg-blue-50 text-[#2A5FA5]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#2A5FA5]" : "text-gray-400")} />
                <span className="flex-1">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    isActive ? "bg-blue-100 text-[#2A5FA5]" : "bg-gray-100 text-gray-500"
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
                    isActive ? "bg-blue-50 text-[#2A5FA5]" : "text-gray-500 hover:bg-gray-50"
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

        {/* Content area */}
        <div className="min-w-0 flex-1">

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Actions bar — full width, clean */}
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <LeadDetailActions requestId={requestId} status={status} isOwned={isOwned} />
            </div>

            {/* 2-column: main + sidebar */}
            <div className="grid gap-4 lg:grid-cols-[1fr_288px]">

              {/* Left: timeline + proposal + activity */}
              <div className="space-y-4">
                <RequestTimeline status={status as "PENDING" | "UNDER_REVIEW" | "MATCHED" | "PROPOSAL_SENT" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED"} />

                {showProposal && proposal && (
                  <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[10px] font-black text-violet-600">P</span>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600">
                        Your proposal
                      </p>
                      <span className="ml-auto font-mono text-[11px] text-violet-400">
                        {new Date(proposal.sentAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
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
                    </div>
                    {proposal.approach && (
                      <div className="mt-2 rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Approach</p>
                        <p className="mt-1 text-sm leading-relaxed text-gray-700">{proposal.approach}</p>
                      </div>
                    )}
                  </div>
                )}

                {showWorkspace && (
                  <ProjectActivity
                    request={activityRequest}
                    partnerName={partnerCompanyName}
                    clientName={client.name ?? "Client"}
                  />
                )}
              </div>

              {/* Right: client + metadata */}
              <div className="space-y-3">

                {/* Client card */}
                {isOwned && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-50 px-4 pt-3.5 pb-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Client
                      </p>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {client.image ? (
                          <Image
                            src={client.image}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#2A5FA5]">
                            {client.name?.[0] ?? "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {client.name ?? "Unknown"}
                          </p>
                          {client.company && (
                            <p className="flex items-center gap-1 text-[11px] text-gray-400 truncate">
                              <Building2 className="h-3 w-3 shrink-0" />
                              {client.company}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        <a
                          href={`mailto:${client.email}`}
                          className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-600 hover:bg-blue-50 hover:text-[#2A5FA5] hover:border-blue-100 transition-colors truncate"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          {client.email}
                        </a>
                        {client.location && (
                          <div className="flex items-center gap-2 px-1 py-1 text-[11px] text-gray-400">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {client.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Project metadata */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-50 px-4 pt-3.5 pb-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Project details
                    </p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    <MetaRow label="Age" value={`${daysSince} days`} />
                    {totalTasks > 0 && (
                      <div className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-gray-500">Tasks</span>
                          <span className="font-mono text-xs font-bold text-gray-700">
                            {doneTasks}/{totalTasks}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              doneTasks === totalTasks ? "bg-[#0F6E56]" : "bg-[#2A5FA5]"
                            )}
                            style={{ width: `${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {configItems && (
                      <MetaRow
                        label="Config"
                        value={`${configApproved}/${configTotal} approved`}
                        valueColor={configApproved === configTotal ? "text-[#0F6E56]" : undefined}
                      />
                    )}
                    <MetaRow label="Messages" value={String(messageCount)} />
                    {etaInfo && (
                      <MetaRow
                        label="ETA"
                        value={etaInfo.label}
                        valueColor={etaInfo.overdue ? "text-red-600" : "text-[#0F6E56]"}
                      />
                    )}
                    {targetDate && (
                      <MetaRow
                        label="Target date"
                        value={new Date(targetDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      />
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Share experience — full width below 2-col */}
            {isOwned && status === "COMPLETED" && (
              <ShareExperienceTrigger
                fromTool={fromTool}
                toTool={toTool}
                fromToolName={fromToolName}
                toToolName={toToolName}
                context={description ?? userGoals ?? null}
                isPartnerMode
              />
            )}
          </div>
        )}

        {/* ── Tasks ── */}
        {activeTab === "tasks" && showWorkspace && (
          <TaskBoard
            requestId={requestId}
            tasks={tasks}
            readonly={status === "COMPLETED"}
          />
        )}

        {/* ── Config ── */}
        {activeTab === "config" && showWorkspace && isOwned && (
          <ConfigPanel
            requestId={requestId}
            fromTool={fromTool}
            fromToolName={fromToolName}
            toToolName={toToolName}
            configItems={configItems}
            configSentAt={configSentAt}
          />
        )}

        {/* ── Invoice ── */}
        {activeTab === "invoice" && showWorkspace && isOwned && (
          <InvoicePanel
            requestId={requestId}
            partnerId={partnerId}
            clientId={clientId}
            requestRef={requestRef}
            fromToolName={fromToolName}
            toToolName={toToolName}
            invoice={invoice}
          />
        )}

        {/* ── Messages ── */}
        {activeTab === "messages" && isOwned && (
          <RequestConversation
            requestId={requestId}
            currentUserId={currentUserId}
            initialMessages={messages.map((m) => ({ ...m, createdAt: new Date(m.createdAt) }))}
          />
        )}
        </div>{/* end content area */}
      </div>{/* end flex row */}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  accent?: "green" | "blue" | "red" | "default";
}) {
  const colors: Record<string, string> = {
    green: "border-green-100 bg-green-50 text-[#0F6E56]",
    blue: "border-blue-100 bg-blue-50 text-[#2A5FA5]",
    red: "border-red-100 bg-red-50 text-red-600",
    default: "border-gray-100 bg-gray-50 text-gray-600",
  };
  const cls = colors[accent ?? "default"];
  return (
    <span className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", cls)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function MetaRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={cn("text-xs font-semibold text-gray-700", valueColor)}>{value}</span>
    </div>
  );
}
