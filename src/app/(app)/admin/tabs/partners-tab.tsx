import Image from "next/image";
import { Star, CheckCircle, Sparkles } from "lucide-react";
import { PartnerActions } from "../admin-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type Partner = {
  id: string;
  companyName: string;
  country: string;
  specialty: string[];
  rating: number;
  projectCount: number;
  approved: boolean;
  featured: boolean;
  logoUrl: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null; email: string; role: string };
  _count: { leads: number };
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PartnersTab({ partners }: { partners: Partner[] }) {
  const pendingCount = partners.filter((p) => !p.approved).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{partners.length} partners</span>
        {pendingCount > 0 && (
          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            {pendingCount} pending approval
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {partners.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">No partner accounts yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Header */}
            <div className="hidden lg:grid grid-cols-[auto_auto_auto_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span>Company</span>
              <span>Country</span>
              <span>Rating</span>
              <span>Projects</span>
              <span>Leads</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {partners.map((partner) => (
              <div
                key={partner.id}
                className={`px-5 py-4 hover:bg-gray-50 flex flex-col lg:grid lg:grid-cols-[auto_auto_auto_auto_auto_auto_auto] gap-3 lg:gap-4 lg:items-center ${
                  !partner.approved ? "bg-amber-50/20" : ""
                }`}
              >
                {/* Company */}
                <div className="flex items-center gap-2.5 shrink-0">
                  {partner.logoUrl ? (
                    <Image src={partner.logoUrl} alt="" width={32} height={32} className="rounded-lg object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-[#2A5FA5]/10 flex items-center justify-center text-xs font-bold text-[#2A5FA5]">
                      {partner.companyName[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{partner.companyName}</div>
                    <div className="text-xs text-gray-400">{partner.user.email}</div>
                  </div>
                </div>

                {/* Country */}
                <div className="shrink-0 text-xs text-gray-600">{partner.country}</div>

                {/* Rating */}
                <div className="shrink-0 flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium text-gray-700">{partner.rating.toFixed(1)}</span>
                </div>

                {/* Projects */}
                <div className="shrink-0 text-sm text-gray-700">{partner.projectCount}</div>

                {/* Leads */}
                <div className="shrink-0 text-sm text-gray-700">{partner._count.leads}</div>

                {/* Status badges */}
                <div className="flex flex-col gap-1 shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    partner.approved ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    <CheckCircle className="h-3 w-3" />
                    {partner.approved ? "Approved" : "Pending"}
                  </span>
                  {partner.featured && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">
                      <Sparkles className="h-3 w-3" /> Featured
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(partner.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  <PartnerActions
                    partnerId={partner.id}
                    approved={partner.approved}
                    featured={partner.featured}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
