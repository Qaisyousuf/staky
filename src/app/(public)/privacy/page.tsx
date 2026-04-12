import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Staky",
  description: "How Staky collects, uses, and protects your personal data.",
};

const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

const SECTIONS = [
  {
    title: "Who we are",
    body: `Staky is the data controller for personal data processed through this platform. We are based in Denmark and operate under EU Regulation 2016/679 (GDPR) and applicable Danish data protection law. You can reach us at privacy@staky.dk.`,
  },
  {
    title: "What data we collect",
    body: `We collect data you provide directly: name, email address, profile information, stack configurations, posts, comments, and migration requests. We also collect data automatically: IP address, browser type, pages visited, session duration, and device type. If you sign in via a third-party provider (e.g. Google), we receive the data you authorise that provider to share.`,
  },
  {
    title: "How we use your data",
    body: `We use your data to operate and improve the platform, personalise your experience, send you notifications you have opted into, match you with relevant migration partners, respond to support requests, and comply with legal obligations. We do not sell your data to third parties.`,
  },
  {
    title: "Legal basis for processing",
    body: `We process your data on the following legal bases under GDPR Art. 6: performance of a contract (operating your account), legitimate interests (platform security, fraud prevention, product improvement), consent (marketing emails, non-essential cookies), and legal obligation (tax and regulatory requirements).`,
  },
  {
    title: "Data sharing",
    body: `We share data only where necessary: with migration partners you explicitly connect with, with trusted service providers (hosting, analytics, email delivery) who are bound by data processing agreements, and with authorities when required by law. All processors are located within the EEA or subject to adequate safeguards.`,
  },
  {
    title: "Data retention",
    body: `We retain account data for as long as your account is active, plus up to 3 years after deletion for legal and audit purposes. Anonymised analytics data may be retained indefinitely. You can request deletion at any time — see "Your rights" below.`,
  },
  {
    title: "Cookies",
    body: `We use cookies for authentication, preferences, analytics, and marketing. You can manage your cookie preferences at any time via the Cookie Settings link in the footer. For full details, see our Cookie Policy.`,
  },
  {
    title: "Your rights",
    body: `Under GDPR, you have the right to access, correct, delete, or export your personal data; to restrict or object to processing; and to withdraw consent at any time. To exercise these rights, email privacy@staky.dk. You also have the right to lodge a complaint with the Danish Data Protection Authority (Datatilsynet) at datatilsynet.dk.`,
  },
  {
    title: "Security",
    body: `We use industry-standard measures to protect your data, including encrypted connections (TLS), hashed passwords, access controls, and regular security reviews. All data is stored on servers within the European Union.`,
  },
  {
    title: "Changes to this policy",
    body: `We may update this policy periodically. We will notify registered users of material changes by email or in-app notice at least 14 days before they take effect. The date at the top of this page reflects the most recent update.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5]" style={{ fontFamily: F }}>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">

        <div className="mb-12 border-b border-[#E8E3D9] pb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9BA39C]">Legal</p>
          <h1
            className="mt-3 font-bold text-[#1B2B1F]"
            style={{ fontSize: "clamp(28px, 4vw, 38px)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
          >
            Privacy Policy
          </h1>
          <p className="mt-3 text-[14px] text-[#9BA39C]">
            Last updated: April 2026 · Staky
          </p>
        </div>

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

        <div className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#E8E3D9] pt-8">
          <Link href="/terms"   className="text-[13px] font-semibold text-[#0F6E56] hover:underline">Terms of Use →</Link>
          <Link href="/cookies" className="text-[13px] font-semibold text-[#0F6E56] hover:underline">Cookie Policy →</Link>
          <Link href="/contact" className="text-[13px] font-semibold text-[#0F6E56] hover:underline">Contact us →</Link>
        </div>

      </div>
    </div>
  );
}
