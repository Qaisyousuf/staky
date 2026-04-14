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
          background: "#F8F5EE",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Background gradients */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 12% 20%, rgba(15,110,86,0.22), transparent 35%), radial-gradient(circle at 88% 78%, rgba(42,95,165,0.14), transparent 30%)",
          }}
        />

        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Main card */}
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 60,
            right: 60,
            bottom: 60,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: 32,
            border: "1.5px solid rgba(0,0,0,0.07)",
            background: "rgba(255,255,255,0.82)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.08)",
            padding: "48px 52px",
          }}
        >
          {/* Top: logo + tagline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Logo pill */}
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                alignItems: "center",
                gap: 12,
                borderRadius: 999,
                background: "#0F6E56",
                padding: "10px 22px",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                S
              </div>
              <span style={{ display: "flex", fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                Staky
              </span>
            </div>

            {/* Headline */}
            <div
              style={{
                display: "flex",
                fontSize: 62,
                fontWeight: 800,
                lineHeight: 1.06,
                letterSpacing: "-0.04em",
                color: "#1B2B1F",
                maxWidth: 780,
              }}
            >
              Switch to European software — together
            </div>

            {/* Sub */}
            <div
              style={{
                display: "flex",
                fontSize: 26,
                lineHeight: 1.5,
                color: "#5C6B5E",
                maxWidth: 700,
              }}
            >
              Discover EU alternatives to US tools, share your migration story, and connect with expert partners.
            </div>
          </div>

          {/* Bottom: stat pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {[
              { label: "EU Alternatives", color: "#EAF3EE", text: "#0F6E56" },
              { label: "Community Stories", color: "#EBF0F9", text: "#2A5FA5" },
              { label: "Migration Partners", color: "#FFF7ED", text: "#C2410C" },
            ].map((pill) => (
              <div
                key={pill.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 999,
                  background: pill.color,
                  padding: "10px 20px",
                  fontSize: 20,
                  fontWeight: 700,
                  color: pill.text,
                }}
              >
                {pill.label}
              </div>
            ))}

            <div style={{ flex: 1 }} />

            {/* Domain */}
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                color: "#9BA39C",
                letterSpacing: "0.01em",
              }}
            >
              staky.dk
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
