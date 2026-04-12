"use client";

import { useState, useTransition } from "react";
import {
  Bell, Mail, ThumbsUp, MessageCircle, Star,
  Bookmark, Share2, UserPlus, Link2, CheckCircle2,
  AlertCircle, Save, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateNotificationSettings } from "@/actions/settings";
import type { NotifSettings } from "../settings-shell";

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-150",
        checked ? "bg-[#0F6E56] border-[#0F6E56]" : "bg-gray-200 border-gray-200"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-150 mt-px",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function NotifRow({
  icon: Icon, label, description, inApp, email,
  onInApp, onEmail, iconColor,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
  onInApp: (v: boolean) => void;
  onEmail: (v: boolean) => void;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-50 last:border-0">
      {/* Icon + label */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 mt-0.5", iconColor && "")}>
          <Icon className={cn("h-3.5 w-3.5", iconColor ?? "text-gray-500")} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 leading-tight">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
      {/* Toggles */}
      <div className="flex items-center gap-6 shrink-0">
        <div className="flex flex-col items-center gap-1">
          <Toggle checked={inApp} onChange={onInApp} label={`In-app ${label}`} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Toggle checked={email} onChange={onEmail} label={`Email ${label}`} />
        </div>
      </div>
    </div>
  );
}

// ─── Group ────────────────────────────────────────────────────────────────────

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Column headers (first group only via sticky approach — shown once via layout) */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
        <div className="flex items-center gap-5 text-[11px] font-medium text-gray-400 shrink-0 pr-0.5">
          <span className="flex items-center gap-1"><Bell className="h-3 w-3" /> In-app</span>
          <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</span>
        </div>
      </div>
      <div className="px-5 pb-2">{children}</div>
    </div>
  );
}

// ─── Digest selector ──────────────────────────────────────────────────────────

const DIGEST_OPTIONS = [
  { value: "REAL_TIME", label: "Real-time",  description: "Delivered immediately" },
  { value: "DAILY",     label: "Daily",      description: "One digest at 9am" },
  { value: "WEEKLY",    label: "Weekly",     description: "Monday morning summary" },
  { value: "OFF",       label: "Off",        description: "No email digests" },
] as const;

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function NotificationsTab({ settings }: { settings: NotifSettings }) {
  const [s, setS] = useState<NotifSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggle = (key: keyof NotifSettings) => (val: boolean) =>
    setS((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateNotificationSettings(s);
        setSaved(true); setError("");
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setError("Failed to save. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
        <p className="text-xs text-gray-400 mt-0.5">Choose what you hear about and how</p>
      </div>

      {/* Activity on your posts */}
      <Group title="Activity on your posts">
        <NotifRow
          icon={ThumbsUp} iconColor="text-[#0F6E56]"
          label="Likes" description="Someone liked one of your posts"
          inApp={s.inAppLikes} email={s.emailLikes}
          onInApp={toggle("inAppLikes")} onEmail={toggle("emailLikes")}
        />
        <NotifRow
          icon={MessageCircle} iconColor="text-blue-500"
          label="Comments" description="Someone commented on your post"
          inApp={s.inAppComments} email={s.emailComments}
          onInApp={toggle("inAppComments")} onEmail={toggle("emailComments")}
        />
        <NotifRow
          icon={MessageCircle} iconColor="text-blue-400"
          label="Replies" description="Someone replied to your comment"
          inApp={s.inAppReplies} email={s.emailReplies}
          onInApp={toggle("inAppReplies")} onEmail={toggle("emailReplies")}
        />
        <NotifRow
          icon={Star} iconColor="text-amber-400"
          label="Recommendations" description="Someone recommended your post"
          inApp={s.inAppRecommendations} email={s.emailRecommendations}
          onInApp={toggle("inAppRecommendations")} onEmail={toggle("emailRecommendations")}
        />
        <NotifRow
          icon={Bookmark} iconColor="text-purple-500"
          label="Saves" description="Someone saved one of your posts"
          inApp={s.inAppSaves} email={s.emailSaves}
          onInApp={toggle("inAppSaves")} onEmail={toggle("emailSaves")}
        />
        <NotifRow
          icon={Share2} iconColor="text-gray-500"
          label="Shares" description="Someone shared one of your posts"
          inApp={s.inAppShares} email={s.emailShares}
          onInApp={toggle("inAppShares")} onEmail={toggle("emailShares")}
        />
      </Group>

      {/* Social */}
      <Group title="Social">
        <NotifRow
          icon={UserPlus} iconColor="text-purple-500"
          label="New followers" description="Someone started following you"
          inApp={s.inAppFollows} email={s.emailFollows}
          onInApp={toggle("inAppFollows")} onEmail={toggle("emailFollows")}
        />
        <NotifRow
          icon={Link2} iconColor="text-purple-600"
          label="Connection requests" description="Someone wants to connect with you"
          inApp={s.inAppConnects} email={s.emailConnects}
          onInApp={toggle("inAppConnects")} onEmail={toggle("emailConnects")}
        />
      </Group>

      {/* Email digest */}
      <div className="bg-white rounded-2xl p-5" style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Email digest frequency</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIGEST_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setS((prev) => ({ ...prev, emailDigest: opt.value }))}
              className={cn(
                "flex flex-col items-start rounded-lg border p-3 text-left transition-colors",
                s.emailDigest === opt.value
                  ? "border-[#0F6E56] bg-green-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <span className={cn("text-xs font-semibold", s.emailDigest === opt.value ? "text-[#0F6E56]" : "text-gray-700")}>
                {opt.label}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 leading-snug">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-2xl border border-[rgba(0,0,0,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)] bg-white/90 backdrop-blur px-5 py-3 shadow-sm">
        {error ? (
          <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>
        ) : saved ? (
          <p className="text-sm text-[#0F6E56] flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 shrink-0" />Preferences saved</p>
        ) : (
          <p className="text-sm text-gray-400">Changes not yet saved</p>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-[#0F6E56] hover:bg-[#0d5f4a] disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition-colors shrink-0"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </div>
  );
}
