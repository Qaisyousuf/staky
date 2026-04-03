import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { UserRole } from "@prisma/client";

const config: NextAuthConfig = {
  // Cast adapter to silence the @auth/core version-mismatch type conflict
  // between @auth/prisma-adapter's bundled @auth/core and next-auth's copy.
  // Runtime behaviour is correct — both implement the same interface.
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role as UserRole,
          activeMode: user.activeMode,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as UserRole;
        token.activeMode = user.activeMode;
        // Remove image from JWT — base64 images make the cookie too large (HTTP 431).
        // Image is fetched directly from DB in server components instead.
        delete token.picture;
      }
      // Re-fetch from DB whenever the client calls session.update()
      if (trigger === "update") {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, email: true, role: true, activeMode: true },
        });
        if (fresh) {
          token.name       = fresh.name;
          token.email      = fresh.email;
          token.role       = fresh.role as UserRole;
          token.activeMode = fresh.activeMode;
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id         = token.id as string;
      session.user.role       = token.role as UserRole;
      session.user.activeMode = (token.activeMode as string | undefined) ?? "user";
      // name / email / image are mapped from token.name / token.email / token.picture by default
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
