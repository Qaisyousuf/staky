"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Shield, BarChart2, Target } from "lucide-react";
import { saveCookieConsent } from "@/actions/cookie-consent";

/* ─── Storage ────────────────────────────────────────────────────────────────── */

const KEY = "staky-cookie-consent";

export interface CookiePrefs {
  necessary: true;
  statistics: boolean;
  marketing: boolean;
  savedAt: number;
}

function loadPrefs(): CookiePrefs | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    return raw ? (JSON.parse(raw) as CookiePrefs) : null;
  } catch {
    return null;
  }
}

function persistPrefs(prefs: CookiePrefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

/* ─── Public helper — call from anywhere to reopen the modal ─────────────────── */

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent("staky:open-cookies"));
}

/* ─── Toggle component ───────────────────────────────────────────────────────── */

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        background: checked ? "#0F6E56" : "#D1D5DB",
        border: "none",
        cursor: "pointer",
        padding: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start",
        flexShrink: 0,
        transition: "background 200ms ease",
        outline: "none",
      }}
    >
      <span style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "white",
        display: "block",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "none",
      }} />
    </button>
  );
}

/* ─── Category row ───────────────────────────────────────────────────────────── */

function CategoryRow({
  icon, title, description, always, checked, onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  always?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div style={{
      background: "#F8FAFC",
      border: "1px solid #F1F5F9",
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
    }}>
      {/* Icon badge */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: always ? "#F0FAF5" : "white",
        border: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 1,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 3 }}>{title}</p>
        <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{description}</p>
      </div>

      {/* Control */}
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        {always ? (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#0F6E56",
            background: "#F0FAF5",
            border: "1px solid #D1FAE5",
            padding: "3px 9px",
            borderRadius: 6,
            whiteSpace: "nowrap",
          }}>
            Always on
          </span>
        ) : (
          <Toggle checked={checked ?? false} onChange={onChange ?? (() => {})} />
        )}
      </div>
    </div>
  );
}

/* ─── Main banner ────────────────────────────────────────────────────────────── */

export function CookieBanner() {
  const [visible, setVisible]       = useState(false);
  const [statistics, setStatistics] = useState(false);
  const [marketing, setMarketing]   = useState(false);

  useEffect(() => {
    // Show on first visit (no saved prefs)
    const prefs = loadPrefs();
    if (!prefs) {
      // Small delay so the page renders first
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }

    // Listen for manual reopen (from footer "Cookie Settings" link)
    function handleOpen() {
      const saved = loadPrefs();
      setStatistics(saved?.statistics ?? false);
      setMarketing(saved?.marketing ?? false);
      setVisible(true);
    }
    window.addEventListener("staky:open-cookies", handleOpen);
    return () => window.removeEventListener("staky:open-cookies", handleOpen);
  }, []);

  function commit(stats: boolean, mkt: boolean) {
    persistPrefs({ necessary: true, statistics: stats, marketing: mkt, savedAt: Date.now() });
    // Sync to DB for logged-in users (fire-and-forget — no UX impact if it fails)
    saveCookieConsent({ statistics: stats, marketing: mkt }).catch(() => {});
    setVisible(false);
  }

  const accept = () => commit(true, true);
  const reject = () => commit(false, false);
  const save   = () => commit(statistics, marketing);

  if (!visible) return null;

  return (
    /* Overlay */
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        animation: "cookie-fade 200ms ease-out both",
      }}
    >
      <style>{`
        @keyframes cookie-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cookie-slide {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Modal */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "28px 28px 24px",
          maxWidth: 500,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 32px 64px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)",
          animation: "cookie-slide 250ms ease-out both",
          fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#F0FAF5",
            border: "1px solid #D1FAE5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Cookie style={{ width: 22, height: 22, color: "#0F6E56" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 5, lineHeight: 1.2 }}>
              We use cookies
            </h2>
            <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55 }}>
              We use cookies to improve your experience, analyse traffic, and personalise content. You can customise your preferences below.
            </p>
          </div>
        </div>

        {/* Category rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          <CategoryRow
            icon={<Shield style={{ width: 15, height: 15, color: "#0F6E56" }} />}
            title="Necessary"
            description="Essential for the website to function. These cannot be disabled."
            always
          />
          <CategoryRow
            icon={<BarChart2 style={{ width: 15, height: 15, color: "#6B7280" }} />}
            title="Statistics"
            description="Help us understand how visitors interact with the site so we can improve it."
            checked={statistics}
            onChange={setStatistics}
          />
          <CategoryRow
            icon={<Target style={{ width: 15, height: 15, color: "#6B7280" }} />}
            title="Marketing"
            description="Used to show you relevant content and ads based on your interests."
            checked={marketing}
            onChange={setMarketing}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Accept all — primary */}
          <button
            onClick={accept}
            style={{
              width: "100%",
              padding: "12px",
              background: "#0F6E56",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            Accept all cookies
          </button>

          {/* Save preferences — secondary */}
          <button
            onClick={save}
            style={{
              width: "100%",
              padding: "12px",
              background: "white",
              color: "#111827",
              border: "1.5px solid #E2E8F0",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save my preferences
          </button>

          {/* Reject all — tertiary (equal prominence per GDPR/Datatilsynet rules) */}
          <button
            onClick={reject}
            style={{
              width: "100%",
              padding: "10px",
              background: "transparent",
              color: "#6B7280",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reject all non-essential cookies
          </button>
        </div>

        {/* Legal links */}
        <div style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid #F1F5F9",
          display: "flex",
          justifyContent: "center",
          gap: 20,
          fontSize: 12,
          color: "#9CA3AF",
        }}>
          <Link href="/cookies" style={{ color: "#9CA3AF", textDecoration: "underline", textUnderlineOffset: 2 }}>
            Cookie Policy
          </Link>
          <Link href="/privacy" style={{ color: "#9CA3AF", textDecoration: "underline", textUnderlineOffset: 2 }}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
