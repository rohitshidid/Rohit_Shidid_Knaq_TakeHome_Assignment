import { prisma } from '../db';
import { runIngest } from './run';

// CLI entry: `npm run ingest`. Keeps the orchestration logic (run.ts) free of
// process concerns so it can be reused from tests later.
runIngest()
  .then(() => prisma.$disconnect())
  .catch(async (e: unknown) => {
    console.error('Ingest failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
