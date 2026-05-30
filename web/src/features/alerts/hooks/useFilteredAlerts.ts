import { useMemo } from 'react';
import { useAppSelector } from '@/lib/store/hooks';
import type { Alert, Severity, AlertStatus } from '@/features/alerts/types';
import { titleForAlert } from '@/features/alerts/lib/format';

const SEVERITY_RANK: Record<Severity, number> = { critical: 2, warning: 1 };
const STATUS_RANK: Record<AlertStatus, number> = { new: 0, acknowledged: 1, resolved: 2, dismissed: 3 };

const newestFirst = (a: Alert, b: Alert): number =>
  new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();

/** Apply the Redux filter/sort state to the cached alert list (client-side). */
export function useFilteredAlerts(alerts: Alert[]): Alert[] {
  const f = useAppSelector((s) => s.alertFilters);

  return useMemo(() => {
    const q = f.search.trim().toLowerCase();

    const filtered = alerts.filter((a) => {
      if (f.severities.length > 0 && !f.severities.includes(a.severity)) return false;
      if (f.statuses.length > 0 && !f.statuses.includes(a.status)) return false;
      if (f.deviceId && a.deviceId !== f.deviceId) return false;
      if (q) {
        const hay = `${titleForAlert(a)} ${a.device.name} ${a.deviceId} ${a.device.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (f.sort === 'time') return newestFirst(a, b);
      if (f.sort === 'status') return STATUS_RANK[a.status] - STATUS_RANK[b.status] || newestFirst(a, b);
      return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || newestFirst(a, b);
    });
  }, [alerts, f]);
}
