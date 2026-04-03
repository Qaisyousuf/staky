import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ModeSelectClient } from "./mode-select-client";

export default async function ModeSelectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Only approved partners need mode selection
  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { approved: true },
  });

  if (!partner?.approved) {
    redirect("/app/dashboard");
  }

  return <ModeSelectClient userName={session.user.name ?? null} userImage={null} />;
}
