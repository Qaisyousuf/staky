"use client";

import { openCookieSettings } from "./cookie-banner";

export function CookieSettingsLink() {
  return (
    <button
      onClick={openCookieSettings}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontSize: 14,
        color: "rgba(255,255,255,0.5)",
        fontFamily: "inherit",
      }}
      className="transition-colors hover:text-white"
    >
      Cookie Settings
    </button>
  );
}
