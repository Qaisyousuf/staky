import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { PostActions } from "../admin-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Post = {
  id: string;
  fromTool: string;
  toTool: string;
  story: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null; role: string };
  _count: { likes: number; recommendations: number; comments: number };
};

type Filter = "all" | "published" | "unpublished" | "featured";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",         label: "All" },
  { id: "published",   label: "Published" },
  { id: "unpublished", label: "Unpublished" },
  { id: "featured",    label: "Featured" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function PostsTab({
  posts,
  currentFilter,
}: {
  posts: Post[];
  currentFilter: Filter;
}) {
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={`/app/admin?tab=posts${f.id !== "all" ? `&filter=${f.id}` : ""}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentFilter === f.id
                ? "bg-[#0F6E56] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <span className="ml-auto text-xs text-gray-400">{posts.length} post{posts.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {posts.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">No posts found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span>Author</span>
              <span>Post</span>
              <span>Engagement</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {posts.map((post) => (
              <div key={post.id} className="px-5 py-4 hover:bg-gray-50 flex flex-col lg:grid lg:grid-cols-[auto_1fr_auto_auto_auto] gap-3 lg:gap-4 lg:items-center">
                {/* Author */}
                <div className="flex items-center gap-2 shrink-0">
                  {post.author.image ? (
                    <Image src={post.author.image} alt="" width={32} height={32} className="rounded-full" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                      {post.author.name?.[0] ?? "?"}
                    </div>
                  )}
                  <span className="text-xs text-gray-700 font-medium max-w-[80px] truncate">{post.author.name ?? "Unknown"}</span>
                </div>

                {/* Post info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900">{post.fromTool} → {post.toTool}</span>
                    {post.featured && (
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{post.story}</p>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Engagement */}
                <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                  <span>{post._count.likes} likes</span>
                  <span>{post._count.comments} comments</span>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    post.published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(post.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  <PostActions postId={post.id} published={post.published} featured={post.featured} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
