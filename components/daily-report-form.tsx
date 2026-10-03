'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  X,
  Upload,
  Loader2,
  Users,
  Camera,
  Save,
  Send,
  Info,
  PackageCheck,
  ShieldAlert,
  DoorOpen,
} from 'lucide-react';
import { addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/toast-utils';
import {
  computeLabourCost,
  formatDayLabel,
  formatKes,
  isTitleWithinWordLimit,
  MAX_TITLE_WORDS,
  parseISODate,
  toDateKey,
  VERDICT_OPTIONS,
  type DailyReportFull,
  type DailyReportMeta,
  type FileEntry,
  type WorkforceEntry,
} from '@/lib/daily-report';

const CUSTOM_TITLE = '__custom__';

interface ActivityState {
  title: string;
  description: string;
  actual: WorkforceEntry[];
  verdict: string;
  remarks: string;
  photos: FileEntry[];
}

interface TargetState {
  title: string;
  description: string;
  workforce: WorkforceEntry[];
  remarks: string;
  uploads: FileEntry[];
}

interface DeliveryRow {
  item: string;
  quantity: string;
  unit: string;
  supplier: string;
  notes: string;
}

interface MaterialRow {
  item: string;
  quantity: string;
  unit: string;
  notes: string;
}

interface DailyReportFormProps {
  siteId: string;
  reportDate: string;
  existing?: DailyReportFull | null;
  meta: DailyReportMeta;
}

function emptyActivity(): ActivityState {
  return { title: '', description: '', actual: [], verdict: '', remarks: '', photos: [] };
}

function emptyTarget(): TargetState {
  return { title: '', description: '', workforce: [], remarks: '', uploads: [] };
}

export function DailyReportForm({
  siteId,
  reportDate,
  existing,
  meta,
}: DailyReportFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [activities, setActivities] = useState<ActivityState[]>(() => {
    const existingActivities = (existing?.activities || [])
      .filter((activity) => activity.title)
      .map((activity) => ({
        title: activity.title,
        description: activity.description || '',
        actual: (activity.actualWorkforce || []) as WorkforceEntry[],
        verdict: activity.verdict || '',
        remarks: activity.remarks || '',
        photos: (activity.photos || []) as FileEntry[],
      }));
    return existingActivities.length > 0 ? existingActivities : [emptyActivity()];
  });

  const [targets, setTargets] = useState<TargetState[]>(() => {
    const existingTargets = (existing?.targets || [])
      .filter((target) => target.title)
      .map((target) => ({
        title: target.title,
        description: target.description || '',
        workforce: (target.workforce || []) as WorkforceEntry[],
        remarks: target.remarks || '',
        uploads: (target.uploads || []) as FileEntry[],
      }));
    return existingTargets.length > 0 ? existingTargets : [emptyTarget()];
  });

  const [deliveries, setDeliveries] = useState<DeliveryRow[]>(() =>
    (existing?.deliveries || []).map((d) => ({
      item: d.item,
      quantity: String(d.quantity ?? 0),
      unit: d.unit || '',
      supplier: d.supplier || '',
      notes: d.notes || '',
    }))
  );

  const [materials, setMaterials] = useState<MaterialRow[]>(() =>
    (existing?.materials || []).map((m) => ({
      item: m.item,
      quantity: String(m.quantity ?? 0),
      unit: m.unit || '',
      notes: m.notes || '',
    }))
  );

  const [attachments, setAttachments] = useState<FileEntry[]>(
    (existing?.uploads || []) as FileEntry[]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [busyUpload, setBusyUpload] = useState<string | null>(null);
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const nextDay = toDateKey(addDays(parseISODate(reportDate), 1));
  const totalWorkforce = meta.workforce.reduce((sum, entry) => sum + entry.count, 0);

  const plannedForTitle = (title: string): WorkforceEntry[] =>
    meta.prevDayTargets.find((t) => t.title === title)?.workforce || [];

  const costForActivity = (activity: ActivityState) =>
    computeLabourCost(activity.actual, meta.designations);

  const activityTitleSelectValue = (activity: ActivityState) => {
    if (!activity.title) return '';
    return meta.prevDayTargets.some((t) => t.title === activity.title)
      ? activity.title
      : CUSTOM_TITLE;
  };

  const uploadFile = async (file: File): Promise<FileEntry | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/web/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      return { url: json.url, name: json.fileName || file.name };
    } catch {
      toast({
        title: 'Upload failed',
        description: getErrorMessage(null, 'Could not upload the file. Please try again.'),
        variant: 'destructive',
      });
      return null;
    }
  };

  const handlePhotoPick = async (
    scope: string,
    index: number,
    file: File | undefined,
    max: number,
    onDone: (entries: FileEntry[]) => void,
    current: FileEntry[]
  ) => {
    if (!file) return;
    setBusyUpload(`${scope}-${index}`);
    const entry = await uploadFile(file);
    setBusyUpload(null);
    if (entry) {
      const next = [...current, entry].slice(0, max);
      onDone(next);
    }
  };

  const setActivity = (index: number, patch: Partial<ActivityState>) => {
    setActivities((prev) =>
      prev.map((activity, i) => (i === index ? { ...activity, ...patch } : activity))
    );
  };

  const removeActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  };

  const addActivity = () => {
    setActivities((prev) => [...prev, emptyActivity()]);
  };

  const setTarget = (index: number, patch: Partial<TargetState>) => {
    setTargets((prev) =>
      prev.map((target, i) => (i === index ? { ...target, ...patch } : target))
    );
  };

  const removeTarget = (index: number) => {
    setTargets((prev) => prev.filter((_, i) => i !== index));
  };

  const addTarget = () => {
    setTargets((prev) => [...prev, emptyTarget()]);
  };

  const save = async (status: 'Draft' | 'Submitted') => {
    const filledActivities = activities
      .filter((a) => a.title.trim() !== '')
      .map((a, index) => ({
        position: index + 1,
        title: a.title.trim(),
        description: a.description.trim() || null,
        plannedWorkforce: plannedForTitle(a.title.trim()),
        actualWorkforce: a.actual.filter((e) => e.category),
        verdict: a.verdict || null,
        remarks: a.remarks.trim() || null,
        photos: a.photos.slice(0, 2),
      }));
    const filledTargets = targets
      .filter((t) => t.title.trim() !== '')
      .map((t, index) => ({
        position: index + 1,
        title: t.title.trim(),
        description: t.description.trim() || null,
        workforce: t.workforce.filter((e) => e.category),
        remarks: t.remarks.trim() || null,
        uploads: t.uploads.slice(0, 2),
      }));
    const filledDeliveries = deliveries
      .filter((d) => d.item.trim() !== '')
      .map((d) => ({
        item: d.item.trim(),
        quantity: Number(d.quantity) || 0,
        unit: d.unit.trim() || null,
        supplier: d.supplier.trim() || null,
        notes: d.notes.trim() || null,
      }));
    const filledMaterials = materials
      .filter((m) => m.item.trim() !== '')
      .map((m) => ({
        item: m.item.trim(),
        quantity: Number(m.quantity) || 0,
        unit: m.unit.trim() || null,
        notes: m.notes.trim() || null,
      }));

    if (status === 'Submitted' && filledActivities.length === 0) {
      toast({
        title: 'Add at least one activity',
        description: "Fill in an activity under Today's Performance before submitting.",
        variant: 'destructive',
      });
      return;
    }

    const invalidTitle = [...filledActivities, ...filledTargets].find((entry) =>
      !isTitleWithinWordLimit(entry.title)
    );
    if (invalidTitle) {
      toast({
        title: 'Title is too long',
        description: `Activity titles must be ${MAX_TITLE_WORDS} words or fewer: "${invalidTitle.title}".`,
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        siteId,
        reportDate,
        status,
        uploads: attachments,
        activities: filledActivities,
        targets: filledTargets,
        deliveries: filledDeliveries,
        materials: filledMaterials,
      };
      const res = existing?.id
        ? await fetch(`/web/api/daily-reports/${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/web/api/daily-reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 && json.existingId) {
          toast({
            title: 'Report already exists',
            description: 'A report for this date was already created. Opening it for editing.',
            variant: 'destructive',
          });
          router.replace(`/contractor/reports/daily/${json.existingId}/edit`);
          return;
        }
        throw new Error(json.error || 'Failed to save report');
      }
      toast({
        title: status === 'Submitted' ? 'Report submitted' : 'Draft saved',
        description: `Daily site report for ${formatDayLabel(reportDate)} has been ${
          status === 'Submitted' ? 'submitted' : 'saved as a draft'
        }.`,
        variant: 'success',
      });
      router.push('/contractor/reports/daily');
    } catch (err: any) {
      toast({
        title: 'Could not save report',
        description: getErrorMessage(err, 'Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderWorkforceEditor = (
    entries: WorkforceEntry[],
    onChange: (entries: WorkforceEntry[]) => void
  ) => {
    const usedCategories = entries.map((e) => e.category.toLowerCase());
    return (
      <div className="space-y-2">
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No labour assigned yet. Add the categories and numbers assigned to this activity.
          </p>
        )}
        {entries.map((entry, index) => {
          const duplicates = entries.filter(
            (e, i) => i !== index && e.category.toLowerCase() === entry.category.toLowerCase()
          );
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="w-48">
                <Select
                  value={entry.category || undefined}
                  onValueChange={(value) => {
                    const next = [...entries];
                    next[index] = { ...next[index], category: value };
                    onChange(next);
                  }}
                >
                  <SelectTrigger className="bg-muted/30 border-none h-9 text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.designations.map((designation) => (
                      <SelectItem
                        key={designation.id}
                        value={designation.title}
                        disabled={
                          usedCategories.includes(designation.title.toLowerCase()) &&
                          designation.title.toLowerCase() !== entry.category.toLowerCase()
                        }
                      >
                        {designation.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="number"
                min={0}
                className="w-24 bg-muted/30 border-none h-9 text-sm text-center font-bold"
                value={entry.count}
                onChange={(e) => {
                  const next = [...entries];
                  next[index] = {
                    ...next[index],
                    count: Math.max(0, Number(e.target.value) || 0),
                  };
                  onChange(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => onChange(entries.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {duplicates.length > 0 && (
                <span className="text-[10px] font-bold text-destructive uppercase">
                  Duplicate category
                </span>
              )}
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 h-8 text-xs"
          onClick={() => onChange([...entries, { category: '', count: 1 }])}
        >
          <Plus className="h-3.5 w-3.5" /> Add labour
        </Button>
      </div>
    );
  };

  const renderPhotoSlots = (
    scope: string,
    photos: FileEntry[],
    max: number,
    accept: string,
    onChange: (entries: FileEntry[]) => void
  ) => (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: max }).map((_, index) => {
        const entry = photos[index];
        const inputKey = `${scope}-${index}`;
        return (
          <div
            key={inputKey}
            className="relative border-2 border-dashed border-border rounded-lg bg-muted/20 aspect-[4/3] flex flex-col items-center justify-center overflow-hidden"
          >
            {entry ? (
              <>
                <img
                  src={entry.url}
                  alt={entry.name || 'Evidence'}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full shadow"
                  onClick={() => onChange(photos.filter((_, i) => i !== index))}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">
                  {entry.name || 'Attachment'}
                </span>
              </>
            ) : (
              <button
                type="button"
                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                disabled={busyUpload === inputKey || photos.length >= max}
                onClick={() => photoInputRefs.current[inputKey]?.click()}
              >
                {busyUpload === inputKey ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 opacity-60" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {scope.includes('materials')
                    ? 'Attachment'
                    : scope.includes('target')
                      ? 'Image / Document'
                      : 'Photo'}{' '}
                  {index + 1}
                </span>
                <span className="text-[10px] italic">Click to upload</span>
              </button>
            )}
            <input
              ref={(el) => {
                photoInputRefs.current[inputKey] = el;
              }}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) {
                  handlePhotoPick(scope, index, file, max, onChange, photos);
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );

  const costTables = useMemo(
    () => activities.map((activity) => costForActivity(activity)),
    [activities, meta.designations]
  );

  return (
    <div className="space-y-6 pb-24">
      {/* ---------------- A. TODAY'S PERFORMANCE ---------------- */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                A. Today&apos;s Performance
              </CardTitle>
              <CardDescription className="text-sm font-bold text-primary">
                {formatDayLabel(reportDate)}
                <span className="text-muted-foreground font-medium italic">
                  {' '}
                  (date &amp; day are automatic and cannot be edited)
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-background rounded-lg border border-border px-3 py-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Total workforce on site
                </p>
                <p className="text-xs font-bold">
                  {totalWorkforce > 0
                    ? meta.workforce.map((w) => `${w.category} - ${w.count}`).join('    ')
                    : 'No attendance records for today'}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-6">
          {meta.prevDayTargets.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-muted/30 border border-border p-3">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Activity titles and planned workforce below are picked from{' '}
                <span className="font-bold text-foreground">
                  yesterday&apos;s next-day targets
                </span>
                : {meta.prevDayTargets.map((t) => t.title).join(' · ')}
              </p>
            </div>
          )}

          {activities.map((activity, index) => {
            const planned = plannedForTitle(activity.title.trim());
            const cost = costTables[index];
            return (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-background overflow-hidden"
                >
                  <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between gap-2">
                    <p className="text-sm font-black uppercase tracking-wider text-primary">
                      Activity {index + 1}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground italic hidden sm:block">
                        Title max 5 words
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeActivity(index)}
                        title="Remove activity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase">Activity Title</Label>
                      {meta.prevDayTargets.length > 0 ? (
                        <div className="space-y-2">
                          <Select
                            value={activityTitleSelectValue(activity) || undefined}
                            onValueChange={(value) =>
                              setActivity(index, {
                                title: value === CUSTOM_TITLE ? '' : value,
                              })
                            }
                          >
                            <SelectTrigger className="bg-muted/30 border-none h-10 text-sm font-bold">
                              <SelectValue placeholder="Pick from yesterday's targets" />
                            </SelectTrigger>
                            <SelectContent>
                              {meta.prevDayTargets.map((target) => (
                                <SelectItem key={target.id} value={target.title}>
                                  {target.title}
                                </SelectItem>
                              ))}
                              <SelectItem value={CUSTOM_TITLE}>Custom title…</SelectItem>
                            </SelectContent>
                          </Select>
                          {(activityTitleSelectValue(activity) === CUSTOM_TITLE ||
                            !activity.title) && (
                            <Input
                              placeholder="Type a short activity title (max 5 words)"
                              maxLength={60}
                              className="bg-muted/30 border-none h-10"
                              value={activity.title}
                              onChange={(e) => {
                                if (isTitleWithinWordLimit(e.target.value)) {
                                  setActivity(index, { title: e.target.value });
                                }
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <Input
                          placeholder="Short activity title (max 5 words)"
                          maxLength={60}
                          className="bg-muted/30 border-none h-10 font-bold"
                          value={activity.title}
                          onChange={(e) => {
                            if (isTitleWithinWordLimit(e.target.value)) {
                              setActivity(index, { title: e.target.value });
                            }
                          }}
                        />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase">
                        Activity Description
                      </Label>
                      <Input
                        placeholder="Describe the activity carried out today"
                        className="bg-muted/30 border-none h-10"
                        value={activity.description}
                        onChange={(e) =>
                          setActivity(index, { description: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase">
                        Planned Workforce{' '}
                        <span className="font-medium italic text-muted-foreground normal-case">
                          (auto from yesterday&apos;s target)
                        </span>
                      </Label>
                      <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 min-h-[40px]">
                        {planned.length > 0 ? (
                          <p className="text-sm font-bold">
                            {planned
                              .map((entry) => `${entry.category} - ${entry.count}`)
                              .join('    ')}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            {activity.title.trim()
                              ? "No matching target in yesterday's plan"
                              : 'Pick an activity title first'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase">
                        Actual Labour Assigned
                      </Label>
                      {renderWorkforceEditor(activity.actual, (actual) =>
                        setActivity(index, { actual })
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase">
                      Activity Labour Cost Implication{' '}
                      <span className="font-medium italic text-muted-foreground normal-case">
                        (auto-calculated from the labour above)
                      </span>
                    </Label>
                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                      {cost.lines.length > 0 ? (
                        <div className="space-y-1">
                          {cost.lines.map((line, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="font-medium">
                                {line.category} ({line.count} x{' '}
                                {line.rate > 0 ? formatKes(line.rate) : 'no rate'})
                              </span>
                              <span className="font-mono font-bold">
                                {formatKes(line.cost)}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between border-t border-border pt-2 mt-2">
                            <span className="text-sm font-black uppercase">Total</span>
                            <span className="font-mono font-black text-primary">
                              {formatKes(cost.total)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Cost appears once actual labour is assigned
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase">Verdict</Label>
                      <RadioGroup
                        value={activity.verdict}
                        onValueChange={(verdict) => setActivity(index, { verdict })}
                        className="flex flex-row flex-wrap gap-4 pt-1"
                      >
                        {VERDICT_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`verdict-${index}-${option.value}`} />
                            <Label
                              htmlFor={`verdict-${index}-${option.value}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase">
                        Remarks / Challenges
                      </Label>
                      <Textarea
                        placeholder="Any remarks or challenges encountered"
                        className="bg-muted/30 border-none min-h-[80px] text-sm"
                        value={activity.remarks}
                        onChange={(e) => setActivity(index, { remarks: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase">
                      Photo Evidence{' '}
                      <span className="font-medium italic text-muted-foreground normal-case">
                        (maximum 2 photos)
                      </span>
                    </Label>
                    {renderPhotoSlots(
                      `activity-${index}`,
                      activity.photos,
                      2,
                      'image/*',
                      (photos) => setActivity(index, { photos })
                    )}
                  </div>
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 h-9"
              onClick={addActivity}
            >
              <Plus className="h-4 w-4" /> Add Activity
            </Button>
            <p className="text-[10px] text-muted-foreground italic">
              Add as many activities as were carried out today — there is no fixed limit.
            </p>
          </CardContent>
        </Card>

      {/* ---------------- B. NEXT DAY'S TARGET ---------------- */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border">
          <CardTitle className="text-lg font-bold">B. Next Day&apos;s Target</CardTitle>
          <CardDescription className="text-sm font-bold text-primary">
            {formatDayLabel(nextDay)}
            <span className="text-muted-foreground font-medium italic">
              {' '}
              (date &amp; day are automatic and cannot be edited)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-6">
          {targets.map((target, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-background overflow-hidden"
              >
                <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between gap-2">
                  <p className="text-sm font-black uppercase tracking-wider text-primary">
                    Activity {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeTarget(index)}
                    title="Remove target"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase">
                      Activity Title{' '}
                      <span className="font-medium italic text-muted-foreground normal-case">
                        (max 5 words)
                      </span>
                    </Label>
                    <Input
                      placeholder="Short title for tomorrow's target"
                      maxLength={60}
                      className="bg-muted/30 border-none h-10 font-bold"
                      value={target.title}
                      onChange={(e) => {
                        if (isTitleWithinWordLimit(e.target.value)) {
                          setTarget(index, { title: e.target.value });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase">
                      Activity Description
                    </Label>
                    <Input
                      placeholder="Describe the planned activity"
                      className="bg-muted/30 border-none h-10"
                      value={target.description}
                      onChange={(e) => setTarget(index, { description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">Target Workforce</Label>
                  {renderWorkforceEditor(target.workforce, (workforce) =>
                    setTarget(index, { workforce })
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">Remarks</Label>
                  <Textarea
                    placeholder="Remarks for tomorrow's target"
                    className="bg-muted/30 border-none min-h-[70px] text-sm"
                    value={target.remarks}
                    onChange={(e) => setTarget(index, { remarks: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">
                    Image / Document Upload{' '}
                    <span className="font-medium italic text-muted-foreground normal-case">
                      (maximum 2)
                    </span>
                  </Label>
                  {renderPhotoSlots(
                    `target-${index}`,
                    target.uploads,
                    2,
                    'image/*,.pdf,.doc,.docx',
                    (uploads) => setTarget(index, { uploads })
                  )}
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 h-9"
            onClick={addTarget}
          >
            <Plus className="h-4 w-4" /> Add Target Activity
          </Button>
          <p className="text-[10px] text-muted-foreground italic">
            Add as many target activities as planned for the next day.
          </p>
        </CardContent>
      </Card>

      {/* ---------------- MATERIALS ---------------- */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border">
          <CardTitle className="text-lg font-bold">Materials Management</CardTitle>
          <CardDescription>
            List the deliveries received today and the materials required.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold uppercase">Deliveries</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 h-8 text-xs"
                onClick={() =>
                  setDeliveries((prev) => [
                    ...prev,
                    { item: '', quantity: '', unit: '', supplier: '', notes: '' },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </Button>
            </div>
            {deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-2">
                No delivery items listed.
              </p>
            ) : (
              <div className="space-y-2">
                {deliveries.map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center rounded-lg border border-border bg-muted/10 p-2"
                  >
                    <Input
                      className="col-span-12 md:col-span-4 bg-background border-none h-9 text-sm"
                      placeholder="Item delivered"
                      value={row.item}
                      onChange={(e) => {
                        const next = [...deliveries];
                        next[index] = { ...next[index], item: e.target.value };
                        setDeliveries(next);
                      }}
                    />
                    <Input
                      className="col-span-4 md:col-span-2 bg-background border-none h-9 text-sm text-center"
                      type="number"
                      min={0}
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => {
                        const next = [...deliveries];
                        next[index] = { ...next[index], quantity: e.target.value };
                        setDeliveries(next);
                      }}
                    />
                    <Input
                      className="col-span-4 md:col-span-2 bg-background border-none h-9 text-sm"
                      placeholder="Unit"
                      value={row.unit}
                      onChange={(e) => {
                        const next = [...deliveries];
                        next[index] = { ...next[index], unit: e.target.value };
                        setDeliveries(next);
                      }}
                    />
                    <Input
                      className="col-span-4 md:col-span-3 bg-background border-none h-9 text-sm"
                      placeholder="Supplier"
                      value={row.supplier}
                      onChange={(e) => {
                        const next = [...deliveries];
                        next[index] = { ...next[index], supplier: e.target.value };
                        setDeliveries(next);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="col-span-12 md:col-span-1 h-9 w-9 text-muted-foreground hover:text-destructive justify-self-end"
                      onClick={() => setDeliveries(deliveries.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Input
                      className="col-span-12 bg-background border-none h-9 text-sm"
                      placeholder="Notes (optional)"
                      value={row.notes}
                      onChange={(e) => {
                        const next = [...deliveries];
                        next[index] = { ...next[index], notes: e.target.value };
                        setDeliveries(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold uppercase">Material Required</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 h-8 text-xs"
                onClick={() =>
                  setMaterials((prev) => [
                    ...prev,
                    { item: '', quantity: '', unit: '', notes: '' },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </Button>
            </div>
            {materials.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-2">
                No required materials listed.
              </p>
            ) : (
              <div className="space-y-2">
                {materials.map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center rounded-lg border border-border bg-muted/10 p-2"
                  >
                    <Input
                      className="col-span-12 md:col-span-4 bg-background border-none h-9 text-sm"
                      placeholder="Material required"
                      value={row.item}
                      onChange={(e) => {
                        const next = [...materials];
                        next[index] = { ...next[index], item: e.target.value };
                        setMaterials(next);
                      }}
                    />
                    <Input
                      className="col-span-4 md:col-span-2 bg-background border-none h-9 text-sm text-center"
                      type="number"
                      min={0}
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => {
                        const next = [...materials];
                        next[index] = { ...next[index], quantity: e.target.value };
                        setMaterials(next);
                      }}
                    />
                    <Input
                      className="col-span-4 md:col-span-2 bg-background border-none h-9 text-sm"
                      placeholder="Unit"
                      value={row.unit}
                      onChange={(e) => {
                        const next = [...materials];
                        next[index] = { ...next[index], unit: e.target.value };
                        setMaterials(next);
                      }}
                    />
                    <Input
                      className="col-span-3 md:col-span-3 bg-background border-none h-9 text-sm"
                      placeholder="Notes (optional)"
                      value={row.notes}
                      onChange={(e) => {
                        const next = [...materials];
                        next[index] = { ...next[index], notes: e.target.value };
                        setMaterials(next);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="col-span-1 md:col-span-1 h-9 w-9 text-muted-foreground hover:text-destructive justify-self-end"
                      onClick={() => setMaterials(materials.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {meta.deliveries.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-emerald-600" />
                <Label className="text-sm font-bold uppercase">
                  Purchase Orders Received Today
                </Label>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-xs font-bold uppercase">PO#</TableHead>
                      <TableHead className="text-xs font-bold uppercase">Supplier</TableHead>
                      <TableHead className="text-xs font-bold uppercase">Items</TableHead>
                      <TableHead className="text-xs font-bold uppercase text-center">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meta.deliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell className="text-xs font-black text-primary">
                          {delivery.orderNumber}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {delivery.supplier}
                        </TableCell>
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
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <Label className="text-sm font-bold uppercase">
                Materials Attachments / Delivery Notes
              </Label>
            </div>
            {renderPhotoSlots('materials-attach', attachments, 5, 'image/*,.pdf,.doc,.docx', setAttachments)}
          </div>
        </CardContent>
      </Card>

      {/* ---------------- VISITORS ---------------- */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border">
          <div className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-bold">Visitors</CardTitle>
              <CardDescription>
                Picked automatically from the visitors section for this day.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {meta.visitors.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-6 text-center">
              No visitors recorded for this day.
            </p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase">Name</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Company</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Purpose</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-center">
                    Check-in
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase text-center">
                    Check-out
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meta.visitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell className="text-sm font-medium">{visitor.name}</TableCell>
                    <TableCell className="text-sm">{visitor.company || '-'}</TableCell>
                    <TableCell className="text-sm">{visitor.purpose}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {new Date(visitor.checkInTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {visitor.checkOutTime
                        ? new Date(visitor.checkOutTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'On site'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ---------------- SAFETY / INCIDENCES ---------------- */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <div>
              <CardTitle className="text-lg font-bold">Incidences</CardTitle>
              <CardDescription>
                Picked automatically from the safety docket for this day.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {meta.incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-6 text-center">
              No safety incidences recorded for this day.
            </p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase">Title</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Type</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-center">
                    Severity
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase text-center">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meta.incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="text-sm font-medium">{incident.title}</TableCell>
                    <TableCell className="text-sm">{incident.type}</TableCell>
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
        </CardContent>
      </Card>

      {/* ---------------- Sticky actions ---------------- */}
      <div className="fixed bottom-0 inset-x-0 z-20 border-t border-border bg-background/95 backdrop-blur px-4 py-3 print:hidden">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground italic hidden sm:block">
            {existing?.id
              ? `Editing report for ${formatDayLabel(reportDate)}`
              : `Creating report for ${formatDayLabel(reportDate)}`}
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              className="gap-2"
              disabled={isSaving}
              onClick={() => save('Draft')}
            >
              <Save className="h-4 w-4" /> Save Draft
            </Button>
            <Button
              className="gap-2 bg-primary hover:bg-primary/90 text-white"
              disabled={isSaving}
              onClick={() => save('Submitted')}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
