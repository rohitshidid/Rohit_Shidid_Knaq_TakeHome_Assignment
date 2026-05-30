import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Load the repo-root .env (this file lives at api/src/config.ts → ../../.env).
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../../.env') });

export const env = {
  port: Number(process.env.API_PORT ?? 8000),
  host: process.env.API_HOST ?? '0.0.0.0',
};
