"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CookieConsentPayload {
  statistics: boolean;
  marketing: boolean;
}

/**
 * Save cookie consent for the currently logged-in user.
 * Called from the client banner after persisting to localStorage.
 * No-op if the user is not authenticated (anonymous visitors use localStorage only).
 */
export async function saveCookieConsent(payload: CookieConsentPayload) {
  const session = await auth();
  if (!session?.user?.id) return; // anonymous — localStorage is enough

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      cookieConsent: {
        necessary: true,
        statistics: payload.statistics,
        marketing: payload.marketing,
        savedAt: new Date().toISOString(),
      },
    },
  });
}

/**
 * Load saved cookie consent for the currently logged-in user.
 * Returns null if not authenticated or no consent saved yet.
 */
export async function getCookieConsent(): Promise<CookieConsentPayload | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cookieConsent: true },
  });

  if (!user?.cookieConsent) return null;

  const c = user.cookieConsent as Record<string, unknown>;
  return {
    statistics: Boolean(c.statistics),
    marketing: Boolean(c.marketing),
  };
}
