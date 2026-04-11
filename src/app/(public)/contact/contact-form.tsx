"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Send, CheckCircle2, Loader2 } from "lucide-react";
import { submitContact } from "@/actions/contact";

const TOPICS = [
  { id: "general",     label: "General" },
  { id: "partnership", label: "Partnership" },
  { id: "press",       label: "Press & media" },
  { id: "bug",         label: "Bug report" },
];

const inputCls = [
  "w-full rounded-xl border border-[#E5E0D8] bg-[#FAFAF9] px-4 py-3",
  "text-[14px] text-[#1B2B1F] placeholder:text-[#C2BDB5]",
  "outline-none transition-all duration-150",
  "focus:border-[#0F6E56] focus:bg-white focus:ring-2 focus:ring-[#0F6E56]/10",
].join(" ");

export function ContactForm() {
  const [topic, setTopic]     = useState("general");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [isPending, start]    = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await submitContact({ name, email, topic, message });
      if (res.success) setSent(true);
      else setError(res.error ?? "Something went wrong.");
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EE]">
          <CheckCircle2 className="h-6 w-6 text-[#0F6E56]" />
        </div>
        <div>
          <p className="text-[19px] font-bold text-[#1B2B1F]" style={{ letterSpacing: "-0.02em" }}>
            Message received
          </p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#5C6B5E]">
            We&apos;ll reply to <span className="font-semibold text-[#1B2B1F]">{email}</span> within 24 hours.
          </p>
        </div>
        <button
          onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); setTopic("general"); }}
          className="text-[13px] font-semibold text-[#0F6E56] hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Topic — minimal tab strip */}
      <div>
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B5B0A8]">Topic</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(({ id, label }) => {
            const active = topic === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTopic(id)}
                className="rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all duration-150"
                style={{
                  border: active ? "1.5px solid #0F6E56" : "1.5px solid #E5E0D8",
                  background: active ? "#EAF3EE" : "transparent",
                  color: active ? "#0F6E56" : "#8A9090",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Name + Email */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B5B0A8]">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B5B0A8]">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            className={inputCls}
          />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B5B0A8]">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us how we can help…"
          className={`${inputCls} resize-none leading-relaxed`}
        />
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
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-semibold text-white transition-all duration-150 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: "#0F6E56",
          boxShadow: "0 1px 0 rgba(255,255,255,0.12) inset, 0 2px 6px rgba(15,110,86,0.35), 0 8px 24px rgba(15,110,86,0.18)",
        }}
      >
        {isPending
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
          : <><Send className="h-4 w-4" /> Send message</>
        }
      </button>

      <p className="text-center text-[12px] text-[#C2BDB5]">
        We respond within 24 hours · Your data stays in Europe
      </p>
    </form>
  );
}
