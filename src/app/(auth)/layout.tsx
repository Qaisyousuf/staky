import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/public/top-nav";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let userImage: string | null = null;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });
    userImage = user?.image ?? null;
  }

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <TopNav userImage={userImage} />
      {children}
    </div>
  );
}
