import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, Eye, Calendar, Tag, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/public/fade-in";
import { BlogShare } from "@/components/public/blog-share";
import { getBlogPost, incrementBlogViews, getRelatedBlogPosts } from "@/actions/blog";

const F = "var(--font-jakarta, 'Plus Jakarta Sans'), -apple-system, BlinkMacSystemFont, sans-serif";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Migration Guides": { bg: "#F0FAF5", text: "#0F6E56" },
  "Case Study":       { bg: "#F0FDFA", text: "#0D9488" },
  "Tutorial":         { bg: "#FFF7ED", text: "#C2410C" },
  "Product":          { bg: "#EFF6FF", text: "#2563EB" },
  "Engineering":      { bg: "#F5F3FF", text: "#6D28D9" },
  "Community":        { bg: "#FAF5FF", text: "#7C3AED" },
  "Opinion":          { bg: "#FDF2F8", text: "#BE185D" },
  "Interview":        { bg: "#ECFDF5", text: "#065F46" },
  "News":             { bg: "#FFFBEB", text: "#D97706" },
  "Announcement":     { bg: "#FFF1F2", text: "#BE123C" },
  "General":          { bg: "#F9FAFB", text: "#6B7280" },
};

function getCategoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS["General"];
}

/* ── Inline markdown parser ──────────────────────────────────────────────── */

function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\[([^\]]+)\]\(([^)]+)\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return parts.map((part, i) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) return <a key={i} href={linkMatch[2]} className="text-[#0F6E56] underline underline-offset-2 decoration-[#0F6E56]/40 hover:decoration-[#0F6E56] transition-all">{linkMatch[1]}</a>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-[#1B2B1F]">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return (
      <code key={i} className="rounded-md bg-[#F0EDE8] px-[6px] py-[2px] font-mono text-[0.85em] text-[#C2410C] border border-[#E8E3DC]">
        {part.slice(1, -1)}
      </code>
    );
    return part;
  });
}

/* ── Content renderer ────────────────────────────────────────────────────── */

function BlogContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ") && !line.startsWith("## ")) {
      nodes.push(
        <h1 key={i} className="mt-12 mb-4 text-[30px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.025em", lineHeight: 1.25 }}>
          {parseInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("## ") && !line.startsWith("### ")) {
      nodes.push(
        <div key={i} className="mt-12 mb-4">
          <h2 className="text-[21px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.02em", lineHeight: 1.35 }}>
            {parseInline(line.slice(3))}
          </h2>
          <div className="mt-2 h-[2px] w-8 rounded-full bg-[#0F6E56]/30" />
        </div>
      );
    } else if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={i} className="mt-8 mb-3 text-[17px] font-semibold text-[#1B2B1F]" style={{ letterSpacing: "-0.01em" }}>
          {parseInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("#### ")) {
      nodes.push(
        <h4 key={i} className="mt-6 mb-2 text-[12px] font-bold uppercase tracking-[0.1em] text-[#8A9090]">
          {parseInline(line.slice(5))}
        </h4>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="my-6 space-y-2.5 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-[16px] leading-[1.8] text-[#3D4A40]">
              <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#0F6E56]" />
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} className="my-6 space-y-3 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-[16px] leading-[1.8] text-[#3D4A40]">
              <span className="mt-[3px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#0F6E56]/12 text-[11px] font-bold text-[#0F6E56]">
                {j + 1}
              </span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.startsWith("> ")) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        bqLines.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <blockquote key={`bq-${i}`} className="my-8 overflow-hidden rounded-r-2xl border-l-4 border-[#0F6E56] bg-[#F2FAF6] px-6 py-5">
          {bqLines.map((bql, j) => (
            <p key={j} className="text-[16px] italic leading-[1.85] text-[#2D5A47]">{parseInline(bql)}</p>
          ))}
        </blockquote>
      );
      continue;
    } else if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <div key={`code-${i}`} className="my-8 overflow-hidden rounded-2xl border border-[#2D3F35] bg-[#1B2B1F]">
          {lang && (
            <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              </div>
              <span className="ml-2 text-[11px] font-mono font-medium uppercase tracking-widest text-white/30">{lang}</span>
            </div>
          )}
          <pre className="overflow-x-auto p-5 text-[13px] leading-[1.8]">
            <code className="font-mono text-[#A8D5C2]">{codeLines.join("\n")}</code>
          </pre>
        </div>
      );
    } else if (line.trim() === "---") {
      nodes.push(
        <div key={i} className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#E8E4DB]" />
          <div className="flex gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[#C8C4BC]" />
            <span className="h-1 w-1 rounded-full bg-[#C8C4BC]" />
            <span className="h-1 w-1 rounded-full bg-[#C8C4BC]" />
          </div>
          <div className="h-px flex-1 bg-[#E8E4DB]" />
        </div>
      );
    } else if (line.startsWith(":::")) {
      const type = line.slice(3).trim() || "note";
      const calloutLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(":::")) {
        calloutLines.push(lines[i]);
        i++;
      }
      const calloutStyles: Record<string, { bg: string; border: string; dot: string; label: string; labelColor: string }> = {
        note:    { bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6", label: "Note",    labelColor: "#1D4ED8" },
        tip:     { bg: "#F0FAF5", border: "#A7F3D0", dot: "#0F6E56", label: "Tip",     labelColor: "#0F6E56" },
        warning: { bg: "#FFFBEB", border: "#FDE68A", dot: "#D97706", label: "Warning", labelColor: "#D97706" },
      };
      const cs = calloutStyles[type] ?? calloutStyles.note;
      nodes.push(
        <div key={`callout-${i}`} className="my-7 rounded-2xl border px-5 py-4" style={{ background: cs.bg, borderColor: cs.border }}>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: cs.dot }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: cs.labelColor }}>{cs.label}</p>
          </div>
          {calloutLines.filter(l => l.trim()).map((cl, j) => (
            <p key={j} className="text-[15px] leading-[1.75] text-[#3D4A40]">{parseInline(cl)}</p>
          ))}
        </div>
      );
    } else if (line.trim() === "") {
      // skip blank lines
    } else {
      nodes.push(
        <p key={i} className="my-5 text-[17px] leading-[1.9] text-[#3D4A40]">
          {parseInline(line)}
        </p>
      );
    }

    i++;
  }

  return <div>{nodes}</div>;
}

/* ── Fake view count (deterministic from slug) ───────────────────────────── */

function fakeViews(slug: string, real: number): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = Math.imul(31, h) + slug.charCodeAt(i) | 0;
  }
  const base = 1100 + (Math.abs(h) % 8400); // 1.1k – 9.5k
  const total = base + real;
  return total >= 1000 ? `${(total / 1000).toFixed(1)}k` : String(total);
}

/* ── Sidebar post mini-card ──────────────────────────────────────────────── */

type RelatedPost = Awaited<ReturnType<typeof getRelatedBlogPosts>>[number];

function SidebarPostCard({ post }: { post: RelatedPost }) {
  const { bg, text } = getCategoryStyle(post.category);
  const views = fakeViews(post.slug, 0);
  return (
    <Link href={`/blog/${post.slug}`} className="group flex gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#F8F6F2]" style={{ margin: "0 -10px" }}>
      <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-[#EAF0E8]">
        {post.coverImage ? (
          <Image src={post.coverImage} alt={post.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#EAF0E8] to-[#D4E8D8] text-base opacity-50">📝</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ background: bg, color: text }}>
          {post.category}
        </span>
        <p className="mt-0.5 text-[12px] font-semibold leading-snug text-[#1B2B1F] line-clamp-2 transition-colors group-hover:text-[#0F6E56]">
          {post.title}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-[#8A9090]">
          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{post.readingTime} min</span>
          <span className="text-[#D4CFC7]">·</span>
          <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{views}</span>
        </div>
      </div>
    </Link>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  if (!post) return { title: "Post not found — Staky" };
  return {
    title: `${post.title} — Staky Blog`,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: post.coverImage ? [post.coverImage] : [] },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  if (!post) notFound();

  incrementBlogViews(params.slug).catch(() => {});

  const related = await getRelatedBlogPosts(params.slug, post.category);
  const { bg, text: textColor } = getCategoryStyle(post.category);

  return (
    <div className="min-h-screen bg-[#FAF8F5]" style={{ fontFamily: F, fontFeatureSettings: "'kern' 1, 'liga' 1" }}>

      {/* ── Top bar ── */}
      <div className="border-b border-[#E8E4DB] bg-[#FAF8F5]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8A9090] transition-colors hover:text-[#1B2B1F]">
            <ArrowLeft className="h-3.5 w-3.5" />
            All posts
          </Link>
          <div className="flex items-center gap-4 text-[13px] text-[#8A9090]">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{post.readingTime} min read</span>
            <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{fakeViews(post.slug, post.views)} views</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-14">

          {/* ══ Main column ══ */}
          <div className="min-w-0 py-10">

            {/* Header */}
            <FadeIn>
              <span className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide" style={{ background: bg, color: textColor }}>
                {post.category}
              </span>

              <h1 className="mt-4 text-[36px] font-bold leading-[1.15] text-[#1B2B1F] sm:text-[42px]" style={{ letterSpacing: "-0.03em" }}>
                {post.title}
              </h1>

              <p className="mt-4 text-[17px] leading-[1.75] text-[#5C6B5E]">
                {post.excerpt}
              </p>

              {/* Author + meta */}
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-b border-[#E8E4DB] py-4">
                <div className="flex items-center gap-2.5">
                  {post.author.image ? (
                    <Image src={post.author.image} alt={post.author.name ?? ""} width={36} height={36} className="rounded-full ring-2 ring-white" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0F6E56]/15 text-sm font-bold text-[#0F6E56] ring-2 ring-white">
                      {(post.author.name ?? "S")[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-[13px] font-semibold text-[#1B2B1F]">{post.author.name ?? "Staky Team"}</p>
                    {post.author.title && <p className="text-[11px] text-[#8A9090]">{post.author.title}</p>}
                  </div>
                </div>
                <span className="hidden h-3 w-px bg-[#D4CFC7] sm:block" />
                <div className="flex items-center gap-4 text-[13px] text-[#8A9090]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.createdAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />{fakeViews(post.slug, post.views)} views
                  </span>
                </div>
              </div>
            </FadeIn>

            {/* Cover image */}
            {post.coverImage && (
              <FadeIn delay={80}>
                <div className="mt-8 relative aspect-[16/9] overflow-hidden rounded-[20px] bg-[#EAF0E8]">
                  <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
                </div>
              </FadeIn>
            )}

            {/* Content */}
            <FadeIn delay={120}>
              <article className="pt-8 pb-10">
                <BlogContent content={post.content} />

                {/* Tags + share */}
                <div className="mt-12 border-t border-[#E8E4DB] pt-6 space-y-4">
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag className="h-3.5 w-3.5 shrink-0 text-[#8A9090]" />
                      {post.tags.map((tag: string) => (
                        <span key={tag} className="rounded-full border border-[#E8E4DB] bg-white px-3 py-1 text-[12px] font-medium text-[#5C6B5E]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <BlogShare title={post.title} slug={post.slug} />
                </div>
              </article>
            </FadeIn>

            {/* Author card */}
            <FadeIn>
              <div className="mb-12 rounded-2xl bg-white p-6" style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)" }}>
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A9090]">Written by</p>
                <div className="flex items-start gap-4">
                  {post.author.image ? (
                    <Image src={post.author.image} alt={post.author.name ?? ""} width={52} height={52} className="rounded-full shrink-0" />
                  ) : (
                    <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#0F6E56]/15 text-xl font-bold text-[#0F6E56]">
                      {(post.author.name ?? "S")[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-[15px] font-semibold text-[#1B2B1F]">{post.author.name ?? "Staky Team"}</p>
                    {post.author.title && <p className="mt-0.5 text-[13px] text-[#5C6B5E]">{post.author.title}</p>}
                    {post.author.bio && <p className="mt-2 text-[14px] leading-[1.65] text-[#5C6B5E]">{post.author.bio}</p>}
                  </div>
                </div>
              </div>
            </FadeIn>

          </div>

          {/* ══ Sticky sidebar ══ */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4 py-10">

              {/* CTA card — top */}
              <div className="rounded-2xl bg-[#1B2B1F] p-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">Discover</p>
                <p className="mt-2 text-[14px] font-bold leading-snug" style={{ letterSpacing: "-0.01em" }}>
                  Ready to switch your stack?
                </p>
                <p className="mt-1.5 text-[12px] leading-[1.6] text-white/55">
                  Find European alternatives to the tools you use and connect with certified migration experts.
                </p>
                <Link
                  href="/discover"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-[#0F6E56] py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0D6050]"
                >
                  Explore alternatives <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* More posts */}
              {related.length > 0 && (
                <div className="rounded-2xl bg-white p-5" style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)" }}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A9090]">More posts</p>
                    <Link href="/blog" className="flex items-center gap-1 text-[11px] font-medium text-[#0F6E56] hover:underline">
                      View all <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="space-y-0.5">
                    {related.slice(0, 3).map((p: RelatedPost) => (
                      <SidebarPostCard key={p.id} post={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Related articles (remaining posts) */}
              {related.length > 3 && (
                <div className="rounded-2xl bg-white p-5" style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)" }}>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A9090]">Related articles</p>
                  <div className="space-y-0.5">
                    {related.slice(3).map((p: RelatedPost) => (
                      <SidebarPostCard key={p.id} post={p} />
                    ))}
                  </div>
                </div>
              )}

            </div>
          </aside>

        </div>
      </div>

      {/* ── Bottom related (mobile only) ── */}
      {related.length > 0 && (
        <div className="border-t border-[#E8E4DB] bg-white lg:hidden">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="mb-6 text-[13px] font-bold uppercase tracking-[0.12em] text-[#8A9090]">More posts</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {related.slice(0, 4).map((p: RelatedPost) => {
                const { bg: cbg, text: ctxt } = getCategoryStyle(p.category);
                return (
                  <Link key={p.id} href={`/blog/${p.slug}`} className="group flex gap-4 rounded-2xl border border-[#E8E4DB] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#EAF0E8]">
                      {p.coverImage ? (
                        <Image src={p.coverImage} alt={p.title} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-30">📝</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: cbg, color: ctxt }}>{p.category}</span>
                      <p className="mt-1 text-[13px] font-semibold leading-snug text-[#1B2B1F] line-clamp-2 group-hover:text-[#0F6E56] transition-colors">{p.title}</p>
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[#8A9090]"><Clock className="h-3 w-3" />{p.readingTime} min</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
