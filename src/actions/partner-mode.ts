"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ApplyAsPartnerData = {
  companyName: string;
  country: string;
  cvr: string;
  specialty: string;
  description?: string;
  website?: string;
  registrationCountry?: "dk" | "fr";
};

// ─── CVR lookup (public cvrapi.dk) ────────────────────────────────────────────

export type CvrResult =
  | {
      status: "found";
      name: string;
      address: string;
      zipcode: string;
      city: string;
      fullLocation: string;    // "Street 1, 1234 Copenhagen"
      industrydesc: string | null;
      companytype: string | null;
      employees: string | null;
      email: string | null;
      phone: string | null;
      startdate: string | null;
    }
  | { status: "not_found" }
  | { status: "error" };

export async function lookupCVR(cvr: string): Promise<CvrResult> {
  const cleaned = cvr.replace(/\s/g, "");
  if (!/^\d{8}$/.test(cleaned)) return { status: "not_found" };

  try {
    const res = await fetch(
      `https://cvrapi.dk/api?vat=${cleaned}&country=dk`,
      { headers: { "User-Agent": "Staky/1.0 (staky.dk)" }, next: { revalidate: 0 } }
    );
    if (!res.ok) return { status: "not_found" };
    const d = await res.json();
    if (d.error || !d.name) return { status: "not_found" };

    const parts = [d.address, [d.zipcode, d.city].filter(Boolean).join(" ")].filter(Boolean);

    return {
      status: "found",
      name: d.name ?? "",
      address: d.address ?? "",
      zipcode: d.zipcode ?? "",
      city: d.city ?? "",
      fullLocation: parts.join(", "),
      industrydesc: d.industrydesc ?? null,
      companytype: d.companytype ?? null,
      employees: d.employees ?? null,
      email: d.email ?? null,
      phone: d.phone ?? null,
      startdate: d.startdate ?? null,
    };
  } catch {
    return { status: "error" };
  }
}

// ─── SIRET/SIREN lookup (French Government API) ───────────────────────────────

export async function lookupSIREN(number: string): Promise<CvrResult> {
  const cleaned = number.replace(/[\s\-]/g, "");
  // Accept SIREN (9 digits) or SIRET (14 digits)
  if (!/^\d{9}$/.test(cleaned) && !/^\d{14}$/.test(cleaned)) {
    return { status: "not_found" };
  }

  try {
    const res = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${cleaned}&per_page=1`,
      { headers: { "User-Agent": "Staky/1.0 (staky.dk)" }, next: { revalidate: 0 } }
    );
    if (!res.ok) return { status: "not_found" };
    const d = await res.json();

    // No results at all — SIREN/SIRET not in registry
    if (!d.total_results || d.total_results === 0 || !d.results?.[0]) {
      return { status: "not_found" };
    }

    const result = d.results[0];

    // NON-DIFFUSIBLE: company is registered but has opted out of public data disclosure
    // (common for auto-entrepreneurs). SIREN is verified — return found with empty fields
    // so the user fills in their own company details.
    const isNonDiffusible =
      !result.nom_complet ||
      result.nom_complet.includes("NON-DIFFUSIBLE") ||
      result.statut_diffusion === "P";

    if (isNonDiffusible) {
      return {
        status: "found",
        name: "",          // user fills manually
        address: "",
        zipcode: "",
        city: "",
        fullLocation: "",
        industrydesc: null,
        companytype: null,
        employees: null,
        email: null,
        phone: null,
        startdate: null,
      };
    }

    const siege = result.siege ?? {};
    const city = (siege.libelle_commune ?? siege.commune ?? "").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
    const zipcode = siege.code_postal ?? "";
    const address = siege.adresse ?? "";
    const parts = [address, [zipcode, city].filter(Boolean).join(" ")].filter(Boolean);

    return {
      status: "found",
      name: result.nom_complet,
      address,
      zipcode,
      city,
      fullLocation: parts.join(", "),
      industrydesc: result.libelle_activite_principale ?? null,
      companytype: result.nature_juridique ?? null,
      employees: result.tranche_effectif_salarie ?? null,
      email: null,
      phone: null,
      startdate: result.date_creation ?? null,
    };
  } catch {
    return { status: "error" };
  }
}

export type PartnerModeState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function applyAsPartner(data: ApplyAsPartnerData): Promise<PartnerModeState> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  const specialtyList = data.specialty
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const cvrCleaned = data.cvr.replace(/[\s\-]/g, "");
  const regCountry = data.registrationCountry ?? "dk";

  if (!data.companyName.trim() || !data.country.trim() || specialtyList.length === 0) {
    return { status: "error", message: "Company name, country, and specialty are required" };
  }

  if (regCountry === "dk") {
    if (!/^\d{8}$/.test(cvrCleaned)) {
      return { status: "error", message: "Danish CVR number must be exactly 8 digits" };
    }
    const cvrResult = await lookupCVR(cvrCleaned);
    if (cvrResult.status === "not_found") {
      return { status: "error", message: "CVR number not found in the Danish Business Register. Please check and try again." };
    }
    if (cvrResult.status === "error") {
      return { status: "error", message: "Could not reach the CVR registry right now. Please try again in a moment." };
    }
  } else {
    // France: SIREN (9 digits) or SIRET (14 digits)
    if (!/^\d{9}$/.test(cvrCleaned) && !/^\d{14}$/.test(cvrCleaned)) {
      return { status: "error", message: "French SIREN must be 9 digits, or SIRET must be 14 digits" };
    }
    const sirenResult = await lookupSIREN(cvrCleaned);
    if (sirenResult.status === "not_found") {
      return { status: "error", message: "Business number not found in the French Business Register (SIRENE). Please check and try again." };
    }
    if (sirenResult.status === "error") {
      return { status: "error", message: "Could not reach the French business registry right now. Please try again in a moment." };
    }
  }

  // CVR is valid — auto-approve
  await prisma.partner.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      companyName: data.companyName.trim(),
      country: data.country.trim(),
      cvr: cvrCleaned,
      specialty: specialtyList,
      services: [],
      certifications: [],
      description: data.description?.trim() || null,
      website: data.website?.trim() || null,
      approved: true,
    },
    update: {
      companyName: data.companyName.trim(),
      country: data.country.trim(),
      cvr: cvrCleaned,
      specialty: specialtyList,
      description: data.description?.trim() || null,
      website: data.website?.trim() || null,
      approved: true,
    },
  });

  // Upgrade user role to PARTNER — but never downgrade an existing ADMIN
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "PARTNER" },
    });
  }

  const { createNotification } = await import("@/lib/notifications");

  // Use first admin as sender so notification shows "Admin approved your application"
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  const firstAdminId = admins[0]?.id ?? null;

  // Notify the user — from admin (always in personal/user inbox)
  await createNotification({
    recipientId: session.user.id,
    recipientMode: "user",
    senderId: firstAdminId,
    type: "PARTNER_APPROVED",
  });

  // Notify all admins (FYI — always in personal/user inbox)
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        recipientId: admin.id,
        recipientMode: "user",
        senderId: session.user.id,
        type: "PARTNER_APPLICATION",
      })
    )
  );

  revalidatePath("/app/settings");
  return { status: "success" };
}

export async function updatePartnerLogo(logoBase64: string): Promise<PartnerModeState> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  await prisma.partner.update({
    where: { userId: session.user.id },
    data: { logoUrl: logoBase64 },
  });

  revalidatePath("/app/settings");
  revalidatePath("/app/dashboard");
  return { status: "success" };
}

export async function setActiveMode(mode: "user" | "partner"): Promise<PartnerModeState> {
  const session = await auth();
  if (!session?.user?.id) return { status: "error", message: "Not authenticated" };

  if (mode === "partner") {
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: { approved: true },
    });
    if (!partner?.approved) {
      return { status: "error", message: "Partner account not approved" };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeMode: mode },
  });

  revalidatePath("/app", "layout");
  return { status: "success" };
}
