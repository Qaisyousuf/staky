import Link from "next/link";
import { ArrowDown, ArrowUpRight, MessageSquare, Users, ShieldCheck, CheckCircle2 } from "lucide-react";
import { FadeIn } from "@/components/public/fade-in";
import { ContactForm } from "./contact-form";
import { getPublishedAlternatives } from "@/actions/tools";

export const metadata = {
  title: "Contact — Staky",
  description: "Get in touch with the Staky team. We\u2019d love to hear from you.",
};

const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

/* ── Inline logo ─────────────────────────────────────────────────────────── */

function InlineLogo({ tool, size = 10 }: {
  tool: { name: string; logoUrl: string | null; color: string; abbr: string };
  size?: number;
}) {
  if (tool.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={tool.logoUrl} alt={tool.name} className={`h-${size} w-${size} shrink-0 object-contain`} />;
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl font-bold text-white"
      style={{ width: size * 4, height: size * 4, background: tool.color, fontSize: size * 1.5 }}
    >
      {tool.abbr}
    </span>
  );
}

/* ── Switch card (same style as landing page) ────────────────────────────── */

function SwitchPreviewCard({ alt }: {
  alt: {
    category: string;
    switcherCount: number;
    fromTool: { name: string; logoUrl: string | null; color: string; abbr: string; origin: string };
    toTool: { name: string; logoUrl: string | null; color: string; abbr: string; country: string | null };
  } | null;
}) {
  if (!alt) return null;

  return (
    <div className="w-[300px]" style={{ fontFamily: F }}>
      {/* Card */}
      <div
        className="overflow-hidden rounded-[28px] bg-white"
        style={{
          border: "1.5px solid rgba(0,0,0,0.04)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
        }}
      >
        {/* From tool */}
        <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-4 text-center">
          <InlineLogo tool={alt.fromTool} size={10} />
          <p className="text-[16px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.02em" }}>{alt.fromTool.name}</p>
        </div>

        {/* Arrow divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-x-0 top-1/2 mx-8 h-px bg-[#F0EDE8]" />
          <div
            className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white"
            style={{ border: "1.5px solid #EAE5DE", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <ArrowDown className="h-4 w-4 text-[#0F6E56]" />
          </div>
        </div>

        {/* To tool */}
        <div className="flex flex-col items-center gap-2 px-6 pt-4 pb-6 text-center">
          <InlineLogo tool={alt.toTool} size={10} />
          <div className="flex items-center gap-1.5">
            <p className="text-[18px] font-bold text-[#0F6E56]" style={{ letterSpacing: "-0.02em" }}>{alt.toTool.name}</p>
            {alt.toTool.country && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://flagcdn.com/16x12/${alt.toTool.country}.png`}
                width={16} height={12} alt={alt.toTool.country}
                className="rounded-[2px] opacity-80"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#F0EDE8] px-6 py-4">
          <p className="text-[13px] text-[#9BA39C]">
            <span className="font-semibold text-[#1B2B1F]">
              {alt.switcherCount > 0
                ? alt.switcherCount >= 1000
                  ? `${(alt.switcherCount / 1000).toFixed(1)}k`
                  : alt.switcherCount.toLocaleString()
                : "847"}
            </span>{" "}companies switched
          </p>
          <Link href="/discover" className="text-[12px] font-semibold text-[#0F6E56] hover:underline">
            View all →
          </Link>
        </div>
      </div>

    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default async function ContactPage() {
  const alternatives = await getPublishedAlternatives();
  const featured = alternatives[0] ?? null;

  return (
    <div className="bg-[#FAF8F5]" style={{ fontFamily: F }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-[#E8E3D9]">
        <div className="mx-auto grid max-w-6xl gap-16 px-4 pb-20 pt-[88px] sm:px-6 sm:pt-[120px] lg:grid-cols-[1fr_auto] lg:items-center lg:gap-24">

          {/* Left */}
          <div>
            <FadeIn delay={60}>
              <h1
                className="mt-4 font-bold text-[#1B2B1F]"
                style={{ fontSize: "clamp(40px, 5vw, 56px)", letterSpacing: "-0.03em", lineHeight: 1.06 }}
              >
                Let&apos;s talk
              </h1>
            </FadeIn>

            <FadeIn delay={120}>
              <p className="mt-4 max-w-[440px] text-[17px] leading-[1.8] text-[#5C6B5E]">
                Have a question, a partnership idea, or just want to say hello?
                We read every message and respond personally.
              </p>
            </FadeIn>

          </div>

          {/* Right — switch card */}
          <FadeIn delay={160}>
            <div className="hidden lg:block">
              <SwitchPreviewCard alt={featured} />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Form section ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-24">

            {/* Left */}
            <div className="space-y-10">
              <FadeIn>
                <div>
                  <h2 className="text-[26px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.025em" }}>
                    How can we help?
                  </h2>
                  <p className="mt-2.5 text-[15px] leading-[1.8] text-[#5C6B5E]">
                    Choose a topic below and we&apos;ll make sure your message reaches the right person.
                  </p>
                </div>
              </FadeIn>


                {/* Topic guide */}
              <FadeIn delay={80}>
                <div className="space-y-5">
                  {[
                    { topic: "General inquiry",  hint: "Questions about how the platform works" },
                    { topic: "Partnership",       hint: "Become a migration partner or list your tool" },
                    { topic: "Press & media",     hint: "Interviews, media kits, or press inquiries" },
                    { topic: "Bug report",        hint: "Something broken? We\u2019ll fix it fast" },
                  ].map(({ topic, hint }) => (
                    <div key={topic} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F6E56]" />
                      <div>
                        <p className="text-[14px] font-semibold text-[#1B2B1F]">{topic}</p>
                        <p className="mt-0.5 text-[13px] leading-[1.6] text-[#8A9090]">{hint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </FadeIn>

            {/* Privacy note */}
              <FadeIn delay={140}>
                <div className="border-t border-[#E8E3D9] pt-8">
                  <p className="text-[13px] leading-[1.7] text-[#8A9090]">
                    We never share your contact details with third parties.
                    Your data stays in Europe.{" "}
                    <Link href="/privacy" className="font-semibold text-[#0F6E56] hover:underline">
                      Privacy policy →
                    </Link>
                  </p>
                </div>
              </FadeIn>
            </div>

            {/* Right — form */}
            <FadeIn delay={100}>
              <div
                className="rounded-[28px] bg-white px-8 py-9 sm:px-10 sm:py-11"
                style={{
                  border: "1.5px solid rgba(0,0,0,0.04)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
                }}
              >
                <div className="mb-8">
                  <h3 className="text-[20px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.02em" }}>
                    Send us a message
                  </h3>
                  <p className="mt-1 text-[14px] text-[#9BA39C]">We&apos;ll reply to your email within 24 hours.</p>
                </div>
                <ContactForm />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Other ways ───────────────────────────────────────────────────── */}
      <section className="border-t border-[#E8E3D9] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9BA39C]">More ways</p>
            <h2 className="mt-2 text-[22px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.025em" }}>
              Other ways to connect
            </h2>
          </FadeIn>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: MessageSquare,
                title: "Join the community",
                description: "Share migration stories and connect with other European companies.",
                href: "/feed",
                cta: "Browse the feed",
              },
              {
                icon: Users,
                title: "Become a partner",
                description: "Help businesses migrate to European software.",
                href: "/signup",
                cta: "Apply now",
              },
              {
                icon: ShieldCheck,
                title: "List your software",
                description: "Get your European product discovered on Staky.",
                href: "mailto:partners@staky.dk",
                cta: "Get in touch",
              },
            ].map(({ icon: Icon, title, description, href, cta }, i) => (
              <FadeIn key={title} delay={i * 60}>
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-px"
                  style={{
                    border: "1.5px solid rgba(0,0,0,0.04)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
                    background: "#FAF8F5",
                  }}
                >
                  <div
                    className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 10px rgba(0,0,0,0.04)" }}
                  >
                    <Icon className="h-4 w-4 text-[#0F6E56]" />
                  </div>
                  <h3 className="text-[14px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.01em" }}>
                    {title}
                  </h3>
                  <p className="mt-1.5 flex-1 text-[13px] leading-[1.7] text-[#5C6B5E]">{description}</p>
                  <div className="mt-5 flex items-center gap-1 text-[13px] font-semibold text-[#0F6E56]">
                    {cta}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
