import { API_TOKEN } from '@/lib/config';

export interface DemoUser {
  name: string;
  role: string;
  company: string;
  token: string;
}

/**
 * The seeded users + their bearer tokens. Hardcoded here purely so the demo
 * can switch "logged-in user" at runtime and show multi-tenant isolation; a
 * real app would issue these via a login flow, not ship them to the client.
 */
export const DEMO_USERS: DemoUser[] = [
  { name: 'Alice Chen', role: 'Building Manager', company: 'Brookfield Properties', token: 'tok_alice_brookfield' },
  { name: 'Bob Martinez', role: 'Field Technician', company: 'Brookfield Properties', token: 'tok_bob_brookfield' },
  { name: 'Carol Nguyen', role: 'Building Manager', company: 'Hines', token: 'tok_carol_hines' },
  { name: 'Dan Okafor', role: 'Field Technician', company: 'Hines', token: 'tok_dan_hines' },
  { name: 'Emi Tanaka', role: 'Building Manager', company: 'Mitsui Fudosan', token: 'tok_emi_mitsui' },
  { name: 'Frank Mueller', role: 'Field Technician', company: 'Mitsui Fudosan', token: 'tok_frank_mitsui' },
];

export const DEFAULT_USER: DemoUser =
  DEMO_USERS.find((u) => u.token === API_TOKEN) ?? DEMO_USERS[0]!;
