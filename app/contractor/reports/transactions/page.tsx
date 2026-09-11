'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Download,
  FileSpreadsheet,
  FileDown,
  Printer,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Search,
  Paperclip,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/toast-utils';
import { exportToCSV, exportToPDF } from '@/lib/export';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransactionRow {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  reference: string | null;
  receiptNumber: string | null;
  recipientName: string | null;
  proofDocumentUrl: string | null;
  proofDocumentName: string | null;
  transactionType: string | null;
  phoneNumber: string | null;
  accountReference: string | null;
  remarks: string | null;
  createdAt: string;
  walletName: string;
  currency: string;
}

interface ReportSummary {
  totalCredit: number;
  totalDebit: number;
  net: number;
  count: number;
}

export default function TransactionsReportPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [summary, setSummary] = useState<ReportSummary>({ totalCredit: 0, totalDebit: 0, net: 0, count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all',
    status: 'all',
  });

  const formatCurrency = (amount: number, currency = 'KES') =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedFilters.startDate) params.set('startDate', appliedFilters.startDate);
      if (appliedFilters.endDate) params.set('endDate', appliedFilters.endDate);
      if (appliedFilters.type !== 'all') params.set('type', appliedFilters.type);
      if (appliedFilters.status !== 'all') params.set('status', appliedFilters.status);

      const res = await fetch(`/web/api/reports/transactions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load transactions report');
      const json = await res.json();
      setTransactions(json.transactions || []);
      setSummary(json.summary || { totalCredit: 0, totalDebit: 0, net: 0, count: 0 });
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load the transactions report. Please refresh the page and try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const applyFilters = () => {
    setAppliedFilters({
      startDate,
      endDate,
      type: typeFilter,
      status: statusFilter,
    });
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setTypeFilter('all');
    setStatusFilter('all');
    setSearch('');
    setAppliedFilters({ startDate: '', endDate: '', type: 'all', status: 'all' });
  };

  const setQuickRange = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (tx.description?.toLowerCase().includes(q)) ||
      (tx.recipientName?.toLowerCase().includes(q)) ||
      (tx.reference?.toLowerCase().includes(q)) ||
      (tx.walletName?.toLowerCase().includes(q)) ||
      (tx.receiptNumber?.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast({ title: 'No data', description: 'There are no transactions to export.', variant: 'destructive' });
      return;
    }
    const rows = filteredTransactions.map((tx) => ({
      Date: new Date(tx.createdAt).toLocaleString(),
      Wallet: tx.walletName,
      Description: tx.description || '',
      'Payment Recipient': tx.recipientName || '',
      Reference: tx.reference || '',
      'Receipt No.': tx.receiptNumber || '',
      Type: tx.type,
      Amount: String(tx.amount),
      Status: tx.status,
      Currency: tx.currency,
    }));
    exportToCSV(rows, `transactions-report-${new Date().toISOString().split('T')[0]}`);
    toast({ title: 'Exported', description: 'CSV file downloaded', variant: 'success' });
  };

  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      toast({ title: 'No data', description: 'There are no transactions to export.', variant: 'destructive' });
      return;
    }
    const headers = ['Date', 'Wallet', 'Description', 'Recipient', 'Reference', 'Type', 'Amount', 'Status'];
    const rows = filteredTransactions.map((tx) => [
      new Date(tx.createdAt).toLocaleDateString(),
      tx.walletName,
      (tx.description || '').slice(0, 40),
      tx.recipientName || '-',
      tx.reference || '-',
      tx.type,
      formatCurrency(tx.amount, tx.currency),
      tx.status,
    ]);
    const rangeLabel = appliedFilters.startDate || appliedFilters.endDate
      ? `${appliedFilters.startDate || 'Start'} to ${appliedFilters.endDate || 'Now'}`
      : 'All time';
    exportToPDF(`Transactions Report - ${rangeLabel}`, headers, rows, `transactions-report-${new Date().toISOString().split('T')[0]}`);
    toast({ title: 'Exported', description: 'PDF file downloaded', variant: 'success' });
  };

  const handlePrintReport = () => {
    window.print();
  };

  const BRAND_BROWN: [number, number, number] = [139, 69, 19]; // #8B4513 saddle brown (primary)
  const BRAND_SIENNA: [number, number, number] = [160, 82, 45]; // #A0522D sienna (accent)
  const BRAND_TINT: [number, number, number] = [249, 245, 240]; // light brown tint
  const BRAND_ZEBRA: [number, number, number] = [252, 249, 246]; // zebra stripe tint
  const BRAND_LINE: [number, number, number] = [222, 205, 189]; // wheat/brown grid line

  const loadLogoDataUrl = async (): Promise<string | null> => {
    try {
      const res = await fetch('/default_full_logo.png');
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const printMiniReport = async (tx: TransactionRow) => {
    const doc = new jsPDF();

    // Header: brand logo (left) + title (right) in brand brown
    const logoDataUrl = await loadLogoDataUrl();
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 14, 11, 42, 11.07); // 4096x1080 logo, aspect preserved
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...BRAND_BROWN);
      doc.text('ReconSMI', 14, 18);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...BRAND_BROWN);
    doc.text('TRANSACTION MINI REPORT', 196, 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 21.5, { align: 'right' });

    // Brand brown divider rules
    doc.setDrawColor(...BRAND_BROWN);
    doc.setLineWidth(0.8);
    doc.line(14, 27, 196, 27);
    doc.setDrawColor(...BRAND_SIENNA);
    doc.setLineWidth(0.25);
    doc.line(14, 28.5, 196, 28.5);

    autoTable(doc, {
      startY: 34,
      head: [['Field', 'Value']],
      body: [
        ['Transaction ID', tx.id],
        ['Date', new Date(tx.createdAt).toLocaleString()],
        ['Wallet', tx.walletName],
        ['Description', tx.description || '-'],
        ['Payment Recipient', tx.recipientName || '-'],
        ['Type', tx.type],
        ['Amount', formatCurrency(tx.amount, tx.currency)],
        ['Status', tx.status],
        ['Reference', tx.reference || '-'],
        ['Receipt Number', tx.receiptNumber || '-'],
        ['Transaction Type', tx.transactionType || '-'],
        ['Phone Number', tx.phoneNumber || '-'],
        ['Account Reference', tx.accountReference || '-'],
        ['Remarks', tx.remarks || '-'],
        ['Proof Document', tx.proofDocumentName || (tx.proofDocumentUrl ? 'Uploaded file' : '-')],
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3, lineColor: BRAND_LINE, lineWidth: 0.1, textColor: [26, 26, 26] },
      headStyles: { fillColor: BRAND_BROWN, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: BRAND_ZEBRA },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, textColor: BRAND_BROWN, fillColor: BRAND_TINT } },
    });

    // Footer: brand rule + tagline
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...BRAND_SIENNA);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 14, 196, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_BROWN);
    doc.text('ReconSMI — Construction Hub', 105, pageHeight - 8, { align: 'center' });

    doc.save(`transaction-${tx.id}.pdf`);
    toast({ title: 'Downloaded', description: 'Mini report PDF downloaded', variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/contractor">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/contractor/reports">Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Transactions Report</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Transactions Report</h1>
          <p className="text-muted-foreground mt-1 text-sm italic">Full ledger of wallet transactions with recipient details.</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={isLoading}>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" /> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                <FileDown className="w-4 h-4" /> Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="gap-2" onClick={handlePrintReport} disabled={isLoading}>
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* Calendar / Date Filter */}
      <Card className="border-none shadow-md print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Filter Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">From Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-muted/30 border-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">To Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-muted/30 border-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-muted/30 border-none h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credit (Deposit)</SelectItem>
                  <SelectItem value="debit">Debit (Payout)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-muted/30 border-none h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="gap-2 flex-1">
                <Search className="w-4 h-4" /> Apply
              </Button>
              <Button variant="outline" onClick={resetFilters}>Reset</Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Quick ranges:</span>
            <Button variant="outline" size="sm" onClick={() => setQuickRange(1)}>Last Month</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange(3)}>Last 3 Months</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange(6)}>Last 6 Months</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange(12)}>Last Year</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground font-bold uppercase">Total Credits</p>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(summary.totalCredit)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm border-l-4 border-l-red-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <p className="text-xs text-muted-foreground font-bold uppercase">Total Debits</p>
            </div>
            <p className="text-xl font-bold text-red-600">{formatCurrency(summary.totalDebit)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-muted-foreground font-bold uppercase">Net Flow</p>
            </div>
            <p className={`text-xl font-bold ${summary.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(summary.net)}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground font-bold uppercase">Transactions</p>
            </div>
            <p className="text-2xl font-bold">{summary.count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Transaction Ledger</CardTitle>
              <CardDescription>
                {appliedFilters.startDate || appliedFilters.endDate
                  ? `${appliedFilters.startDate || 'Start'} — ${appliedFilters.endDate || 'Now'}`
                  : 'All time'}
              </CardDescription>
            </div>
            <div className="relative w-64 print:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-10 text-xs shadow-sm border-none bg-background" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground italic">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchReport}>Try Again</Button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-12 text-center">No transactions found for the selected filters.</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase">Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Wallet</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Description</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Payment Recipient</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Reference</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right">Amount</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-center">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-center print:hidden">Mini Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()}
                      <span className="block text-[10px]">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </TableCell>
                    <TableCell className="text-xs font-medium whitespace-nowrap">{tx.walletName}</TableCell>
                    <TableCell className="text-xs max-w-[180px] truncate">
                      {tx.description || '-'}
                      {tx.proofDocumentUrl && (
                        <a href={tx.proofDocumentUrl} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center text-primary hover:underline">
                          <Paperclip className="w-3 h-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{tx.recipientName || '-'}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{tx.reference || tx.receiptNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`text-[9px] font-bold uppercase px-1.5 py-0 border-none ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono text-xs font-bold whitespace-nowrap ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-[9px] font-bold uppercase px-1.5 py-0 border-none ${tx.status === 'completed' || tx.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'pending_approval' || tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : tx.status === 'failed' || tx.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center print:hidden">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printMiniReport(tx)} title="Print mini report">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
