"use client";

import { useState, useTransition } from "react";
import {
  KeyRound, Trash2, AlertTriangle, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader2, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { changePassword, deleteAccount } from "@/actions/settings";

// ─── Password field ───────────────────────────────────────────────────────────

function PasswordInput({
  value, onChange, placeholder, id,
}: { value: string; onChange: (v: string) => void; placeholder?: string; id: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm placeholder:text-gray-400 outline-none focus:border-[#0F6E56] bg-white transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Password strength indicator ─────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-[#0F6E56]"];
  const textColors = ["text-red-500", "text-orange-500", "text-yellow-600", "text-[#0F6E56]"];

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? colors[score - 1] : "bg-gray-100"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[11px] font-medium", textColors[score - 1] ?? "text-gray-400")}>
        {score > 0 ? labels[score - 1] : ""}{" "}
        <span className="font-normal text-gray-400">
          {!checks[0] && "· min 8 chars"}{" "}
          {!checks[1] && "· uppercase"}{" "}
          {!checks[2] && "· number"}{" "}
          {!checks[3] && "· special char"}
        </span>
      </p>
    </div>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

function DeleteModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const canDelete = confirm === email;

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAccount();
      } catch {
        setError("Failed to delete account. Please try again.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-base font-bold text-gray-900 text-center mb-1">Delete your account</h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed mb-5">
          This will permanently delete your account, posts, stack, follows, and all other data.
          <strong className="text-gray-700"> This cannot be undone.</strong>
        </p>

        <div className="space-y-2 mb-5">
          <label className="text-xs font-medium text-gray-700">
            Type your email to confirm: <span className="text-gray-900">{email}</span>
          </label>
          <input
            type="email"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={email}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-300 outline-none focus:border-red-400 transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 mb-3 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || isPending}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isPending ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function AccountTab({ email, createdAt }: { email: string; createdAt: string }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const memberSince = new Date(createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const handleChangePassword = () => {
    setPwError("");
    if (!current || !newPw || !confirmPw) { setPwError("All fields are required"); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match"); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters"); return; }

    startTransition(async () => {
      try {
        await changePassword(current, newPw);
        setPwSaved(true);
        setPwError("");
        setCurrent(""); setNewPw(""); setConfirmPw("");
        setTimeout(() => setPwSaved(false), 3000);
      } catch (err) {
        setPwError(err instanceof Error ? err.message : "Failed to update password");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Account</h2>
        <p className="text-xs text-gray-400 mt-0.5">Manage your security and account lifecycle</p>
      </div>

      {/* Account info */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Account details</h3>
        </div>
        <dl className="space-y-3">
          <div className="flex items-center justify-between">
            <dt className="text-xs text-gray-400">Email address</dt>
            <dd className="text-sm font-medium text-gray-800">{email}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-xs text-gray-400">Member since</dt>
            <dd className="text-sm font-medium text-gray-800">{memberSince}</dd>
          </div>
        </dl>
      </section>

      {/* Change password */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Change password</h3>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700" htmlFor="current-pw">Current password</label>
          <PasswordInput id="current-pw" value={current} onChange={setCurrent} placeholder="Enter current password" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700" htmlFor="new-pw">New password</label>
          <PasswordInput id="new-pw" value={newPw} onChange={setNewPw} placeholder="At least 8 characters" />
          <PasswordStrength password={newPw} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700" htmlFor="confirm-pw">Confirm new password</label>
          <PasswordInput id="confirm-pw" value={confirmPw} onChange={setConfirmPw} placeholder="Repeat new password" />
          {confirmPw && newPw !== confirmPw && (
            <p className="text-[11px] text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Passwords do not match
            </p>
          )}
          {confirmPw && newPw === confirmPw && confirmPw.length >= 8 && (
            <p className="text-[11px] text-[#0F6E56] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Passwords match
            </p>
          )}
        </div>

        {pwError && (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" /> {pwError}
          </p>
        )}
        {pwSaved && (
          <p className="text-sm text-[#0F6E56] flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Password updated successfully
          </p>
        )}

        <button
          onClick={handleChangePassword}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {isPending ? "Updating…" : "Update password"}
        </button>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border-2 border-red-100 bg-red-50/40 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 shrink-0 mt-0.5">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-700">Danger zone</h3>
            <p className="text-xs text-red-500 mt-1 leading-relaxed">
              Permanently delete your account and all associated data. This includes your posts,
              comments, connections, and stack. <strong>This action is irreversible.</strong>
            </p>
            <button
              onClick={() => setShowDelete(true)}
              className="mt-3 flex items-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete my account
            </button>
          </div>
        </div>
      </section>

      {showDelete && (
        <DeleteModal email={email} onClose={() => setShowDelete(false)} />
      )}
    </div>
  );
}
