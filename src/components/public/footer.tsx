import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-5 w-7 rounded bg-[#003399] text-[#FFCC00] text-[9px] font-bold tracking-widest select-none">
              EU
            </span>
            <span className="font-bold text-[15px] text-gray-900 tracking-tight leading-none">
              Staky<span className="text-[#0F6E56]">.</span>
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            {FOOTER_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-xs text-gray-400 shrink-0">
            © {year} Staky
          </p>
        </div>
      </div>
    </footer>
  );
}
