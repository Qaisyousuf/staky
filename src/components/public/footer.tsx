import Link from "next/link";

const F = "var(--font-jakarta, 'Plus Jakarta Sans'), -apple-system, BlinkMacSystemFont, sans-serif";

const PRODUCT_LINKS = [
  { href: "/discover", label: "Discover alternatives" },
  { href: "/feed", label: "Migration stories" },
  { href: "/partners", label: "Find a partner" },
  { href: "/signup", label: "Create free account" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
  { href: "/careers", label: "Careers" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/cookies", label: "Cookie Policy" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#151F18]" style={{ fontFamily: F }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Main grid */}
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div>
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-[4px] bg-[#E4F0EA] px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.05em] text-[#0F6E56] select-none">
                EU
              </span>
              <span className="font-bold text-[17px] text-white tracking-tight leading-none">
                Staky<span className="text-[#0F6E56]">.</span>
              </span>
            </Link>

            <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-white/45">
              The platform for European software migration. Discover, switch, and grow — privately.
            </p>

            {/* Built in EU badge */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <span className="inline-flex items-center justify-center rounded-[3px] bg-[#EDF5F0] px-1 py-0.5 text-[9px] font-bold tracking-widest text-[#0F6E56] select-none">
                EU
              </span>
              <span className="text-[12px] font-medium text-white/50">Built and hosted in Europe</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">
              Product
            </p>
            <ul className="space-y-3.5">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[14px] text-white/50 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">
              Company
            </p>
            <ul className="space-y-3.5">
              {COMPANY_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[14px] text-white/50 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30">
              Legal
            </p>
            <ul className="space-y-3.5">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[14px] text-white/50 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.08] py-6 sm:flex-row">
          <p className="text-[13px] text-white/30">
            © {year} Staky. All rights reserved.
          </p>
          <p className="text-[13px] text-white/30">
            Made with care in Europe 🇪🇺
          </p>
        </div>
      </div>
    </footer>
  );
}
