"use client";

import { Check, Zap, Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: "€0",
    period: "forever",
    icon: Zap,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    badge: null,
    features: [
      "Community feed access",
      "Public migration posts",
      "Stack analyser (up to 5 tools)",
      "Follow up to 50 people",
      "Basic notifications",
    ],
    cta: "Current plan",
    ctaDisabled: true,
  },
  {
    id: "PRO",
    name: "Pro",
    price: "€9",
    period: "per month",
    icon: Sparkles,
    color: "text-[#0F6E56]",
    bg: "bg-green-50",
    border: "border-[#0F6E56]",
    badge: "Most popular",
    features: [
      "Everything in Free",
      "Unlimited stack tools",
      "Unlimited follows & connections",
      "Priority feed placement",
      "Advanced analytics on posts",
      "Export your data any time",
      "Email digest customisation",
    ],
    cta: "Upgrade to Pro",
    ctaDisabled: false,
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "€29",
    period: "per month",
    icon: Building2,
    color: "text-[#2A5FA5]",
    bg: "bg-blue-50",
    border: "border-[#2A5FA5]",
    badge: "For teams",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared stack workspace",
      "Private migration playbooks",
      "Dedicated partner matching",
      "Priority support",
      "Custom data export (CSV/JSON)",
    ],
    cta: "Upgrade to Business",
    ctaDisabled: false,
  },
] as const;

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isCurrent,
}: {
  plan: typeof PLANS[number];
  isCurrent: boolean;
}) {
  const Icon = plan.icon;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border-2 p-5 transition-all duration-200 hover:-translate-y-0.5",
        isCurrent ? "border-[#0F6E56] shadow-sm" : plan.border,
        isCurrent && "ring-2 ring-[#0F6E56]/10"
      )}
    >
      {/* Badge */}
      {(plan.badge || isCurrent) && (
        <div className="absolute -top-3 left-4">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
              isCurrent
                ? "bg-[#0F6E56] text-white"
                : "bg-[#2A5FA5] text-white"
            )}
          >
            {isCurrent ? "Current plan" : plan.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 mt-1">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", plan.bg)}>
          <Icon className={cn("h-4 w-4", plan.color)} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{plan.name}</p>
          <p className="text-xs text-gray-400">{plan.period}</p>
        </div>
        <div className="ml-auto text-right">
          <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
          {plan.id !== "FREE" && (
            <span className="text-xs text-gray-400 block">/mo</span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
            <Check className="h-3.5 w-3.5 text-[#0F6E56] shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        disabled={isCurrent || plan.ctaDisabled}
        className={cn(
          "w-full rounded-lg py-2.5 text-sm font-semibold transition-colors",
          isCurrent
            ? "bg-gray-100 text-gray-400 cursor-default"
            : plan.id === "PRO"
            ? "bg-[#0F6E56] hover:bg-[#0d5f4a] text-white"
            : "bg-[#2A5FA5] hover:bg-[#244d8a] text-white"
        )}
      >
        {isCurrent ? "Current plan" : plan.cta}
      </button>
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

export function BillingTab({ plan }: { plan: string }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Plan &amp; Billing</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          You are on the <span className="font-medium text-gray-700">{plan}</span> plan.
          Upgrade to unlock more features.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <PlanCard key={p.id} plan={p} isCurrent={p.id === plan} />
        ))}
      </div>

      {/* Billing info */}
      <div className="bg-white rounded-2xl p-5" style={{ border: "1.5px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)" }}>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Billing information</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Paid plans are billed monthly. You can cancel at any time and your access will
          continue until the end of the billing period. All prices are in EUR and include VAT
          where applicable.
        </p>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">🔒 Secure payment via Stripe</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">🇪🇺 EU-hosted billing</span>
        </div>
      </div>
    </div>
  );
}
