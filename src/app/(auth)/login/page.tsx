import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in — Staky",
};

export default function LoginPage() {
  return (
    <>
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
          Staky
          <span className="text-[#0F6E56]">.</span>
        </Link>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
