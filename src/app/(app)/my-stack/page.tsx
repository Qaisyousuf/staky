import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StackAnalyzer } from "./stack-analyzer";

export const metadata = {
  title: "My Stack — Staky",
};

export default async function MyStackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const stack = await prisma.stack.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        orderBy: { order: "asc" },
        select: { id: true, toolName: true, category: true },
      },
    },
  });

  return <StackAnalyzer initialItems={stack?.items ?? []} />;
}
