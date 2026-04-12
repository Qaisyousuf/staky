import Image from "next/image";
import { ShieldAlert } from "lucide-react";
import { UserActions } from "../admin-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  plan: string;
  suspended: boolean;
  createdAt: Date;
  partner: { id: string; companyName: string; approved: boolean } | null;
  _count: { posts: number };
};

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  USER:    { label: "User",    cls: "bg-gray-100 text-gray-600" },
  PARTNER: { label: "Partner", cls: "bg-blue-50 text-blue-700" },
  ADMIN:   { label: "Admin",   cls: "bg-green-50 text-[#0F6E56]" },
};

const PLAN_CONFIG: Record<string, { label: string; cls: string }> = {
  FREE:     { label: "Free",     cls: "bg-gray-100 text-gray-500" },
  PRO:      { label: "Pro",      cls: "bg-purple-50 text-purple-700" },
  BUSINESS: { label: "Business", cls: "bg-amber-50 text-amber-700" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function UsersTab({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const suspendedCount = users.filter((u) => u.suspended).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{users.length} users</span>
        {suspendedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
            <ShieldAlert className="h-3 w-3" /> {suspendedCount} suspended
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]">
        {users.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">No users yet</div>
        ) : (
          <div className="divide-y divide-[rgba(0,0,0,0.04)]">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-[auto_auto_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-[#F7F9FC] text-[10px] font-bold text-[#9BA39C] uppercase tracking-widest">
              <span>User</span>
              <span>Role</span>
              <span>Plan</span>
              <span>Posts</span>
              <span>Joined</span>
              <span>Actions</span>
            </div>

            {users.map((user) => {
              const role = ROLE_CONFIG[user.role] ?? { label: user.role, cls: "bg-gray-100 text-gray-600" };
              const plan = PLAN_CONFIG[user.plan] ?? { label: user.plan, cls: "bg-gray-100 text-gray-500" };
              const isSelf = user.id === currentUserId;

              return (
                <div
                  key={user.id}
                  className={`px-5 py-4 hover:bg-[#FAFAF9] flex flex-col lg:grid lg:grid-cols-[auto_auto_auto_auto_auto_auto] gap-3 lg:gap-4 lg:items-center ${
                    isSelf ? "bg-green-50/30" : ""
                  } ${user.suspended ? "bg-red-50/20" : ""}`}
                >
                  {/* User */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {user.image ? (
                      <Image src={user.image} alt="" width={32} height={32} className="rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {user.name?.[0] ?? user.email[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        {user.name ?? "—"}
                        {user.suspended && (
                          <ShieldAlert className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                        {isSelf && (
                          <span className="text-xs text-[#0F6E56] font-normal">(you)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">{user.email}</div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.cls}`}>
                      {role.label}
                    </span>
                    {user.partner && !user.partner.approved && (
                      <div className="text-xs text-amber-600 mt-0.5">Pending partner</div>
                    )}
                  </div>

                  {/* Plan */}
                  <div className="shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.cls}`}>
                      {plan.label}
                    </span>
                  </div>

                  {/* Posts */}
                  <div className="shrink-0 text-sm text-gray-700">{user._count.posts}</div>

                  {/* Joined */}
                  <div className="shrink-0 text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0">
                    <UserActions
                      userId={user.id}
                      currentUserId={currentUserId}
                      suspended={user.suspended}
                      role={user.role}
                    />
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
