'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import type { SiteReportFieldsState } from '@/lib/site-report';

interface SiteReportFieldsSectionProps {
  fields: SiteReportFieldsState;
  onChange: (patch: Partial<SiteReportFieldsState>) => void;
  disabled?: boolean;
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50';

const labelClass =
  'block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider';

async function uploadSiteImage(file: File): Promise<string> {
  const data = new FormData();
  data.append('file', file);
  const res = await fetch('/web/api/upload', { method: 'POST', body: data });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || 'Failed to upload the site image');
  }
  const json = await res.json();
  if (!json?.url || typeof json.url !== 'string') {
    throw new Error('Failed to upload the site image');
  }
  return json.url as string;
}

export function SiteReportFieldsSection({
  fields,
  onChange,
  disabled,
}: SiteReportFieldsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFilePick = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadSiteImage(file);
      onChange({ image: url });
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload the site image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Plot / L.R No.</label>
            <input
              type="text"
              value={fields.plotNumber}
              onChange={(e) => onChange({ plotNumber: e.target.value })}
              placeholder="e.g. 1870/I/330"
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Built Up Area</label>
            <input
              type="text"
              value={fields.builtUpArea}
              onChange={(e) => onChange({ builtUpArea: e.target.value })}
              placeholder="e.g. 12,000 m²"
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>No. of Floors</label>
            <input
              type="number"
              min="0"
              value={fields.numberOfFloors}
              onChange={(e) => onChange({ numberOfFloors: e.target.value })}
              placeholder="e.g. 19"
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Commencement Date</label>
            <input
              type="date"
              value={fields.commencementDate}
              onChange={(e) => onChange({ commencementDate: e.target.value })}
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Expected Completion Date</label>
            <input
              type="date"
              value={fields.expectedCompletionDate}
              onChange={(e) => onChange({ expectedCompletionDate: e.target.value })}
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Contract Period (months)</label>
            <input
              type="number"
              min="0"
              value={fields.contractPeriodMonths}
              onChange={(e) => onChange({ contractPeriodMonths: e.target.value })}
              placeholder="Auto-computed from the dates when blank"
              disabled={disabled}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-6 space-y-4">
        <div>
          <label className={labelClass}>Site Image (report header)</label>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              disabled={disabled || uploading}
              onChange={(e) => handleFilePick(e.target.files?.[0])}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20 disabled:opacity-50"
            />
            {uploading && (
              <p className="text-xs text-gray-500 italic flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading image...
              </p>
            )}
            {uploadError && (
              <p className="text-xs text-red-600">{uploadError}</p>
            )}
            {fields.image && !uploading && (
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fields.image}
                  alt="Site image"
                  className="h-24 w-36 rounded-md border border-gray-300 object-cover"
                />
                <button
                  type="button"
                  onClick={() => onChange({ image: '' })}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" /> Remove image
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400">
              <ImagePlus className="mr-1 inline h-3.5 w-3.5" />
              Shown on the generated weekly progress report header.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          Overall Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Overall Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={fields.overallProgress}
              onChange={(e) => onChange({ overallProgress: e.target.value })}
              placeholder="e.g. 35"
              disabled={disabled}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Description of Progress</label>
            <textarea
              value={fields.progressDescription}
              onChange={(e) => onChange({ progressDescription: e.target.value })}
              placeholder="e.g. Construction has reached the second floor with most of the 1st floor finishes done"
              rows={2}
              disabled={disabled}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
