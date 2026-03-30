import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/public/top-nav";
import { Footer } from "@/components/public/footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let userImage: string | null = null;
  if (session?.user?.id) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });
    userImage = u?.image ?? null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav userImage={userImage} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
