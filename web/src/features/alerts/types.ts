import type { DeviceType } from '@/features/devices/types';
import type { User } from '@/features/users/types';

export type Severity = 'warning' | 'critical';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved' | 'dismissed';
export type ResolutionType =
  | 'fixed'
  | 'false_alarm'
  | 'known_issue'
  | 'deferred'
  | 'cannot_reproduce';
export type TimelineAction =
  | 'created'
  | 'acknowledged'
  | 'assigned'
  | 'note'
  | 'resolved'
  | 'dismissed'
  | 'reopened'
  | 'recovered';

/** Device fields embedded in an alert row. */
export interface AlertDeviceRef {
  id: string;
  name: string;
  location: string;
  type: DeviceType;
  company: string;
  timezone?: string; // present on the detail endpoint
}

export type AssigneeRef = Pick<User, 'id' | 'name' | 'role'>;

export interface TimelineEvent {
  id: string;
  alertId: string;
  timestamp: string;
  action: TimelineAction;
  userName: string | null;
  note: string | null;
  details: unknown;
}

export interface Alert {
  id: string;
  deviceId: string;
  company: string;
  alertType: string;
  severity: Severity;
  threshold: number | null;
  readingValue: number | null;
  readingName: string | null;
  triggeredAt: string;
  recoveredAt: string | null;

  status: AlertStatus;
  assignedToId: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  resolutionType: ResolutionType | null;
  resolutionRootCause: string | null;
  resolutionActionTaken: string | null;
  resolutionPreventiveMeasures: string | null;
  resolutionTimeSpentMinutes: number | null;

  createdAt: string;
  updatedAt: string;

  device: AlertDeviceRef;
  assignedTo: AssigneeRef | null;
  timeline?: TimelineEvent[]; // present on GET /alerts/:id
}
