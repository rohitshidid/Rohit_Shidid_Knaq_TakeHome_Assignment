export interface AlertStats {
  byStatus: { new: number; acknowledged: number; resolved: number; dismissed: number };
  openBySeverity: { critical: number; warning: number };
  mttrMinutes: number | null;
  resolutionTimeBySeverity: { critical: number | null; warning: number | null };
  resolvedThisWeek: number;
  resolvedLastWeek: number;
  dismissalRate: number;
}

export interface TimeseriesPoint {
  date: string;
  critical: number;
  warning: number;
}

export interface TimeseriesResponse {
  days: number;
  points: TimeseriesPoint[];
}
