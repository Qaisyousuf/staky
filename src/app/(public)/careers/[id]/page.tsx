import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { getPublishedJob } from "@/actions/jobs";
import { ApplyButton } from "./apply-button";

const F = "-apple-system, 'Segoe UI', system-ui, sans-serif";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getPublishedJob(id);
  if (!job) return { title: "Role not found — Staky" };
  return { title: `${job.title} — Staky Careers` };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getPublishedJob(id);
  if (!job) notFound();

  return (
    <div className="bg-[#FAF8F5]" style={{ fontFamily: F }}>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">

        {/* Back */}
        <Link
          href="/careers"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#9BA39C] hover:text-[#0F6E56] transition-colors mb-10"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All open roles
        </Link>

        {/* Header */}
        <div className="border-b border-[#E8E3D9] pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0F6E56]">
            {job.department}
          </p>
          <h1
            className="mt-3 font-bold text-[#1B2B1F]"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
          >
            {job.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-1.5 text-[13px] text-[#5C6B5E]">
              <MapPin className="h-3.5 w-3.5 text-[#9BA39C]" /> {job.location}
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-[#5C6B5E]">
              <Clock className="h-3.5 w-3.5 text-[#9BA39C]" /> {job.type}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="py-10">
          <div
            className="text-[15px] leading-[1.85] text-[#3D4D41] whitespace-pre-wrap"
          >
            {job.description}
          </div>
        </div>

        {/* Apply CTA */}
        <div
          className="flex flex-col items-start gap-5 rounded-2xl bg-white p-7 sm:flex-row sm:items-center sm:justify-between"
          style={{
            border: "1.5px solid rgba(0,0,0,0.04)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <p className="text-[15px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.01em" }}>
              Interested in this role?
            </p>
            <p className="mt-0.5 text-[13px] text-[#5C6B5E]">
              Takes less than 2 minutes — no cover letter required.
            </p>
          </div>
          <ApplyButton jobId={job.id} jobTitle={job.title} />
        </div>

      </div>
    </div>
  );
}
