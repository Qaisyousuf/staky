import { Suspense } from "react";
import { ArrowRight, Check } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/shared/logo";

export const metadata = { title: "Sign in — Staky" };

const BULLETS = [
  "Discover EU-hosted alternatives",
  "Track your migration progress",
  "Connect with expert partners",
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen lg:grid lg:grid-cols-2">

      {/* ── Left: Promo panel ── */}
      <div className="hidden lg:flex flex-col min-h-screen bg-[#0f2d1f] px-12 xl:px-16">
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">

          {/* Logo */}
          <Logo href="/" variant="white" size="lg" />

          {/* Headline */}
          <h1 className="mt-10 max-w-xs text-[2.4rem] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
            Your stack.<br />Your sovereignty.
          </h1>
          <p className="mt-3 max-w-[260px] text-sm leading-relaxed text-white/40">
            Switch to privacy-respecting European software. No lock-in, no compromise.
          </p>

          {/* Single big switch example */}
          <div className="mt-12">
            <div className="flex items-center justify-center gap-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/tools/slack.svg" alt="Slack" className="h-24 w-24 opacity-60" />
              <ArrowRight className="h-5 w-5 shrink-0 text-white/20" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/tools/mattermost.svg" alt="Mattermost" className="h-24 w-24" />
            </div>
            <div className="mt-4 flex items-start justify-center gap-8">
              <div className="w-24 text-center">
                <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">From</p>
                <p className="mt-0.5 text-sm font-semibold text-white/50">Slack</p>
              </div>
              <div className="w-5" />
              <div className="w-24 text-center">
                <p className="text-[10px] font-medium uppercase tracking-widest text-[#4ade80]/50">To</p>
                <p className="mt-0.5 text-sm font-semibold text-white/90">Mattermost</p>
              </div>
            </div>
          </div>

          {/* Bullets */}
          <ul className="mt-12 space-y-2.5">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-white/50">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4ade80]/15">
                  <Check className="h-3 w-3 text-[#4ade80]" strokeWidth={2.5} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="py-6 text-center text-[11px] text-white/20">
          © {new Date().getFullYear()} Staky · Built for Europe
        </p>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex min-h-screen items-center justify-center bg-[#f6f4ee] px-6 py-12">
        <div className="w-full max-w-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>

    </div>
  );
}
