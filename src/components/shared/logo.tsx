import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoVariant = "dark" | "white";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  iconOnly?: boolean;
  href?: string;
  className?: string;
}

const SIZE_CONFIG: Record<LogoSize, { icon: number; textClass: string; gap: string }> = {
  sm: { icon: 18, textClass: "text-[14px]", gap: "gap-1.5" },
  md: { icon: 22, textClass: "text-[17px]", gap: "gap-2" },
  lg: { icon: 28, textClass: "text-[22px]", gap: "gap-2.5" },
};

function LogoMark({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="6" rx="3" fill="currentColor" opacity="0.28" />
      <rect x="7" y="13" width="20" height="6" rx="3" fill="currentColor" opacity="0.64" />
      <rect x="12" y="22" width="20" height="6" rx="3" fill="currentColor" />
    </svg>
  );
}

export function Logo({ variant = "dark", size = "md", iconOnly = false, href, className }: LogoProps) {
  const config = SIZE_CONFIG[size];
  const isDark = variant === "dark";

  const content = (
    <span className={cn("inline-flex items-center shrink-0", config.gap, className)}>
      <LogoMark
        size={config.icon}
        className={isDark ? "text-[#0F6E56]" : "text-white"}
      />
      {!iconOnly && (
        <span
          className={cn(
            "font-bold tracking-tight leading-none select-none",
            config.textClass,
            isDark ? "text-gray-900" : "text-white"
          )}
        >
          Staky
          <span className={isDark ? "text-[#0F6E56]" : "text-[#4ade80]"}>.</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
