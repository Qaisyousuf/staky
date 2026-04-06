import { redirect } from "next/navigation";

export default function CompanyProfilePage() {
  redirect("/app/settings?tab=company");
}
