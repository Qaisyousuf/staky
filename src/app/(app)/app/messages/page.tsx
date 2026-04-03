import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Messages — Staky" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { user?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let targetUser: { name: string | null } | null = null;
  if (searchParams.user) {
    targetUser = await prisma.user.findUnique({
      where: { id: searchParams.user },
      select: { name: true },
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-[#0F6E56]" />
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
      </div>

      {targetUser && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <p className="text-sm font-medium text-gray-900 mb-1">
            Start conversation with {targetUser.name ?? "this user"}
          </p>
          <p className="text-xs text-gray-400">
            Messaging will be available soon. Check back later!
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-dashed border-gray-200 py-20 text-center">
        <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-4" />
        <p className="text-base font-semibold text-gray-700 mb-2">Full messaging coming soon</p>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Direct messaging between users and migration partners is on the roadmap.
          You&apos;ll be notified when it&apos;s ready.
        </p>
      </div>
    </div>
  );
}
