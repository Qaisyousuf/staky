"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  Globe,
  Tag,
  DollarSign,
  ArrowRight,
  Loader2,
  Zap,
  Handshake,
} from "lucide-react";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { signupAction } from "@/actions/auth";

type UserType = "user" | "partner";

export function SignupForm() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { userType: "user" },
  });

  const handleTypeChange = (type: UserType) => {
    setUserType(type);
    setValue("userType", type, { shouldValidate: false });
  };

  const onSubmit = async (data: SignupInput) => {
    setIsPending(true);
    setServerError(null);
    try {
      const fd = new FormData();
      (Object.entries(data) as [string, unknown][]).forEach(([k, v]) => {
        if (v != null) fd.set(k, String(v));
      });
      const result = await signupAction({ status: "idle" }, fd);
      if (result.status === "error") {
        setServerError(result.message);
      } else {
        router.push("/login?registered=1");
      }
    } finally {
      setIsPending(false);
    }
  };

  const isPartner = userType === "partner";
  const accentColor = isPartner ? "#2A5FA5" : "#0F6E56";
  const accentHover = isPartner ? "#244d8a" : "#0d5f4a";
  const focusBorder = isPartner ? "focus:border-[#2A5FA5]" : "focus:border-[#0F6E56]";

  const inputClass = (hasError: boolean) =>
    `w-full py-2.5 text-sm rounded-lg border bg-white outline-none transition-colors ${
      hasError
        ? "border-red-300 focus:border-red-400"
        : `border-gray-200 ${focusBorder}`
    }`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Join Staky
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Start your journey to EU software today.
        </p>
      </div>

      {/* User type toggle */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">I am…</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange("user")}
            className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all ${
              userType === "user"
                ? "border-[#0F6E56] bg-green-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                userType === "user" ? "bg-[#0F6E56] text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              <Zap className="h-4 w-4" />
            </span>
            <span
              className={`text-sm font-medium ${
                userType === "user" ? "text-[#0F6E56]" : "text-gray-700"
              }`}
            >
              Looking to switch
            </span>
            <span className="text-xs text-gray-400 leading-snug">
              Find EU alternatives and share your experience
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange("partner")}
            className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all ${
              userType === "partner"
                ? "border-[#2A5FA5] bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                userType === "partner" ? "bg-[#2A5FA5] text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              <Handshake className="h-4 w-4" />
            </span>
            <span
              className={`text-sm font-medium ${
                userType === "partner" ? "text-[#2A5FA5]" : "text-gray-700"
              }`}
            >
              Migration partner
            </span>
            <span className="text-xs text-gray-400 leading-snug">
              Help businesses migrate and manage leads
            </span>
          </button>
        </div>

        {isPartner && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#2A5FA5] bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2A5FA5] shrink-0" />
            Partner accounts are reviewed by our team before activation.
          </p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("userType")} value={userType} />

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Full name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-gray-400" />
            </span>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              {...register("name")}
              className={`${inputClass(!!errors.name)} pl-10 pr-4`}
            />
          </div>
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Work email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400" />
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...register("email")}
              className={`${inputClass(!!errors.email)} pl-10 pr-4`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 chars, uppercase + number"
              {...register("password")}
              className={`${inputClass(!!errors.password)} pl-10 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </span>
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              className={`${inputClass(!!errors.confirmPassword)} pl-10 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Partner fields */}
        {isPartner && (
          <div className="space-y-4 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-[#2A5FA5] uppercase tracking-wide">
              Company details
            </p>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Company name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  id="companyName"
                  type="text"
                  placeholder="Acme GmbH"
                  {...register("companyName")}
                  className={`${inputClass(!!errors.companyName)} pl-10 pr-4`}
                />
              </div>
              {errors.companyName && (
                <p className="mt-1.5 text-xs text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1.5">
                Country
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  id="country"
                  type="text"
                  placeholder="Germany"
                  {...register("country")}
                  className={`${inputClass(!!errors.country)} pl-10 pr-4`}
                />
              </div>
              {errors.country && (
                <p className="mt-1.5 text-xs text-red-600">{errors.country.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1.5">
                Specialty{" "}
                <span className="font-normal text-gray-400">(comma-separated)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Tag className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  id="specialty"
                  type="text"
                  placeholder="Nextcloud, self-hosting, GDPR compliance"
                  {...register("specialty")}
                  className={`${inputClass(!!errors.specialty)} pl-10 pr-4`}
                />
              </div>
              {errors.specialty && (
                <p className="mt-1.5 text-xs text-red-600">{errors.specialty.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="pricing" className="block text-sm font-medium text-gray-700 mb-1.5">
                Pricing{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  id="pricing"
                  type="text"
                  placeholder="From €150/hour · Project-based"
                  {...register("pricing")}
                  className={`${inputClass(false)} pl-10 pr-4`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          style={{ backgroundColor: accentColor }}
          className="w-full flex items-center justify-center gap-2 rounded-lg text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          onMouseOver={(e) => {
            if (!isPending)
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = accentHover;
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = accentColor;
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {isPending
            ? "Creating account…"
            : isPartner
            ? "Submit for review"
            : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-[#0F6E56] font-medium hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-gray-400">
        By signing up you agree to our{" "}
        <Link href="/terms" className="hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
