"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function BlogShare({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  const href = typeof window !== "undefined" ? window.location.href : `/blog/${slug}`;
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/blog/${slug}`
    : `/blog/${slug}`;

  function copy() {
    navigator.clipboard.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8A9090]">Share</span>
      <div className="flex items-center gap-1.5">

        {/* X / Twitter */}
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on X"
          className="group flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E4DB] bg-white transition-all hover:border-[#1B2B1F] hover:bg-[#1B2B1F]"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-[#5C6B5E] transition-colors group-hover:fill-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* LinkedIn */}
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on LinkedIn"
          className="group flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E4DB] bg-white transition-all hover:border-[#0A66C2] hover:bg-[#0A66C2]"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-[#5C6B5E] transition-colors group-hover:fill-white">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>

        {/* Copy link */}
        <button
          onClick={copy}
          title="Copy link"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E8E4DB] bg-white px-3 text-[12px] font-medium text-[#5C6B5E] transition-all hover:border-[#0F6E56] hover:text-[#0F6E56]"
        >
          {copied ? (
            <><Check className="h-3.5 w-3.5 text-[#0F6E56]" /><span className="text-[#0F6E56]">Copied!</span></>
          ) : (
            <><Link2 className="h-3.5 w-3.5" />Copy link</>
          )}
        </button>

      </div>
    </div>
  );
}
