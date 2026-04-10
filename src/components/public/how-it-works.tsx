"use client";

import { useEffect, useRef, useState } from "react";
import { Search, CheckCircle, ChevronDown } from "lucide-react";

/* ─── Keyframes ──────────────────────────────────────────────────────────────── */

const CSS = `
@keyframes hiw-fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0);   }
}
@keyframes hiw-draw {
  to { stroke-dashoffset: 0; }
}
.hiw-diagrams {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
@media (max-width: 1023px) {
  .hiw-diagrams {
    flex-direction: column;
  }
  .hiw-diagrams > * {
    width: 100% !important;
    flex: none !important;
  }
}
@media (max-width: 767px) {
  .hiw-diagrams {
    margin: 0 -8px;
  }
}
`;

/* ─── IntersectionObserver hook ─────────────────────────────────────────────── */

function useInView(threshold = 0.1) {
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

/* ─── Animation helpers ─────────────────────────────────────────────────────── */

function fadeUp(inView: boolean, delay: number): React.CSSProperties {
  if (!inView) return { opacity: 0 };
  return { animation: `hiw-fade-up 300ms ease-out ${delay}ms both` };
}

function drawLine(inView: boolean, len: number, delay: number): React.CSSProperties {
  return {
    strokeDasharray: len,
    strokeDashoffset: inView ? undefined : len,
    animation: inView ? `hiw-draw 400ms ease-out ${delay}ms forwards` : "none",
  };
}

/* ─── Shared primitives ─────────────────────────────────────────────────────── */

function WindowBar({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.03)",
        gap: 8,
      }}
    >
      <span style={{ display: "flex", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F57", display: "block" }} />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E", display: "block" }} />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#28CA41", display: "block" }} />
      </span>
      <span style={{ flex: 1, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: "0.01em" }}>
        {title}
      </span>
      <span style={{ width: 42 }} />
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span style={{
      background: "rgba(255,255,255,0.1)",
      borderRadius: 6,
      padding: "2px 10px",
      fontSize: 12,
      color: "rgba(255,255,255,0.7)",
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
    }}>
      {label}
      <ChevronDown style={{ width: 10, height: 10, opacity: 0.5 }} />
    </span>
  );
}

function Toggle() {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      width: 28,
      height: 16,
      borderRadius: 999,
      background: "#0F6E56",
      padding: "0 2px",
      justifyContent: "flex-end",
    }}>
      <span style={{ width: 12, height: 12, borderRadius: "50%", background: "white", display: "block" }} />
    </span>
  );
}

function ConfigPanel({ trigger, fromLabel, fromPill, inView, delay }: {
  trigger: string;
  fromLabel: string;
  fromPill: string;
  inView: boolean;
  delay: number;
}) {
  return (
    <div style={{
      ...fadeUp(inView, delay),
      margin: "16px 16px 0",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      padding: 16,
    }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 12 }}>{trigger}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          <span>On every</span>
          <Pill label="switch" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          <span>{fromLabel}</span>
          <Pill label={fromPill} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          <span>Enabled</span>
          <Toggle />
        </div>
      </div>
    </div>
  );
}

function CompactNode({ icon, label, inView, delay }: {
  icon: React.ReactNode;
  label: string;
  inView: boolean;
  delay: number;
}) {
  return (
    <div style={{
      ...fadeUp(inView, delay),
      margin: "0 16px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      {icon}
      <span style={{ fontSize: 13, fontWeight: 500, color: "white" }}>{label}</span>
    </div>
  );
}

function ResultNode({ label, sub, diffLabel, diffColor, skipped, inView, delay }: {
  label: string;
  sub: string;
  diffLabel: string;
  diffColor: string;
  skipped?: boolean;
  inView: boolean;
  delay: number;
}) {
  return (
    <div style={{
      ...fadeUp(inView, delay),
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      padding: "10px 12px",
      flex: 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {skipped ? (
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "inline-block", flexShrink: 0 }} />
        ) : (
          <CheckCircle style={{ width: 14, height: 14, color: "#0F6E56", flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: skipped ? "rgba(255,255,255,0.35)" : "white" }}>{label}</span>
      </div>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", paddingLeft: 20, marginBottom: 2 }}>{sub}</p>
      <p style={{ fontSize: 11, color: diffColor, paddingLeft: 20 }}>{diffLabel}</p>
    </div>
  );
}

function FinalNode({ label, sub, inView, delay }: {
  label: string;
  sub: string;
  inView: boolean;
  delay: number;
}) {
  return (
    <div style={{
      ...fadeUp(inView, delay),
      margin: "0 16px 16px",
      background: "rgba(15,110,86,0.12)",
      border: "1px solid rgba(15,110,86,0.3)",
      borderRadius: 10,
      padding: "10px 14px",
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
    }}>
      <CheckCircle style={{ width: 14, height: 14, color: "#4CAF8B", flexShrink: 0, marginTop: 1 }} />
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{sub}</p>
      </div>
    </div>
  );
}

/* ─── SVG connector lines ────────────────────────────────────────────────────── */

type LineSpec =
  | { type: "v"; x: number; y1: number; y2: number; delay: number }
  | { type: "split"; x: number; y1: number; y2: number; xL: number; xR: number; delay: number }
  | { type: "merge"; xL: number; xR: number; xC: number; y1: number; y2: number; delay: number };

function ConnectorSvg({ lines, h, inView }: { lines: LineSpec[]; h: number; inView: boolean }) {
  return (
    <svg
      width="100%"
      height={h}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      {lines.map((l, i) => {
        if (l.type === "v") {
          const len = Math.abs(l.y2 - l.y1);
          return (
            <line
              key={i}
              x1={`${l.x}%`} y1={l.y1}
              x2={`${l.x}%`} y2={l.y2}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={drawLine(inView, len, l.delay)}
            />
          );
        }
        if (l.type === "split") {
          const vLen = l.y2 - l.y1;
          const lLen = vLen + Math.abs(l.xL - l.x) * 2;
          const rLen = vLen + Math.abs(l.xR - l.x) * 2;
          return (
            <g key={i}>
              {/* center down */}
              <line
                x1={`${l.x}%`} y1={l.y1}
                x2={`${l.x}%`} y2={l.y1 + vLen / 2}
                stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round"
                style={drawLine(inView, vLen / 2, l.delay)}
              />
              {/* left branch */}
              <polyline
                points={`${l.x}%,${l.y1 + vLen / 2} ${l.xL}%,${l.y1 + vLen / 2} ${l.xL}%,${l.y2}`}
                fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={drawLine(inView, lLen, l.delay + 80)}
              />
              {/* right branch */}
              <polyline
                points={`${l.x}%,${l.y1 + vLen / 2} ${l.xR}%,${l.y1 + vLen / 2} ${l.xR}%,${l.y2}`}
                fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={drawLine(inView, rLen, l.delay + 80)}
              />
              <circle cx={`${l.x}%`} cy={l.y1 + vLen / 2} r="3" fill="rgba(255,255,255,0.18)"
                style={{ opacity: inView ? 1 : 0, transition: `opacity 200ms ${l.delay + 60}ms` }} />
            </g>
          );
        }
        if (l.type === "merge") {
          const vLen = l.y2 - l.y1;
          const lLen = vLen + Math.abs(l.xL - l.xC) * 2;
          const rLen = vLen + Math.abs(l.xR - l.xC) * 2;
          return (
            <g key={i}>
              <polyline
                points={`${l.xL}%,${l.y1} ${l.xL}%,${l.y1 + vLen / 2} ${l.xC}%,${l.y1 + vLen / 2}`}
                fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={drawLine(inView, lLen, l.delay)}
              />
              <polyline
                points={`${l.xR}%,${l.y1} ${l.xR}%,${l.y1 + vLen / 2} ${l.xC}%,${l.y1 + vLen / 2}`}
                fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={drawLine(inView, rLen, l.delay)}
              />
              <line
                x1={`${l.xC}%`} y1={l.y1 + vLen / 2}
                x2={`${l.xC}%`} y2={l.y2}
                stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round"
                style={drawLine(inView, vLen / 2, l.delay + 80)}
              />
              <circle cx={`${l.xC}%`} cy={l.y1 + vLen / 2} r="3" fill="rgba(255,255,255,0.18)"
                style={{ opacity: inView ? 1 : 0, transition: `opacity 200ms ${l.delay + 60}ms` }} />
            </g>
          );
        }
        return null;
      })}
    </svg>
  );
}

/* ─── Left diagram: Quick Switch ────────────────────────────────────────────── */

function LeftDiagram({ inView, baseDelay = 0 }: { inView: boolean; baseDelay?: number }) {
  const d = baseDelay;

  const leftLines: LineSpec[] = [
    { type: "v",     x: 50, y1: 0, y2: 20, delay: d + 400 },
    { type: "split", x: 50, y1: 20, y2: 44, xL: 25, xR: 75, delay: d + 800 },
    { type: "merge", xL: 25, xR: 75, xC: 50, y1: 0, y2: 20, delay: d + 1200 },
    { type: "v",     x: 50, y1: 20, y2: 40, delay: d + 1300 },
  ];

  return (
    <div style={{
      ...fadeUp(inView, d),
      background: "#151F18",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      flex: 1,
      minWidth: 0,
    }}>
      <WindowBar title="Staky — Migration Workflow" />

      {/* Config */}
      <ConfigPanel
        trigger="Start migration"
        fromLabel="from stack"
        fromPill="my tools"
        inView={inView}
        delay={d + 200}
      />

      {/* Line 1 */}
      <ConnectorSvg h={24} inView={inView} lines={[{ type: "v", x: 50, y1: 0, y2: 24, delay: d + 400 }]} />

      {/* Discover node */}
      <CompactNode
        icon={<Search style={{ width: 15, height: 15, color: "#4CAF8B" }} />}
        label="Find alternatives"
        inView={inView}
        delay={d + 600}
      />

      {/* Split SVG */}
      <ConnectorSvg h={44} inView={inView} lines={[leftLines[1]]} />

      {/* Two result nodes */}
      <div style={{ display: "flex", gap: 8, margin: "0 16px" }}>
        <ResultNode
          label="Match found"
          sub="Mattermost for Slack"
          diffLabel="Difficulty: Easy"
          diffColor="#4CAF8B"
          inView={inView}
          delay={d + 1000}
        />
        <ResultNode
          label="Match found"
          sub="Nextcloud for Drive"
          diffLabel="Difficulty: Medium"
          diffColor="#C8956C"
          inView={inView}
          delay={d + 1000}
        />
      </div>

      {/* Merge SVG */}
      <ConnectorSvg h={44} inView={inView} lines={[
        { type: "merge", xL: 25, xR: 75, xC: 50, y1: 0, y2: 44, delay: d + 1200 },
      ]} />

      {/* Final node */}
      <FinalNode
        label="Migration plan ready"
        sub="2 tools · 1 partner matched"
        inView={inView}
        delay={d + 1400}
      />
    </div>
  );
}

/* ─── Right diagram: Expert Migration ───────────────────────────────────────── */

function RightDiagram({ inView, baseDelay = 0 }: { inView: boolean; baseDelay?: number }) {
  const d = baseDelay;

  return (
    <div style={{
      ...fadeUp(inView, d),
      background: "#151F18",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      flex: 1,
      minWidth: 0,
    }}>
      <WindowBar title="Staky — Partner Workflow" />

      {/* Config */}
      <ConfigPanel
        trigger="Request expert help"
        fromLabel="auto-match"
        fromPill="partners"
        inView={inView}
        delay={d + 200}
      />

      {/* Line */}
      <ConnectorSvg h={24} inView={inView} lines={[{ type: "v", x: 50, y1: 0, y2: 24, delay: d + 400 }]} />

      {/* Analyse node */}
      <CompactNode
        icon={<Search style={{ width: 15, height: 15, color: "#4CAF8B" }} />}
        label="Analyze stack"
        inView={inView}
        delay={d + 600}
      />

      {/* Split */}
      <ConnectorSvg h={44} inView={inView} lines={[
        { type: "split", x: 50, y1: 20, y2: 44, xL: 25, xR: 75, delay: d + 800 },
      ]} />

      {/* Two nodes */}
      <div style={{ display: "flex", gap: 8, margin: "0 16px" }}>
        <ResultNode
          label="Partner matched"
          sub="Nordic Cloud Solutions"
          diffLabel="Rating: 4.9 ★"
          diffColor="#C8956C"
          inView={inView}
          delay={d + 1000}
        />
        <ResultNode
          label="Additional review"
          sub="Skipped"
          diffLabel=""
          diffColor="rgba(255,255,255,0.3)"
          skipped
          inView={inView}
          delay={d + 1000}
        />
      </div>

      {/* Left-only line going down from left node */}
      <ConnectorSvg h={44} inView={inView} lines={[
        { type: "v", x: 25, y1: 0, y2: 44, delay: d + 1200 },
      ]} />

      {/* Final */}
      <FinalNode
        label="Migration started"
        sub="Estimated: 3 months"
        inView={inView}
        delay={d + 1400}
      />
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────────────────────── */

export function HowItWorks() {
  const { ref, inView } = useInView();

  return (
    <section
      ref={ref}
      style={{
        background: "#1B2B1F",
        padding: "100px 0",
        fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64, ...fadeUp(inView, 0) }}>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.4)",
            marginBottom: 12,
          }}>
            How it works
          </p>
          <h2 style={{
            fontSize: 36,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            marginBottom: 16,
          }}>
            Three steps to EU sovereignty
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            From discovery to full migration — we guide you through every step.
          </p>
        </div>

        {/* Diagrams */}
        <div className="hiw-diagrams">
          <LeftDiagram  inView={inView} baseDelay={0}    />
          <RightDiagram inView={inView} baseDelay={1600} />
        </div>

        {/* Stats row */}
        <div style={{
          marginTop: 40,
          textAlign: "center",
          fontSize: 13,
          color: "rgba(255,255,255,0.5)",
          ...fadeUp(inView, 3200),
        }}>
          186+ alternatives
          <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
          6 certified partners
          <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
          10 categories
        </div>

      </div>
    </section>
  );
}
