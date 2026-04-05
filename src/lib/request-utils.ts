import { MIGRATION_ANALYSIS } from "@/data/migration-data";
import { TOOLS } from "@/data/mock-data";
import type { MigrationRequestStatus } from "@/types";

export type RequestSource =
  | "stack"
  | "partner_profile"
  | "discover"
  | "feed"
  | "partner_directory";

export interface RequestSwitch {
  fromTool: string;
  toTool: string;
}

export const ACTIVE_REQUEST_STATUSES: MigrationRequestStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "MATCHED",
  "PROPOSAL_SENT",
  "ACCEPTED",
  "IN_PROGRESS",
];

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface MigrationTask {
  id: string;
  title: string;
  description?: string;
  techNote?: string;
  priority?: TaskPriority;
  estimatedTime?: string;
  status: "todo" | "in_progress" | "done";
  createdAt: string;
  completedAt?: string | null;
}

export interface MigrationProposal {
  timeline: string;
  approach: string;
  budgetRange: string;
  sentAt: string;
}

export function getRequestStatusMeta(status: MigrationRequestStatus) {
  switch (status) {
    case "PENDING":
      return { label: "Submitted", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "UNDER_REVIEW":
      return { label: "Under Review", cls: "bg-orange-50 text-orange-700 border-orange-200" };
    case "MATCHED":
      return { label: "Partner Assigned", cls: "bg-blue-50 text-[#2A5FA5] border-blue-200" };
    case "PROPOSAL_SENT":
      return { label: "Proposal Sent", cls: "bg-violet-50 text-violet-700 border-violet-200" };
    case "ACCEPTED":
      return { label: "Accepted", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    case "IN_PROGRESS":
      return { label: "In Progress", cls: "bg-green-50 text-[#0F6E56] border-green-200" };
    case "COMPLETED":
      return { label: "Completed", cls: "bg-gray-100 text-gray-600 border-gray-200" };
    case "CANCELLED":
      return { label: "Cancelled", cls: "bg-red-50 text-red-600 border-red-200" };
    default:
      return { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  }
}

export function getRequestSourceLabel(source?: string | null) {
  switch (source) {
    case "stack":
      return "My Stack";
    case "partner_profile":
      return "Partner Profile";
    case "discover":
      return "Discover";
    case "feed":
      return "Feed";
    case "partner_directory":
      return "Partners";
    default:
      return "Request";
  }
}

export function getToolSlugByName(toolName: string) {
  return Object.values(TOOLS).find(
    (tool) => tool.name.toLowerCase() === toolName.trim().toLowerCase()
  )?.slug;
}

export function normalizeRequestSwitches(switches: RequestSwitch[]) {
  const seen = new Set<string>();
  const normalized: RequestSwitch[] = [];

  for (const item of switches) {
    if (!item.fromTool || !item.toTool || item.fromTool === item.toTool) continue;
    const key = `${item.fromTool}:${item.toTool}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(item);
  }

  return normalized.slice(0, 5);
}

export function buildSwitchesFromStack(toolNames: string[]) {
  const derived = toolNames.flatMap((toolName) => {
    const fromTool = getToolSlugByName(toolName);
    if (!fromTool) return [];
    const analysis = MIGRATION_ANALYSIS[fromTool];
    if (!analysis?.euAlternative) return [];
    return [{ fromTool, toTool: analysis.euAlternative }];
  });

  return normalizeRequestSwitches(derived);
}

export function buildRequestSummary({
  source,
  switches,
  partnerName,
}: {
  source: RequestSource;
  switches: RequestSwitch[];
  partnerName?: string | null;
}) {
  if (switches.length === 1) {
    const item = switches[0];
    const fromName = TOOLS[item.fromTool]?.name ?? item.fromTool;
    const toName = TOOLS[item.toTool]?.name ?? item.toTool;
    return partnerName
      ? `I need help switching from ${fromName} to ${toName} with ${partnerName}.`
      : `I need help switching from ${fromName} to ${toName}.`;
  }

  if (switches.length > 1) {
    const names = switches
      .slice(0, 3)
      .map((item) => {
        const fromName = TOOLS[item.fromTool]?.name ?? item.fromTool;
        const toName = TOOLS[item.toTool]?.name ?? item.toTool;
        return `${fromName} → ${toName}`;
      })
      .join(", ");

    return partnerName
      ? `I need help switching my stack with ${partnerName}: ${names}.`
      : `I need help switching my stack: ${names}.`;
  }

  if (source === "partner_profile" && partnerName) {
    return `I requested migration help from ${partnerName}'s partner profile.`;
  }

  return `I requested migration help from the ${getRequestSourceLabel(source).toLowerCase()} page.`;
}

export function buildRequestContextKey({
  source,
  partnerId,
  switches,
}: {
  source: RequestSource;
  partnerId?: string | null;
  switches: RequestSwitch[];
}) {
  const switchPart = switches.map((item) => `${item.fromTool}->${item.toTool}`).join("|") || "none";
  return `${source}:${partnerId ?? "open"}:${switchPart}`;
}
