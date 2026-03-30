"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations/auth";
import { signOut } from "@/lib/auth";

export type SignupState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    userType: formData.get("userType"),
    companyName: formData.get("companyName") ?? undefined,
    country: formData.get("country") ?? undefined,
    specialty: formData.get("specialty") ?? undefined,
    pricing: formData.get("pricing") ?? undefined,
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { name, email, password, userType, companyName, country, specialty, pricing } =
    parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { status: "error", message: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: userType === "partner" ? "PARTNER" : "USER",
      ...(userType === "partner" &&
        companyName &&
        country &&
        specialty && {
          partner: {
            create: {
              companyName: companyName.trim(),
              country: country.trim(),
              specialty: specialty
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              pricing: pricing?.trim() || null,
              approved: false,
            },
          },
        }),
    },
  });

  return { status: "success" };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
