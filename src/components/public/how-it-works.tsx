"use client";

import { useRef, useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  Compass, Layers, Users,
  Search, Star, BarChart3, ArrowUpDown,
  Shield, MessageSquare,
} from "lucide-react";

const F =
  "var(--font-jakarta,'Plus Jakarta Sans'),-apple-system,BlinkMacSystemFont,sans-serif";

/* ─────────────────────────────── Animation hook ──────────────────────────── */

function usePipelineAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, triggered };
}

/* ─────────────────────────────── Style helpers ────────────────────────────── */

function fadeStyle(triggered: boolean, delay: number): React.CSSProperties {
  return {
    opacity: triggered ? 1 : 0,
    transform: triggered ? "translateY(0)" : "translateY(10px)",
    transition: `opacity 300ms ease-out ${delay}ms, transform 300ms ease-out ${delay}ms`,
  };
}

function scaleXStyle(triggered: boolean, delay: number): React.CSSProperties {
  return {
    transformOrigin: "left center",
    transform: triggered ? "scaleX(1)" : "scaleX(0)",
    transition: `transform 400ms ease-out ${delay}ms`,
  };
}

function scaleYStyle(triggered: boolean, delay: number): React.CSSProperties {
  return {
    transformOrigin: "top center",
    transform: triggered ? "scaleY(1)" : "scaleY(0)",
    transition: `transform 250ms ease-out ${delay}ms`,
  };
}

/* ─────────────────────────────── Atoms ────────────────────────────────────── */

function StatusDot() {
  return (
    <span className="absolute left-4 top-4 flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0F6E56] opacity-40" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0F6E56]" />
    </span>
  );
}

function ConnDot() {
  return <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-white/20" />;
}

function HLine({ triggered, delay }: { triggered: boolean; delay: number }) {
  return (
    <div className="flex flex-1 items-center">
      <div
        className="flex-1 h-px bg-white/15"
        style={scaleXStyle(triggered, delay)}
      />
    </div>
  );
}

function VLine({ triggered, delay }: { triggered: boolean; delay: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <ConnDot />
      <div
        className="w-px h-8 bg-white/15"
        style={scaleYStyle(triggered, delay)}
      />
      <ConnDot />
    </div>
  );
}

/* ─────────────────────────────── Cards ────────────────────────────────────── */

interface SubCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  triggered: boolean;
  delay: number;
}

function SubCard({ icon: Icon, label, triggered, delay }: SubCardProps) {
  return (
    <div
      className="flex items-center gap-2 whitespace-nowrap rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-[18px] py-[13px] text-[12px] font-medium text-white/55"
      style={fadeStyle(triggered, delay)}
    >
      <Icon className="h-4 w-4 shrink-0 text-white/35" />
      {label}
    </div>
  );
}

interface MainNodeProps {
  num: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  pill: string;
  triggered: boolean;
  delay: number;
}

function MainNode({ num, icon: Icon, title, desc, pill, triggered, delay }: MainNodeProps) {
  return (
    <div
      className="relative w-[230px] shrink-0 rounded-[14px] border border-white/10 bg-white/[0.06] p-7 hover:border-white/20 hover:bg-white/10"
      style={{
        opacity: triggered ? 1 : 0,
        transform: triggered ? "translateY(0)" : "translateY(10px)",
        transition: `opacity 300ms ease-out ${delay}ms, transform 300ms ease-out ${delay}ms, border-color 200ms ease-out, background-color 200ms ease-out`,
      }}
    >
      <StatusDot />
      <span
        className="pointer-events-none absolute right-4 top-3 select-none font-black leading-none text-white/[0.07]"
        style={{ fontSize: 40 }}
        aria-hidden="true"
      >
        {num}
      </span>
      <Icon className="mb-3 mt-1 h-7 w-7 text-[#4CAF8B]" />
      <h3 className="mb-2 text-[17px] font-semibold leading-snug text-white">{title}</h3>
      <p className="mb-4 text-[13px] leading-[1.65] text-white/60">{desc}</p>
      <span className="inline-block rounded-full bg-white/[0.08] px-3 py-1 text-[11px] font-medium text-white/50">
        {pill}
      </span>
    </div>
  );
}

function TriggerCard({ triggered }: { triggered: boolean }) {
  return (
    <div
      className="w-[148px] shrink-0 rounded-[10px] border border-white/10 bg-white/[0.04] px-5 py-[18px]"
      style={fadeStyle(triggered, 0)}
    >
      <p className="mb-1 text-[13px] font-bold leading-tight text-white">Your current stack</p>
      <p className="mb-3 text-[11px] leading-snug text-white/45">US tools you want to replace</p>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[#0F6E56]" />
        <span className="text-[11px] text-white/50">Ready to switch</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Node column ───────────────────────────────── */

interface NodeDef {
  num: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  pill: string;
  subTop: { icon: ComponentType<{ className?: string }>; label: string };
  subBottom: { icon: ComponentType<{ className?: string }>; label: string };
}

interface NodeColumnProps {
  node: NodeDef;
  triggered: boolean;
  nodeDelay: number;
  subDelay: number;
  vlineDelay: number;
}

function NodeColumn({ node, triggered, nodeDelay, subDelay, vlineDelay }: NodeColumnProps) {
  return (
    <div className="flex flex-col items-center">
      <SubCard
        icon={node.subTop.icon}
        label={node.subTop.label}
        triggered={triggered}
        delay={subDelay}
      />
      <VLine triggered={triggered} delay={vlineDelay} />
      <MainNode
        num={node.num}
        icon={node.icon}
        title={node.title}
        desc={node.desc}
        pill={node.pill}
        triggered={triggered}
        delay={nodeDelay}
      />
      <VLine triggered={triggered} delay={vlineDelay} />
      <SubCard
        icon={node.subBottom.icon}
        label={node.subBottom.label}
        triggered={triggered}
        delay={subDelay + 150}
      />
    </div>
  );
}

/* ─────────────────────────────── Main export ───────────────────────────────── */

export function HowItWorks() {
  const { ref, triggered } = usePipelineAnimation();

  const nodes: NodeDef[] = [
    {
      num: "01",
      icon: Compass,
      title: "Discover alternatives",
      desc: "Browse 186+ EU alternatives across 10 categories. Compare features, community ratings, and real migration stories.",
      pill: "186+ tools",
      subTop: { icon: Search, label: "Search & filter" },
      subBottom: { icon: Star, label: "Community ratings" },
    },
    {
      num: "02",
      icon: Layers,
      title: "Build your stack",
      desc: "Add your current tools. Get a personalized migration plan with difficulty scores and recommended switching order.",
      pill: "Smart analysis",
      subTop: { icon: BarChart3, label: "Difficulty scoring" },
      subBottom: { icon: ArrowUpDown, label: "Migration order" },
    },
    {
      num: "03",
      icon: Users,
      title: "Get expert help",
      desc: "Connect with certified EU migration partners. Track progress, share experiences, and join the community.",
      pill: "6 certified partners",
      subTop: { icon: Shield, label: "Certified partners" },
      subBottom: { icon: MessageSquare, label: "Community support" },
    },
  ];

  return (
    <section className="bg-[#1B2B1F] py-[100px]" style={{ fontFamily: F }}>
      <div ref={ref} className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="mb-16 text-center" style={fadeStyle(triggered, 0)}>
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

        {/* ── Desktop: horizontal pipeline ── */}
        <div className="hidden lg:flex items-center">
          <TriggerCard triggered={triggered} />
          <HLine triggered={triggered} delay={300} />
          <NodeColumn
            node={nodes[0]}
            triggered={triggered}
            nodeDelay={700}
            subDelay={900}
            vlineDelay={600}
          />
          <HLine triggered={triggered} delay={1100} />
          <NodeColumn
            node={nodes[1]}
            triggered={triggered}
            nodeDelay={1500}
            subDelay={1700}
            vlineDelay={1400}
          />
          <HLine triggered={triggered} delay={1900} />
          <NodeColumn
            node={nodes[2]}
            triggered={triggered}
            nodeDelay={2300}
            subDelay={2500}
            vlineDelay={2200}
          />
        </div>

        {/* ── Mobile: vertical flow ── */}
        <div className="flex flex-col items-center lg:hidden">
          <TriggerCard triggered={triggered} />
          {nodes.map((node, i) => (
            <div key={node.num} className="flex w-full max-w-sm flex-col items-center">
              {/* Vertical connector from above */}
              <div
                className="h-8 w-px bg-white/15"
                style={scaleYStyle(triggered, i * 600 + 200)}
              />
              <MainNode
                num={node.num}
                icon={node.icon}
                title={node.title}
                desc={node.desc}
                pill={node.pill}
                triggered={triggered}
                delay={i * 600 + 350}
              />
              {/* Sub-cards side by side below each node */}
              <div className="mt-2 flex w-full gap-2">
                <div className="flex-1">
                  <SubCard
                    icon={node.subTop.icon}
                    label={node.subTop.label}
                    triggered={triggered}
                    delay={i * 600 + 500}
                  />
                </div>
                <div className="flex-1">
                  <SubCard
                    icon={node.subBottom.icon}
                    label={node.subBottom.label}
                    triggered={triggered}
                    delay={i * 600 + 600}
                  />
                </div>
              </div>
              {/* Vertical connector to next node */}
              {i < 2 && (
                <div
                  className="mt-3 h-8 w-px bg-white/15"
                  style={scaleYStyle(triggered, i * 600 + 700)}
                />
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
