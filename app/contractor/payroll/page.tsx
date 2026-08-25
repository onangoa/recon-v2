'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Coins, 
  Plus, 
  Search, 
  RotateCcw, 
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Filter,
  Loader2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Settings2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Pencil
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
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { useRouter } from 'next/navigation';

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
}

export default function PayrollPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchPeriods = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/web/api/payroll-periods?page=${currentPage}&limit=${limit}`);
      if (!response.ok) throw new Error('Unable to load the payroll periods. Please refresh the page and try again.');
      const data = await response.json();
      setPeriods(data.periods);
      setTotalPages(data.pagination.pages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to load the payroll periods. Please refresh the page and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, [currentPage]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-none uppercase text-[10px] font-bold">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-amber-500/10 text-amber-600 border-none uppercase text-[10px] font-bold">Processing</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-none uppercase text-[10px] font-bold">Cancelled</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-600 border-none uppercase text-[10px] font-bold">Draft</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Payroll</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Payroll Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage payroll periods, salary components and employee payments.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/contractor/payroll/components">
              <Settings2 className="w-4 h-4" />
              <span>Components</span>
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/contractor/payroll/periods/create">
              <Plus className="w-4 h-4" />
              <span>New Period</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Periods</p>
                <h3 className="text-2xl font-bold">{totalCount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Gross Pay</p>
                <h3 className="text-xl font-bold">{formatCurrency(periods.reduce((acc, p) => acc + p.totalGrossPay, 0))}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Net Pay</p>
                <h3 className="text-xl font-bold">{formatCurrency(periods.reduce((acc, p) => acc + p.totalNetPay, 0))}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Deductions</p>
                <h3 className="text-xl font-bold">{formatCurrency(periods.reduce((acc, p) => acc + p.totalDeductions, 0))}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold">Payroll Periods</h2>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchPeriods}
                disabled={isLoading}
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading payroll periods...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : periods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Coins className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No payroll periods found.</p>
              <Button asChild variant="link" className="text-primary">
                <Link href="/contractor/payroll/periods/create">Create your first payroll period</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Period Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Dates</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Workers</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Total Net Pay</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => (
                  <TableRow key={period.id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => router.push(`/contractor/payroll/periods/${period.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-sm">{period.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[10px] text-muted-foreground font-medium">
                        <span>{new Date(period.startDate).toLocaleDateString()} -</span>
                        <span>{new Date(period.endDate).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{period.totalEmployees} Workers</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-primary">{formatCurrency(period.totalNetPay)}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(period.status)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/contractor/payroll/periods/${period.id}`)}>
                            <Search className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/contractor/payroll/periods/edit/${period.id}`)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-muted/5">
            <p className="text-sm text-muted-foreground italic">
              Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, totalCount)}</span> of <span className="font-bold">{totalCount}</span> periods
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="gap-1 h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(p)}
                    disabled={isLoading}
                    className={`h-8 w-8 p-0 ${currentPage === p ? 'bg-primary text-white' : ''}`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="gap-1 h-8 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
