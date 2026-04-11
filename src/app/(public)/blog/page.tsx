import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/public/fade-in";
import { getPublishedBlogPosts, getBlogCategories } from "@/actions/blog";

const F = "var(--font-jakarta, 'Plus Jakarta Sans'), -apple-system, BlinkMacSystemFont, sans-serif";

export const metadata = {
  title: "Blog — Staky",
  description: "Guides, news, and stories about European software migration.",
};

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

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS["General"];
}

function fakeViews(slug: string, real: number): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = Math.imul(31, h) + slug.charCodeAt(i) | 0;
  }
  const base = 1100 + (Math.abs(h) % 8400);
  const total = base + real;
  return total >= 1000 ? `${(total / 1000).toFixed(1)}k` : String(total);
}

type PostSummary = Awaited<ReturnType<typeof getPublishedBlogPosts>>[number];

/* ── Category pill ───────────────────────────────────────────────────────── */

function CategoryBadge({ category, size = "sm" }: { category: string; size?: "sm" | "xs" }) {
  const { bg, text } = getCategoryStyle(category);
  return (
    <span
      className={`inline-block rounded-full font-semibold uppercase tracking-wide ${size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"}`}
      style={{ background: bg, color: text }}
    >
      {category}
    </span>
  );
}

/* ── Author avatar row ───────────────────────────────────────────────────── */

function AuthorMeta({ post }: { post: PostSummary }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-[#8A9090]">
      {post.author.image ? (
        <Image src={post.author.image} alt={post.author.name ?? ""} width={18} height={18} className="rounded-full" />
      ) : (
        <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#0F6E56]/20 text-[9px] font-bold text-[#0F6E56]">
          {(post.author.name ?? "S")[0]}
        </div>
      )}
      <span className="font-medium text-[#5C6B5E]">{post.author.name ?? "Staky Team"}</span>
      <span className="text-[#D4CFC7]">·</span>
      <span>{new Date(post.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
      <span className="text-[#D4CFC7]">·</span>
      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime} min</span>
      <span className="text-[#D4CFC7]">·</span>
      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{fakeViews(post.slug, post.views)}</span>
    </div>
  );
}

/* ── Featured post (large hero card) ────────────────────────────────────── */

function FeaturedCard({ post }: { post: PostSummary }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div
        className="relative overflow-hidden rounded-[28px] bg-white transition-all duration-300 hover:shadow-2xl"
        style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 12px 48px rgba(0,0,0,0.07)" }}
      >
        <div className="grid items-stretch lg:grid-cols-[1.15fr_0.85fr]">
          {/* Image */}
          <div className="relative min-h-[260px] overflow-hidden bg-[#EAF0E8] lg:min-h-[380px]">
            {post.coverImage ? (
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#EAF0E8] to-[#D4E8D8]">
                <div className="h-20 w-20 rounded-full bg-[#0F6E56]/10 flex items-center justify-center">
                  <span className="text-4xl">✍️</span>
                </div>
              </div>
            )}
            {/* Overlay gradient on mobile */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:hidden" />
            <div className="absolute left-5 top-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0F6E56] shadow-sm backdrop-blur-sm">
                Featured
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center gap-4 p-8 lg:p-10">
            <CategoryBadge category={post.category} />
            <div>
              <h2 className="text-[26px] font-bold leading-[1.2] text-[#1B2B1F] transition-colors group-hover:text-[#0F6E56] lg:text-[30px]" style={{ letterSpacing: "-0.025em" }}>
                {post.title}
              </h2>
              <p className="mt-3 text-[15px] leading-[1.75] text-[#5C6B5E] line-clamp-3">
                {post.excerpt}
              </p>
            </div>
            <AuthorMeta post={post} />
            <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[#0F6E56]">
              Read article <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Standard post card ──────────────────────────────────────────────────── */

function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col">
      <div
        className="flex h-full flex-col overflow-hidden rounded-[20px] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)" }}
      >
        {/* Cover */}
        <div className="relative aspect-[16/9] overflow-hidden bg-[#EAF0E8]">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#EAF0E8] to-[#D4E8D8]">
              <span className="text-4xl opacity-40">📝</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-5">
          <CategoryBadge category={post.category} size="xs" />
          <h3
            className="mt-2.5 flex-1 text-[16px] font-bold leading-snug text-[#1B2B1F] line-clamp-2 transition-colors group-hover:text-[#0F6E56]"
            style={{ letterSpacing: "-0.018em" }}
          >
            {post.title}
          </h3>
          <p className="mt-2 text-[13px] leading-[1.65] text-[#5C6B5E] line-clamp-2">
            {post.excerpt}
          </p>
          <div className="mt-4 border-t border-[#F0EDE8] pt-3.5">
            <AuthorMeta post={post} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Horizontal list card (for secondary posts) ──────────────────────────── */

function ListCard({ post }: { post: PostSummary }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex gap-4 rounded-2xl p-3 transition-colors hover:bg-white" style={{ margin: "0 -12px" }}>
      <div className="relative h-[72px] w-[104px] shrink-0 overflow-hidden rounded-xl bg-[#EAF0E8]">
        {post.coverImage ? (
          <Image src={post.coverImage} alt={post.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#EAF0E8] to-[#D4E8D8]">
            <span className="text-2xl opacity-40">📝</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <CategoryBadge category={post.category} size="xs" />
        <p className="mt-1 text-[13px] font-semibold leading-snug text-[#1B2B1F] line-clamp-2 transition-colors group-hover:text-[#0F6E56]" style={{ letterSpacing: "-0.01em" }}>
          {post.title}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#8A9090]">
          <Clock className="h-3 w-3" />{post.readingTime} min
        </div>
      </div>
    </Link>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const activeCategory = searchParams.category ?? "all";
  const [allPosts, categories] = await Promise.all([
    getPublishedBlogPosts(activeCategory === "all" ? undefined : activeCategory),
    getBlogCategories(),
  ]);

  const featured = allPosts.find((p: PostSummary) => p.featured) ?? allPosts[0] ?? null;
  const rest = featured ? allPosts.filter((p: PostSummary) => p.id !== featured.id) : allPosts;

  // Split rest into grid (first 6) + list sidebar (rest)
  const gridPosts = rest.slice(0, 6);
  const listPosts = rest.slice(6);

  return (
    <div className="min-h-screen bg-[#FAF8F5]" style={{ fontFamily: F }}>

      {/* ── Header ── */}
      <div className="border-b border-[#E8E4DB]">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0F6E56]">
              Staky Blog
            </p>
            <h1 className="text-[40px] font-bold text-[#1B2B1F] sm:text-[48px]" style={{ letterSpacing: "-0.03em", lineHeight: 1.08 }}>
              Guides, stories<br className="hidden sm:block" /> & updates
            </h1>
            <p className="mt-3 max-w-[480px] text-[15px] leading-[1.75] text-[#5C6B5E]">
              Everything you need to navigate European software migration — from practical guides to community stories.
            </p>
          </FadeIn>

          {/* Category filters */}
          {categories.length > 0 && (
            <FadeIn delay={100}>
              <div className="mt-8 flex flex-wrap gap-2">
                {["all", ...categories].map((cat) => (
                  <Link
                    key={cat}
                    href={cat === "all" ? "/blog" : `/blog?category=${encodeURIComponent(cat)}`}
                    className="rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200"
                    style={
                      activeCategory === cat
                        ? { background: "#1B2B1F", color: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
                        : { background: "white", color: "#5C6B5E", border: "1.5px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }
                    }
                  >
                    {cat === "all" ? "All posts" : cat}
                  </Link>
                ))}
              </div>
            </FadeIn>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {allPosts.length === 0 ? (
          <FadeIn>
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF0E8] text-4xl">✍️</div>
              <h2 className="text-[22px] font-bold text-[#1B2B1F]">No posts yet</h2>
              <p className="mt-2 text-[15px] text-[#5C6B5E]">
                {activeCategory === "all" ? "Check back soon — posts are on the way." : `No posts in "${activeCategory}" yet.`}
              </p>
              {activeCategory !== "all" && (
                <Link href="/blog" className="mt-5 text-[14px] font-medium text-[#0F6E56] hover:underline">
                  View all posts →
                </Link>
              )}
            </div>
          </FadeIn>
        ) : (
          <div className="space-y-16">

            {/* Featured */}
            {featured && (
              <FadeIn>
                <FeaturedCard post={featured} />
              </FadeIn>
            )}

            {/* Main grid + sidebar */}
            {rest.length > 0 && (
              <div>
                <FadeIn>
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#8A9090]">
                      {featured ? "More posts" : "All posts"}
                    </h2>
                    <span className="text-[12px] text-[#B0AAA0]">{rest.length} article{rest.length !== 1 ? "s" : ""}</span>
                  </div>
                </FadeIn>

                <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">

                  {/* Grid */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    {gridPosts.map((post: PostSummary, i: number) => (
                      <FadeIn key={post.id} delay={i * 50}>
                        <PostCard post={post} />
                      </FadeIn>
                    ))}
                  </div>

                  {/* Sidebar — extra posts as list */}
                  {listPosts.length > 0 && (
                    <aside className="mt-8 lg:mt-0">
                      <div className="rounded-2xl bg-white p-5" style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)" }}>
                        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A9090]">Also worth reading</p>
                        <div className="space-y-1">
                          {listPosts.map((post: PostSummary) => (
                            <ListCard key={post.id} post={post} />
                          ))}
                        </div>
                      </div>
                    </aside>
                  )}

                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── Newsletter strip ── */}
      <div className="border-t border-[#E8E4DB] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-[#1B2B1F] px-8 py-10 text-center sm:flex-row sm:text-left">
              <div>
                <p className="text-[18px] font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
                  Stay up to date
                </p>
                <p className="mt-1 text-[14px] leading-[1.6] text-white/60">
                  Get the latest migration guides and community stories.
                </p>
              </div>
              <Link
                href="/signup"
                className="shrink-0 rounded-xl bg-[#0F6E56] px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#0D6050]"
                style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.1) inset, 0 2px 8px rgba(15,110,86,0.4)" }}
              >
                Create free account
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>

    </div>
  );
}
