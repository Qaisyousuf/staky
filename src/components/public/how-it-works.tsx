"use client";

import { useRef, useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Compass, Layers, Users } from "lucide-react";

/* ─── Font & keyframes ──────────────────────────────────────────────────────── */

const F =
  "var(--font-jakarta,'Plus Jakarta Sans'),-apple-system,BlinkMacSystemFont,sans-serif";

const CSS = `
@keyframes hiw-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hiw-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes hiw-draw {
  to { stroke-dashoffset: 0; }
}
`;

/* ─── Rect type ─────────────────────────────────────────────────────────────── */

interface Rect {
  x: number; y: number;
  w: number; h: number;
  cx: number; cy: number;
}

function getRect(el: HTMLElement | null, base: HTMLElement | null): Rect | null {
  if (!el || !base) return null;
  const e = el.getBoundingClientRect();
  const b = base.getBoundingClientRect();
  if (b.width === 0 && b.height === 0) return null;
  const x = e.left - b.left;
  const y = e.top - b.top;
  return { x, y, w: e.width, h: e.height, cx: x + e.width / 2, cy: y + e.height / 2 };
}

/* ─── IntersectionObserver hook ─────────────────────────────────────────────── */

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

/* ─── Animation helpers ─────────────────────────────────────────────────────── */

function fadeUp(inView: boolean, delay: number): React.CSSProperties {
  if (!inView) return { opacity: 0 };
  return { animation: `hiw-fade-up 400ms ease-out ${delay}ms both` };
}

/* ─── SVG primitives ────────────────────────────────────────────────────────── */

function SvgLine({
  x1, y1, x2, y2, inView, delay,
}: {
  x1: number; y1: number; x2: number; y2: number;
  inView: boolean; delay: number;
}) {
  const len = Math.round(Math.abs(x2 - x1) + Math.abs(y2 - y1));
  if (len < 2) return null;
  return (
    <line
      x1={Math.round(x1)} y1={Math.round(y1)}
      x2={Math.round(x2)} y2={Math.round(y2)}
      stroke="rgba(255,255,255,0.18)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray={len}
      style={{
        strokeDashoffset: len,
        animation: inView ? `hiw-draw 450ms ease-out ${delay}ms forwards` : "none",
      }}
    />
  );
}

function SvgDot({
  cx, cy, inView, delay,
}: { cx: number; cy: number; inView: boolean; delay: number }) {
  return (
    <circle
      cx={Math.round(cx)} cy={Math.round(cy)} r="3"
      fill="rgba(255,255,255,0.25)"
      style={{
        opacity: 0,
        animation: inView ? `hiw-fade 250ms ease-out ${delay}ms both` : "none",
      }}
    />
  );
}

/* ─── Status dot ────────────────────────────────────────────────────────────── */

function StatusDot() {
  return (
    <span className="absolute left-4 top-4 flex h-2 w-2" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0F6E56] opacity-35" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0F6E56]" />
    </span>
  );
}

/* ─── Card components ───────────────────────────────────────────────────────── */

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
      <div className="mb-3.5 flex items-center gap-1.5 text-[11px] text-white/40">
        <span>On every</span>
        <span className="rounded-[6px] border border-white/10 bg-white/[0.07] px-1.5 py-[3px] font-medium text-white/65">
          switch
        </span>
        <span className="ml-auto flex h-[14px] w-[24px] items-center rounded-full bg-[#0F6E56]/30 px-[3px]">
          <span className="ml-auto h-[9px] w-[9px] rounded-full bg-[#0F6E56]" />
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[#0F6E56]" />
        <span className="text-[11px] text-white/40">Ready to migrate</span>
      </div>
    </div>
  );
}

interface SubCardProps { label: string; detail: string; inView: boolean; delay: number; }

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
      <p className="pl-[13px] text-[11px] leading-tight text-white/30">{detail}</p>
    </div>
  );
}

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

/* ─── SVG line builder ──────────────────────────────────────────────────────── */

interface AllRects {
  containerW: number;
  containerH: number;
  trigger: Rect | null;
  steps: (Rect | null)[];
  subTops: (Rect | null)[];
  subBots: (Rect | null)[];
}

function buildSvgElems(r: AllRects, inView: boolean): React.ReactNode {
  const { trigger: tri, steps: s, subTops: st, subBots: sb } = r;
  if (!tri || !s[0]) return null;

  const elems: React.ReactNode[] = [];
  let k = 0;

  function line(x1: number, y1: number, x2: number, y2: number, delay: number) {
    elems.push(<SvgLine key={`l${k++}`} x1={x1} y1={y1} x2={x2} y2={y2} inView={inView} delay={delay} />);
  }
  function dot(cx: number, cy: number, delay: number) {
    elems.push(<SvgDot key={`d${k++}`} cx={cx} cy={cy} inView={inView} delay={delay} />);
  }

  // ── Trigger → Step 0 ──────────────────────────────────────────────────────
  if (s[0]) {
    const y = s[0].cy;
    line(tri.x + tri.w, y, s[0].x, y, 200);
    dot(tri.x + tri.w, y, 350);
    dot(s[0].x, y, 500);
  }

  // ── Step 0 branches ───────────────────────────────────────────────────────
  if (s[0]) {
    if (st[0]) {
      // vertical up: step top-center → sub bottom-center
      line(s[0].cx, s[0].y, st[0].cx, st[0].y + st[0].h, 800);
      dot(s[0].cx, s[0].y, 800);
      dot(st[0].cx, st[0].y + st[0].h, 950);
    }
    if (sb[0]) {
      // vertical down: step bottom-center → sub top-center
      line(s[0].cx, s[0].y + s[0].h, sb[0].cx, sb[0].y, 800);
      dot(s[0].cx, s[0].y + s[0].h, 800);
      dot(sb[0].cx, sb[0].y, 950);
    }
  }

  // ── Step 0 → Step 1 ───────────────────────────────────────────────────────
  if (s[0] && s[1]) {
    const y = s[0].cy;
    line(s[0].x + s[0].w, y, s[1].x, y, 1200);
    dot(s[0].x + s[0].w, y, 1200);
    dot(s[1].x, y, 1350);
  }

  // ── Step 1 branches ───────────────────────────────────────────────────────
  if (s[1]) {
    if (st[1]) {
      line(s[1].cx, s[1].y, st[1].cx, st[1].y + st[1].h, 1600);
      dot(s[1].cx, s[1].y, 1600);
      dot(st[1].cx, st[1].y + st[1].h, 1750);
    }
    if (sb[1]) {
      line(s[1].cx, s[1].y + s[1].h, sb[1].cx, sb[1].y, 1600);
      dot(s[1].cx, s[1].y + s[1].h, 1600);
      dot(sb[1].cx, sb[1].y, 1750);
    }
  }

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────
  if (s[1] && s[2]) {
    const y = s[1].cy;
    line(s[1].x + s[1].w, y, s[2].x, y, 2000);
    dot(s[1].x + s[1].w, y, 2000);
    dot(s[2].x, y, 2150);
  }

  // ── Step 2 branches ───────────────────────────────────────────────────────
  if (s[2]) {
    if (st[2]) {
      line(s[2].cx, s[2].y, st[2].cx, st[2].y + st[2].h, 2400);
      dot(s[2].cx, s[2].y, 2400);
      dot(st[2].cx, st[2].y + st[2].h, 2550);
    }
    if (sb[2]) {
      line(s[2].cx, s[2].y + s[2].h, sb[2].cx, sb[2].y, 2400);
      dot(s[2].cx, s[2].y + s[2].h, 2400);
      dot(sb[2].cx, sb[2].y, 2550);
    }
  }

  return elems;
}

/* ─── Step data ─────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    num: "01", icon: Compass,
    title: "Discover alternatives",
    desc: "Browse 186+ EU alternatives across 10 categories. Compare features, ratings, and real stories.",
    subTop:    { label: "Search & filter",    detail: "186+ tools indexed"     },
    subBottom: { label: "Community ratings",  detail: "Real user reviews"      },
  },
  {
    num: "02", icon: Layers,
    title: "Build your stack",
    desc: "Add your current tools. Get a personalized migration plan with difficulty scores.",
    subTop:    { label: "Difficulty scoring", detail: "Auto-analyzed"          },
    subBottom: { label: "Migration order",    detail: "Smart recommendations"  },
  },
  {
    num: "03", icon: Users,
    title: "Get expert help",
    desc: "Connect with certified EU partners. Track progress and join the community.",
    subTop:    { label: "Certified partners", detail: "6 verified experts"     },
    subBottom: { label: "Community support",  detail: "Active discussions"     },
  },
] as const;

/* ─── Main export ───────────────────────────────────────────────────────────── */

export function HowItWorks() {
  const { ref: sectionRef, inView } = useInView();

  // ── Refs for SVG measurement (desktop only) ────────────────────────────────
  const desktopRef  = useRef<HTMLDivElement>(null);
  const triggerRef  = useRef<HTMLDivElement>(null);

  const stepRef0    = useRef<HTMLDivElement>(null);
  const stepRef1    = useRef<HTMLDivElement>(null);
  const stepRef2    = useRef<HTMLDivElement>(null);

  const subTopRef0  = useRef<HTMLDivElement>(null);
  const subTopRef1  = useRef<HTMLDivElement>(null);
  const subTopRef2  = useRef<HTMLDivElement>(null);

  const subBotRef0  = useRef<HTMLDivElement>(null);
  const subBotRef1  = useRef<HTMLDivElement>(null);
  const subBotRef2  = useRef<HTMLDivElement>(null);

  const [allRects, setAllRects] = useState<AllRects | null>(null);

  useEffect(() => {
    function measure() {
      const base = desktopRef.current;
      if (!base) return;
      const cb = base.getBoundingClientRect();
      if (cb.width === 0) return; // hidden on mobile, skip

      function r(el: HTMLDivElement | null) { return getRect(el, base); }

      setAllRects({
        containerW: cb.width,
        containerH: cb.height,
        trigger:  r(triggerRef.current),
        steps:    [r(stepRef0.current), r(stepRef1.current), r(stepRef2.current)],
        subTops:  [r(subTopRef0.current), r(subTopRef1.current), r(subTopRef2.current)],
        subBots:  [r(subBotRef0.current), r(subBotRef1.current), r(subBotRef2.current)],
      });
    }

    // Measure after first paint (layout is stable)
    const t = requestAnimationFrame(() => { measure(); });

    const obs = new ResizeObserver(measure);
    if (desktopRef.current) obs.observe(desktopRef.current);

    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(t);
      obs.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Re-measure when inView fires (ensures animation timing is current)
  useEffect(() => {
    if (!inView) return;
    const base = desktopRef.current;
    if (!base) return;
    const cb = base.getBoundingClientRect();
    if (cb.width === 0) return;
    function r(el: HTMLDivElement | null) { return getRect(el, base); }
    setAllRects({
      containerW: cb.width,
      containerH: cb.height,
      trigger:  r(triggerRef.current),
      steps:    [r(stepRef0.current), r(stepRef1.current), r(stepRef2.current)],
      subTops:  [r(subTopRef0.current), r(subTopRef1.current), r(subTopRef2.current)],
      subBots:  [r(subBotRef0.current), r(subBotRef1.current), r(subBotRef2.current)],
    });
  }, [inView]);

  // ── Delay schedule ─────────────────────────────────────────────────────────
  const D = {
    trigger: 0,
    step:    [600,  1400, 2200] as const,
    sub:     [1000, 1800, 2600] as const,
  };

  return (
    <section
      ref={sectionRef}
      className="bg-[#1B2B1F] py-[100px]"
      style={{ fontFamily: F }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
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

        {/* ══ Desktop: SVG-connected pipeline ════════════════════════════════ */}
        {/*
          Layout: flex items-center → trigger + [flex-1 gap] + node-col × 3
          Node col: flex-col gap-[56px] → sub-top, step, sub-bottom
          Symmetry: sub heights ≈ equal, gap heights = equal
            → column center == step card center == H-line center ✓
          SVG overlay: absolute inset-0, pointer-events-none
            → draws lines between measured card positions
        */}
        <div ref={desktopRef} className="relative hidden lg:block">
          <div className="flex items-center">

            {/* Trigger */}
            <div ref={triggerRef}>
              <TriggerCard inView={inView} />
            </div>

            {/* Gap 1 */}
            <div className="flex-1 min-w-[28px]" />

            {/* Node 01 */}
            <div className="flex w-[240px] shrink-0 flex-col gap-[56px]">
              <div ref={subTopRef0}>
                <SubCard {...STEPS[0].subTop} inView={inView} delay={D.sub[0]} />
              </div>
              <div ref={stepRef0}>
                <StepCard num={STEPS[0].num} icon={STEPS[0].icon} title={STEPS[0].title} desc={STEPS[0].desc} inView={inView} delay={D.step[0]} />
              </div>
              <div ref={subBotRef0}>
                <SubCard {...STEPS[0].subBottom} inView={inView} delay={D.sub[0] + 120} />
              </div>
            </div>

            {/* Gap 2 */}
            <div className="flex-1 min-w-[28px]" />

            {/* Node 02 */}
            <div className="flex w-[240px] shrink-0 flex-col gap-[56px]">
              <div ref={subTopRef1}>
                <SubCard {...STEPS[1].subTop} inView={inView} delay={D.sub[1]} />
              </div>
              <div ref={stepRef1}>
                <StepCard num={STEPS[1].num} icon={STEPS[1].icon} title={STEPS[1].title} desc={STEPS[1].desc} inView={inView} delay={D.step[1]} />
              </div>
              <div ref={subBotRef1}>
                <SubCard {...STEPS[1].subBottom} inView={inView} delay={D.sub[1] + 120} />
              </div>
            </div>

            {/* Gap 3 */}
            <div className="flex-1 min-w-[28px]" />

            {/* Node 03 */}
            <div className="flex w-[240px] shrink-0 flex-col gap-[56px]">
              <div ref={subTopRef2}>
                <SubCard {...STEPS[2].subTop} inView={inView} delay={D.sub[2]} />
              </div>
              <div ref={stepRef2}>
                <StepCard num={STEPS[2].num} icon={STEPS[2].icon} title={STEPS[2].title} desc={STEPS[2].desc} inView={inView} delay={D.step[2]} />
              </div>
              <div ref={subBotRef2}>
                <SubCard {...STEPS[2].subBottom} inView={inView} delay={D.sub[2] + 120} />
              </div>
            </div>

          </div>

          {/* SVG overlay — drawn lines between cards */}
          {allRects && (
            <svg
              className="pointer-events-none absolute inset-0"
              width={allRects.containerW}
              height={allRects.containerH}
              aria-hidden
            >
              {buildSvgElems(allRects, inView)}
            </svg>
          )}
        </div>

        {/* ══ Mobile / Tablet: vertical stack with CSS lines ════════════════ */}
        <div className="flex flex-col items-center lg:hidden">

          {/* Trigger */}
          <div className="w-full max-w-[360px]">
            <TriggerCard inView={inView} />
          </div>

          {STEPS.map((step, i) => (
            <div key={step.num} className="flex w-full max-w-[360px] flex-col">
              {/* Connector line from above */}
              <div className="flex justify-center py-1">
                <div
                  className="w-px bg-white/[0.18]"
                  style={{
                    height: 36,
                    transformOrigin: "top center",
                    transform: inView ? "scaleY(1)" : "scaleY(0)",
                    transition: `transform 280ms ease-out ${i * 700 + 200}ms`,
                  }}
                />
              </div>

              {/* Step card */}
              <StepCard
                num={step.num}
                icon={step.icon}
                title={step.title}
                desc={step.desc}
                inView={inView}
                delay={i * 700 + 350}
              />

              {/* Sub-cards 2-col */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <SubCard {...step.subTop}    inView={inView} delay={i * 700 + 550} />
                <SubCard {...step.subBottom} inView={inView} delay={i * 700 + 650} />
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}
