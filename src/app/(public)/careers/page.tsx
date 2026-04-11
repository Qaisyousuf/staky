import Link from "next/link";
import { ArrowUpRight, MapPin, Clock } from "lucide-react";
import { FadeIn } from "@/components/public/fade-in";
import { getPublishedJobs } from "@/actions/jobs";

export const metadata = {
  title: "Careers — Staky",
  description: "Join Staky and help European businesses reclaim their digital sovereignty.",
};

const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

export default async function CareersPage() {
  const jobs = await getPublishedJobs();

  const byDept = jobs.reduce<Record<string, typeof jobs>>((acc, job) => {
    if (!acc[job.department]) acc[job.department] = [];
    acc[job.department].push(job);
    return acc;
  }, {});

  return (
    <div className="bg-[#FAF8F5]" style={{ fontFamily: F }}>

      {/* Hero */}
      <section className="border-b border-[#E8E3D9]">
        <div className="mx-auto max-w-4xl px-4 pb-20 pt-[88px] sm:px-6 sm:pt-[128px]">
          <FadeIn>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9BA39C]">Careers</p>
          </FadeIn>
          <FadeIn delay={60}>
            <h1
              className="mt-4 max-w-[520px] font-bold text-[#1B2B1F]"
              style={{ fontSize: "clamp(36px, 5vw, 52px)", letterSpacing: "-0.03em", lineHeight: 1.08 }}
            >
              Help Europe reclaim its digital future
            </h1>
          </FadeIn>
          <FadeIn delay={120}>
            <p className="mt-4 max-w-[420px] text-[16px] leading-[1.8] text-[#5C6B5E]">
              Small team. Real mission. Come build with us.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">

          {jobs.length === 0 ? (
            <FadeIn>
              <div className="py-16 text-center">
                <p className="text-[17px] font-semibold text-[#1B2B1F]">No open roles right now</p>
                <p className="mt-2 text-[14px] text-[#9BA39C]">
                  We hire for exceptional people.{" "}
                  <a href="mailto:jobs@staky.dk" className="font-semibold text-[#0F6E56] hover:underline">
                    Send us a note →
                  </a>
                </p>
              </div>
            </FadeIn>
          ) : (
            <div className="space-y-12">
              {Object.entries(byDept).map(([dept, deptJobs], di) => (
                <FadeIn key={dept} delay={di * 80}>
                  <div>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9BA39C]">
                      {dept}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {deptJobs.map((job) => (
                        <Link
                          key={job.id}
                          href={`/careers/${job.id}`}
                          className="group flex flex-col gap-4 rounded-2xl bg-white p-6 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(27,43,31,0.08)]"
                          style={{
                            border: "1.5px solid rgba(0,0,0,0.04)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
                          }}
                        >
                          <div>
                            <p className="text-[16px] font-bold text-[#1B2B1F] group-hover:text-[#0F6E56] transition-colors"
                              style={{ letterSpacing: "-0.01em" }}>
                              {job.title}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="flex items-center gap-1.5 text-[12px] text-[#9BA39C]">
                                <MapPin className="h-3 w-3" />{job.location}
                              </span>
                              <span className="flex items-center gap-1.5 text-[12px] text-[#9BA39C]">
                                <Clock className="h-3 w-3" />{job.type}
                              </span>
                            </div>
                          </div>

                          <p className="text-[13px] leading-[1.7] text-[#5C6B5E] line-clamp-2">
                            {job.description}
                          </p>

                          <div className="flex items-center gap-1 text-[13px] font-semibold text-[#0F6E56]">
                            View role
                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}

              <FadeIn delay={180}>
                <div className="border-t border-[#E8E3D9] pt-10 text-center">
                  <p className="text-[14px] font-semibold text-[#1B2B1F]">Don&apos;t see your role?</p>
                  <p className="mt-1 text-[13px] text-[#9BA39C]">
                    We hire for exceptional people.{" "}
                    <a href="mailto:jobs@staky.dk" className="font-semibold text-[#0F6E56] hover:underline">
                      Send us a note →
                    </a>
                  </p>
                </div>
              </FadeIn>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
