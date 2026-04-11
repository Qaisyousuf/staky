"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";

const NAV_LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/discover", label: "Discover" },
  { href: "/feed", label: "Feed" },
  { href: "/partners", label: "Partners" },
  { href: "/blog", label: "Blog" },
];

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function LogoLink() {
  return <Logo href="/" />;
}

function UserAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  const initials = getInitials(name);
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={name ?? ""} className="h-7 w-7 rounded-full object-cover shrink-0" />
    );
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0F6E56] text-white text-xs font-bold select-none shrink-0">
      {initials}
    </span>
  );
}

function UserMenu({ name, image }: { name?: string | null; image?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F5F3EF] transition-colors"
      >
        <UserAvatar name={name} image={image} />
        <span className="hidden sm:block text-sm font-medium text-[#6B6860] max-w-[120px] truncate">
          {name}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-40 w-44 rounded-xl border border-[#E8E6E1] bg-white shadow-lg py-1 overflow-hidden">
            <Link
              href="/app/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#6B6860] hover:bg-[#F5F3EF] hover:text-[#1C1C1C] transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-[#A8A49C]" />
              Dashboard
            </Link>
            <div className="my-1 border-t border-[#E8E6E1]" />
            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TopNav({ userImage }: { userImage?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#DDD9D0] bg-[#FAF8F5]/95 backdrop-blur-md" style={{ fontFamily: "var(--font-jakarta, 'Plus Jakarta Sans'), -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-8">
            <LogoLink />

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map(({ href, label, exact }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-sm transition-colors",
                    isActive(href, exact)
                      ? "text-[#1C1C1C] font-semibold"
                      : "text-[#A8A49C] font-normal hover:text-[#1C1C1C]"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <UserMenu name={session.user.name} image={userImage} />
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-[13px] font-medium text-[#6B6860] transition-colors hover:text-[#1C1C1C]"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center rounded-[8px] bg-[#1C1C1C] px-5 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#333333] hover:-translate-y-px shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_1px_3px_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_2px_6px_rgba(0,0,0,0.22),0_8px_20px_rgba(0,0,0,0.14)]"
                  >
                    Sign up free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-[#6B6860] hover:bg-[#F5F3EF] transition-colors"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — rendered outside header so it overlays full page */}
      <div className="md:hidden">

        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={cn(
            "fixed right-0 top-0 z-50 flex h-full w-[min(300px,85vw)] flex-col bg-[#FAF8F5] shadow-2xl",
            "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Drawer header */}
          <div className="flex h-14 items-center justify-between border-b border-[#E8E6E1] px-5 shrink-0">
            <LogoLink />
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-[#A8A49C] hover:bg-[#F5F3EF] hover:text-[#1C1C1C] transition-colors"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-0.5 p-4">
            {NAV_LINKS.map(({ href, label, exact }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-lg text-[15px] transition-colors",
                  isActive(href, exact)
                    ? "text-[#1C1C1C] font-semibold bg-[#F5F3EF]"
                    : "text-[#6B6860] font-normal hover:text-[#1C1C1C] hover:bg-[#F5F3EF]"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth — pinned to bottom */}
          <div className="mt-auto border-t border-[#E8E6E1] p-4 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/app/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-[#6B6860] hover:bg-[#F5F3EF] hover:text-[#1C1C1C] transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-[#A8A49C]" />
                  Dashboard
                </Link>
                <button
                  onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 text-[15px] font-medium text-center text-[#6B6860] hover:text-[#1C1C1C] transition-colors rounded-lg hover:bg-[#F5F3EF]"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 text-[15px] font-medium text-center rounded-[8px] bg-[#1C1C1C] hover:bg-[#333333] text-white transition-colors"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
