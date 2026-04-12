const HASHTAG_REGEX = /(^|[\s.,!?;:()[\]{}])#([a-z0-9][a-z0-9_-]{0,49})\b/gi;

export const MAX_POST_HASHTAGS = 5;
export const MAX_POST_IMAGE_COUNT = 4;
export const MAX_POST_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_POST_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export interface ParsedPostContent {
  text: string;
  hashtags: string[];
}

export function sanitizePostText(input: string) {
  return input.replace(/\0/g, "").trim();
}

export function parseHashtags(input: string) {
  const matches = Array.from(input.matchAll(HASHTAG_REGEX));
  const tags: string[] = [];

  for (const match of matches) {
    const tag = match[2]?.toLowerCase();
    if (!tag || tags.includes(tag)) continue;
    tags.push(tag);
    if (tags.length >= MAX_POST_HASHTAGS) break;
  }

  return tags;
}

export function stripHashtagsFromText(input: string) {
  const withoutTags = input.replace(HASHTAG_REGEX, (_match, prefix) => prefix || " ");
  return withoutTags
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function splitPostContent(input: string, storedTags: string[] = []): ParsedPostContent {
  const text = sanitizePostText(stripHashtagsFromText(input));
  const parsedTags = parseHashtags(input);
  const hashtags = Array.from(
    new Set([...parsedTags, ...storedTags.map((tag) => tag.toLowerCase())])
  ).slice(
    0,
    MAX_POST_HASHTAGS
  );

  return { text, hashtags };
}

export function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(url.protocol)) return null;

  url.hash = "";
  return url.toString();
}

export function getUrlDomain(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return "";
  }
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function extractMetaTag(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }

  return null;
}

function extractTitle(html: string) {
  const ogTitle = extractMetaTag(html, "og:title");
  if (ogTitle) return ogTitle;

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch?.[1] ? stripHtml(titleMatch[1]) : null;
}

export async function fetchLinkMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "StakyBot/1.0 (+https://staky.local)",
      },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/html")) {
      return null;
    }

    const html = await response.text();
    const title = extractTitle(html);
    const description =
      extractMetaTag(html, "og:description") ||
      extractMetaTag(html, "description");
    const image = extractMetaTag(html, "og:image");
    const canonicalUrl = extractMetaTag(html, "og:url") || url;

    return {
      title: title || null,
      description: description || null,
      image: image || null,
      domain: getUrlDomain(canonicalUrl),
    };
  } catch {
    return null;
  }
}

export function validatePostInput({
  story,
  imageCount,
  linkUrl,
  fromTool,
  toTool,
}: {
  story: string;
  imageCount: number;
  linkUrl: string | null;
  fromTool: string;
  toTool: string;
}) {
  if (fromTool && toTool && fromTool === toTool) throw new Error("From and To tools must be different.");

  const cleanStory = sanitizePostText(story);
  const hashtags = parseHashtags(cleanStory);

  if (!cleanStory && imageCount === 0 && !linkUrl) {
    throw new Error("Add text, an image, or a link before posting.");
  }

  if (parseHashtags(cleanStory).length > MAX_POST_HASHTAGS) {
    throw new Error(`Use up to ${MAX_POST_HASHTAGS} hashtags.`);
  }

  return {
    story: cleanStory,
    hashtags,
  };
}
