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
  Download
} from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SalarySlip {
  id: string;
  worker: {
    name: string;
    phone: string | null;
  };
  designation: {
    title: string;
  } | null;
  grossPay: number;
  payeTax: number;
  netPay: number;
  status: string;
}

interface PayrollPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
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

  const fetchPeriod = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payroll-periods/${id}`);
      if (!response.ok) throw new Error('Failed to fetch payroll period');
      const data = await response.json();
      setPeriod(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriod();
  }, [id]);

  const handleProcessPayroll = async () => {
    setIsProcessing(true);
    try {
      // In a real app, this would be a single bulk API call
      // For now, we'll simulate the "process" logic
      const response = await fetch(`/api/payroll-periods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processing' }),
      });

      if (!response.ok) throw new Error('Failed to start processing');
      
      toast({ title: "Processing", description: "Payroll calculation has started." });
      fetchPeriod();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
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
              <Badge className={`
                uppercase text-[10px] font-bold
                ${period.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 
                  period.status === 'processing' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-600'}
              `}>
                {period.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {period.status === 'draft' && (
            <Button onClick={handleProcessPayroll} disabled={isProcessing} className="gap-2">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Process Payroll
            </Button>
          )}
          {period.status === 'processing' && (
            <Button className="gap-2" variant="outline" disabled>
              <Loader2 className="w-4 h-4 animate-spin" />
              Calculating...
            </Button>
          )}
          {period.status === 'completed' && (
            <>
              <Button variant="outline" className="gap-2 text-primary border-primary/20">
                <Download className="w-4 h-4" /> Export CSV
              </Button>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Send className="w-4 h-4" /> Bulk M-Pesa Payment
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Employees</p>
            <h3 className="text-xl font-bold">{period.totalEmployees} Active</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Salary Slips</CardTitle>
              <CardDescription>Individual breakdown for all workers in this period.</CardDescription>
            </div>
            <div className="relative w-64">
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground hidden" />
              <Input placeholder="Filter by worker name..." className="h-9 text-xs" />
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
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Worker</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Designation</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Gross Pay</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right text-red-600">PAYE Tax</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right text-emerald-600">Net Pay</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {period.salarySlips.map((slip) => (
                  <TableRow key={slip.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-primary/10 rounded-full">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{slip.worker.name}</span>
                          <span className="text-[10px] text-muted-foreground">{slip.worker.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {slip.designation?.title || 'Worker'}
                      </Badge>
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
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-primary text-xs font-bold gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> View Slip
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
