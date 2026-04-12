"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";

const NAV_LINKS = [
  { href: "/", label: "Home", exact: true },
  { href: "/discover", label: "Discover" },
  { href: "/feed", label: "Community" },
  { href: "/partners", label: "Partners" },
  { href: "/blog", label: "Blog" },
];

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function UserAvatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name ?? ""} className="h-7 w-7 rounded-full object-cover ring-2 ring-white shrink-0" />;
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0F6E56] text-white text-[10px] font-bold select-none shrink-0">
      {getInitials(name)}
    </span>
  );
}

function UserMenu({ name, image }: { name?: string | null; image?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-[#F0EDE6]"
      >
        <UserAvatar name={name} image={image} />
        <span className="hidden sm:block text-[13px] font-medium text-[#3a3a38] max-w-[110px] truncate leading-none">
          {name?.split(" ")[0]}
        </span>
        <ChevronDown className={cn("h-3 w-3 text-[#9a9690] transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-40 w-48 overflow-hidden rounded-2xl bg-white py-1.5"
            style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.08)" }}
          >
            <div className="border-b border-[#F0EDE6] px-4 pb-2.5 pt-1">
              <p className="text-[13px] font-semibold text-[#1B2B1F] truncate">{name}</p>
            </div>
            <div className="pt-1">
              <Link
                href="/app/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#4a4a48] hover:bg-[#F8F6F2] transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-[#9a9690]" />
                Dashboard
              </Link>
              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-red-400 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function TopNav({ userImage }: { userImage?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled
            ? "bg-white/98 backdrop-blur-md"
            : "bg-[#FAF8F5]/95 backdrop-blur-sm"
        )}
        style={{
          fontFamily: "-apple-system, 'Segoe UI', system-ui, sans-serif",
          boxShadow: scrolled
            ? "0 2px 0 rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)"
            : "0 2px 0 rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.07)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[68px] items-center justify-between gap-6">

            {/* Logo */}
            <Logo href="/" />

            {/* Desktop nav — centered */}
            <nav className="hidden md:flex items-center gap-0">
              {NAV_LINKS.map(({ href, label, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative px-4 py-2 text-[13px] tracking-[0.01em] transition-colors duration-150",
                      active
                        ? "text-[#1B2B1F] font-semibold"
                        : "text-[#7a7a76] font-normal hover:text-[#1B2B1F]"
                    )}
                  >
                    {label}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-[#0F6E56]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-2">
              {isLoggedIn ? (
                <UserMenu name={session.user.name} image={userImage} />
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-[13px] font-medium text-[#7a7a76] transition-colors hover:text-[#1B2B1F]"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center rounded-full bg-[#0F6E56] px-5 py-2 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-[#0c5e49] hover:-translate-y-px"
                    style={{ boxShadow: "0 1px 2px rgba(15,110,86,0.3), 0 4px 10px rgba(15,110,86,0.15)" }}
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl text-[#6B6860] hover:bg-[#F0EDE6] transition-colors"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className="md:hidden">
        <div
          className={cn(
            "fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setOpen(false)}
        />

        <div
          className={cn(
            "fixed right-0 top-0 z-50 flex h-full w-[min(280px,88vw)] flex-col bg-white",
            "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            open ? "translate-x-0" : "translate-x-full"
          )}
          style={{ boxShadow: "-8px 0 40px rgba(0,0,0,0.12)" }}
        >
          {/* Drawer header */}
          <div className="flex h-[68px] items-center justify-between border-b border-[#F0EDE6] px-5 shrink-0">
            <Logo href="/" />
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9a9690] hover:bg-[#F8F6F2] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col p-3">
            {NAV_LINKS.map(({ href, label, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] transition-colors",
                    active
                      ? "font-semibold text-[#1B2B1F] bg-[#F8F6F2]"
                      : "font-normal text-[#6B6860] hover:text-[#1B2B1F] hover:bg-[#F8F6F2]"
                  )}
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-[#0F6E56] shrink-0" />}
                  {!active && <span className="h-1.5 w-1.5 shrink-0" />}
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Auth — pinned to bottom */}
          <div className="mt-auto border-t border-[#F0EDE6] p-4 space-y-2">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                  <UserAvatar name={session.user.name} image={userImage} />
                  <p className="text-[13px] font-semibold text-[#1B2B1F] truncate">{session.user.name}</p>
                </div>
                <Link
                  href="/app/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium text-[#4a4a48] hover:bg-[#F8F6F2] transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-[#9a9690]" />
                  Dashboard
                </Link>
                <button
                  onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium text-red-400 hover:bg-red-50 transition-colors"
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
                  className="block w-full rounded-xl border border-[#E8E3D9] px-4 py-2.5 text-center text-[14px] font-medium text-[#4a4a48] hover:bg-[#F8F6F2] transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="block w-full rounded-xl bg-[#0F6E56] px-4 py-2.5 text-center text-[14px] font-semibold text-white hover:bg-[#0c5e49] transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
