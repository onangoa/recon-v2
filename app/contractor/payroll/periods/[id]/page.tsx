'use client';

import { useState, useEffect, use } from 'react';
import { 
  Coins, 
  RotateCcw, 
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Loader2,
  ArrowLeft,
  FileText,
  User,
  CreditCard,
  Send,
  Play,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileSpreadsheet,
  FileDown,
  Fingerprint,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { exportToCSV, exportToPDF } from '@/lib/export';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SalarySlipDetail {
  id: string;
  name: string;
  type: string;
  amount: number;
  isStatutory: boolean;
}

interface SalarySlip {
  id: string;
  worker: {
    name: string;
    phone: string | null;
    nationalId: string | null;
    paymentMode: string;
    paymentPhone: string | null;
    paymentAccount: string | null;
  };
  designation: {
    title: string;
  } | null;
  basicSalary: number;
  totalAllowance: number;
  totalDeductions: number;
  grossPay: number;
  payeTax: number;
  personalRelief: number;
  netPay: number;
  // Attendance-derived fields
  overtimeHours: number;
  overtimePay: number;
  daysWorked: number;
  workingDays: number;
  attainedDays: number;
  workingHours: number;
  attainedHours: number;
  lateDays: number;
  lateHours: number;
  leaveDays: number;
  leaveHours: number;
  status: string;
  note?: string | null;
  details: SalarySlipDetail[];
}

interface PayrollPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  paymentFrequency: string;
  status: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  salarySlips: SalarySlip[];
}

export default function PayrollPeriodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  
  const [period, setPeriod] = useState<PayrollPeriod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [disburseResult, setDisburseResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  
  const [viewingSlip, setViewingSlip] = useState<SalarySlip | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [payrollMode, setPayrollMode] = useState<'full' | 'simple' | 'simple_overtime'>('full');
  const [attendancePreview, setAttendancePreview] = useState<any[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchPeriod = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/web/api/payroll-periods/${id}`);
      if (!response.ok) throw new Error('Unable to load the payroll period. Please refresh the page and try again.');
      const data = await response.json();
      setPeriod(data);
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to load the payroll period. Please refresh the page and try again."), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriod();
  }, [id]);

  const fetchAttendancePreview = async () => {
    setLoadingPreview(true);
    try {
      const startDate = new Date(period!.startDate).toISOString().split('T')[0];
      const endDate = new Date(period!.endDate).toISOString().split('T')[0];
      const res = await fetch(`/web/api/attendance?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error('Failed to fetch attendance');
      const data = await res.json();
      const byWorker = new Map<string, { name: string; days: number; hours: number; overtime: number; lateDays: number }>();
      for (const a of data) {
        const existing = byWorker.get(a.worker.id) || { name: a.worker.name, days: 0, hours: 0, overtime: 0, lateDays: 0 };
        if (a.status !== 'Absent' && a.checkIn) existing.days++;
        existing.hours += a.totalHours || 0;
        existing.overtime += a.overtimeHours || 0;
        existing.lateDays += a.lateDays || 0;
        byWorker.set(a.worker.id, existing);
      }
      setAttendancePreview(Array.from(byWorker.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to load attendance preview."), variant: "destructive" });
      setAttendancePreview([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleOpenProcessDialog = () => {
    setShowProcessDialog(true);
    fetchAttendancePreview();
  };

  const handleProcessPayroll = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/web/api/payroll-periods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processing', payrollMode }),
      });

      if (!response.ok) throw new Error('Unable to process the payroll. Please try again.');
      
      toast({ title: "Success", description: "Payroll calculation completed. Attendance has been linked." });
      setShowProcessDialog(false);
      fetchPeriod();
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to process the payroll. Please check your connection and try again."), variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenDisburse = async () => {
    try {
      const res = await fetch('/web/api/wallets');
      if (!res.ok) throw new Error('Unable to load the wallets. Please refresh the page and try again.');
      const data = await res.json();
      setWallets(data.wallets || data);
      setShowDisburseDialog(true);
      setDisburseResult(null);
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to load the wallets. Please refresh the page and try again."), variant: "destructive" });
    }
  };

  const handleDisburse = async () => {
    if (!selectedWalletId) {
      toast({ title: "Error", description: "Please select a wallet", variant: "destructive" });
      return;
    }
    setIsDisbursing(true);
    try {
      const res = await fetch(`/web/api/payroll-periods/${id}/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: selectedWalletId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(getApiError(data, "Unable to disburse the payroll. Please verify the details and try again."));
      setDisburseResult(data);
      toast({ title: "Disbursement Complete", description: `${data.mpesa} M-Pesa payments pending approval, ${data.manual} manual payments completed${data.alreadyDisbursed > 0 ? `, ${data.alreadyDisbursed} already disbursed` : ''}`, variant: "success" });
      fetchPeriod();
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to disburse the payroll. Please check your connection and try again."), variant: "destructive" });
    } finally {
      setIsDisbursing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const handleExportCSV = () => {
    if (!period || period.salarySlips.length === 0) return;
    const data = period.salarySlips.map(s => ({
      'Worker': s.worker.name,
      'Designation': s.designation?.title || 'N/A',
      'Days Worked': String(s.daysWorked),
      'Working Days': String(s.workingDays),
      'Hours Worked': s.attainedHours.toFixed(1),
      'Expected Hours': s.workingHours.toFixed(1),
      'Overtime Hours': s.overtimeHours.toFixed(1),
      'Overtime Pay': s.overtimePay.toFixed(2),
      'Late Days': String(s.lateDays),
      'Late Hours': s.lateHours.toFixed(1),
      'Basic Salary': s.basicSalary.toFixed(2),
      'Gross Pay': s.grossPay.toFixed(2),
      'PAYE Tax': s.payeTax.toFixed(2),
      'Total Deductions': s.totalDeductions.toFixed(2),
      'Net Pay': s.netPay.toFixed(2),
      'Status': s.status || 'draft',
    }));
    exportToCSV(data, `payslips-${period.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`);
    toast({ title: "Exported", description: "CSV file downloaded", variant: "success" });
  };

  const handleExportPDF = () => {
    if (!period || period.salarySlips.length === 0) return;
    const headers = ['Worker', 'Designation', 'Days', 'Hours', 'OT Hrs', 'OT Pay', 'Gross', 'PAYE', 'Net Pay', 'Status'];
    const rows = period.salarySlips.map(s => [
      s.worker.name,
      s.designation?.title || 'N/A',
      `${s.daysWorked}/${s.workingDays}`,
      s.attainedHours.toFixed(1),
      s.overtimeHours.toFixed(1),
      formatCurrency(s.overtimePay),
      formatCurrency(s.grossPay),
      formatCurrency(s.payeTax),
      formatCurrency(s.netPay),
      s.status || 'draft',
    ]);
    exportToPDF(`Payslips - ${period.name}`, headers, rows, `payslips-${period.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`, { 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } });
    toast({ title: "Exported", description: "PDF file downloaded", variant: "success" });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">Loading period details...</p>
      </div>
    );
  }

  if (!period) return null;

  const filteredSlips = period.salarySlips.filter(s => 
    s.worker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSlips.length / limit);
  const paginatedSlips = filteredSlips.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <div className="space-y-6 text-foreground">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/contractor">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/contractor/payroll">Payroll</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{period.name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/contractor/payroll"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-primary">{period.name}</h1>
              <div className="flex gap-2">
                <Badge className="bg-primary/10 text-primary border-none uppercase text-[10px] font-bold">
                  {period.paymentFrequency || 'monthly'}
                </Badge>
                <Badge className={`
                  uppercase text-[10px] font-bold
                  ${period.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 
                    period.status === 'processing' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-600'}
                `}>
                  {period.status}
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPeriod} variant="outline" size="icon">
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {period.status === 'draft' && (
            <Button onClick={handleOpenProcessDialog} disabled={isProcessing} className="gap-2">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Process Payroll
            </Button>
          )}
          {period.status === 'completed' && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2" disabled={period.salarySlips.length === 0}>
                    <Download className="w-4 h-4" /> Export
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
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleOpenDisburse}>
                <Send className="w-4 h-4" /> Disburse Payroll
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Gross Pay</p>
            <h3 className="text-xl font-bold">{formatCurrency(period.totalGrossPay)}</h3>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Deductions</p>
            <h3 className="text-xl font-bold text-red-600">{formatCurrency(period.totalDeductions)}</h3>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Total Net Pay</p>
            <h3 className="text-2xl font-black text-emerald-600">{formatCurrency(period.totalNetPay)}</h3>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Fingerprint className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Days Worked</p>
                <h3 className="text-xl font-bold">{period.salarySlips.reduce((acc, s) => acc + s.daysWorked, 0)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Timer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Hours</p>
                <h3 className="text-xl font-bold">{period.salarySlips.reduce((acc, s) => acc + s.attainedHours, 0).toFixed(1)}h</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Overtime</p>
                <h3 className="text-xl font-bold text-orange-600">{period.salarySlips.reduce((acc, s) => acc + s.overtimeHours, 0).toFixed(1)}h</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Salary Slips</CardTitle>
              <CardDescription>Individual breakdown for all workers in this period.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter by worker name..." 
                className="h-9 pl-10 text-xs shadow-sm border-none bg-background" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {period.salarySlips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <FileText className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No salary slips generated yet.</p>
              {period.status === 'draft' && (
                <p className="text-xs">Click "Process Payroll" to generate slips for this period.</p>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Worker</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Designation</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Days</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Hours</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">OT Hrs</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Gross Pay</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right text-red-600">PAYE Tax</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right text-emerald-600">Net Pay</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSlips.map((slip) => (
                    <TableRow key={slip.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-primary/10 rounded-full">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{slip.worker.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">{slip.worker.phone || 'No phone'}</span>
                              {slip.worker.paymentMode && slip.worker.paymentMode !== 'manual' && (
                                <Badge className="text-[8px] px-1 py-0 bg-blue-100 text-blue-700 border-none uppercase font-bold">
                                  {slip.worker.paymentMode}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {slip.designation?.title || 'Worker'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-sm">{slip.daysWorked}</span>
                          <span className="text-[10px] text-muted-foreground">/ {slip.workingDays || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-xs font-bold">{slip.attainedHours.toFixed(1)}h</span>
                        <p className="text-[10px] text-muted-foreground">/ {slip.workingHours.toFixed(1)}h</p>
                      </TableCell>
                      <TableCell className="text-center">
                        {slip.overtimeHours > 0 ? (
                          <Badge className="bg-orange-500/10 text-orange-600 border-none font-bold text-[10px]">
                            {slip.overtimeHours.toFixed(1)}h
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatCurrency(slip.grossPay)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-red-600">
                        -{formatCurrency(slip.payeTax)}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono text-sm text-emerald-600">
                        {formatCurrency(slip.netPay)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`
                          text-[9px] uppercase font-black px-1.5 py-0
                          ${slip.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}
                        `}>
                          {slip.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => setViewingSlip(slip)} variant="ghost" size="sm" className="h-8 px-2 text-primary text-xs font-bold gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> View Slip
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-muted/5">
                  <p className="text-sm text-muted-foreground italic">
                    Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, filteredSlips.length)}</span> of <span className="font-bold">{filteredSlips.length}</span> slips
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="gap-1 h-8 px-3">
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(p)} className={`h-8 w-8 p-0 ${currentPage === p ? 'bg-primary text-white' : ''}`}>
                          {p}
                        </Button>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="gap-1 h-8 px-3">
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payslip Modal */}
      <Dialog open={!!viewingSlip} onOpenChange={() => setViewingSlip(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black tracking-tighter">SALARY <span className="text-primary">SLIP</span></DialogTitle>
                <DialogDescription>Payroll Period: {period.name}</DialogDescription>
              </div>
              <Button variant="outline" size="icon" onClick={() => window.print()} className="print:hidden">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {viewingSlip && (
            <div className="py-6 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Employee Details</p>
                  <h4 className="text-lg font-bold">{viewingSlip.worker.name}</h4>
                  <p className="text-sm text-muted-foreground">{viewingSlip.designation?.title}</p>
                  <p className="text-sm text-muted-foreground">ID: {viewingSlip.worker.nationalId || 'N/A'}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Payment Info</p>
                  <p className="text-sm font-medium">Status: <span className="text-emerald-600 uppercase font-bold">{viewingSlip.status}</span></p>
                  <p className="text-sm text-muted-foreground">Phone: {viewingSlip.worker.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 bg-muted/50 p-3 border-b text-xs font-bold uppercase tracking-wider">
                  <span>Description</span>
                  <span className="text-right">Amount (KES)</span>
                </div>
                <div className="p-3 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-muted-foreground italic">Basic Salary</span>
                    <span className="font-mono">{viewingSlip.basicSalary.toLocaleString()}</span>
                  </div>

                  {viewingSlip.details.filter(d => d.type === 'earning').map(d => (
                    <div key={d.id} className="flex justify-between text-sm">
                      <span className="font-medium text-muted-foreground italic">{d.name}</span>
                      <span className="font-mono">{d.amount.toLocaleString()}</span>
                    </div>
                  ))}

                  <div className="pt-2 border-t flex justify-between font-bold text-sm">
                    <span>GROSS PAY</span>
                    <span className="font-mono">{viewingSlip.grossPay.toLocaleString()}</span>
                  </div>

                  <div className="pt-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Deductions</p>
                    <div className="flex justify-between text-sm text-red-600">
                      <span className="font-medium italic">PAYE Tax (Before Relief)</span>
                      <span className="font-mono">{(viewingSlip.payeTax + viewingSlip.personalRelief).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span className="font-medium italic">Less: Personal Relief</span>
                      <span className="font-mono">({viewingSlip.personalRelief.toLocaleString()})</span>
                    </div>
                    {viewingSlip.details.filter(d => d.type === 'deduction').map(d => (
                      <div key={d.id} className="flex justify-between text-sm text-red-600">
                        <span className="font-medium italic">{d.name}</span>
                        <span className="font-mono">{d.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t flex justify-between items-center">
                    <span className="text-lg font-black uppercase tracking-tighter">NET PAYABLE</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono">
                      {formatCurrency(viewingSlip.netPay)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-3 border-b text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Attendance Summary
                </div>
                <div className="p-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days Worked</span>
                    <span className="font-mono">{viewingSlip.daysWorked} / {viewingSlip.workingDays || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hours Worked</span>
                    <span className="font-mono">{viewingSlip.attainedHours.toFixed(1)} / {viewingSlip.workingHours.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Overtime Hours</span>
                    <span className="font-mono">{viewingSlip.overtimeHours.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Overtime Pay</span>
                    <span className="font-mono text-emerald-600">{formatCurrency(viewingSlip.overtimePay)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Late Days</span>
                    <span className="font-mono">{viewingSlip.lateDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Late Hours</span>
                    <span className="font-mono">{viewingSlip.lateHours.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Leave Days</span>
                    <span className="font-mono">{viewingSlip.leaveDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Leave Hours</span>
                    <span className="font-mono">{viewingSlip.leaveHours.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 text-center border-t text-[10px] text-muted-foreground uppercase tracking-widest">
                This is a computer generated document. Signature is not required.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Payroll Dialog with Attendance Preview */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Process Payroll
            </DialogTitle>
            <DialogDescription>
              Attendance records from <strong>{new Date(period.startDate).toLocaleDateString()}</strong> to <strong>{new Date(period.endDate).toLocaleDateString()}</strong> will be linked to calculate each worker's pay based on days worked, hours, and overtime.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 py-4">
            {loadingPreview ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground italic">Loading attendance data...</p>
              </div>
            ) : attendancePreview && attendancePreview.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Workers with Attendance</p>
                    <h4 className="text-lg font-bold">{attendancePreview.length}</h4>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Days Worked</p>
                    <h4 className="text-lg font-bold">{attendancePreview.reduce((a, w) => a + w.days, 0)}</h4>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Overtime</p>
                    <h4 className="text-lg font-bold text-orange-600">{attendancePreview.reduce((a, w) => a + w.overtime, 0).toFixed(1)}h</h4>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase">Worker</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-center">Days</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-center">Hours</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-center">Overtime</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-center">Late Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendancePreview.slice(0, 10).map((w, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm font-medium">{w.name}</TableCell>
                          <TableCell className="text-center text-sm font-bold">{w.days}</TableCell>
                          <TableCell className="text-center text-sm font-mono">{w.hours.toFixed(1)}h</TableCell>
                          <TableCell className="text-center">
                            {w.overtime > 0 ? (
                              <Badge className="bg-orange-500/10 text-orange-600 border-none text-[10px] font-bold">
                                {w.overtime.toFixed(1)}h
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm">{w.lateDays > 0 ? <span className="text-red-600 font-bold">{w.lateDays}</span> : '0'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {attendancePreview.length > 10 && (
                  <p className="text-xs text-muted-foreground italic text-center">
                    Showing 10 of {attendancePreview.length} workers. All will be included in payroll.
                  </p>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">How attendance affects pay:</p>
                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                      <li>Basic salary is pro-rated by days worked / expected working days</li>
                      <li>Overtime is paid according to each shift's configured rate</li>
                      <li>Late hours are deducted as unpaid post-tax deductions</li>
                      <li>Workers without attendance records will have 0 days worked</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <Fingerprint className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">No attendance records found for this period.</p>
                <p className="text-xs italic">Workers will have 0 days worked. Pay will be calculated as 0 basic + allowances.</p>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t pt-4">
            <div className="space-y-2">
              <span className="text-sm font-bold">Calculation Mode</span>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/30 transition-colors" data-mode="full">
                <input
                  type="radio"
                  name="payrollMode"
                  checked={payrollMode === 'full'}
                  onChange={() => setPayrollMode('full')}
                  className="mt-0.5 size-4 accent-primary"
                />
                <div>
                  <span className="text-sm font-semibold">Full Mode (Attendance-based)</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Basic salary pro-rated by days worked. Overtime paid per shift config. Late hours deducted.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/30 transition-colors" data-mode="simple">
                <input
                  type="radio"
                  name="payrollMode"
                  checked={payrollMode === 'simple'}
                  onChange={() => setPayrollMode('simple')}
                  className="mt-0.5 size-4 accent-primary"
                />
                <div>
                  <span className="text-sm font-semibold">Simple Mode (Salary &times; Working Days)</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ignores attendance, hours, overtime, and late penalties. Each worker is paid daily rate &times; expected working days.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/30 transition-colors" data-mode="simple_overtime">
                <input
                  type="radio"
                  name="payrollMode"
                  checked={payrollMode === 'simple_overtime'}
                  onChange={() => setPayrollMode('simple_overtime')}
                  className="mt-0.5 size-4 accent-primary"
                />
                <div>
                  <span className="text-sm font-semibold">Simple + Overtime (Days + Shift Overtime)</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Full daily rate &times; expected working days, plus overtime from attendance records paid per shift config. Late penalties still ignored.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>Cancel</Button>
            <Button onClick={handleProcessPayroll} disabled={isProcessing} className="gap-2">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isProcessing ? 'Processing...' : 'Confirm & Process'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disbursement Dialog */}
      <Dialog open={showDisburseDialog} onOpenChange={setShowDisburseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Disburse Payroll
            </DialogTitle>
            <DialogDescription>
              Select a wallet to fund payroll payments. M-Pesa payments will require approval; manual settlements are completed immediately.
            </DialogDescription>
          </DialogHeader>

          {disburseResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{disburseResult.mpesa}</p>
                    <p className="text-xs text-emerald-700 font-bold uppercase">M-Pesa</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{disburseResult.manual}</p>
                    <p className="text-xs text-blue-700 font-bold uppercase">Manual</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{disburseResult.skipped}</p>
                    <p className="text-xs text-amber-700 font-bold uppercase">Skipped</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-2xl font-bold text-gray-600">{disburseResult.alreadyDisbursed || 0}</p>
                    <p className="text-xs text-gray-700 font-bold uppercase">Already Paid</p>
                  </CardContent>
                </Card>
              </div>

              {disburseResult.transactions.length > 0 && (
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Worker</TableHead>
                        <TableHead className="text-xs">Mode</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                        <TableHead className="text-xs text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disburseResult.transactions.map((t: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm font-medium">{t.workerName}</TableCell>
                          <TableCell className="text-xs">
                            <Badge className={`
                              text-[9px] uppercase font-bold px-1.5 py-0 border-none
                              ${t.mode === 'manual' ? 'bg-blue-100 text-blue-700' :
                                t.mode === 'phone' ? 'bg-green-100 text-green-700' :
                                t.mode === 'pochi' ? 'bg-purple-100 text-purple-700' :
                                t.mode === 'till' ? 'bg-orange-100 text-orange-700' :
                                t.mode === 'paybill' ? 'bg-teal-100 text-teal-700' :
                                'bg-gray-100 text-gray-600'}
                            `}>
                              {t.mode}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono text-right">{formatCurrency(t.netPay)}</TableCell>
                          <TableCell className="text-xs text-right">
                            <Badge className={`
                              text-[9px] uppercase font-bold px-1.5 py-0
                              ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                t.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-200 text-gray-600'}
                            `}>
                              {t.status === 'completed' ? 'Paid' : t.status === 'pending_approval' ? 'Pending Approval' : t.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <p className="text-xs text-muted-foreground italic">
                M-Pesa payments are pending approval. Go to Wallet &gt; Approvals to release funds.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-semibold mb-1">Payroll Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-muted-foreground">Total Net Pay:</p>
                  <p className="font-bold text-emerald-600">{formatCurrency(period.totalNetPay)}</p>
                  <p className="text-muted-foreground">Employees:</p>
                  <p className="font-bold">{period.totalEmployees}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Select Wallet *
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Choose a wallet...</option>
                  {wallets.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name} - KES {w.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {filteredSlips.length > 0 && (
                <div className="max-h-52 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Worker</TableHead>
                        <TableHead className="text-xs">Payment Mode</TableHead>
                        <TableHead className="text-xs text-right">Net Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSlips.map((slip) => (
                        <TableRow key={slip.id}>
                          <TableCell className="text-sm font-medium">{slip.worker.name}</TableCell>
                          <TableCell className="text-xs">
                            <Badge className={`
                              text-[9px] uppercase font-bold px-1.5 py-0 border-none
                              ${slip.worker.paymentMode === 'manual' || !slip.worker.paymentMode ? 'bg-gray-100 text-gray-600' :
                                slip.worker.paymentMode === 'phone' ? 'bg-green-100 text-green-700' :
                                slip.worker.paymentMode === 'pochi' ? 'bg-purple-100 text-purple-700' :
                                slip.worker.paymentMode === 'till' ? 'bg-orange-100 text-orange-700' :
                                'bg-teal-100 text-teal-700'}
                            `}>
                              {slip.worker.paymentMode || 'manual'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono text-right">{formatCurrency(slip.netPay)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!disburseResult && (
              <>
                <Button variant="outline" onClick={() => setShowDisburseDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleDisburse}
                  disabled={isDisbursing || !selectedWalletId}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isDisbursing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isDisbursing ? 'Processing...' : 'Disburse Payroll'}
                </Button>
              </>
            )}
            {disburseResult && (
              <Button onClick={() => setShowDisburseDialog(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
