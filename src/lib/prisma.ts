import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof buildPrisma> | undefined;
};

function buildPrisma() {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  // Retry once on "Server has closed the connection" (Neon auto-suspend)
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (e: unknown) {
          if (
            e instanceof Error &&
            (e.message.includes("Server has closed the connection") ||
              e.message.includes("Can't reach database server"))
          ) {
            await new Promise((r) => setTimeout(r, 300));
            return query(args);
          }
          throw e;
        }
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? buildPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
