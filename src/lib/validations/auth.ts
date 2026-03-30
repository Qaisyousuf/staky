import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
    userType: z.enum(["user", "partner"]),
    // Partner-only fields
    companyName: z.string().optional(),
    country: z.string().optional(),
    specialty: z.string().optional(),
    pricing: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.userType === "partner") {
        return !!data.companyName?.trim() && !!data.country?.trim() && !!data.specialty?.trim();
      }
      return true;
    },
    {
      message: "Company name, country, and specialty are required",
      path: ["companyName"],
    }
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
