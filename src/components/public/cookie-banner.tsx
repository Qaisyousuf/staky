"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, BarChart2, Target, Settings2, ChevronDown, ChevronUp, Wrench, Loader2 } from "lucide-react";
import { saveCookieConsent } from "@/actions/cookie-consent";

/* ── Storage ─────────────────────────────────────────────────────────────── */

const KEY = "staky-cookie-consent";

export interface CookiePrefs {
  necessary: true;
  functional: boolean;
  statistics: boolean;
  marketing: boolean;
  savedAt: number;
}

function loadPrefs(): CookiePrefs | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    return raw ? (JSON.parse(raw) as CookiePrefs) : null;
  } catch { return null; }
}

function persistPrefs(prefs: CookiePrefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent("staky:open-cookies"));
}

/* ── Toggle ──────────────────────────────────────────────────────────────── */

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 36, height: 20,
        background: disabled ? "#D1FAE5" : checked ? "#0F6E56" : "#D1D5DB",
        borderRadius: 999, border: "none", padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative", flexShrink: 0,
        transition: "background 200ms",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: 2,
        width: 16, height: 16, borderRadius: "50%", background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "transform 200ms",
        transform: (checked || disabled) ? "translateX(16px)" : "translateX(0)",
        display: "block",
      }} />
    </button>
  );
}

/* ── Categories ──────────────────────────────────────────────────────────── */

const CATEGORIES = [
  {
    key: "necessary" as const,
    icon: Shield, color: "#0F6E56",
    title: "Necessary",
    description: "Login, security, and session management. Cannot be disabled.",
    always: true,
  },
  {
    key: "functional" as const,
    icon: Wrench, color: "#6366F1",
    title: "Functional",
    description: "Remember your language and display preferences.",
    always: false,
  },
  {
    key: "statistics" as const,
    icon: BarChart2, color: "#F59E0B",
    title: "Analytics",
    description: "Anonymous usage stats to help us improve the platform.",
    always: false,
  },
  {
    key: "marketing" as const,
    icon: Target, color: "#EF4444",
    title: "Marketing",
    description: "Relevant content and campaign measurement.",
    always: false,
  },
];

/* ── Banner ──────────────────────────────────────────────────────────────── */

export function CookieBanner() {
  const [visible,    setVisible]    = useState(false);
  const [expanded,   setExpanded]   = useState(true);
  const [functional, setFunctional] = useState(false);
  const [statistics, setStatistics] = useState(false);
  const [marketing,  setMarketing]  = useState(false);
  const [saving,     setSaving]     = useState<"accept" | "reject" | "save" | null>(null);

  useEffect(() => {
    const prefs = loadPrefs();
    if (!prefs) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
    function handleOpen() {
      const saved = loadPrefs();
      setFunctional(saved?.functional ?? false);
      setStatistics(saved?.statistics ?? false);
      setMarketing(saved?.marketing ?? false);
      setExpanded(true);
      setVisible(true);
    }
    window.addEventListener("staky:open-cookies", handleOpen);
    return () => window.removeEventListener("staky:open-cookies", handleOpen);
  }, []);

  async function commit(func: boolean, stats: boolean, mkt: boolean, type: "accept" | "reject" | "save") {
    setSaving(type);
    await new Promise((r) => setTimeout(r, 600));
    persistPrefs({ necessary: true, functional: func, statistics: stats, marketing: mkt, savedAt: Date.now() });
    saveCookieConsent({ statistics: stats, marketing: mkt }).catch(() => {});
    setVisible(false);
    setExpanded(true);
    setSaving(null);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-5 left-1/2 z-[9999] w-full max-w-5xl -translate-x-1/2 px-4"
      style={{ fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif" }}
    >
      <style>{`
        @keyframes banner-slide {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cookie-root { animation: banner-slide 320ms cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div className="cookie-root w-full bg-white" style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}>
        <div className="px-6">

          {/* Expanded panel */}
          {expanded && (
            <div className="grid gap-3 border-b border-gray-100 py-6 sm:grid-cols-4">
              {CATEGORIES.map(({ key, icon: Icon, color, title, description, always }) => {
                const checked = key === "necessary" ? true : key === "functional" ? functional : key === "statistics" ? statistics : marketing;
                const onChange = key === "functional" ? setFunctional : key === "statistics" ? setStatistics : setMarketing;
                return (
                  <div key={key} className="flex flex-col gap-4 rounded-2xl p-5"
                    style={{ background: always ? "#F6FAF8" : "#FAFAFA", border: `1px solid ${always ? "rgba(15,110,86,0.1)" : "rgba(0,0,0,0.06)"}` }}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `${color}18` }}>
                      <Icon style={{ width: 16, height: 16, color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-gray-900">{title}</p>
                      <p className="mt-1.5 text-[12px] leading-[1.6] text-gray-400">{description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      {always
                        ? <span className="text-[11px] font-bold text-[#0F6E56]">Always on</span>
                        : <>
                            <span className="text-[11px] font-medium text-gray-400">{checked ? "Enabled" : "Disabled"}</span>
                            <Toggle checked={checked} onChange={onChange} />
                          </>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Main bar */}
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">

            {/* Text */}
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <Settings2 className="h-4 w-4 shrink-0 text-[#0F6E56]" />
              <p className="text-[12px] text-gray-500">
                <span className="font-semibold text-gray-800">Cookies</span> — we use them to improve your experience.{" "}
                <Link href="/cookies" className="text-[#0F6E56] underline underline-offset-2 hover:no-underline">Policy</Link>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                disabled={!!saving}
                onClick={() => commit(false, false, false, "reject")}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-[12px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                {saving === "reject" ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</> : "Reject all"}
              </button>

              <button
                disabled={!!saving}
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3.5 py-2 text-[12px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Customise
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </button>

              {expanded && (
                <button
                  disabled={!!saving}
                  onClick={() => commit(functional, statistics, marketing, "save")}
                  className="flex items-center gap-1.5 rounded-lg border border-[#0F6E56] px-3.5 py-2 text-[12px] font-semibold text-[#0F6E56] transition-colors hover:bg-[#EAF3EE] disabled:opacity-60"
                >
                  {saving === "save" ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</> : "Save"}
                </button>
              )}

              <button
                disabled={!!saving}
                onClick={() => commit(true, true, true, "accept")}
                className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-60"
                style={{ background: "#0F6E56", boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(15,110,86,0.3)" }}
              >
                {saving === "accept" ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</> : "Accept all"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
