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
  ArrowRight,
  Loader2,
} from "lucide-react";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { signupAction } from "@/actions/auth";

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

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

  const inputClass = (hasError: boolean) =>
    `w-full rounded-2xl border bg-[#fffdfa] py-3 text-sm outline-none transition-colors ${
      hasError
        ? "border-red-300 focus:border-red-400"
        : "border-[#ddd6c8] focus:border-[#0f3d2e]"
    }`;

  return (
    <div
      className="w-full rounded-[32px] border border-[#ddd4c3] bg-[linear-gradient(180deg,#fffdf8_0%,#f7f1e6_100%)] p-8 shadow-[0_20px_45px_rgba(17,24,39,0.07)] sm:p-10"
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <div className="mb-6 border-b border-[#ece2d3] pb-6">
        <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#151a16]">
          Join Staky
        </h1>
        <p className="mt-2 text-sm leading-6 text-[rgba(0,0,0,0.6)]">
          Start your journey to EU software today.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-2xl border border-red-100 bg-[#fdf1ee] px-4 py-3.5 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[#374039]">
            Full name
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
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
          {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#374039]">
            Work email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
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
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#374039]">
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
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
          {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-[#374039]">
            Confirm password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
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
          {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#0f3d2e] py-[14px] text-base font-medium text-white transition-all duration-200 ease-in-out hover:-translate-y-px hover:bg-[#14503d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[rgba(0,0,0,0.6)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[#0f3d2e] hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-[#8c9388]">
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
