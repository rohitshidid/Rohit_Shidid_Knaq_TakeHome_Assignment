import { z } from 'zod';

/** A raw message straight from the JSON file — shape unknown until validated. */
export type RawMessage = Record<string, unknown>;

/** Minimal device facts the validator needs (loaded from the DB registry). */
export interface DeviceInfo {
  readingTypes: string[];
}

export interface NormalizedReading {
  kind: 'reading';
  deviceId: string;
  tsMs: number;
  inputs: { metric: string; value: number }[];
}

export interface NormalizedAlert {
  kind: 'alert' | 'recovery';
  deviceId: string;
  tsMs: number;
  alertType: string;
  severity: 'warning' | 'critical';
  threshold: number | null;
  readingValue: number | null;
  readingName: string | null;
}

export type Normalized = NormalizedReading | NormalizedAlert;

export type ValidationResult =
  | { ok: true; value: Normalized }
  | { ok: false; reason: string };

// --- Zod schemas for the type-specific bodies ---

const readingSchema = z.object({
  inputs: z
    .array(z.object({ input_name: z.string(), input_value: z.number() }))
    .min(1),
});

const alertSchema = z.object({
  alert_type: z.string().min(1),
  severity: z.enum(['warning', 'critical']),
  threshold: z.number().optional(),
  reading_value: z.number().optional(),
  reading_name: z.string().optional(),
});

/** Accept epoch-ms numbers, and recover ISO-8601 strings → ms. Else null. */
function coerceTimestamp(ts: unknown): number | null {
  if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
  if (typeof ts === 'string') {
    const ms = Date.parse(ts);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

function summarizeZod(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
}

/**
 * Validate + normalize one raw message. Returns either a normalized value or a
 * rejection reason. Checks run cheapest-first; the first failure wins.
 */
export function validateMessage(raw: RawMessage, devices: Map<string, DeviceInfo>): ValidationResult {
  // 1) message_type must classify the message
  const messageType = raw['message_type'];
  if (messageType !== 'reading' && messageType !== 'alert' && messageType !== 'recovery') {
    return { ok: false, reason: 'missing or unknown message_type' };
  }

  // 2) device_id present
  const deviceId = raw['device_id'];
  if (typeof deviceId !== 'string' || deviceId.length === 0) {
    return { ok: false, reason: 'missing device_id' };
  }

  // 3) device exists in the registry
  const device = devices.get(deviceId);
  if (!device) {
    return { ok: false, reason: `unknown device: ${deviceId}` };
  }

  // 4) timestamp present & coercible
  const tsMs = coerceTimestamp(raw['timestamp']);
  if (tsMs === null) {
    return { ok: false, reason: 'missing or invalid timestamp' };
  }

  // 5) type-specific body
  if (messageType === 'reading') {
    const parsed = readingSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, reason: `invalid reading: ${summarizeZod(parsed.error)}` };
    }
    const inputs = parsed.data.inputs.map((i) => ({ metric: i.input_name, value: i.input_value }));
    const unknownMetric = inputs.find((i) => !device.readingTypes.includes(i.metric));
    if (unknownMetric) {
      return { ok: false, reason: `metric '${unknownMetric.metric}' not in reading_types for ${deviceId}` };
    }
    return { ok: true, value: { kind: 'reading', deviceId, tsMs, inputs } };
  }

  // alert | recovery
  const parsed = alertSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: `invalid ${messageType}: ${summarizeZod(parsed.error)}` };
  }
  return {
    ok: true,
    value: {
      kind: messageType,
      deviceId,
      tsMs,
      alertType: parsed.data.alert_type,
      severity: parsed.data.severity,
      threshold: parsed.data.threshold ?? null,
      readingValue: parsed.data.reading_value ?? null,
      readingName: parsed.data.reading_name ?? null,
    },
  };
}
