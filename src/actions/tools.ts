"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Guards ───────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ToolSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1),
  logoUrl: z.string().url().optional().or(z.literal("")),
  origin: z.enum(["us", "eu"]),
  country: z.string().max(2).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  abbr: z.string().min(1).max(2),
  category: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  published: z.boolean(),
});

const AlternativeSchema = z.object({
  fromToolId: z.string().min(1),
  toToolId: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  license: z.string().optional().or(z.literal("")),
  published: z.boolean(),
});

// ─── Tool actions ─────────────────────────────────────────────────────────────

export async function createTool(data: unknown) {
  await requireAdmin();
  const parsed = ToolSchema.parse(data);
  const tool = await prisma.softwareTool.create({
    data: {
      ...parsed,
      logoUrl: parsed.logoUrl || null,
      country: parsed.country || null,
      category: parsed.category || null,
      description: parsed.description || null,
      website: parsed.website || null,
    },
  });
  revalidatePath("/app/admin");
  return tool;
}

export async function updateTool(id: string, data: unknown) {
  await requireAdmin();
  const parsed = ToolSchema.parse(data);
  const tool = await prisma.softwareTool.update({
    where: { id },
    data: {
      ...parsed,
      logoUrl: parsed.logoUrl || null,
      country: parsed.country || null,
      category: parsed.category || null,
      description: parsed.description || null,
      website: parsed.website || null,
    },
  });
  revalidatePath("/app/admin");
  return tool;
}

export async function deleteTool(id: string) {
  await requireAdmin();
  await prisma.softwareTool.delete({ where: { id } });
  revalidatePath("/app/admin");
}

// ─── Alternative actions ──────────────────────────────────────────────────────

export async function createAlternative(data: unknown) {
  await requireAdmin();
  const parsed = AlternativeSchema.parse(data);

  const [fromTool, toTool] = await Promise.all([
    prisma.softwareTool.findUnique({ where: { id: parsed.fromToolId }, select: { origin: true } }),
    prisma.softwareTool.findUnique({ where: { id: parsed.toToolId }, select: { origin: true } }),
  ]);
  if (fromTool?.origin !== "us") throw new Error("From tool must be a US tool");
  if (toTool?.origin !== "eu") throw new Error("To tool must be an EU tool");

  const alt = await prisma.softwareAlternative.create({
    data: {
      fromToolId: parsed.fromToolId,
      toToolId: parsed.toToolId,
      category: parsed.category,
      description: parsed.description || null,
      license: parsed.license || null,
      published: parsed.published,
    },
  });
  revalidatePath("/app/admin");
  return alt;
}

export async function updateAlternative(id: string, data: unknown) {
  await requireAdmin();
  const parsed = AlternativeSchema.parse(data);
  const alt = await prisma.softwareAlternative.update({
    where: { id },
    data: {
      fromToolId: parsed.fromToolId,
      toToolId: parsed.toToolId,
      category: parsed.category,
      description: parsed.description || null,
      license: parsed.license || null,
      published: parsed.published,
    },
  });
  revalidatePath("/app/admin");
  return alt;
}

export async function deleteAlternative(id: string) {
  await requireAdmin();
  await prisma.softwareAlternative.delete({ where: { id } });
  revalidatePath("/app/admin");
}

// ─── Admin fetch actions ──────────────────────────────────────────────────────

export async function adminGetTools() {
  await requireAdmin();
  return prisma.softwareTool.findMany({
    orderBy: { name: "asc" },
  });
}

export async function adminGetAlternatives() {
  await requireAdmin();
  return prisma.softwareAlternative.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      fromTool: true,
      toTool: true,
    },
  });
}

// ─── Website metadata fetcher ─────────────────────────────────────────────────

export async function fetchToolMeta(rawUrl: string) {
  await requireAdmin();

  const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Staky/1.0; +https://staky.dk)" },
      redirect: "follow",
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    // Always derive name/slug/website from the ORIGINAL URL, not the redirected one.
    // This prevents e.g. drive.google.com → redirect to accounts.google.com → wrong name.
    const originalBase = new URL(url);
    const resolveBase = new URL(res.url || url); // used only for resolving relative icon paths

    // Extract a meta tag content by property or name attribute
    const getMeta = (prop: string): string | null => {
      const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return m[1].trim();
      }
      return null;
    };

    // Name: always from the original domain (e.g. "drive.google.com" → "Drive")
    const domainRoot = originalBase.hostname.replace(/^www\./, "").split(".")[0];
    const name = domainRoot.charAt(0).toUpperCase() + domainRoot.slice(1);

    const description = getMeta("og:description") || getMeta("description") || "";

    // Logo: prefer apple-touch-icon (high-res square) → PNG icon → og:image → favicon.ico
    let logoUrl: string | null = null;
    const iconSelectors = [
      /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*>/i,
      /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+\.png)["'][^>]*>/i,
      /<link[^>]+href=["']([^"']+\.png)["'][^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/i,
    ];
    for (const pattern of iconSelectors) {
      const m = html.match(pattern);
      if (m?.[1]) {
        try { logoUrl = new URL(m[1], resolveBase.origin).href; } catch { /* skip invalid */ }
        break;
      }
    }
    if (!logoUrl) {
      const ogImg = getMeta("og:image");
      if (ogImg) {
        try { logoUrl = ogImg.startsWith("http") ? ogImg : new URL(ogImg, resolveBase.origin).href; } catch { /* skip */ }
      }
    }
    if (!logoUrl) {
      logoUrl = `${originalBase.origin}/favicon.ico`;
    }

    // Slug and website: always from original URL
    const slug = originalBase.hostname
      .replace(/^www\./, "")
      .split(".")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");

    // Abbr: initials from name words, max 2 chars
    const words = name.trim().split(/\s+/);
    const abbr =
      words.length > 1
        ? words.slice(0, 2).map((w) => w[0]).join("").toUpperCase()
        : name.slice(0, 2).toUpperCase();

    return { name, slug, description, logoUrl, website: originalBase.origin, abbr };
  } catch (err) {
    clearTimeout(timer);
    throw new Error(
      `Could not fetch "${url}": ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}

// ─── Public fetch actions (no auth) ──────────────────────────────────────────

export async function getPublishedTools() {
  return prisma.softwareTool.findMany({
    where: { published: true },
    orderBy: { name: "asc" },
  });
}

export async function getPublishedAlternatives() {
  return prisma.softwareAlternative.findMany({
    where: { published: true },
    orderBy: { switcherCount: "desc" },
    include: {
      fromTool: true,
      toTool: true,
    },
  });
}
