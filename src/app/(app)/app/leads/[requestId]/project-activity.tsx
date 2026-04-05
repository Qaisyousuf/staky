import {
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Send,
  UserCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MigrationTask, MigrationProposal } from "@/lib/request-utils";

type ActivityItem = {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub?: string;
  date: Date;
};

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ProjectActivity({
  request,
  partnerName,
  clientName,
}: {
  request: {
    createdAt: Date;
    updatedAt: Date;
    status: string;
    tasks: MigrationTask[] | null;
    proposal: MigrationProposal | null;
    messages: {
      id: string;
      content: string;
      createdAt: Date;
      sender: { id: string; name: string | null; role: string };
    }[];
  };
  partnerName: string;
  clientName: string;
}) {
  const events: ActivityItem[] = [];

  events.push({
    id: "created",
    icon: <FileText className="h-3.5 w-3.5" />,
    iconBg: "bg-gray-100 text-gray-500",
    title: "Request submitted",
    sub: `by ${clientName}`,
    date: request.createdAt,
  });

  if (request.proposal) {
    events.push({
      id: "proposal",
      icon: <Send className="h-3.5 w-3.5" />,
      iconBg: "bg-violet-100 text-violet-600",
      title: "Proposal sent",
      sub: request.proposal.timeline ? `Timeline: ${request.proposal.timeline}` : partnerName,
      date: new Date(request.proposal.sentAt),
    });
  }

  if (["ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(request.status)) {
    events.push({
      id: "accepted",
      icon: <UserCheck className="h-3.5 w-3.5" />,
      iconBg: "bg-green-100 text-[#0F6E56]",
      title: "Proposal accepted",
      sub: `by ${clientName}`,
      date: new Date(request.updatedAt.getTime() - 2000),
    });
  }

  if (["IN_PROGRESS", "COMPLETED"].includes(request.status)) {
    events.push({
      id: "started",
      icon: <Zap className="h-3.5 w-3.5" />,
      iconBg: "bg-blue-100 text-[#2A5FA5]",
      title: "Work started",
      sub: `by ${partnerName}`,
      date: new Date(request.updatedAt.getTime() - 1000),
    });
  }

  if (request.status === "COMPLETED") {
    events.push({
      id: "completed",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      iconBg: "bg-green-100 text-[#0F6E56]",
      title: "Migration completed",
      sub: `by ${partnerName}`,
      date: request.updatedAt,
    });
  }

  // Completed tasks
  if (request.tasks) {
    for (const task of request.tasks) {
      if (task.status === "done" && task.completedAt) {
        events.push({
          id: `task-${task.id}`,
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          iconBg: "bg-green-50 text-[#0F6E56]",
          title: task.title,
          sub: task.techNote ? `$ ${task.techNote}` : "Task completed",
          date: new Date(task.completedAt),
        });
      }
    }
  }

  // Recent messages
  for (const msg of request.messages.slice(-6)) {
    const isPartner = msg.sender.role === "PARTNER";
    events.push({
      id: `msg-${msg.id}`,
      icon: <MessageSquare className="h-3.5 w-3.5" />,
      iconBg: isPartner ? "bg-blue-50 text-[#2A5FA5]" : "bg-gray-100 text-gray-500",
      title: msg.sender.name ?? (isPartner ? partnerName : clientName),
      sub: msg.content.length > 55 ? msg.content.slice(0, 55) + "…" : msg.content,
      date: msg.createdAt,
    });
  }

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-sm font-bold text-gray-900">Activity</p>
          <p className="mt-0.5 text-xs text-gray-400">{events.length} events</p>
        </div>
        <Clock className="h-4 w-4 text-gray-300" />
      </div>
      <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
        {events.slice(0, 15).map((event) => (
          <div key={event.id} className="flex items-start gap-3 px-4 py-3">
            <div
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                event.iconBg
              )}
            >
              {event.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 leading-snug">{event.title}</p>
              {event.sub && (
                <p
                  className={cn(
                    "mt-0.5 text-[11px] leading-snug truncate",
                    event.sub.startsWith("$")
                      ? "font-mono text-green-600"
                      : "text-gray-400"
                  )}
                >
                  {event.sub}
                </p>
              )}
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
              {timeAgo(event.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
