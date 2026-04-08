import Link from "next/link";
import { ArrowRight, Compass, Layers, ShieldCheck, Users } from "lucide-react";
import { getPublishedAlternatives } from "@/actions/tools";
import { FadeIn } from "@/components/public/fade-in";
import { ToolIcon } from "@/components/shared/tool-icon";

const F = "var(--font-jakarta, 'Plus Jakarta Sans'), -apple-system, BlinkMacSystemFont, sans-serif";

export const metadata = {
  title: "About — Staky",
  description: "Why Staky exists and how we help European teams switch away from US Big Tech.",
};

export default async function AboutPage() {
  const alternatives = await getPublishedAlternatives();
  const featuredSwitch = alternatives[0] ?? null;

  return (
    <div className="bg-[#FAF8F5]" style={{ fontFamily: F }}>
      <section className="overflow-hidden bg-[#FAF8F5]">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-[70px] sm:px-6 sm:pt-[110px] lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-20">
          <div>
            <FadeIn delay={80}>
              <h1
                className="max-w-[620px] font-bold text-[#1B2B1F]"
                style={{ fontSize: "clamp(42px, 6.5vw, 64px)", letterSpacing: "-0.03em", lineHeight: 1.08 }}
              >
                A simpler way to switch to European software
              </h1>
            </FadeIn>

            <FadeIn delay={160}>
              <p className="mt-5 max-w-[520px] text-lg leading-[1.7] text-[#5C6B5E]">
                Discover better tools, see real switch stories, and get help when you need it.
              </p>
            </FadeIn>

            <FadeIn delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-[10px] bg-[#0F6E56] px-8 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-[#0D6050]"
                  style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(15,110,86,0.35), 0 8px 24px rgba(15,110,86,0.2)" }}
                >
                  Get started free
                </Link>
                <Link
                  href="/discover"
                  className="inline-flex items-center rounded-[10px] bg-transparent px-8 py-3.5 text-[15px] font-semibold text-[#1B2B1F] transition-all duration-200 hover:-translate-y-px hover:bg-[#EFF0EB]"
                  style={{ border: "1.5px solid rgba(0,0,0,0.04)", boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)" }}
                >
                  Explore alternatives
                </Link>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={180}>
            <div
              className="rounded-[30px] bg-white px-7 py-8 sm:px-9 sm:py-10"
              style={{ border: "1.5px solid rgba(0,0,0,0.04)", boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)" }}
            >
              {featuredSwitch ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4 px-1 py-2">
                    <div className="min-w-0 flex-1 text-center">
                      <div className="flex justify-center">
                        <ToolIcon toolData={featuredSwitch.fromTool} size="xl" plain className="h-14 w-14 object-contain" />
                      </div>
                      <p className="mt-3 text-[15px] font-semibold text-[#1B2B1F]">
                        {featuredSwitch.fromTool.name}
                      </p>
                    </div>

                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF3EE]"
                      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 10px rgba(15,110,86,0.08)" }}
                    >
                      <ArrowRight className="h-4 w-4 text-[#0F6E56]" />
                    </div>

                    <div className="min-w-0 flex-1 text-center">
                      <div className="flex justify-center">
                        <ToolIcon toolData={featuredSwitch.toTool} size="xl" plain className="h-14 w-14 object-contain" />
                      </div>
                      <p className="mt-3 text-[15px] font-semibold text-[#0F6E56]">
                        {featuredSwitch.toTool.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-[#ECE6DB] pt-5">
                    <span />
                    <Link href="/discover" className="text-sm font-semibold text-[#0F6E56]">
                      View all
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-[15px] leading-7 text-[#5C6B5E]">
                  Your published alternatives will appear here.
                </p>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-start">
            <FadeIn>
              <div>
                <h2 className="text-[32px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.03em" }}>
                  Built for practical switching
                </h2>
                <div className="mt-5 max-w-[470px] space-y-4 text-[16px] leading-[1.85] text-[#5C6B5E]">
                  <p>
                    Compare alternatives, see what others switched to, and move faster with the right support.
                  </p>
                  <p>
                    Everything stays connected so the next step is always clear.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={120}>
              <div className="space-y-5">
                <div className="space-y-5">
                  {[
                    { title: "Browse alternatives", text: "Explore EU options for your current tools.", href: "/discover" },
                    { title: "Read migration stories", text: "See real switches from the community.", href: "/feed" },
                    { title: "Find migration partners", text: "Get help when the move needs expertise.", href: "/partners" },
                  ].map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="group block border-b border-[#E9E6DF] pb-4 transition-colors last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[15px] font-semibold text-[#1B2B1F] transition-colors group-hover:text-[#0F6E56]">
                          {item.title}
                        </p>
                        <span className="text-sm font-semibold text-[#0F6E56]">View</span>
                      </div>
                      <p className="mt-1.5 text-[14px] leading-7 text-[#5C6B5E]">{item.text}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="bg-[#FAF8F5] py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[32px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.03em" }}>
                Clear by design
              </h2>
              <p className="mt-3 text-[15px] leading-[1.8] text-[#5C6B5E]">
                A simpler way to compare, decide, and move.
              </p>
            </div>
          </FadeIn>

          <div className="mt-12 grid gap-x-12 gap-y-8 md:grid-cols-2">
            <FadeIn>
              <div className="border-t border-[#DBD5C9] pt-5">
                <div className="flex items-center gap-3">
                  <Compass className="h-4 w-4 text-[#0F6E56]" />
                  <h3 className="text-[17px] font-semibold text-[#1B2B1F]" style={{ letterSpacing: "-0.02em" }}>
                    Clear choices
                  </h3>
                </div>
                <p className="mt-2 text-[15px] leading-[1.75] text-[#5C6B5E]">
                  Compare tools with confidence.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={80}>
              <div className="border-t border-[#DBD5C9] pt-5">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-[#0F6E56]" />
                  <h3 className="text-[17px] font-semibold text-[#1B2B1F]" style={{ letterSpacing: "-0.02em" }}>
                    One flow
                  </h3>
                </div>
                <p className="mt-2 text-[15px] leading-[1.75] text-[#5C6B5E]">
                  Tools, stories, and support together.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={160}>
              <div className="border-t border-[#DBD5C9] pt-5">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-[#0F6E56]" />
                  <h3 className="text-[17px] font-semibold text-[#1B2B1F]" style={{ letterSpacing: "-0.02em" }}>
                    Real proof
                  </h3>
                </div>
                <p className="mt-2 text-[15px] leading-[1.75] text-[#5C6B5E]">
                  Learn from real switches.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={240}>
              <div className="border-t border-[#DBD5C9] pt-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-[#0F6E56]" />
                  <h3 className="text-[17px] font-semibold text-[#1B2B1F]" style={{ letterSpacing: "-0.02em" }}>
                    European focus
                  </h3>
                </div>
                <p className="mt-2 text-[15px] leading-[1.75] text-[#5C6B5E]">
                  Privacy and independence first.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
}
