"use client";

import { useState, useTransition } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { submitJobApplication } from "@/actions/jobs";

const inputCls = [
  "w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF9] px-4 py-3",
  "text-[14px] text-[#1B2B1F] placeholder:text-[#C2BDB5]",
  "outline-none transition-all duration-150",
  "focus:border-[#0F6E56] focus:bg-white focus:ring-2 focus:ring-[#0F6E56]/10",
].join(" ");

const labelCls = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B5B0A8] mb-1.5";

export function ApplyModal({ jobId, jobTitle, onClose }: {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
}) {
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [phone, setPhone]             = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolio]  = useState("");
  const [message, setMessage]         = useState("");
  const [sent, setSent]               = useState(false);
  const [error, setError]             = useState("");
  const [isPending, start]            = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await submitJobApplication({ jobId, name, email, phone, linkedinUrl, portfolioUrl, message });
      if (res.success) setSent(true);
      else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>

      <div
        className="w-full sm:max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EDE8] px-7 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9BA39C]">Apply for</p>
            <p className="mt-0.5 text-[16px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.015em" }}>
              {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E8E3D9] text-[#9BA39C] hover:bg-[#FAF8F5] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {sent ? (
          <div className="flex flex-col items-center gap-4 px-7 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EE]">
              <CheckCircle2 className="h-6 w-6 text-[#0F6E56]" />
            </div>
            <div>
              <p className="text-[18px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.02em" }}>
                Application sent!
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#5C6B5E]">
                We&apos;ll review your application and get back to you at{" "}
                <span className="font-semibold text-[#1B2B1F]">{email}</span>.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-px"
              style={{ background: "#0F6E56", boxShadow: "0 2px 6px rgba(15,110,86,0.35), 0 8px 24px rgba(15,110,86,0.18)" }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-7 py-6 space-y-5">
            {/* Name + Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Full name <span className="text-[#0F6E56]">*</span></label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" required autoComplete="name" />
              </div>
              <div>
                <label className={labelCls}>Email <span className="text-[#0F6E56]">*</span></label>
                <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelCls}>Phone <span className="text-[#C2BDB5] font-normal normal-case">(optional)</span></label>
              <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+45 xx xx xx xx" autoComplete="tel" />
            </div>

            {/* LinkedIn + Portfolio */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>LinkedIn URL</label>
                <input className={inputCls} type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/in/…" />
              </div>
              <div>
                <label className={labelCls}>Portfolio / GitHub</label>
                <input className={inputCls} type="url" value={portfolioUrl} onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="github.com/…" />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className={labelCls}>Cover note <span className="text-[#C2BDB5] font-normal normal-case">(optional)</span></label>
              <textarea className={`${inputCls} resize-none leading-relaxed`} rows={4}
                value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us why you're excited about this role…" />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-px h-4 w-4 shrink-0 text-red-400" />
                <p className="text-[13px] text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "#0F6E56",
                boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(15,110,86,0.35), 0 8px 24px rgba(15,110,86,0.18)",
              }}
            >
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Submit application</>}
            </button>

            <p className="text-center text-[11px] text-[#C2BDB5]">Your data stays in Europe · We respond within 5 business days</p>
          </form>
        )}
      </div>
    </div>
  );
}
