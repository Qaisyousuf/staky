"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "staky_ios_banner_dismissed_at";
const DISMISS_DAYS = 7;

export function IosInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
    const isSafari =
      /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS/.test(navigator.userAgent);

    if (!isIos || isStandalone || !isSafari) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    const timer = setTimeout(() => {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setTimeout(() => setMounted(false), 300);
  }

  if (!mounted) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#DDD9D0] px-5 py-4"
      style={{
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: visible
          ? "transform 300ms ease-out"
          : "transform 200ms ease-in",
      }}
    >
      {/* Row 1: icon + text + close */}
      <div className="flex items-center gap-3">
        {/* App icon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/apple-touch-icon.png"
          alt="Staky"
          width={48}
          height={48}
          className="rounded-xl flex-shrink-0"
        />
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] text-gray-900 leading-tight">Install Staky</p>
          <p className="text-[13px] text-[#9BA39C] leading-tight mt-0.5">Add to your home screen</p>
        </div>
        {/* Close */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 p-1 text-[#9BA39C] hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
      {/* Row 2: instructions */}
      <p className="text-[13px] text-[#6B6860] mt-3 flex items-center gap-1 flex-wrap">
        Tap{" "}
        <ShareIcon />{" "}
        then <strong className="font-semibold text-gray-800">&apos;Add to Home Screen&apos;</strong>
      </p>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="18"
      height="22"
      viewBox="0 0 18 22"
      fill="none"
      stroke="#6B6860"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <path d="M9 1v13M5 5l4-4 4 4" />
      <path d="M3 9H1v12h16V9h-2" />
    </svg>
  );
}
