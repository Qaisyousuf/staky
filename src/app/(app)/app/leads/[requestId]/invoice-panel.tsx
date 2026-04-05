"use client";

import { useState, useTransition } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Receipt,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createInvoice,
  updateInvoice,
  sendInvoice,
  markInvoicePaid,
} from "@/actions/invoice";
import {
  calcTotals,
  formatCurrency,
  type InvoiceLineItem,
  type InvoiceStatusType,
} from "@/lib/invoice-utils";

type Invoice = {
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

function newItem(description = ""): InvoiceLineItem {
  return { id: crypto.randomUUID(), description, quantity: 1, unitPrice: 0, total: 0 };
}

const CURRENCIES = ["EUR", "USD", "GBP", "DKK", "SEK", "NOK"];

const STATUS_BADGE: Record<InvoiceStatusType, string> = {
  DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
  SENT: "bg-blue-50 text-[#2A5FA5] border-blue-200",
  VIEWED: "bg-violet-50 text-violet-600 border-violet-200",
  PAID: "bg-green-50 text-[#0F6E56] border-green-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABEL: Record<InvoiceStatusType, string> = {
  DRAFT: "Draft",
  SENT: "Awaiting payment",
  VIEWED: "Viewed by client",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

interface InvoicePanelProps {
  requestId: string;
  partnerId: string;
  clientId: string;
  requestRef: string;
  fromToolName: string;
  toToolName: string;
  invoice: Invoice | null;
}

export function InvoicePanel({
  requestId,
  requestRef,
  fromToolName,
  toToolName,
  invoice: initialInvoice,
}: InvoicePanelProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(initialInvoice);
  const [showBuilder, setShowBuilder] = useState(false);
  const [isPending, startTransition] = useTransition();

  const defaultDescription = `Migration from ${fromToolName} to ${toToolName}`;

  // Builder form state
  const [items, setItems] = useState<InvoiceLineItem[]>(
    initialInvoice?.lineItems ?? [newItem(defaultDescription)]
  );
  const [taxPercent, setTaxPercent] = useState(initialInvoice?.taxPercent ?? 0);
  const [currency, setCurrency] = useState(initialInvoice?.currency ?? "EUR");
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate ? initialInvoice.dueDate.slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(initialInvoice?.notes ?? "");

  const { subtotal, tax, total } = calcTotals(items, taxPercent);

  function updateItem(id: string, field: keyof InvoiceLineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function openBuilder(existing?: Invoice) {
    if (existing) {
      setItems(existing.lineItems);
      setTaxPercent(existing.taxPercent);
      setCurrency(existing.currency);
      setDueDate(existing.dueDate?.slice(0, 10) ?? "");
      setNotes(existing.notes ?? "");
    } else {
      setItems([newItem(defaultDescription)]);
      setTaxPercent(0);
      setCurrency("EUR");
      setDueDate("");
      setNotes("");
    }
    setShowBuilder(true);
  }

  async function doSave() {
    if (invoice) {
      const res = await updateInvoice(invoice.id, { lineItems: items, taxPercent, currency, dueDate: dueDate || null, notes: notes || null });
      return { ...invoice, ...res.invoice, lineItems: items, status: res.invoice.status as InvoiceStatusType, dueDate: res.invoice.dueDate?.toString() ?? null, sentAt: res.invoice.sentAt?.toString() ?? null, paidAt: res.invoice.paidAt?.toString() ?? null };
    } else {
      const res = await createInvoice(requestId, { lineItems: items, taxPercent, currency, dueDate: dueDate || null, notes: notes || null });
      return { ...res.invoice, lineItems: items, status: res.invoice.status as InvoiceStatusType, dueDate: res.invoice.dueDate?.toString() ?? null, sentAt: res.invoice.sentAt?.toString() ?? null, paidAt: res.invoice.paidAt?.toString() ?? null };
    }
  }

  function handleSaveDraft() {
    startTransition(async () => {
      try {
        const updated = await doSave();
        setInvoice(updated);
        setShowBuilder(false);
        toast.success("Invoice saved as draft");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save invoice");
      }
    });
  }

  function handleSendNow() {
    startTransition(async () => {
      try {
        let inv = await doSave();
        const res2 = await sendInvoice(inv.id);
        inv = { ...inv, ...res2.invoice, lineItems: items, status: res2.invoice.status as InvoiceStatusType, dueDate: res2.invoice.dueDate?.toString() ?? null, sentAt: res2.invoice.sentAt?.toString() ?? null, paidAt: res2.invoice.paidAt?.toString() ?? null };
        setInvoice(inv);
        setShowBuilder(false);
        toast.success("Invoice sent to client");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to send invoice");
      }
    });
  }

  function handleSendExisting() {
    if (!invoice) return;
    startTransition(async () => {
      try {
        const res = await sendInvoice(invoice.id);
        setInvoice({ ...invoice, ...res.invoice, lineItems: invoice.lineItems, status: res.invoice.status as InvoiceStatusType, dueDate: res.invoice.dueDate?.toString() ?? null, sentAt: res.invoice.sentAt?.toString() ?? null, paidAt: res.invoice.paidAt?.toString() ?? null });
        toast.success("Invoice sent to client");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to send");
      }
    });
  }

  function handleMarkPaid() {
    if (!invoice) return;
    startTransition(async () => {
      try {
        const res = await markInvoicePaid(invoice.id);
        setInvoice({ ...invoice, ...res.invoice, lineItems: invoice.lineItems, status: res.invoice.status as InvoiceStatusType, dueDate: res.invoice.dueDate?.toString() ?? null, sentAt: res.invoice.sentAt?.toString() ?? null, paidAt: res.invoice.paidAt?.toString() ?? null });
        toast.success("Invoice marked as paid");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to mark as paid");
      }
    });
  }

  const canEdit = !invoice || invoice.status === "DRAFT";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-3">
        <Receipt className="h-4 w-4 text-gray-400" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Invoice</p>
        {/* Request context */}
        <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-mono text-gray-500">
          {requestRef}
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">{fromToolName}</span>
          <ArrowRight className="h-3 w-3 text-gray-300" />
          <span className="font-semibold text-[#0F6E56]">{toToolName}</span>
        </div>
        {invoice && (
          <span className={`ml-auto inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[invoice.status]}`}>
            {STATUS_LABEL[invoice.status]}
          </span>
        )}
        {invoice && (
          <span className="font-mono text-xs text-gray-400">{invoice.invoiceNumber}</span>
        )}
      </div>

      <div className="p-5">
        {/* ── No invoice ── */}
        {!invoice && !showBuilder && (
          <div className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">No invoice yet</p>
              <p className="text-xs text-gray-400 mt-0.5">Create and send an invoice to your client for this migration project</p>
            </div>
            <button
              onClick={() => openBuilder()}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0F6E56] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a5c47] transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Invoice
            </button>
          </div>
        )}

        {/* ── Builder ── */}
        {showBuilder && (
          <div className="space-y-5">
            {/* Line items */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Line Items</p>
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-[1fr_72px_110px_110px_32px] gap-0 border-b border-gray-100 bg-gray-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Description</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Qty</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Unit price</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Total</p>
                  <span />
                </div>
                <div className="divide-y divide-gray-50 px-3">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_72px_110px_110px_32px] gap-2 py-2 items-center">
                      <input
                        type="text"
                        placeholder="e.g. Migration consulting"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        className="rounded border border-gray-200 px-2 py-1.5 text-sm text-gray-800 outline-none focus:border-[#0F6E56] focus:ring-1 focus:ring-[#0F6E56]/20"
                      />
                      <input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        className="rounded border border-gray-200 px-2 py-1.5 text-sm text-center tabular-nums text-gray-800 outline-none focus:border-[#0F6E56]"
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="rounded border border-gray-200 px-2 py-1.5 text-sm text-right tabular-nums text-gray-800 outline-none focus:border-[#0F6E56]"
                      />
                      <p className="text-right text-sm font-semibold text-gray-800 tabular-nums">
                        {formatCurrency(item.total, currency)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                        className="flex items-center justify-center rounded p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setItems((prev) => [...prev, newItem()])}
                    className="flex items-center gap-1 text-xs font-medium text-[#0F6E56] hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add line item
                  </button>
                </div>
              </div>
            </div>

            {/* Settings + totals side by side */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-[#0F6E56]"
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tax %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-[#0F6E56]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-[#0F6E56]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Payment terms, bank details, etc."
                    className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700 outline-none focus:border-[#0F6E56] resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Summary</p>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(subtotal, currency)}</span>
                  </div>
                  {taxPercent > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax ({taxPercent}%)</span>
                      <span className="tabular-nums">{formatCurrency(tax, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(total, currency)}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSendNow}
                    disabled={isPending || items.every((i) => !i.description)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#2A5FA5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e4a8a] transition-colors disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send to client
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isPending || items.every((i) => !i.description)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      Save draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBuilder(false)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Draft preview ── */}
        {invoice?.status === "DRAFT" && !showBuilder && (
          <div className="space-y-4">
            <InvoiceTable invoice={invoice} />
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => openBuilder(invoice)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleSendExisting}
                disabled={isPending}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#2A5FA5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e4a8a] transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send to client
              </button>
            </div>
          </div>
        )}

        {/* ── Sent / Viewed ── */}
        {(invoice?.status === "SENT" || invoice?.status === "VIEWED") && (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium ${invoice.status === "VIEWED" ? "border-violet-200 bg-violet-50 text-violet-700" : "border-blue-100 bg-blue-50 text-[#2A5FA5]"}`}>
              <Send className="h-4 w-4 shrink-0" />
              <span>
                {invoice.status === "VIEWED" ? "Viewed by client" : "Awaiting client payment"}
              </span>
              {invoice.sentAt && (
                <span className="ml-auto text-xs text-gray-400">
                  Sent {new Date(invoice.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
            <InvoiceTable invoice={invoice} />
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400">Once payment is received, confirm it below</p>
              <button
                onClick={handleMarkPaid}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[#0F6E56] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a5c47] transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                Confirm payment received
              </button>
            </div>
          </div>
        )}

        {/* ── Paid ── */}
        {invoice?.status === "PAID" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0F6E56]" />
              <div>
                <p className="text-sm font-bold text-[#0F6E56]">Payment confirmed</p>
                {invoice.paidAt && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(invoice.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
              <span className="ml-auto text-xl font-bold text-[#0F6E56] tabular-nums">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>
            <InvoiceTable invoice={invoice} />
          </div>
        )}
      </div>
    </div>
  );
}

function InvoiceTable({ invoice }: { invoice: Invoice }) {
  const { subtotal, tax } = calcTotals(invoice.lineItems, invoice.taxPercent);
  return (
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
              <td className="px-3 py-2.5 text-gray-800">{item.description || "—"}</td>
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
            <td className="px-3 py-2.5 text-right text-sm font-bold tabular-nums text-gray-900">{formatCurrency(invoice.total, invoice.currency)}</td>
          </tr>
        </tfoot>
      </table>
      {(invoice.notes || invoice.dueDate) && (
        <div className="border-t border-gray-100 flex flex-wrap gap-4 px-3 py-2.5 text-xs text-gray-500">
          {invoice.dueDate && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Due {new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {invoice.notes && <span className="leading-relaxed">{invoice.notes}</span>}
        </div>
      )}
    </div>
  );
}
