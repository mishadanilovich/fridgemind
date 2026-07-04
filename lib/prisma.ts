import { PrismaClient } from "@prisma/client";

// Singleton Prisma Client — избегает исчерпания коннекшенов при hot-reload в dev
// (см. CLAUDE.md, раздел 10 — типизация из Prisma Client, не дублируется руками).

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
