import Link from "next/link";

export const metadata = {
  title: "Cookie Policy — Staky",
  description: "How Staky uses cookies and how you can manage your preferences.",
};

const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

const COOKIE_TYPES = [
  {
    name: "Strictly necessary",
    basis: "Cookie Executive Order §3 — no consent required",
    retention: "Session / up to 1 year",
    examples: "Authentication token, CSRF protection, session ID",
    description: "These cookies are essential for the platform to function. They enable you to log in, navigate securely, and use core features. They cannot be disabled.",
  },
  {
    name: "Functional",
    basis: "GDPR Art. 6(1)(a) — Consent",
    retention: "Up to 12 months",
    examples: "Language preference, display settings",
    description: "These cookies remember your preferences to provide a more personalised experience across visits.",
  },
  {
    name: "Analytics & statistics",
    basis: "GDPR Art. 6(1)(a) — Consent",
    retention: "Up to 24 months",
    examples: "Page views, session duration, navigation paths",
    description: "These cookies help us understand how visitors use the platform so we can improve it. Data is anonymised and stored within the EU.",
  },
  {
    name: "Marketing",
    basis: "GDPR Art. 6(1)(a) — Consent",
    retention: "Up to 12 months",
    examples: "Campaign attribution, retargeting",
    description: "These cookies are used to measure the effectiveness of our communications and show you relevant content. We do not sell your data to advertisers.",
  },
];

const SECTIONS = [
  {
    title: "What are cookies",
    body: `Cookies are small text files placed on your device when you visit a website. They allow the site to remember your actions and preferences over time, so you don't have to re-enter them each visit. Cookies can be session-based (deleted when you close the browser) or persistent (stored for a set period).`,
  },
  {
    title: "Legal framework",
    body: `Our use of cookies is governed by EU Regulation 2016/679 (GDPR) and the Danish Cookie Executive Order (Cookiebekendtgørelsen). We obtain your consent before placing any non-essential cookies and give you the ability to withdraw that consent at any time.`,
  },
  {
    title: "Third-party cookies",
    body: `Some cookies may be set by third-party services we use, such as analytics providers or authentication services. These providers have their own privacy policies. All third-party processors we work with are contractually bound to GDPR-compliant data handling and operate within the EEA or under equivalent safeguards.`,
  },
  {
    title: "Managing your preferences",
    body: `You can update your cookie preferences at any time using the Cookie Settings link in the footer of any page. You can also control cookies through your browser settings, though disabling all cookies may affect how the platform functions. Withdrawing consent does not affect the legality of processing that occurred before withdrawal.`,
  },
  {
    title: "Contact",
    body: `If you have questions about our use of cookies, email us at privacy@staky.dk. You may also lodge a complaint with the Danish Data Protection Authority (Datatilsynet) at datatilsynet.dk.`,
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5]" style={{ fontFamily: F }}>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">

        {/* Header */}
        <div className="mb-12 border-b border-[#E8E3D9] pb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9BA39C]">Legal</p>
          <h1
            className="mt-3 font-bold text-[#1B2B1F]"
            style={{ fontSize: "clamp(28px, 4vw, 38px)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
          >
            Cookie Policy
          </h1>
          <p className="mt-3 text-[14px] text-[#9BA39C]">
            Last updated: April 2026 · Staky
          </p>
        </div>

        {/* Cookie types table */}
        <div className="mb-12">
          <h2 className="mb-4 text-[15px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.01em" }}>
            Cookie categories we use
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[#E8E3D9]">
            {COOKIE_TYPES.map(({ name, basis, retention, examples, description }, i) => (
              <div
                key={name}
                className={`px-6 py-5 ${i < COOKIE_TYPES.length - 1 ? "border-b border-[#F0EDE8]" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <p className="text-[13px] font-bold text-[#1B2B1F]">{name}</p>
                  <span className="rounded-full bg-[#F0EDE8] px-2.5 py-0.5 text-[11px] font-medium text-[#8A9090]">
                    {retention}
                  </span>
                </div>
                <p className="text-[13px] leading-[1.7] text-[#5C6B5E]">{description}</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
                  <span className="text-[11px] text-[#9BA39C]">
                    <span className="font-semibold">Basis:</span> {basis}
                  </span>
                  <span className="text-[11px] text-[#9BA39C]">
                    <span className="font-semibold">Examples:</span> {examples}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map(({ title, body }, i) => (
            <div key={title}>
              <h2 className="text-[15px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.01em" }}>
                <span className="mr-2.5 text-[#C2BDB5]">{String(i + 1).padStart(2, "0")}.</span>
                {title}
              </h2>
              <p className="mt-3 text-[14px] leading-[1.85] text-[#5C6B5E]">{body}</p>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#E8E3D9] pt-8">
          <Link href="/privacy" className="text-[13px] font-semibold text-[#0F6E56] hover:underline">Privacy Policy →</Link>
          <Link href="/terms"   className="text-[13px] font-semibold text-[#0F6E56] hover:underline">Terms of Use →</Link>
          <Link href="/contact" className="text-[13px] font-semibold text-[#0F6E56] hover:underline">Contact us →</Link>
        </div>

      </div>
    </div>
  );
}
