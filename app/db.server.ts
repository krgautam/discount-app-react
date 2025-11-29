import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient;
}

const prisma: PrismaClient =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.MONGODB_URI,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.MONGODB_URI,
        },
      },
    });
  }
}

export default prisma;
