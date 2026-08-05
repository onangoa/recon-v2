'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, Download, Trash2, Loader2, FileSpreadsheet } from 'lucide-react';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';

interface CsvImportColumn {
  key: string;
  label: string;
  required?: boolean;
}

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  columns: CsvImportColumn[];
  templateRows?: Record<string, string>[];
  endpoint: string;
  requestBodyKey: string;
  extraBody?: Record<string, string>;
  onSuccess: () => void;
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const rows = lines.slice(1)
    .map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] || '';
      });
      return obj;
    })
    .filter(row => Object.values(row).some(v => v.length > 0));

  return { headers, rows };
}

function generateCsvTemplate(columns: CsvImportColumn[], exampleRows?: Record<string, string>[]): string {
  const header = columns.map(c => c.key).join(',');
  const rows = (exampleRows && exampleRows.length > 0)
    ? exampleRows.map(row => columns.map(c => {
        const val = row[c.key] || '';
        return val.includes(',') || val.includes('"') ? `"${val}"` : val;
      }).join(','))
    : [columns.map(c => c.required ? `<${c.label}>` : c.label).join(',')];
  return [header, ...rows].join('\n');
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function CsvImportDialog({
  open,
  onOpenChange,
  title,
  description,
  columns,
  templateRows,
  endpoint,
  requestBodyKey,
  extraBody,
  onSuccess,
}: CsvImportDialogProps) {
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { rows } = parseCsv(text);
      if (rows.length === 0) {
        setError('No valid data found in CSV file. Ensure it has a header row and at least one data row.');
        return;
      }
      setParsedRows(rows);
      setStep('preview');
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to parse the CSV file. Please check the format and try again."));
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveRow = (index: number) => {
    setParsedRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    try {
      const body: Record<string, any> = { [requestBodyKey]: parsedRows };
      if (extraBody) Object.assign(body, extraBody);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (response.ok) {
        onSuccess();
        handleClose();
      } else {
        throw new Error(getApiError(result, "Unable to import the data. Please verify the file contents and try again."));
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to import the data. Please check your connection and try again."));
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setParsedRows([]);
    setError(null);
    onOpenChange(false);
  };

  const handleDownloadTemplate = () => {
    const csv = generateCsvTemplate(columns, templateRows);
    downloadCsv(`${title.toLowerCase().replace(/\s+/g, '-')}-template.csv`, csv);
  };

  const displayColumns = columns.slice(0, 6);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-2">CSV Format Requirements</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Required columns: <span className="font-medium text-foreground">{columns.filter(c => c.required).map(c => c.key).join(', ')}</span></p>
                <p>Optional columns: <span className="font-medium text-foreground">{columns.filter(c => !c.required).map(c => c.key).join(', ') || 'None'}</span></p>
              </div>
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4" />
              Download Template CSV
            </Button>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} ready to import
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setStep('upload'); setParsedRows([]); }}>
                  Choose Different File
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center">#</TableHead>
                    {displayColumns.map(col => (
                      <TableHead key={col.key} className={col.required ? 'font-bold' : ''}>
                        {col.label}
                        {col.required && <span className="text-destructive ml-0.5">*</span>}
                      </TableHead>
                    ))}
                    <TableHead className="w-[60px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                      {displayColumns.map(col => (
                        <TableCell key={col.key} className="text-sm max-w-[180px] truncate">
                          {row[col.key] || <span className="text-muted-foreground italic">—</span>}
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveRow(idx)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {parsedRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={displayColumns.length + 2} className="text-center text-muted-foreground py-8">
                        No rows to import. All rows have been removed.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || parsedRows.length === 0}
                className="gap-2"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isImporting ? 'Importing...' : `Import ${parsedRows.length} Row${parsedRows.length !== 1 ? 's' : ''}`}
              </Button>
            </>
          )}
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}