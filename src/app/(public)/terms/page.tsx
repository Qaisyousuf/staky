import Link from "next/link";

export const metadata = {
  title: "Terms of Use — Staky",
  description: "Terms and conditions for using the Staky platform.",
};

const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

const SECTIONS = [
  {
    title: "Acceptance of terms",
    body: `By accessing or using Staky ("the Platform"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Platform. These terms apply to all visitors, registered users, and migration partners.`,
  },
  {
    title: "Who we are",
    body: `Staky is operated by Staky ApS, a company registered in Denmark (Copenhagen). We help European businesses discover alternatives to US software and connect with migration partners. All data is processed within the European Economic Area.`,
  },
  {
    title: "Your account",
    body: `You are responsible for maintaining the security of your account and for all activity that occurs under it. You must provide accurate information when registering. We reserve the right to suspend or terminate accounts that violate these terms or are used for fraudulent purposes.`,
  },
  {
    title: "Acceptable use",
    body: `You agree not to misuse the Platform. This includes, but is not limited to: posting false or misleading content, scraping or harvesting data without permission, attempting to gain unauthorised access to any part of the Platform, or using the Platform for spam or unsolicited communications.`,
  },
  {
    title: "Content you post",
    body: `You retain ownership of content you post on Staky (reviews, migration stories, comments). By posting, you grant us a non-exclusive, royalty-free licence to display and distribute that content on the Platform. We may remove content that violates our policies without notice.`,
  },
  {
    title: "Migration partners",
    body: `Partners listed on Staky are independent third parties. Staky facilitates connections but is not a party to any agreement between you and a migration partner. We do not guarantee the quality or outcome of any migration service. Due diligence remains your responsibility.`,
  },
  {
    title: "Intellectual property",
    body: `The Staky name, logo, and Platform design are owned by Staky ApS. You may not reproduce, distribute, or create derivative works from our content without written permission. Logos and trademarks of third-party tools belong to their respective owners.`,
  },
  {
    title: "Limitation of liability",
    body: `To the extent permitted by Danish and EU law, Staky ApS shall not be liable for indirect, incidental, or consequential damages arising from your use of the Platform, including data loss, service interruptions, or decisions made based on Platform content.`,
  },
  {
    title: "Privacy & data",
    body: `Your use of the Platform is also governed by our Privacy Policy and Cookie Policy. We process personal data in accordance with GDPR (EU 2016/679). For questions about your data, contact privacy@staky.dk.`,
  },
  {
    title: "Changes to these terms",
    body: `We may update these terms from time to time. We will notify registered users of material changes by email or in-app notice. Continued use of the Platform after changes take effect constitutes acceptance of the revised terms.`,
  },
  {
    title: "Governing law",
    body: `These terms are governed by the laws of Denmark. Any disputes shall be subject to the exclusive jurisdiction of the courts of Copenhagen, Denmark, unless EU consumer protection law requires otherwise.`,
  },
];

export default function TermsPage() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen" style={{ fontFamily: F }}>
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">

        {/* Header */}
        <div className="mb-12 border-b border-[#E8E3D9] pb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9BA39C]">Legal</p>
          <h1
            className="mt-3 font-bold text-[#1B2B1F]"
            style={{ fontSize: "clamp(28px, 4vw, 38px)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
          >
            Terms of Use
          </h1>
          <p className="mt-3 text-[14px] text-[#9BA39C]">
            Last updated: April 2026 · Staky ApS, Copenhagen, Denmark
          </p>
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
        <div className="mt-16 border-t border-[#E8E3D9] pt-8 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="text-[13px] font-semibold text-[#0F6E56] hover:underline">
            Privacy Policy →
          </Link>
          <Link href="/cookies" className="text-[13px] font-semibold text-[#0F6E56] hover:underline">
            Cookie Policy →
          </Link>
          <Link href="/contact" className="text-[13px] font-semibold text-[#0F6E56] hover:underline">
            Contact us →
          </Link>
        </div>

      </div>
    </div>
  );
}
