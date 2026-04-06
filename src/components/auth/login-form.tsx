"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Invalid email or password");
      return;
    }

    router.push("/mode-select");
    router.refresh();
  };

  return (
    <div
      className="w-full rounded-[32px] border border-[#ddd4c3] bg-[linear-gradient(180deg,#fffdf8_0%,#f7f1e6_100%)] p-8 shadow-[0_20px_45px_rgba(17,24,39,0.07)] sm:p-10"
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <div className="mb-8 border-b border-[#ece2d3] pb-6">
        <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#151a16]">
          Sign in to Staky
        </h1>
        <p className="mt-2 text-sm leading-6 text-[rgba(0,0,0,0.6)]">
          Welcome back — let&apos;s continue your switch to European software.
        </p>
      </div>

      {registered && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#d9e5dc] bg-[#f1f6f1] px-4 py-3.5 text-sm text-[#0f3d2e]">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500">
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Account created — sign in to get started.
        </div>
      )}

      {serverError && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-[#fdf1ee] px-4 py-3.5 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#374039]">
            Email
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
              className={`w-full rounded-2xl border bg-[#fffdfa] py-3.5 pl-10 pr-4 text-sm outline-none transition-colors ${
                errors.email
                  ? "border-red-300 focus:border-red-400"
                  : "border-[#ddd6c8] focus:border-[#0f3d2e]"
              }`}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-[#374039]">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-[#0f3d2e] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Lock className="h-4 w-4 text-gray-400" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className={`w-full rounded-2xl border bg-[#fffdfa] py-3.5 pl-10 pr-10 text-sm outline-none transition-colors ${
                errors.password
                  ? "border-red-300 focus:border-red-400"
                  : "border-[#ddd6c8] focus:border-[#0f3d2e]"
              }`}
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0f3d2e] py-[14px] text-base font-medium text-white transition-all duration-200 ease-in-out hover:-translate-y-px hover:bg-[#14503d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[rgba(0,0,0,0.6)]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-[#0f3d2e] hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
