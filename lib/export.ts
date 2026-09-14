import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportToPDF(
  title: string,
  headers: string[],
  rows: string[][],
  filename: string,
  columnStyles?: Record<string, any>,
  options?: {
    /** Page orientation for wide tables. Default portrait. */
    orientation?: 'portrait' | 'landscape';
    /** Body font size. Default 8. */
    fontSize?: number;
    /** Header font size. Defaults to fontSize. */
    headFontSize?: number;
    /** Split tables wider than the page across multiple pages. */
    horizontalPageBreak?: boolean;
    /** Column keys (indexes as strings, or data keys) repeated on every horizontal page. */
    horizontalPageBreakRepeat?: string[];
  }
) {
  const {
    orientation = 'portrait',
    fontSize = 8,
    headFontSize,
    horizontalPageBreak = false,
    horizontalPageBreakRepeat,
  } = options || {};

  const doc = new jsPDF({ orientation });

  doc.setFontSize(16);
  doc.text(title, 14, 22);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  autoTable(doc, {
    startY: 36,
    head: [headers],
    body: rows,
    styles: { fontSize, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], fontSize: headFontSize ?? fontSize },
    columnStyles: columnStyles,
    ...(horizontalPageBreak ? { horizontalPageBreak: true as const, horizontalPageBreakRepeat } : {}),
  });

  doc.save(`${filename}.pdf`);
}