"use client";

import { useEffect } from "react";

interface Props {
  targetPostId?: string;
  targetCommentId?: string;
}

export function FeedScrollHandler({ targetPostId, targetCommentId }: Props) {
  useEffect(() => {
    // Prefer scrolling to the specific comment; fall back to the post
    const elementId = targetCommentId
      ? `comment-${targetCommentId}`
      : targetPostId
      ? `post-${targetPostId}`
      : null;

    if (!elementId) return;

    let attempts = 0;
    const maxAttempts = 20; // poll for up to ~4 seconds (comments may load async)

    function tryScroll() {
      const el = document.getElementById(elementId!);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight-flash");
        const cleanup = setTimeout(() => el.classList.remove("highlight-flash"), 2100);
        return () => clearTimeout(cleanup);
      }
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryScroll, 200);
      }
    }

    // Small initial delay so the page finishes painting
    const t = setTimeout(tryScroll, 250);
    return () => clearTimeout(t);
  }, [targetPostId, targetCommentId]);

  return null;
}
