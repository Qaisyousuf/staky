export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceStatusType = "DRAFT" | "SENT" | "VIEWED" | "PAID" | "CANCELLED";

export function calcTotals(items: InvoiceLineItem[], taxPercent: number) {
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = subtotal * (taxPercent / 100);
  return { subtotal, tax, total: subtotal + tax };
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-EU", { style: "currency", currency }).format(amount);
}
