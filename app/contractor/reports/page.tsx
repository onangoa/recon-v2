'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Package,
  Hammer,
  ClipboardList,
  ShieldAlert,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileDown,
  Loader2,
  AlertCircle,
  Calendar,
  PackageCheck,
  AlertCircleIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useSite } from '@/hooks/use-site';
import { exportToCSV, exportToPDF } from '@/lib/export';

interface ReportData {
  overview: {
    totalWorkers: number;
    activeWorkers: number;
    totalSites: number;
    totalInventory: number;
    totalEquipment: number;
    totalPurchaseOrders: number;
    pendingPurchaseOrders: number;
    totalPayrollPeriods: number;
    totalSafetyIncidents: number;
  };
  payroll: {
    totalGrossPay: number;
    totalNetPay: number;
    totalDeductions: number;
    periodCount: number;
  };
  inventoryByStatus: { status: string; count: number }[];
  attendanceByStatus: { status: string; count: number }[];
  purchaseOrdersByStatus: { status: string; count: number; totalValue: number }[];
  wallet: {
    totalBalance: number;
    walletCount: number;
  };
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    description: string | null;
    status: string;
    createdAt: string;
    walletName: string;
  }[];
}

export default function ReportsPage() {
  const { toast } = useToast();
  const { activeSite } = useSite();
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeSite) params.set('siteId', activeSite.id);
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load report data');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeSite]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      { Metric: 'Active Workers', Value: String(data.overview.activeWorkers) },
      { Metric: 'Total Workers', Value: String(data.overview.totalWorkers) },
      { Metric: 'Sites', Value: String(data.overview.totalSites) },
      { Metric: 'Inventory Items', Value: String(data.overview.totalInventory) },
      { Metric: 'Equipment', Value: String(data.overview.totalEquipment) },
      { Metric: 'Purchase Orders', Value: String(data.overview.totalPurchaseOrders) },
      { Metric: 'Pending POs', Value: String(data.overview.pendingPurchaseOrders) },
      { Metric: 'Payroll Periods', Value: String(data.overview.totalPayrollPeriods) },
      { Metric: 'Safety Incidents', Value: String(data.overview.totalSafetyIncidents) },
      { Metric: 'Total Gross Pay', Value: String(data.payroll.totalGrossPay) },
      { Metric: 'Total Net Pay', Value: String(data.payroll.totalNetPay) },
      { Metric: 'Total Deductions', Value: String(data.payroll.totalDeductions) },
      { Metric: 'Wallet Balance', Value: String(data.wallet.totalBalance) },
    ];
    exportToCSV(rows, `report-${new Date().toISOString().split('T')[0]}`);
    toast({ title: 'Exported', description: 'CSV file downloaded', variant: 'success' });
  };

  const handleExportPDF = () => {
    if (!data) return;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Active Workers', String(data.overview.activeWorkers)],
      ['Total Workers', String(data.overview.totalWorkers)],
      ['Sites', String(data.overview.totalSites)],
      ['Inventory Items', String(data.overview.totalInventory)],
      ['Equipment', String(data.overview.totalEquipment)],
      ['Purchase Orders', String(data.overview.totalPurchaseOrders)],
      ['Pending POs', String(data.overview.pendingPurchaseOrders)],
      ['Total Gross Pay', formatCurrency(data.payroll.totalGrossPay)],
      ['Total Net Pay', formatCurrency(data.payroll.totalNetPay)],
      ['Total Deductions', formatCurrency(data.payroll.totalDeductions)],
      ['Wallet Balance', formatCurrency(data.wallet.totalBalance)],
    ];
    exportToPDF('Report Overview', headers, rows, `report-${new Date().toISOString().split('T')[0]}`);
    toast({ title: 'Exported', description: 'PDF file downloaded', variant: 'success' });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchReport}>Try Again</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/contractor">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Reports</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm italic">Comprehensive overview of your construction operations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReport} size="icon">
            <Calendar className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={!data}>
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
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-muted-foreground font-bold uppercase">Workers</p>
            </div>
            <p className="text-2xl font-bold">{data.overview.activeWorkers}</p>
            <p className="text-[10px] text-muted-foreground">{data.overview.totalWorkers} total</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-muted-foreground font-bold uppercase">Inventory</p>
            </div>
            <p className="text-2xl font-bold">{data.overview.totalInventory}</p>
            <p className="text-[10px] text-muted-foreground">{data.overview.totalEquipment} equipment</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-muted-foreground font-bold uppercase">POs</p>
            </div>
            <p className="text-2xl font-bold">{data.overview.totalPurchaseOrders}</p>
            <p className="text-[10px] text-muted-foreground">{data.overview.pendingPurchaseOrders} pending</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground font-bold uppercase">Net Pay</p>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(data.payroll.totalNetPay)}</p>
            <p className="text-[10px] text-muted-foreground">{data.payroll.periodCount} periods</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <p className="text-xs text-muted-foreground font-bold uppercase">Incidents</p>
            </div>
            <p className="text-2xl font-bold">{data.overview.totalSafetyIncidents}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Summary */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Payroll Summary
            </CardTitle>
            <Badge className="bg-emerald-500/10 text-emerald-700 border-none text-[10px] font-bold uppercase">
              {data.payroll.periodCount} periods
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Gross Pay</p>
              <p className="text-lg font-bold">{formatCurrency(data.payroll.totalGrossPay)}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600 font-bold uppercase mb-1">Deductions</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(data.payroll.totalDeductions)}</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Net Pay</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(data.payroll.totalNetPay)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Purchase Orders by Status */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.purchaseOrdersByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4 text-center">No purchase orders</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase">Status</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-right">Count</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.purchaseOrdersByStatus.map((po) => (
                    <TableRow key={po.status}>
                      <TableCell>
                        <Badge className={`text-[10px] font-bold uppercase px-2 py-0 border-none ${po.status === 'delivered' ? 'bg-green-100 text-green-700' : po.status === 'pending' ? 'bg-amber-100 text-amber-700' : po.status === 'processing' ? 'bg-blue-100 text-blue-700' : po.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{po.count}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(po.totalValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Inventory by Status */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.inventoryByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4 text-center">No inventory data</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase">Status</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.inventoryByStatus.map((inv) => (
                    <TableRow key={inv.status}>
                      <TableCell>
                        <Badge className="text-[10px] font-bold uppercase px-2 py-0 border-none bg-blue-100 text-blue-700">
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{inv.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.attendanceByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4 text-center">No attendance data</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold uppercase">Status</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-right">Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.attendanceByStatus.map((att) => (
                    <TableRow key={att.status}>
                      <TableCell>
                        <Badge className="text-[10px] font-bold uppercase px-2 py-0 border-none bg-indigo-100 text-indigo-700">
                          {att.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{att.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Wallet Summary */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Wallet Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                <span className="text-sm font-bold text-emerald-700">Total Wallet Balance</span>
                <span className="text-xl font-bold text-emerald-600">{formatCurrency(data.wallet.totalBalance)}</span>
              </div>
              <p className="text-xs text-muted-foreground italic">{data.wallet.walletCount} wallet(s) active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Recent Transactions</CardTitle>
          <CardDescription>Latest 10 wallet transactions across all wallets.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">No transactions found</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase">Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Wallet</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Description</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right">Amount</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{tx.walletName}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{tx.description || '-'}</TableCell>
                    <TableCell>
                      <Badge className={`text-[9px] font-bold uppercase px-1.5 py-0 border-none ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-mono text-xs font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-[9px] font-bold uppercase px-1.5 py-0 border-none ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tx.status}
                      </Badge>
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