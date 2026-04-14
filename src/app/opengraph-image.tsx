import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Staky — EU Stack Switcher";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0D1F16",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Background radial glow top-left */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(15,110,86,0.55) 0%, transparent 70%)",
          }}
        />
        {/* Background radial glow bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: -140,
            right: -60,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(42,95,165,0.35) 0%, transparent 70%)",
          }}
        />

        {/* Grid lines overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "52px 60px",
          }}
        >
          {/* Top row: logo + domain */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 36,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ width: 28, height: 7, borderRadius: 999, background: "rgba(255,255,255,0.3)" }} />
                <div style={{ width: 34, height: 7, borderRadius: 999, background: "rgba(255,255,255,0.55)" }} />
                <div style={{ width: 42, height: 7, borderRadius: 999, background: "#ffffff" }} />
              </div>
              <span style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                Staky
              </span>
            </div>

            {/* Domain pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.07)",
                padding: "8px 18px",
                fontSize: 18,
                fontWeight: 600,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: "0.02em",
              }}
            >
              staky.dk
            </div>
          </div>

          {/* Center: headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Label */}
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                background: "rgba(15,110,86,0.25)",
                border: "1px solid rgba(15,110,86,0.5)",
                padding: "6px 16px",
                fontSize: 14,
                fontWeight: 700,
                color: "#4ECBA0",
                letterSpacing: "0.06em",
              }}
            >
              EU STACK SWITCHER
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 68,
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: "-0.045em",
                color: "#ffffff",
                maxWidth: 820,
              }}
            >
              Switch to European software — together
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 24,
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.55)",
                maxWidth: 680,
              }}
            >
              Discover EU alternatives, share your migration story, and connect with expert partners.
            </div>
          </div>

          {/* Bottom: category pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {[
              { label: "EU Alternatives", bg: "rgba(15,110,86,0.2)", border: "rgba(15,110,86,0.45)", text: "#4ECBA0" },
              { label: "Community Stories", bg: "rgba(42,95,165,0.2)", border: "rgba(42,95,165,0.45)", text: "#7EB4FF" },
              { label: "Migration Partners", bg: "rgba(220,150,50,0.15)", border: "rgba(220,150,50,0.4)", text: "#F5C57A" },
              { label: "GDPR Compliant", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", text: "rgba(255,255,255,0.5)" },
            ].map((pill) => (
              <div
                key={pill.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 999,
                  background: pill.bg,
                  border: `1px solid ${pill.border}`,
                  padding: "10px 20px",
                  fontSize: 18,
                  fontWeight: 600,
                  color: pill.text,
                }}
              >
                {pill.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
