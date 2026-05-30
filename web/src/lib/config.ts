// Browser-exposed config. Falls back to local defaults so a fresh clone works
// with no env file; override via NEXT_PUBLIC_API_URL / NEXT_PUBLIC_API_TOKEN.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
export const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? 'tok_alice_brookfield';
