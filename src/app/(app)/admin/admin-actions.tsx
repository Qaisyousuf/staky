"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  CheckCircle,
  XCircle,
  Star,
  StarOff,
  Trash2,
  Eye,
  EyeOff,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import {
  adminModeratePost,
  adminModerateComment,
  adminUpdateRequest,
  adminManagePartner,
  adminManageUser,
} from "@/actions/admin";

// ─── Shared ───────────────────────────────────────────────────────────────────

function ActionBtn({
  onClick,
  disabled,
  variant,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  variant: "green" | "red" | "amber" | "blue" | "gray";
  children: React.ReactNode;
}) {
  const cls = {
    green: "text-green-700 bg-green-50 hover:bg-green-100",
    red:   "text-red-600 bg-red-50 hover:bg-red-100",
    amber: "text-amber-700 bg-amber-50 hover:bg-amber-100",
    blue:  "text-blue-700 bg-blue-50 hover:bg-blue-100",
    gray:  "text-gray-600 bg-gray-50 hover:bg-gray-100",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

// ─── Post Actions ─────────────────────────────────────────────────────────────

export function PostActions({
  postId,
  published,
  featured,
}: {
  postId: string;
  published: boolean;
  featured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(action: "publish" | "unpublish" | "feature" | "unfeature" | "delete") {
    if (action === "delete" && !confirm("Delete this post?")) return;
    startTransition(async () => {
      await adminModeratePost(postId, action);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {published ? (
        <ActionBtn onClick={() => act("unpublish")} disabled={pending} variant="amber">
          <EyeOff className="h-3 w-3" /> Unpublish
        </ActionBtn>
      ) : (
        <ActionBtn onClick={() => act("publish")} disabled={pending} variant="green">
          <CheckCircle className="h-3 w-3" /> Publish
        </ActionBtn>
      )}
      {featured ? (
        <ActionBtn onClick={() => act("unfeature")} disabled={pending} variant="gray">
          <StarOff className="h-3 w-3" /> Unfeature
        </ActionBtn>
      ) : (
        <ActionBtn onClick={() => act("feature")} disabled={pending} variant="blue">
          <Star className="h-3 w-3" /> Feature
        </ActionBtn>
      )}
      <ActionBtn onClick={() => act("delete")} disabled={pending} variant="red">
        <Trash2 className="h-3 w-3" /> Delete
      </ActionBtn>
    </div>
  );
}

// ─── Comment Actions ──────────────────────────────────────────────────────────

export function CommentActions({
  commentId,
  hidden,
}: {
  commentId: string;
  hidden: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(action: "hide" | "show" | "delete") {
    if (action === "delete" && !confirm("Delete this comment?")) return;
    startTransition(async () => {
      await adminModerateComment(commentId, action);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {hidden ? (
        <ActionBtn onClick={() => act("show")} disabled={pending} variant="green">
          <Eye className="h-3 w-3" /> Show
        </ActionBtn>
      ) : (
        <ActionBtn onClick={() => act("hide")} disabled={pending} variant="amber">
          <EyeOff className="h-3 w-3" /> Hide
        </ActionBtn>
      )}
      <ActionBtn onClick={() => act("delete")} disabled={pending} variant="red">
        <Trash2 className="h-3 w-3" /> Delete
      </ActionBtn>
    </div>
  );
}

// ─── Request Actions ──────────────────────────────────────────────────────────

export function RequestActions({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(action: "cancel" | "reopen") {
    startTransition(async () => {
      await adminUpdateRequest(requestId, action);
      router.refresh();
    });
  }

  const canCancel = status !== "COMPLETED" && status !== "CANCELLED";
  const canReopen = status === "CANCELLED";

  return (
    <div className="flex items-center gap-1">
      {canCancel && (
        <ActionBtn onClick={() => act("cancel")} disabled={pending} variant="amber">
          <XCircle className="h-3 w-3" /> Cancel
        </ActionBtn>
      )}
      {canReopen && (
        <ActionBtn onClick={() => act("reopen")} disabled={pending} variant="green">
          <RotateCcw className="h-3 w-3" /> Reopen
        </ActionBtn>
      )}
    </div>
  );
}

// ─── Partner Actions ──────────────────────────────────────────────────────────

export function PartnerActions({
  partnerId,
  approved,
  featured,
}: {
  partnerId: string;
  approved: boolean;
  featured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(action: "approve" | "reject" | "feature" | "unfeature" | "delete") {
    if (action === "delete" && !confirm("Delete this partner? This will downgrade their account to USER.")) return;
    startTransition(async () => {
      await adminManagePartner(partnerId, action);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {approved ? (
        <ActionBtn onClick={() => act("reject")} disabled={pending} variant="amber">
          <XCircle className="h-3 w-3" /> Reject
        </ActionBtn>
      ) : (
        <ActionBtn onClick={() => act("approve")} disabled={pending} variant="green">
          <CheckCircle className="h-3 w-3" /> Approve
        </ActionBtn>
      )}
      {featured ? (
        <ActionBtn onClick={() => act("unfeature")} disabled={pending} variant="gray">
          <StarOff className="h-3 w-3" /> Unfeature
        </ActionBtn>
      ) : (
        <ActionBtn onClick={() => act("feature")} disabled={pending} variant="blue">
          <Star className="h-3 w-3" /> Feature
        </ActionBtn>
      )}
      <ActionBtn onClick={() => act("delete")} disabled={pending} variant="red">
        <Trash2 className="h-3 w-3" /> Delete
      </ActionBtn>
    </div>
  );
}

// ─── User Actions ─────────────────────────────────────────────────────────────

export function UserActions({
  userId,
  currentUserId,
  suspended,
  role,
}: {
  userId: string;
  currentUserId: string;
  suspended: boolean;
  role: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isSelf = userId === currentUserId;

  function act(action: "suspend" | "activate" | "makeAdmin" | "makePartner" | "makeUser") {
    startTransition(async () => {
      await adminManageUser(userId, action);
      router.refresh();
    });
  }

  if (isSelf) {
    return <span className="text-xs text-gray-400 italic">You</span>;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {suspended ? (
        <ActionBtn onClick={() => act("activate")} disabled={pending} variant="green">
          <ShieldCheck className="h-3 w-3" /> Activate
        </ActionBtn>
      ) : (
        <ActionBtn onClick={() => act("suspend")} disabled={pending} variant="red">
          <ShieldAlert className="h-3 w-3" /> Suspend
        </ActionBtn>
      )}
      <div className="relative">
        <select
          disabled={pending}
          value={role}
          onChange={(e) => {
            const v = e.target.value as "USER" | "PARTNER" | "ADMIN";
            const map = { USER: "makeUser", PARTNER: "makePartner", ADMIN: "makeAdmin" } as const;
            act(map[v]);
          }}
          className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 appearance-none pr-6"
        >
          <option value="USER">USER</option>
          <option value="PARTNER">PARTNER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <UserCog className="h-3 w-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
