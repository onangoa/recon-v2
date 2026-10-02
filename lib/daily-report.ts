// Shared types + helpers for the Daily Site Progress & Next-Day Planning
// Report (see flutter/NEW PROPOSAL.docx). Used by the form, the read-only
// document view and the merged print view.

import { format, parse } from 'date-fns';

export interface WorkforceEntry {
  category: string;
  count: number;
}

export interface FileEntry {
  url: string;
  name?: string;
}

export interface DailyReportActivity {
  id?: string;
  position: number;
  title: string;
  description?: string | null;
  plannedWorkforce?: WorkforceEntry[] | null;
  actualWorkforce?: WorkforceEntry[] | null;
  labourCost: number;
  verdict?: string | null;
  remarks?: string | null;
  photos?: FileEntry[] | null;
}

export interface DailyReportTarget {
  id?: string;
  position: number;
  title: string;
  description?: string | null;
  workforce?: WorkforceEntry[] | null;
  remarks?: string | null;
  uploads?: FileEntry[] | null;
}

export interface DailyReportDelivery {
  id?: string;
  item: string;
  quantity: number;
  unit?: string | null;
  supplier?: string | null;
  notes?: string | null;
}

export interface DailyReportMaterial {
  id?: string;
  item: string;
  quantity: number;
  unit?: string | null;
  notes?: string | null;
}

export interface DayVisitor {
  id: string;
  name: string;
  company?: string | null;
  purpose: string;
  checkInTime: string;
  checkOutTime?: string | null;
}

export interface DayIncident {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  severity: string;
  status: string;
  incidentDate: string;
  reportedBy: string;
}

export interface DayPODelivery {
  id: string;
  orderNumber: string;
  supplier: string;
  status: string;
  deliveredAt?: string | null;
  items: { description: string; quantity: number }[];
}

export interface DailyReportFull {
  id: string;
  siteId: string;
  reportDate: string;
  status: string;
  uploads?: FileEntry[] | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  activities: DailyReportActivity[];
  targets: DailyReportTarget[];
  deliveries: DailyReportDelivery[];
  materials: DailyReportMaterial[];
  site?: {
    id: string;
    name: string;
    location: string;
    contractor: { companyName: string; logo?: string | null };
  };
  // Attached by the merged range endpoint (printing).
  dayWorkforce?: WorkforceEntry[];
  dayVisitors?: DayVisitor[];
  dayIncidents?: DayIncident[];
  dayDeliveries?: DayPODelivery[];
}

export interface DailyReportMeta {
  designations: { id: string; title: string; salary: number | null }[];
  workforce: WorkforceEntry[];
  visitors: DayVisitor[];
  incidents: DayIncident[];
  deliveries: DayPODelivery[];
  prevDayTargets: {
    id: string;
    position: number;
    title: string;
    description?: string | null;
    workforce?: WorkforceEntry[] | null;
    remarks?: string | null;
  }[];
}

export const VERDICT_OPTIONS = [
  { value: 'achieved', label: 'Achieved' },
  { value: 'partially_achieved', label: 'Partially Achieved' },
  { value: 'not_achieved', label: 'Not Achieved' },
] as const;

export const VERDICT_LABELS: Record<string, string> = {
  achieved: 'Achieved',
  partially_achieved: 'Partially Achieved',
  not_achieved: 'Not Achieved',
};

export const VERDICT_BADGE_CLASSES: Record<string, string> = {
  achieved: 'bg-emerald-500/10 text-emerald-700',
  partially_achieved: 'bg-amber-500/10 text-amber-700',
  not_achieved: 'bg-red-500/10 text-red-700',
};

/** "Friday, 2 October 2026" - used for the automatic report dates. */
export function formatDayLabel(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISODate(dateStr) : dateStr;
  return format(date, 'EEEE, d MMMM yyyy');
}

/** "Friday, 2 Oct" - compact day chip. */
export function formatDayCompact(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISODate(dateStr) : dateStr;
  return format(date, 'EEEE d MMM');
}

/** Parse "YYYY-MM-DD" (or a full ISO string) as a local date. */
export function parseISODate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parse(value, 'yyyy-MM-dd', new Date());
  }
  return new Date(value);
}

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatKes(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-KE').format(value);
}

/**
 * Labour cost implication for a workforce allocation: sum of
 * count x designation daily rate per category. Categories without a
 * designation rate contribute 0.
 */
export function computeLabourCost(
  workforce: WorkforceEntry[],
  designations: { title: string; salary: number | null }[]
): { lines: { category: string; count: number; rate: number; cost: number }[]; total: number } {
  const rateByCategory = new Map<string, number>(
    designations.map((d) => [d.title.trim().toLowerCase(), d.salary || 0])
  );
  const lines = workforce.map((entry) => {
    const rate = rateByCategory.get(entry.category.trim().toLowerCase()) || 0;
    return {
      category: entry.category,
      count: entry.count,
      rate,
      cost: rate * entry.count,
    };
  });
  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.cost, 0),
  };
}
