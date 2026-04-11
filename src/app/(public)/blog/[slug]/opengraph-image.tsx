import { ImageResponse } from "next/og";
import { getBlogPost } from "@/actions/blog";

export const runtime = "nodejs";
export const alt = "Staky blog post preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function fakeViews(slug: string, real: number): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = Math.imul(31, h) + slug.charCodeAt(i) | 0;
  }
  const base = 1100 + (Math.abs(h) % 8400);
  const total = base + real;
  return total >= 1000 ? `${(total / 1000).toFixed(1)}k` : String(total);
}

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1B2B1F",
            color: "#fff",
            fontSize: 42,
            fontWeight: 700,
          }}
        >
          Staky Blog
        </div>
      ),
      size
    );
  }

  const author = post.author.name ?? "Staky Team";
  const initial = author[0]?.toUpperCase() ?? "S";
  const views = fakeViews(post.slug, post.views);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#F8F5EE",
          color: "#1B2B1F",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 18%, rgba(15,110,86,0.18), transparent 26%), radial-gradient(circle at 84% 82%, rgba(200,149,108,0.18), transparent 24%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 54,
            top: 54,
            right: 54,
            bottom: 54,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: 34,
            border: "1.5px solid rgba(0,0,0,0.06)",
            background: "rgba(255,255,255,0.78)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05), 0 12px 40px rgba(0,0,0,0.08)",
            padding: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                borderRadius: 999,
                background: "#EAF3EE",
                color: "#0F6E56",
                padding: "10px 18px",
                fontSize: 20,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              {post.category}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 58,
                lineHeight: 1.04,
                letterSpacing: "-0.05em",
                fontWeight: 800,
                maxWidth: 820,
              }}
            >
              {post.title}
            </div>

            <div
              style={{
                display: "flex",
                maxWidth: 820,
                fontSize: 26,
                lineHeight: 1.55,
                color: "#5C6B5E",
              }}
            >
              {post.excerpt}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  background: "#0F6E56",
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                {initial}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>{author}</div>
                <div style={{ display: "flex", fontSize: 18, color: "#7A847B" }}>Published on Staky Blog</div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderRadius: 999,
                background: "#1B2B1F",
                color: "#fff",
                padding: "12px 18px",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              <span style={{ display: "flex" }}>Views</span>
              <span style={{ display: "flex", color: "#A6D2BC" }}>{views}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
