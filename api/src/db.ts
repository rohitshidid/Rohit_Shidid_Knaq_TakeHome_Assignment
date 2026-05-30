import './config'; // side-effect: loads the repo-root .env before we read DATABASE_URL
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — copy .env.example to .env at the repo root.');
}

// Prisma 7 connects through a driver adapter rather than reading the URL itself.
const adapter = new PrismaPg({ connectionString });

// Reuse a single client across hot-reloads in dev (avoids exhausting connections).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
