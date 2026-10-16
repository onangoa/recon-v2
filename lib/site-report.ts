// Shared types + helpers for the Weekly Progress Report (the contractor's
// SAMPLE REPORT.docx template). The site-level report data lives on the Site
// model (title comes from the site name, the category row from
// Site.category); the PROJECT TEAM section is sourced from the staff
// (TeamMember) assigned to the site, and the ACTIVITY SUMMARY section from
// the daily reports of the selected week.

import { format, parseISO } from 'date-fns';

/** Display labels for the site categories (matches the site form select). */
export const SITE_CATEGORY_LABELS: Record<string, string> = {
  infrastructure: 'Infrastructure / Roads',
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
};

export function siteCategoryLabel(category: string | null | undefined): string {
  if (!category) return '';
  return SITE_CATEGORY_LABELS[category] || category;
}

/** All weekly-report form fields as strings (form state). */
export interface SiteReportFieldsState {
  image: string;
  plotNumber: string;
  builtUpArea: string;
  numberOfFloors: string;
  commencementDate: string;
  expectedCompletionDate: string;
  contractPeriodMonths: string;
  overallProgress: string;
  progressDescription: string;
}

export const EMPTY_SITE_REPORT_FIELDS: SiteReportFieldsState = {
  image: '',
  plotNumber: '',
  builtUpArea: '',
  numberOfFloors: '',
  commencementDate: '',
  expectedCompletionDate: '',
  contractPeriodMonths: '',
  overallProgress: '',
  progressDescription: '',
};

/** "yyyy-MM-dd" for date inputs, from an API ISO date value. */
export function toFormDate(value: string | null | undefined): string {
  if (!value) return '';
  try {
    return format(parseISO(value), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

/** Site API payload -> form state. */
export function siteToReportFields(site: Record<string, unknown>): SiteReportFieldsState {
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const num = (v: unknown) =>
    v === null || v === undefined ? '' : String(v);
  return {
    image: str(site.image),
    plotNumber: str(site.plotNumber),
    builtUpArea: str(site.builtUpArea),
    numberOfFloors: num(site.numberOfFloors),
    commencementDate: toFormDate(str(site.commencementDate)),
    expectedCompletionDate: toFormDate(str(site.expectedCompletionDate)),
    contractPeriodMonths: num(site.contractPeriodMonths),
    overallProgress: num(site.overallProgress),
    progressDescription: str(site.progressDescription),
  };
}

/** Form state -> site API payload (empty strings become null). */
export function reportFieldsToPayload(fields: SiteReportFieldsState) {
  const str = (v: string) => {
    const t = typeof v === 'string' ? v.trim() : '';
    return t === '' ? null : t;
  };
  const int = (v: string) => {
    const t = (v ?? '').trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? Math.round(n) : null;
  };
  const pct = (v: string) => {
    const t = (v ?? '').trim();
    if (t === '') return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    return Math.min(100, Math.max(0, n));
  };
  return {
    image: str(fields.image),
    plotNumber: str(fields.plotNumber),
    builtUpArea: str(fields.builtUpArea),
    numberOfFloors: int(fields.numberOfFloors),
    commencementDate: str(fields.commencementDate),
    expectedCompletionDate: str(fields.expectedCompletionDate),
    contractPeriodMonths: int(fields.contractPeriodMonths),
    overallProgress: pct(fields.overallProgress),
    progressDescription: str(fields.progressDescription),
  };
}

/**
 * API-body parser for the sites routes: coerces the weekly-report fields
 * into the Prisma types (Int / Float / DateTime / String|null) and normalises
 * empty strings to null.
 */
export function parseSiteReportFields(body: Record<string, unknown>) {
  const str = (value: unknown) => {
    if (typeof value !== 'string') return null;
    const t = value.trim();
    return t === '' ? null : t;
  };
  const int = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : null;
  };
  const pct = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.min(100, Math.max(0, n));
  };
  const day = (value: unknown) => {
    if (typeof value !== 'string' || value.trim() === '') return null;
    const date = new Date(`${value.trim().slice(0, 10)}T00:00:00`);
    return isNaN(date.getTime()) ? null : date;
  };
  return {
    image: str(body.image),
    plotNumber: str(body.plotNumber),
    builtUpArea: str(body.builtUpArea),
    numberOfFloors: int(body.numberOfFloors),
    commencementDate: day(body.commencementDate),
    expectedCompletionDate: day(body.expectedCompletionDate),
    contractPeriodMonths: int(body.contractPeriodMonths),
    overallProgress: pct(body.overallProgress),
    progressDescription: str(body.progressDescription),
  };
}

/**
 * Download the Weekly Progress Report PDF (the SAMPLE REPORT.docx format)
 * for one week of a site's daily reports as a file.
 */
export async function downloadWeeklyReportPdf(params: {
  siteId: string;
  from: string;
  to: string;
}) {
  const search = new URLSearchParams({
    siteId: params.siteId,
    from: params.from,
    to: params.to,
  });
  const res = await fetch(`/web/api/weekly-report/pdf?${search.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to export the weekly report PDF');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Weekly-Progress-Report-${params.from}_to_${params.to}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
