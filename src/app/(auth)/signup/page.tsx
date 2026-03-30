import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Create account — Staky",
};

export default function SignupPage() {
  return (
    <>
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
          Staky
          <span className="text-[#0F6E56]">.</span>
        </Link>
      </div>

      <SignupForm />
    </>
  );
}
