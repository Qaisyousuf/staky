import Image from "next/image";
import { RequestActions } from "../admin-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Request = {
  id: string;
  fromTool: string;
  toTool: string;
  description: string | null;
  budget: string | null;
  teamSize: string | null;
  status: string;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null; email: string };
  partner: { id: string; companyName: string; logoUrl: string | null } | null;
};

type Partner = { userId: string; companyName: string };

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:      { label: "Pending",          cls: "bg-amber-50 text-amber-700" },
  UNDER_REVIEW: { label: "Under Review",     cls: "bg-orange-50 text-orange-700" },
  MATCHED:      { label: "Partner Assigned", cls: "bg-blue-50 text-blue-700" },
  ACCEPTED:     { label: "Accepted",         cls: "bg-indigo-50 text-indigo-700" },
  IN_PROGRESS:  { label: "In Progress",      cls: "bg-purple-50 text-purple-700" },
  COMPLETED:    { label: "Completed",        cls: "bg-green-50 text-green-700" },
  CANCELLED:    { label: "Cancelled",        cls: "bg-gray-100 text-gray-500" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RequestsTab({ requests, partners }: { requests: Request[]; partners: Partner[] }) {
  return (
    <div className="space-y-4">
      <span className="text-xs text-gray-500">{requests.length} total requests</span>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {requests.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">No migration requests yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Header */}
            <div className="hidden xl:grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span>User</span>
              <span>Switch</span>
              <span>Description</span>
              <span>Budget</span>
              <span>Status</span>
              <span>Partner</span>
              <span>Actions</span>
            </div>

            {requests.map((req) => {
              const status = STATUS_CONFIG[req.status] ?? { label: req.status, cls: "bg-gray-100 text-gray-500" };
              return (
                <div key={req.id} className="px-5 py-4 hover:bg-gray-50 flex flex-col xl:grid xl:grid-cols-[auto_auto_1fr_auto_auto_auto_auto] gap-3 xl:gap-4 xl:items-center">
                  {/* User */}
                  <div className="flex items-center gap-2 shrink-0">
                    {req.user.image ? (
                      <Image src={req.user.image} alt="" width={28} height={28} className="rounded-full" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {req.user.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-medium text-gray-900">{req.user.name ?? "Unknown"}</div>
                      <div className="text-xs text-gray-400">{req.user.email}</div>
                    </div>
                  </div>

                  {/* Switch */}
                  <div className="shrink-0">
                    <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {req.fromTool} → {req.toTool}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="min-w-0">
                    {req.description ? (
                      <p className="text-xs text-gray-600 line-clamp-2">{req.description}</p>
                    ) : (
                      <span className="text-xs text-gray-300 italic">No description</span>
                    )}
                    <div className="flex gap-3 mt-1">
                      {req.teamSize && <span className="text-xs text-gray-400">Team: {req.teamSize}</span>}
                      <span className="text-xs text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="shrink-0">
                    {req.budget ? (
                      <span className="text-xs text-gray-700 font-medium">{req.budget}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Partner */}
                  <div className="shrink-0">
                    {req.partner ? (
                      <span className="text-xs text-[#2A5FA5] font-medium">{req.partner.companyName}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    <RequestActions requestId={req.id} status={req.status} partners={partners} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
