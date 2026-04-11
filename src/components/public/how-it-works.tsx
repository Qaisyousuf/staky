"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDown, Plus, Link2,
  Lightbulb, Users, UserCheck, Rocket,
  Settings, Activity, CheckCircle2, Search,
  type LucideIcon,
} from "lucide-react";

/* ── Segments ────────────────────────────────────────────────────────────── */

const segments = [
  { d: "M 282 192 L 410 192",          delay: 300,  dur: 800  },
  { d: "M 584 192 L 644 192",          delay: 1100, dur: 375  },
  { d: "M 644 192 L 644 12 L 726 12",  delay: 1475, dur: 1640 },
  { d: "M 888 50 L 888 115",           delay: 3115, dur: 406  },
  { d: "M 888 177 L 888 242",          delay: 3521, dur: 406  },
  { d: "M 888 304 L 888 369",          delay: 3927, dur: 406  },
  { d: "M 1028 400 L 1088 400",        delay: 4333, dur: 375  },
  { d: "M 1234 369 L 1234 304",        delay: 4708, dur: 406  },
  { d: "M 1234 242 L 1234 177",        delay: 5114, dur: 406  },
  { d: "M 1234 115 L 1234 12",         delay: 5520, dur: 644  },
];

const STEP_DUR = 420; // mobile connector duration ms

/* ── CSS ─────────────────────────────────────────────────────────────────── */

const css = `
@keyframes workflow-draw {
  from { stroke-dashoffset: 1; }
  to   { stroke-dashoffset: 0; }
}
.workflow-root { background: #1B2B1F; }
.workflow-card {
  background: #0e1a11;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.05) inset,
    0 2px 4px rgba(0,0,0,0.5),
    0 8px 24px rgba(0,0,0,0.3);
}
.workflow-desktop { display: block; }
.workflow-mobile  { display: none;  }
@media (max-width: 1099px) {
  .workflow-desktop { display: none; }
  .workflow-mobile  { display: flex; }
}
`;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function useInView() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ob = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); ob.disconnect(); } },
      { threshold: 0.12 },
    );
    ob.observe(node);
    return () => ob.disconnect();
  }, []);
  return { ref, visible };
}

/* ── Base card ───────────────────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`workflow-card rounded-2xl ${className}`}
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {children}
    </div>
  );
}

/* ── Icon square ─────────────────────────────────────────────────────────── */

function IconBox({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.05]">
      <Icon className="h-3.5 w-3.5 text-[#4ade80]" />
    </div>
  );
}

/* ── TriggerCard ─────────────────────────────────────────────────────────── */

function TriggerCard() {
  return (
    <div className="w-[282px]">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Migration Trigger
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#0F6E56]/25">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
          </span>
        </div>
        <div className="space-y-2 p-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">US Tool</p>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                <Image src="/logos/tools/github.svg" alt="GitHub" width={16} height={16} className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">GitHub</p>
                <p className="text-[10px] text-white/45">US · Code hosting</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center py-0.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
              <ArrowDown className="h-3 w-3 text-white/35" />
            </div>
          </div>
          <div className="rounded-xl border border-[#2e885d]/25 bg-[#0d2016]/60 px-3 py-2.5">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#4ade80]/60">EU Alternative</p>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2e885d]/30 bg-[#0F6E56]/15">
                <Image src="/logos/tools/forgejo.svg" alt="Forgejo" width={16} height={16} className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">Forgejo</p>
                <p className="text-[10px] text-[#4ade80]/55">EU · Code hosting</p>
              </div>
              <span className="ml-auto text-base leading-none">🇪🇺</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ── ActionCard ──────────────────────────────────────────────────────────── */

function ActionCard() {
  return (
    <div className="w-[174px]">
      <Card className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <IconBox icon={Plus} />
          <div>
            <p className="text-[12px] font-semibold text-white">Add to stack</p>
            <p className="text-[10.5px] text-white/60">1 action triggered</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ── StepCard ────────────────────────────────────────────────────────────── */

function StepCard({ title, detail, icon, widthClass }: {
  title: string; detail?: string; icon: LucideIcon; widthClass: string;
}) {
  return (
    <div className={widthClass}>
      <Card className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <IconBox icon={icon} />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold leading-snug text-white">{title}</p>
            {detail && <p className="mt-0.5 truncate text-[10.5px] text-white/60">{detail}</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ── Desktop ─────────────────────────────────────────────────────────────── */

function DesktopWorkflow({ visible }: { visible: boolean }) {
  return (
    <div className="workflow-desktop mt-20">
      <div className="relative mx-auto h-[540px] max-w-[1380px]">

        <div className="absolute left-0 top-[116px] z-10">
          <TriggerCard />
        </div>
        <div className="absolute left-[410px] top-[168px] z-10">
          <ActionCard />
        </div>

        <div className="absolute left-[726px] top-[-12px] z-10">
          <StepCard title="Suggest migration partner" detail="For your US to EU migration" icon={Lightbulb} widthClass="w-[324px]" />
        </div>
        <div className="absolute left-[726px] top-[115px] z-10">
          <StepCard title="List migration partners" detail="TechMigrate GmbH · Nordic Cloud · EuroStack" icon={Users} widthClass="w-[324px]" />
        </div>
        <div className="absolute left-[748px] top-[242px] z-10">
          <StepCard title="Find migration partner" detail="SeoSoft ApS" icon={UserCheck} widthClass="w-[280px]" />
        </div>
        <div className="absolute left-[748px] top-[369px] z-10">
          <StepCard title="Connect" detail="Open the migration workspace" icon={Link2} widthClass="w-[280px]" />
        </div>

        <div className="absolute right-0 top-[-12px] z-10">
          <StepCard title="Migration completed" detail="European tools are now live" icon={CheckCircle2} widthClass="w-[292px]" />
        </div>
        <div className="absolute right-0 top-[115px] z-10">
          <StepCard title="Configuring the new system" detail="Prepare the European stack setup" icon={Settings} widthClass="w-[292px]" />
        </div>
        <div className="absolute right-0 top-[242px] z-10">
          <StepCard title="Migration in progress" detail="Partner updates your stack configuration" icon={Activity} widthClass="w-[292px]" />
        </div>
        <div className="absolute right-0 top-[369px] z-10">
          <StepCard title="Migration started" detail="Kick off the partner migration work" icon={Rocket} widthClass="w-[292px]" />
        </div>

        {/* SVG lines */}
        <svg aria-hidden width="1380" height="540" className="pointer-events-none absolute inset-0 z-0">
          {segments.map((seg, i) => (
            <g key={i}>
              <path d={seg.d} fill="none" stroke="rgba(79,84,95,0.55)" strokeWidth="1.4" strokeLinecap="round" />
              <path
                d={seg.d} pathLength={1} fill="none"
                stroke="rgba(242,246,250,0.94)" strokeWidth="2.6"
                strokeLinecap="round" strokeDasharray="1" strokeDashoffset="1"
                style={visible
                  ? { animation: `workflow-draw ${seg.dur}ms linear ${seg.delay}ms forwards` }
                  : { strokeDashoffset: 1 }}
              />
            </g>
          ))}
          <rect
            x="641" y="189" width="6" height="6"
            fill="rgba(242,246,250,0.94)"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease 1475ms" }}
          />
        </svg>
      </div>
    </div>
  );
}

/* ── Mobile connector ────────────────────────────────────────────────────── */

function MobileConnector({ visible, delay }: { visible: boolean; delay: number }) {
  return (
    <div className="relative mx-auto h-8 w-px overflow-hidden">
      <span className="absolute inset-0 bg-white/15" />
      <span
        className="absolute inset-x-0 top-0 bg-white/80"
        style={{
          height: "100%",
          transformOrigin: "top",
          transform: visible ? "scaleY(1)" : "scaleY(0)",
          transition: `transform ${STEP_DUR}ms linear ${delay}ms`,
        }}
      />
    </div>
  );
}

/* ── Mobile step card ────────────────────────────────────────────────────── */

function MobileStep({ title, detail, icon }: { title: string; detail?: string; icon: LucideIcon }) {
  return (
    <Card className="w-full px-4 py-3.5">
      <div className="flex items-center gap-3">
        <IconBox icon={icon} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white">{title}</p>
          {detail && <p className="mt-0.5 text-[11px] text-white/60">{detail}</p>}
        </div>
      </div>
    </Card>
  );
}

/* ── Mobile workflow ─────────────────────────────────────────────────────── */

const MOBILE_STEPS = [
  { title: "Discover EU alternative",   detail: "GitHub → Forgejo",                   icon: Search       },
  { title: "Add to stack",              detail: "1 action triggered",                  icon: Plus         },
  { title: "Suggest migration partner", detail: "For your US to EU migration",         icon: Lightbulb    },
  { title: "Find migration partner",    detail: "SeoSoft ApS",                         icon: UserCheck    },
  { title: "Connect",                   detail: "Open the migration workspace",         icon: Link2        },
  { title: "Migration started",         detail: "Kick off the partner migration work",  icon: Rocket       },
  { title: "Configuring new system",    detail: "Prepare the European stack setup",    icon: Settings     },
  { title: "Migration completed",       detail: "European tools are now live",          icon: CheckCircle2 },
];

function MobileWorkflow({ visible }: { visible: boolean }) {
  return (
    <div className="workflow-mobile mt-12 flex-col items-center px-4">

      <div className="flex w-full max-w-[360px] justify-center">
        <TriggerCard />
      </div>

      <MobileConnector visible={visible} delay={0} />

      <div className="flex w-full max-w-[360px] justify-center">
        <ActionCard />
      </div>

      <MobileConnector visible={visible} delay={STEP_DUR} />

      <div className="flex w-full max-w-[360px] flex-col">
        {MOBILE_STEPS.map((step, i) => (
          <div key={i}>
            <MobileStep title={step.title} detail={step.detail} icon={step.icon} />
            {i < MOBILE_STEPS.length - 1 && (
              <MobileConnector visible={visible} delay={STEP_DUR * (i + 2)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────────────────────── */

export function HowItWorks() {
  const { ref, visible } = useInView();

  return (
    <section ref={ref} className="workflow-root overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="mx-auto max-w-[1440px]">
        <header className="mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="mb-2 h-0.5 w-6 rounded-full bg-white/30" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
              How it works
            </p>
          </div>
          <h2 className="text-[32px] font-bold text-white" style={{ letterSpacing: "-0.03em" }}>
            The path from US tools to European software
          </h2>
          <p className="mt-2 max-w-[600px] text-base text-white/60">
            See how companies discover EU alternatives, add them to their stack, and connect with migration partners to complete the move.
          </p>
        </header>

        <DesktopWorkflow visible={visible} />
        <MobileWorkflow visible={visible} />
      </div>
    </section>
  );
}
