"use client";

import { useRef, useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Compass, Layers, Users } from "lucide-react";

/* ─── Font ──────────────────────────────────────────────────────────────────── */

const F =
  "var(--font-jakarta,'Plus Jakarta Sans'),-apple-system,BlinkMacSystemFont,sans-serif";

/* ─── Keyframes (injected once) ─────────────────────────────────────────────── */

const CSS = `
@keyframes hiw-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hiw-grow-x {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes hiw-grow-y-top {
  from { transform: scaleY(0); transform-origin: top center; }
  to   { transform: scaleY(1); transform-origin: top center; }
}
@keyframes hiw-grow-y-bot {
  from { transform: scaleY(0); transform-origin: bottom center; }
  to   { transform: scaleY(1); transform-origin: bottom center; }
}
`;

/* ─── IntersectionObserver hook ─────────────────────────────────────────────── */

function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Animation style helpers ───────────────────────────────────────────────── */

type Sty = React.CSSProperties;

function fadeUp(inView: boolean, delay: number): Sty {
  if (!inView) return { opacity: 0 };
  return {
    animationName: "hiw-fade-up",
    animationDuration: "400ms",
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
    animationTimingFunction: "ease-out",
  };
}

function growX(inView: boolean, delay: number): Sty {
  if (!inView) return { transform: "scaleX(0)", transformOrigin: "left center" };
  return {
    animationName: "hiw-grow-x",
    animationDuration: "400ms",
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
    animationTimingFunction: "ease-out",
    transformOrigin: "left center",
  };
}

function growYTop(inView: boolean, delay: number): Sty {
  if (!inView) return { transform: "scaleY(0)", transformOrigin: "top center" };
  return {
    animationName: "hiw-grow-y-top",
    animationDuration: "280ms",
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
    animationTimingFunction: "ease-out",
  };
}

function growYBot(inView: boolean, delay: number): Sty {
  if (!inView) return { transform: "scaleY(0)", transformOrigin: "bottom center" };
  return {
    animationName: "hiw-grow-y-bot",
    animationDuration: "280ms",
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
    animationTimingFunction: "ease-out",
  };
}

/* ─── Atoms ─────────────────────────────────────────────────────────────────── */

/** A small junction dot that marks a real connection endpoint. */
function Dot() {
  return (
    <span
      className="block h-[5px] w-[5px] shrink-0 rounded-full bg-white/[0.18]"
      aria-hidden
    />
  );
}

/** Pulsing green status indicator, absolute-positioned top-left of parent. */
function StatusDot() {
  return (
    <span className="absolute left-4 top-4 flex h-2 w-2" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0F6E56] opacity-35" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0F6E56]" />
    </span>
  );
}

/* ─── Connector lines ───────────────────────────────────────────────────────── */

/**
 * Horizontal line between two nodes.
 * Dots at each end mark real junction points.
 * scaleX grows left → right.
 */
function HLine({ inView, delay }: { inView: boolean; delay: number }) {
  return (
    <div className="flex flex-1 items-center" aria-hidden>
      <Dot />
      <div
        className="flex-1 h-px bg-white/[0.12]"
        style={growX(inView, delay)}
      />
      <Dot />
    </div>
  );
}

/**
 * Vertical line from step-card top up to sub-card bottom.
 * Origin = bottom so it grows upward from the step card.
 */
function VLineUp({ inView, delay }: { inView: boolean; delay: number }) {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      <Dot />
      <div className="w-px h-8 bg-white/[0.12]" style={growYBot(inView, delay)} />
      <Dot />
    </div>
  );
}

/**
 * Vertical line from step-card bottom down to sub-card top.
 * Origin = top so it grows downward from the step card.
 */
function VLineDown({ inView, delay }: { inView: boolean; delay: number }) {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      <Dot />
      <div className="w-px h-8 bg-white/[0.12]" style={growYTop(inView, delay)} />
      <Dot />
    </div>
  );
}

/* ─── Trigger card ──────────────────────────────────────────────────────────── */

function TriggerCard({ inView }: { inView: boolean }) {
  return (
    <div
      className="w-[178px] shrink-0 rounded-[12px] border border-white/10 bg-white/[0.05] p-5"
      style={fadeUp(inView, 0)}
    >
      <p className="mb-1 text-[14px] font-semibold leading-tight text-white">
        Your current stack
      </p>
      <p className="mb-4 text-[12px] leading-[1.4] text-white/40">
        US tools you want to replace
      </p>

      {/* "On every switch" row */}
      <div className="mb-3.5 flex items-center gap-1.5 text-[11px] text-white/40">
        <span>On every</span>
        <span className="rounded-[6px] border border-white/10 bg-white/[0.07] px-1.5 py-[3px] font-medium text-white/65">
          switch
        </span>
        {/* toggle dot */}
        <span className="ml-auto flex h-[14px] w-[24px] items-center rounded-full bg-[#0F6E56]/30 px-[3px]">
          <span className="ml-auto h-[9px] w-[9px] rounded-full bg-[#0F6E56]" />
        </span>
      </div>

      {/* Ready indicator */}
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#0F6E56]" />
        <span className="text-[11px] text-white/40">Ready to migrate</span>
      </div>
    </div>
  );
}

/* ─── Sub-card ──────────────────────────────────────────────────────────────── */

interface SubCardProps {
  label: string;
  detail: string;
  inView: boolean;
  delay: number;
}

function SubCard({ label, detail, inView, delay }: SubCardProps) {
  return (
    <div
      className="rounded-[10px] border border-white/[0.08] bg-white/[0.03] px-[18px] py-[14px]"
      style={fadeUp(inView, delay)}
    >
      <div className="mb-[5px] flex items-center gap-[7px]">
        <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#0F6E56]/60" />
        <span className="text-[13px] font-[500] text-white/60">{label}</span>
      </div>
      <p className="pl-[13px] text-[11px] leading-tight text-white/28">{detail}</p>
    </div>
  );
}

/* ─── Step card ─────────────────────────────────────────────────────────────── */

interface StepCardProps {
  num: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  inView: boolean;
  delay: number;
}

function StepCard({ num, icon: Icon, title, desc, inView, delay }: StepCardProps) {
  return (
    <div
      className="relative rounded-[14px] border border-white/[0.12] bg-white/[0.06] p-6 transition-[border-color,background-color] duration-200 hover:border-white/25 hover:bg-white/[0.08]"
      style={fadeUp(inView, delay)}
    >
      <StatusDot />
      {/* Watermark step number */}
      <span
        className="pointer-events-none absolute right-4 top-2 select-none font-bold leading-none text-white/[0.06]"
        style={{ fontSize: 48 }}
        aria-hidden
      >
        {num}
      </span>
      <Icon className="mb-[10px] mt-[2px] h-6 w-6 text-[#4CAF8B]" />
      <h3 className="mb-[6px] text-[16px] font-semibold leading-snug text-white">{title}</h3>
      <p className="text-[13px] leading-[1.5] text-white/50">{desc}</p>
    </div>
  );
}

/* ─── Step column (desktop) ─────────────────────────────────────────────────── */

/**
 * A vertical column containing: SubCard (top) → VLine → StepCard → VLine → SubCard (bottom).
 * The outer `flex items-center` container centers all columns on the step-card midpoint,
 * because both VLines and both SubCards are identical in height → step card IS the column center.
 */
interface StepColProps {
  num: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  subTop: { label: string; detail: string };
  subBottom: { label: string; detail: string };
  inView: boolean;
  stepDelay: number;
  vlineDelay: number;
  subDelay: number;
}

function StepCol({
  num, icon, title, desc,
  subTop, subBottom,
  inView, stepDelay, vlineDelay, subDelay,
}: StepColProps) {
  return (
    <div className="flex w-[240px] shrink-0 flex-col">
      <SubCard {...subTop}    inView={inView} delay={subDelay} />
      <VLineUp               inView={inView} delay={vlineDelay} />
      <StepCard
        num={num} icon={icon} title={title} desc={desc}
        inView={inView} delay={stepDelay}
      />
      <VLineDown             inView={inView} delay={vlineDelay} />
      <SubCard {...subBottom} inView={inView} delay={subDelay + 120} />
    </div>
  );
}

/* ─── Mobile step block ─────────────────────────────────────────────────────── */

interface MobileBlockProps {
  num: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  subTop: { label: string; detail: string };
  subBottom: { label: string; detail: string };
  inView: boolean;
  stepDelay: number;
  subDelay: number;
}

function MobileBlock({
  num, icon, title, desc,
  subTop, subBottom,
  inView, stepDelay, subDelay,
}: MobileBlockProps) {
  return (
    <div className="w-full">
      <StepCard
        num={num} icon={icon} title={title} desc={desc}
        inView={inView} delay={stepDelay}
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <SubCard {...subTop}    inView={inView} delay={subDelay} />
        <SubCard {...subBottom} inView={inView} delay={subDelay + 120} />
      </div>
    </div>
  );
}

/* ─── Vertical connector used in mobile flow ────────────────────────────────── */

function MobileVConn({ inView, delay }: { inView: boolean; delay: number }) {
  return (
    <div className="flex flex-col items-center py-1" aria-hidden>
      <Dot />
      <div className="h-8 w-px bg-white/[0.12]" style={growYTop(inView, delay)} />
      <Dot />
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────────────────────── */

export function HowItWorks() {
  const { ref, inView } = useInView();

  // Step data
  const steps = [
    {
      num: "01",
      icon: Compass,
      title: "Discover alternatives",
      desc: "Browse 186+ EU alternatives across 10 categories. Compare features, ratings, and real stories.",
      subTop:    { label: "Search & filter",    detail: "186+ tools indexed" },
      subBottom: { label: "Community ratings",  detail: "Real user reviews"  },
    },
    {
      num: "02",
      icon: Layers,
      title: "Build your stack",
      desc: "Add your current tools. Get a personalized migration plan with difficulty scores.",
      subTop:    { label: "Difficulty scoring", detail: "Auto-analyzed"         },
      subBottom: { label: "Migration order",    detail: "Smart recommendations" },
    },
    {
      num: "03",
      icon: Users,
      title: "Get expert help",
      desc: "Connect with certified EU partners. Track progress and join the community.",
      subTop:    { label: "Certified partners",  detail: "6 verified experts" },
      subBottom: { label: "Community support",   detail: "Active discussions"  },
    },
  ] as const;

  /* Animation delay schedule (ms)
   * 1.  Trigger card    0
   * 2.  H-line → 01   200  (draws 400ms)
   * 3.  Step 01        600
   * 4.  V-lines 01     800  (branches out)
   * 5.  Sub A / Sub B 1000
   * 6.  H-line → 02   1200 (draws 400ms)
   * 7.  Step 02        1400
   * 8.  V-lines 02     1600
   * 9.  Sub C / Sub D 1800
   * 10. H-line → 03   2000
   * 11. Step 03        2200
   * 12. V-lines 03     2400
   * 13. Sub E / Sub F 2600
   */

  return (
    <section className="bg-[#1B2B1F] py-[100px]" style={{ fontFamily: F }}>
      {/* Inject keyframes once — React deduplicates identical style tags */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div ref={ref} className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="mb-16 text-center" style={fadeUp(inView, 0)}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
            How it works
          </p>
          <h2
            className="mb-4 text-[36px] font-bold leading-tight text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Three steps to EU sovereignty
          </h2>
          <p className="text-[16px] text-white/50">
            From discovery to full migration — we guide you through every step.
          </p>
        </div>

        {/* ── Desktop: horizontal pipeline ───────────────────────────────── */}
        {/*
          Outer flex items-center ensures HLines align with node centers.
          Each StepCol is symmetric (SubCard + VLine + StepCard + VLine + SubCard)
          so the column's geometric center == the StepCard's center == HLine height.
        */}
        <div className="hidden lg:flex items-center">

          <TriggerCard inView={inView} />

          <HLine inView={inView} delay={200} />

          <StepCol
            {...steps[0]}
            inView={inView}
            stepDelay={600}
            vlineDelay={800}
            subDelay={1000}
          />

          <HLine inView={inView} delay={1200} />

          <StepCol
            {...steps[1]}
            inView={inView}
            stepDelay={1400}
            vlineDelay={1600}
            subDelay={1800}
          />

          <HLine inView={inView} delay={2000} />

          <StepCol
            {...steps[2]}
            inView={inView}
            stepDelay={2200}
            vlineDelay={2400}
            subDelay={2600}
          />

        </div>

        {/* ── Tablet (md–lg): vertical pipeline, cards full width ─────────── */}
        <div className="hidden md:flex lg:hidden flex-col items-center max-w-sm mx-auto">

          <TriggerCard inView={inView} />

          {steps.map((step, i) => (
            <div key={step.num} className="w-full">
              <MobileVConn inView={inView} delay={i * 800 + 200} />
              <MobileBlock
                {...step}
                inView={inView}
                stepDelay={i * 800 + 400}
                subDelay={i * 800 + 600}
              />
            </div>
          ))}

        </div>

        {/* ── Mobile (<md): same vertical flow, full width ─────────────────── */}
        <div className="flex md:hidden flex-col items-center">

          <div className="w-full max-w-[360px]">
            <TriggerCard inView={inView} />
          </div>

          {steps.map((step, i) => (
            <div key={step.num} className="w-full max-w-[360px]">
              <MobileVConn inView={inView} delay={i * 700 + 200} />
              <MobileBlock
                {...step}
                inView={inView}
                stepDelay={i * 700 + 350}
                subDelay={i * 700 + 500}
              />
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}
