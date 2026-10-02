'use client';

import {
  CheckCircle2,
  Circle,
  Users,
  PackageCheck,
  DoorOpen,
  ShieldAlert,
  Paperclip,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  addDays,
  format,
} from 'date-fns';
import {
  computeLabourCost,
  formatDayLabel,
  formatKes,
  parseISODate,
  toDateKey,
  VERDICT_LABELS,
  type DailyReportFull,
  type DayIncident,
  type DayPODelivery,
  type DayVisitor,
  type WorkforceEntry,
} from '@/lib/daily-report';

interface DailyReportDocumentProps {
  report: DailyReportFull;
  /** Total workforce on site for the day, from attendance records. */
  workforce?: WorkforceEntry[];
  /** Day visitors, from the visitors section. */
  visitors?: DayVisitor[];
  /** Day safety incidences, from the safety docket. */
  incidents?: DayIncident[];
  /** Purchase orders delivered on the day. */
  poDeliveries?: DayPODelivery[];
  /** Designations (for the labour cost breakdown). */
  designations?: { id: string; title: string; salary: number | null }[];
}

function DocumentSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-black uppercase tracking-wider text-primary border-b-2 border-primary pb-1 mb-3">
      {children}
    </h3>
  );
}

function DocumentField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <div className="text-sm text-foreground break-words">{children}</div>
    </div>
  );
}

export function DailyReportDocument({
  report,
  workforce,
  visitors,
  incidents,
  poDeliveries,
  designations,
}: DailyReportDocumentProps) {
  const reportDate = parseISODate(report.reportDate);
  const nextDay = toDateKey(addDays(reportDate, 1));
  const dayWorkforce = workforce || report.dayWorkforce || [];
  const dayVisitors = visitors || report.dayVisitors || [];
  const dayIncidents = incidents || report.dayIncidents || [];
  const dayDeliveries = poDeliveries || report.dayDeliveries || [];
  const totalWorkforce = dayWorkforce.reduce((sum, entry) => sum + entry.count, 0);
  const siteName = report.site?.name;
  const companyName = report.site?.contractor?.companyName;

  return (
    <div className="rounded-lg border border-border bg-white text-foreground shadow-sm print:shadow-none print:rounded-none">
      {/* Document header */}
      <div className="border-b-2 border-primary px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-primary leading-tight">
              Daily Site Progress &amp; Next-Day Planning Report
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {[companyName, siteName].filter(Boolean).join(' — ') || 'Site Report'}
            </p>
          </div>
          <Badge
            className={`text-[10px] font-black uppercase px-2 py-1 border-none shrink-0 ${
              report.status === 'Submitted'
                ? 'bg-emerald-500/10 text-emerald-700'
                : 'bg-amber-500/10 text-amber-700'
            }`}
          >
            {report.status}
          </Badge>
        </div>
      </div>

      <div className="px-6 py-5 space-y-8">
        {/* ---------------- A. TODAY'S PERFORMANCE ---------------- */}
        <section>
          <DocumentSectionTitle>A. Today&apos;s Performance</DocumentSectionTitle>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <p className="text-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Date:{' '}
              </span>
              <span className="font-bold">{formatDayLabel(report.reportDate)}</span>
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 print:break-inside-avoid">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Total workforce on site (attendance)
                </p>
                <p className="text-xs font-bold">
                  {totalWorkforce > 0
                    ? dayWorkforce.map((w) => `${w.category} - ${w.count}`).join('    ')
                    : 'No attendance records'}
                </p>
              </div>
            </div>
          </div>

          {report.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              No activities recorded for this day.
            </p>
          ) : (
            <div className="space-y-5">
              {report.activities.map((activity, index) => {
                const actual = (activity.actualWorkforce || []) as WorkforceEntry[];
                const cost = computeLabourCost(actual, designations || []);
                return (
                  <div
                    key={activity.id || index}
                    className="rounded-lg border border-border overflow-hidden print:break-inside-avoid"
                  >
                    <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-wider text-primary">
                        Activity {index + 1}
                      </p>
                      <p className="text-sm font-bold">{activity.title}</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <DocumentField label="Activity Description">
                        {activity.description || <span className="italic text-muted-foreground">Not provided</span>}
                      </DocumentField>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-md border border-border bg-muted/10 px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                            Planned Workforce (from yesterday&apos;s target)
                          </p>
                          {(activity.plannedWorkforce || []).length > 0 ? (
                            <p className="text-sm font-bold">
                              {(activity.plannedWorkforce || [])
                                .map((e) => `${e.category} - ${e.count}`)
                                .join('    ')}
                            </p>
                          ) : (
                            <p className="text-xs italic text-muted-foreground">—</p>
                          )}
                        </div>
                        <div className="rounded-md border border-border bg-muted/10 px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                            Actual Labour Assigned
                          </p>
                          {actual.length > 0 ? (
                            <p className="text-sm font-bold">
                              {actual.map((e) => `${e.category} - ${e.count}`).join('    ')}
                            </p>
                          ) : (
                            <p className="text-xs italic text-muted-foreground">—</p>
                          )}
                        </div>
                      </div>
                      <div className="rounded-md border border-border bg-muted/10 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                          Activity Labour Cost Implication
                        </p>
                        {cost.lines.length > 0 ? (
                          <div className="space-y-0.5">
                            {cost.lines.map((line, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span>
                                  {line.category} ({line.count} x{' '}
                                  {line.rate > 0 ? formatKes(line.rate) : 'no rate'})
                                </span>
                                <span className="font-mono font-bold">{formatKes(line.cost)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between border-t border-border pt-1 mt-1">
                              <span className="text-xs font-black uppercase">Total</span>
                              <span className="font-mono font-black text-primary">
                                {formatKes(activity.labourCost ?? cost.total)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs italic text-muted-foreground">—</p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Verdict
                          </span>
                          {(['achieved', 'partially_achieved', 'not_achieved'] as const).map(
                            (value) => (
                              <span
                                key={value}
                                className={`inline-flex items-center gap-1 font-bold ${
                                  activity.verdict === value
                                    ? 'text-foreground'
                                    : 'text-muted-foreground/50'
                                }`}
                              >
                                {activity.verdict === value ? (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                                {VERDICT_LABELS[value]}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <DocumentField label="Remarks / Challenges">
                        {activity.remarks || <span className="italic text-muted-foreground">None</span>}
                      </DocumentField>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                          Photo Evidence (max 2)
                        </p>
                        {(activity.photos || []).length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 max-w-sm">
                            {(activity.photos || []).map((photo, i) => (
                              <div
                                key={i}
                                className="relative rounded-md border border-border overflow-hidden bg-muted/20"
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.name || `Photo ${i + 1}`}
                                  className="w-full aspect-[4/3] object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 max-w-[210mm]">
                            {[1, 2].map((n) => (
                              <div
                                key={n}
                                className="rounded-md border-2 border-dashed border-border aspect-[4/3] flex items-center justify-center text-[10px] italic text-muted-foreground"
                              >
                                Photo {n}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ---------------- B. NEXT DAY'S TARGET ---------------- */}
        <section>
          <DocumentSectionTitle>B. Next Day&apos;s Target</DocumentSectionTitle>
          <p className="text-sm mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Date:{' '}
            </span>
            <span className="font-bold">{formatDayLabel(nextDay)}</span>
          </p>
          {report.targets.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              No targets set for the next day.
            </p>
          ) : (
            <div className="space-y-4">
              {report.targets.map((target, index) => (
                <div
                  key={target.id || index}
                  className="rounded-lg border border-border overflow-hidden print:break-inside-avoid"
                >
                  <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wider text-primary">
                      Activity {index + 1}
                    </p>
                    <p className="text-sm font-bold">{target.title}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <DocumentField label="Activity Description">
                      {target.description || <span className="italic text-muted-foreground">Not provided</span>}
                    </DocumentField>
                    <div className="rounded-md border border-border bg-muted/10 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                        Target Workforce
                      </p>
                      {(target.workforce || []).length > 0 ? (
                        <p className="text-sm font-bold">
                          {(target.workforce || [])
                            .map((e) => `${e.category} - ${e.count}`)
                            .join('    ')}
                        </p>
                      ) : (
                        <p className="text-xs italic text-muted-foreground">—</p>
                      )}
                    </div>
                    <DocumentField label="Remarks">
                      {target.remarks || <span className="italic text-muted-foreground">None</span>}
                    </DocumentField>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                        Image / Document Upload (max 2)
                      </p>
                      {(target.uploads || []).length > 0 ? (
                        <div className="space-y-1">
                          {(target.uploads || []).map((upload, i) => {
                            const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(upload.url);
                            return (
                              <a
                                key={i}
                                href={upload.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                              >
                                <Paperclip className="h-3.5 w-3.5" />
                                {upload.name || `Attachment ${i + 1}`}
                              </a>
                            );
                          })}
                          {(() => {
                            const imageUploads = (target.uploads || []).filter((u) =>
                              /\.(png|jpe?g|gif|webp|svg)$/i.test(u.url)
                            );
                            if (imageUploads.length === 0) return null;
                            return (
                              <div className="grid grid-cols-2 gap-2 max-w-sm pt-1">
                                {imageUploads.slice(0, 2).map((upload, i) => (
                                  <div
                                    key={`img-${i}`}
                                    className="rounded-md border border-border overflow-hidden bg-muted/20"
                                  >
                                    <img
                                      src={upload.url}
                                      alt={upload.name || `Upload ${i + 1}`}
                                      className="w-full aspect-[4/3] object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-w-[210mm]">
                          {[1, 2].map((n) => (
                            <div
                              key={n}
                              className="rounded-md border-2 border-dashed border-border aspect-[4/3] flex items-center justify-center text-[10px] italic text-muted-foreground"
                            >
                              Image / Document {n}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- MATERIALS ---------------- */}
        <section>
          <DocumentSectionTitle>Materials Management</DocumentSectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border overflow-hidden print:break-inside-avoid">
              <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-black uppercase tracking-wider">Deliveries</p>
              </div>
              {report.deliveries.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  No deliveries listed.
                </p>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase">Item</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Qty</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Unit</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Supplier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.deliveries.map((delivery, i) => (
                      <TableRow key={delivery.id || i}>
                        <TableCell className="text-xs font-medium">{delivery.item}</TableCell>
                        <TableCell className="text-xs text-center font-mono">
                          {delivery.quantity}
                        </TableCell>
                        <TableCell className="text-xs">{delivery.unit || '-'}</TableCell>
                        <TableCell className="text-xs">{delivery.supplier || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="rounded-lg border border-border overflow-hidden print:break-inside-avoid">
              <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-amber-600" />
                <p className="text-xs font-black uppercase tracking-wider">Material Required</p>
              </div>
              {report.materials.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  No materials required listed.
                </p>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase">Item</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-center">Qty</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Unit</TableHead>
                      <TableHead className="text-[10px] font-black uppercase">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.materials.map((material, i) => (
                      <TableRow key={material.id || i}>
                        <TableCell className="text-xs font-medium">{material.item}</TableCell>
                        <TableCell className="text-xs text-center font-mono">
                          {material.quantity}
                        </TableCell>
                        <TableCell className="text-xs">{material.unit || '-'}</TableCell>
                        <TableCell className="text-xs">{material.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {dayDeliveries.length > 0 && (
            <div className="mt-4 rounded-lg border border-border overflow-hidden print:break-inside-avoid">
              <div className="px-3 py-2 bg-muted/40 border-b border-border">
                <p className="text-xs font-black uppercase tracking-wider">
                  Purchase Orders Received This Day
                </p>
              </div>
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase">PO#</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Supplier</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Items</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="text-xs font-black text-primary">
                        {delivery.orderNumber}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{delivery.supplier}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {delivery.items
                          .map((item) => `${item.description} (${item.quantity})`)
                          .join(', ')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="text-[9px] font-bold uppercase px-1.5 py-0 border-none bg-emerald-500/10 text-emerald-700">
                          {delivery.status === 'delivered' ? 'Delivered' : 'Partial'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {(report.uploads || []).length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                Materials Attachments / Delivery Notes
              </p>
              <div className="space-y-1">
                {(report.uploads || []).map((upload, i) => (
                  <a
                    key={i}
                    href={upload.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    {upload.name || `Attachment ${i + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ---------------- VISITORS ---------------- */}
        <section>
          <DocumentSectionTitle>Visitor Management</DocumentSectionTitle>
          <div className="rounded-lg border border-border overflow-hidden print:break-inside-avoid">
            {dayVisitors.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center">
                No visitors recorded for this day.
              </p>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase">Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Company</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Purpose</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">
                      Check-in
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">
                      Check-out
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayVisitors.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell className="text-xs font-medium">{visitor.name}</TableCell>
                      <TableCell className="text-xs">{visitor.company || '-'}</TableCell>
                      <TableCell className="text-xs">{visitor.purpose}</TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground">
                        {format(new Date(visitor.checkInTime), 'HH:mm')}
                      </TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground">
                        {visitor.checkOutTime
                          ? format(new Date(visitor.checkOutTime), 'HH:mm')
                          : 'On site'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </section>

        {/* ---------------- SAFETY ---------------- */}
        <section>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <DocumentSectionTitle>Safety — Incidences</DocumentSectionTitle>
          </div>
          <div className="rounded-lg border border-border overflow-hidden print:break-inside-avoid">
            {dayIncidents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center">
                No safety incidences recorded for this day.
              </p>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase">Title</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Type</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">
                      Severity
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="text-xs font-medium">{incident.title}</TableCell>
                      <TableCell className="text-xs">{incident.type}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`text-[9px] font-bold uppercase px-1.5 py-0 border-none ${
                            incident.severity?.toLowerCase() === 'high'
                              ? 'bg-red-500/10 text-red-700'
                              : incident.severity?.toLowerCase() === 'medium'
                                ? 'bg-amber-500/10 text-amber-700'
                                : 'bg-emerald-500/10 text-emerald-700'
                          }`}
                        >
                          {incident.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="text-[9px] font-bold uppercase px-1.5 py-0 border-none bg-blue-500/10 text-blue-700">
                          {incident.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </section>
      </div>

      <div className="border-t border-border px-6 py-3 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          Prepared {format(new Date(report.createdAt), 'EEE d MMM yyyy, HH:mm')}
          {report.updatedAt && report.updatedAt !== report.createdAt
            ? ` · Updated ${format(new Date(report.updatedAt), 'EEE d MMM yyyy, HH:mm')}`
            : ''}
        </span>
        <span className="flex items-center gap-1">
          <DoorOpen className="h-3 w-3" /> ReconSMI
        </span>
      </div>
    </div>
  );
}
