"use client";

import { useState, useTransition } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { clientConfirmPayment } from "@/actions/invoice";
import { calcTotals, formatCurrency, type InvoiceLineItem, type InvoiceStatusType } from "@/lib/invoice-utils";

type InvoiceViewProps = {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: InvoiceStatusType;
    lineItems: InvoiceLineItem[];
    subtotal: number;
    taxPercent: number;
    total: number;
    currency: string;
    dueDate: string | null;
    notes: string | null;
    sentAt: string | null;
    paidAt: string | null;
  };
  requestRef: string;
  fromToolName: string;
  toToolName: string;
  partnerName: string;
  partnerCountry: string | null;
  clientName: string;
  clientEmail: string;
  clientCompany: string | null;
};

// Labels from the CLIENT's perspective (they receive the invoice)
const CLIENT_STATUS: Record<InvoiceStatusType, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  SENT: { label: "Awaiting payment", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  VIEWED: { label: "Awaiting payment", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID: { label: "Paid", cls: "bg-green-50 text-[#0F6E56] border-green-200" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-50 text-red-600 border-red-200" },
};

export function InvoiceView({
  invoice: initialInvoice,
  requestRef,
  fromToolName,
  toToolName,
  partnerName,
  partnerCountry,
  clientName,
  clientEmail,
  clientCompany,
}: InvoiceViewProps) {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [isPending, startTransition] = useTransition();

  const { subtotal, tax } = calcTotals(invoice.lineItems, invoice.taxPercent);
  const statusMeta = CLIENT_STATUS[invoice.status];
  const awaitingPayment = invoice.status === "SENT" || invoice.status === "VIEWED";

  function handleConfirmPayment() {
    startTransition(async () => {
      try {
        const res = await clientConfirmPayment(invoice.id);
        setInvoice((prev) => ({
          ...prev,
          ...res.invoice,
          lineItems: prev.lineItems,
          status: res.invoice.status as InvoiceStatusType,
          dueDate: res.invoice.dueDate?.toString() ?? null,
          sentAt: res.invoice.sentAt?.toString() ?? null,
          paidAt: res.invoice.paidAt?.toString() ?? null,
        }));
        toast.success("Payment confirmed — your partner has been notified");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to confirm payment");
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Paid banner */}
      {invoice.status === "PAID" && (
        <div className="flex items-center gap-3 border-b border-green-200 bg-green-50 px-5 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0F6E56]" />
          <p className="text-sm font-semibold text-[#0F6E56]">
            Payment confirmed
            {invoice.paidAt && (
              <span className="ml-2 font-normal text-gray-500">
                · {new Date(invoice.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
          </p>
          <span className="ml-auto text-lg font-bold text-[#0F6E56] tabular-nums">
            {formatCurrency(invoice.total, invoice.currency)}
          </span>
        </div>
      )}

      {/* Awaiting payment banner */}
      {awaitingPayment && (
        <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3">
          <CreditCard className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm font-semibold text-amber-700">Invoice received — payment due</p>
          {invoice.dueDate && (
            <span className="ml-auto flex items-center gap-1 text-xs text-amber-600">
              <CalendarDays className="h-3.5 w-3.5" />
              Due {new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      )}

      <div className="p-5 space-y-5">
        {/* Invoice header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
              <Receipt className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Invoice</p>
              <p className="font-mono text-sm font-bold text-gray-900">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.cls}`}>
              {statusMeta.label}
            </span>
            {/* Request context */}
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <span className="font-mono">{requestRef}</span>
              <span className="text-gray-200">·</span>
              <span>{fromToolName}</span>
              <ArrowRight className="h-2.5 w-2.5 text-gray-300" />
              <span className="font-semibold text-[#0F6E56]">{toToolName}</span>
            </div>
          </div>
        </div>

        {/* From / To */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">From</p>
            <p className="text-sm font-semibold text-gray-900">{partnerName}</p>
            {partnerCountry && <p className="text-xs text-gray-400">{partnerCountry}</p>}
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">To</p>
            <p className="text-sm font-semibold text-gray-900">{clientName}</p>
            <p className="text-xs text-gray-400">{clientEmail}</p>
            {clientCompany && <p className="text-xs text-gray-400">{clientCompany}</p>}
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Description</th>
                <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 w-16">Qty</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 w-28">Unit price</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.lineItems.map((item, i) => (
                <tr key={item.id ?? i}>
                  <td className="px-3 py-2.5 text-gray-800">{item.description}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-gray-500">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-500">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-gray-900">{formatCurrency(item.total, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-gray-100 bg-gray-50/60">
              {invoice.taxPercent > 0 && (
                <>
                  <tr>
                    <td colSpan={3} className="px-3 py-1.5 text-right text-xs text-gray-500">Subtotal</td>
                    <td className="px-3 py-1.5 text-right text-xs tabular-nums text-gray-500">{formatCurrency(subtotal, invoice.currency)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-3 py-1.5 text-right text-xs text-gray-500">Tax ({invoice.taxPercent}%)</td>
                    <td className="px-3 py-1.5 text-right text-xs tabular-nums text-gray-500">{formatCurrency(tax, invoice.currency)}</td>
                  </tr>
                </>
              )}
              <tr>
                <td colSpan={3} className="px-3 py-2.5 text-right text-sm font-bold text-gray-900">Total</td>
                <td className="px-3 py-2.5 text-right text-base font-bold tabular-nums text-gray-900">{formatCurrency(invoice.total, invoice.currency)}</td>
              </tr>
            </tfoot>
          </table>
          {invoice.notes && (
            <div className="border-t border-gray-100 px-3 py-2.5 text-xs text-gray-500 leading-relaxed">
              {invoice.notes}
            </div>
          )}
        </div>

        {/* Client action */}
        {awaitingPayment && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              Once you have made the payment, confirm it here to notify your partner.
            </p>
            <button
              onClick={handleConfirmPayment}
              disabled={isPending}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-[#0F6E56] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a5c47] transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              I&apos;ve made the payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
