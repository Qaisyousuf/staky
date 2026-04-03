import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/discover", label: "Discover alternatives" },
  { href: "/feed", label: "Migration stories" },
  { href: "/partners", label: "Find a partner" },
  { href: "/signup", label: "Create free account" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/cookies", label: "Cookie Policy" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Main row */}
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="inline-flex h-5 w-7 items-center justify-center rounded bg-[#003399] text-[#FFCC00] text-[9px] font-black tracking-widest select-none">
                EU
              </span>
              <span className="font-bold text-[17px] text-gray-900 tracking-tight leading-none">
                Staky<span className="text-[#0F6E56]">.</span>
              </span>
            </Link>
            <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-gray-400">
              The platform for European software migration. Discover, switch, and grow — privately.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
              Product
            </p>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-500 transition-colors hover:text-gray-900">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
              Company
            </p>
            <ul className="space-y-3">
              {COMPANY_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-500 transition-colors hover:text-gray-900">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
              Legal
            </p>
            <ul className="space-y-3">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-500 transition-colors hover:text-gray-900">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 py-6 sm:flex-row">
          <p className="text-xs text-gray-400">
            © {year} Staky. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-4 w-[22px] items-center justify-center rounded-[3px] bg-[#003399] text-[7px] font-black tracking-widest text-[#FFCC00] select-none">
              EU
            </span>
            <span className="text-xs text-gray-400">Built and hosted in Europe</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
