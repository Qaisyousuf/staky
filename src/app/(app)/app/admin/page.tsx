import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell, type AdminTab } from "./admin-shell";
import { OverviewTab } from "./tabs/overview-tab";
import { PostsTab } from "./tabs/posts-tab";
import { CommentsTab } from "./tabs/comments-tab";
import { RequestsTab } from "./tabs/requests-tab";
import { PartnersTab } from "./tabs/partners-tab";
import { UsersTab } from "./tabs/users-tab";
import { ReportsTab } from "./tabs/reports-tab";
import { ToolsTab } from "./tabs/tools-tab";
import { BlogTab } from "./tabs/blog-tab";
import {
  getAdminStats,
  getPendingPosts,
  getRecentRequests,
  adminGetPosts,
  adminGetComments,
  adminGetRequests,
  adminGetPartners,
  adminGetUsers,
  adminGetReports,
} from "@/actions/admin";
import { adminGetTools, adminGetAlternatives } from "@/actions/tools";
import { adminGetBlogPosts } from "@/actions/blog";

const VALID_TABS: AdminTab[] = [
  "overview", "posts", "comments", "requests", "partners", "users", "reports", "tools", "blog",
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { tab?: string; filter?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/app/dashboard");

  const tab = (VALID_TABS.includes(searchParams.tab as AdminTab)
    ? searchParams.tab
    : "overview") as AdminTab;

  return (
    <AdminShell currentTab={tab}>
      {tab === "overview" && <OverviewTabLoader />}
      {tab === "posts" && <PostsTabLoader filter={searchParams.filter as "all" | "published" | "unpublished" | "featured"} />}
      {tab === "comments" && <CommentsTabLoader />}
      {tab === "requests" && <RequestsTabLoader />}
      {tab === "partners" && <PartnersTabLoader />}
      {tab === "users" && <UsersTabLoader userId={session.user.id} />}
      {tab === "reports" && <ReportsTabLoader />}
      {tab === "tools" && <ToolsTabLoader />}
      {tab === "blog" && <BlogTabLoader />}
    </AdminShell>
  );
}

async function OverviewTabLoader() {
  const [stats, pendingPosts, recentRequests] = await Promise.all([
    getAdminStats(),
    getPendingPosts(),
    getRecentRequests(),
  ]);
  return <OverviewTab stats={stats} pendingPosts={pendingPosts} recentRequests={recentRequests} />;
}

async function PostsTabLoader({ filter }: { filter?: "all" | "published" | "unpublished" | "featured" }) {
  const posts = await adminGetPosts(filter ?? "all");
  return <PostsTab posts={posts} currentFilter={filter ?? "all"} />;
}

async function CommentsTabLoader() {
  const comments = await adminGetComments();
  return <CommentsTab comments={comments} />;
}

async function RequestsTabLoader() {
  const { prisma } = await import("@/lib/prisma");
  const [requests, partnerList] = await Promise.all([
    adminGetRequests(),
    prisma.partner.findMany({
      where: { approved: true },
      select: { userId: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
  ]);
  return <RequestsTab requests={requests} partners={partnerList} />;
}

async function PartnersTabLoader() {
  const partners = await adminGetPartners();
  return <PartnersTab partners={partners} />;
}

async function UsersTabLoader({ userId }: { userId: string }) {
  const users = await adminGetUsers();
  return <UsersTab users={users} currentUserId={userId} />;
}

async function ReportsTabLoader() {
  const data = await adminGetReports();
  return <ReportsTab data={data} />;
}

async function ToolsTabLoader() {
  const [tools, alternatives] = await Promise.all([
    adminGetTools(),
    adminGetAlternatives(),
  ]);
  return <ToolsTab initialTools={tools} initialAlternatives={alternatives} />;
}

async function BlogTabLoader() {
  const posts = await adminGetBlogPosts();
  return <BlogTab posts={posts} />;
}
