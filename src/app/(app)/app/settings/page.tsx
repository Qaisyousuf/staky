import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsShell } from "./settings-shell";

export const metadata = { title: "Settings — Staky" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, notifSettings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        coverImage: true,
        bio: true,
        title: true,
        company: true,
        location: true,
        socialLinks: true,
        interests: true,
        role: true,
        plan: true,
        profileVisibility: true,
        createdAt: true,
        partner: {
          select: {
            companyName: true,
            country: true,
            approved: true,
            rating: true,
            projectCount: true,
            logoUrl: true,
          },
        },
      },
    }),
    prisma.notificationSettings.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  if (!user) redirect("/login");

  const socialLinks = (user.socialLinks ?? {}) as {
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  };

  return (
    <SettingsShell
      user={{
        id: user.id,
        name: user.name ?? "",
        email: user.email,
        image: user.image ?? "",
        coverImage: user.coverImage ?? "",
        bio: user.bio ?? "",
        title: user.title ?? "",
        company: user.company ?? "",
        location: user.location ?? "",
        socialLinks: {
          linkedin: socialLinks.linkedin ?? "",
          twitter: socialLinks.twitter ?? "",
          github: socialLinks.github ?? "",
          website: socialLinks.website ?? "",
        },
        interests: user.interests,
        role: user.role,
        plan: user.plan,
        profileVisibility: user.profileVisibility,
        createdAt: user.createdAt.toISOString(),
        partner: user.partner
          ? {
              companyName: user.partner.companyName,
              country: user.partner.country,
              approved: user.partner.approved,
              rating: user.partner.rating,
              projectCount: user.partner.projectCount,
              logoUrl: user.partner.logoUrl ?? null,
            }
          : null,
      }}
      notifSettings={
        notifSettings
          ? {
              inAppLikes: notifSettings.inAppLikes,
              inAppComments: notifSettings.inAppComments,
              inAppReplies: notifSettings.inAppReplies,
              inAppFollows: notifSettings.inAppFollows,
              inAppConnects: notifSettings.inAppConnects,
              inAppRecommendations: notifSettings.inAppRecommendations,
              inAppSaves: notifSettings.inAppSaves,
              inAppShares: notifSettings.inAppShares,
              emailLikes: notifSettings.emailLikes,
              emailComments: notifSettings.emailComments,
              emailReplies: notifSettings.emailReplies,
              emailFollows: notifSettings.emailFollows,
              emailConnects: notifSettings.emailConnects,
              emailRecommendations: notifSettings.emailRecommendations,
              emailSaves: notifSettings.emailSaves,
              emailShares: notifSettings.emailShares,
              emailDigest: notifSettings.emailDigest as "REAL_TIME" | "DAILY" | "WEEKLY" | "OFF",
            }
          : null
      }
    />
  );
}
