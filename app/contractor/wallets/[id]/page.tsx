'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  ArrowLeft, 
  Pencil, 
  CheckCircle2, 
  Play, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History,
  Info,
  DollarSign,
  Plus,
  Minus,
  Wallet,
  Smartphone,
  Search,
  RotateCcw,
  MoreVertical,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function WalletDetailPage() {
  const router = useRouter();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showMakePayment, setShowMakePayment] = useState(false);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor/wallets">Wallets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Test Wallet</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 border border-muted-foreground/10 hover:bg-muted"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Test Wallet</h1>
            <p className="text-muted-foreground mt-1 text-sm italic">Detailed ledger and account management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-10 w-10 text-primary border-primary/20 hover:bg-primary/5">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <CheckCircle2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 text-blue-600 border-blue-200 hover:bg-blue-50">
            <Play className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Balance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-primary to-accent text-primary-foreground relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">Current Balance</span>
              <span className="text-3xl font-black tracking-tighter">KES 0.00</span>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-16 h-16" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-emerald-50 text-emerald-900 border border-emerald-100">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Total Credits</span>
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-2xl font-bold">KES 0.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-red-50 text-red-900 border border-red-100">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-widest text-red-700">Total Debits</span>
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-red-600" />
                <span className="text-2xl font-bold">KES 0.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Transactions */}
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Transaction History
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search ledger..." className="pl-8 bg-background border-none h-8 text-xs w-[200px]" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold text-[10px] uppercase">Ref ID</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Amount</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-center">Type</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Description</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <p className="text-muted-foreground text-sm italic">No recent financial activity recorded.</p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Quick Actions Card */}
          <Card className="border-none shadow-md overflow-hidden bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-widest text-primary font-bold">Quick Disbursement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 shadow-sm border-none">
                    <Plus className="w-4 h-4" /> Deposit Funds
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-emerald-700 flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5" /> Inward Remittance
                    </DialogTitle>
                    <DialogDescription>Add credits to this wallet via M-Pesa or Bank.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Amount (KES) *</Label>
                      <Input type="number" placeholder="0.00" className="bg-muted/30 border-none h-11 font-mono font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label>Source Mobile No. *</Label>
                      <Input type="tel" placeholder="254..." className="bg-muted/30 border-none h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Internal Memo</Label>
                      <Textarea placeholder="Reason for deposit..." className="bg-muted/30 border-none" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddFunds(false)}>Cancel</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Confirm Deposit</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showMakePayment} onOpenChange={setShowMakePayment}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 shadow-sm border-none">
                    <Smartphone className="w-4 h-4" /> Send Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-blue-700 flex items-center gap-2">
                      <ArrowDownLeft className="w-5 h-5" /> Outward Payment
                    </DialogTitle>
                    <DialogDescription>Pay suppliers or staff from available balance.</DialogDescription>
                  </DialogHeader>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2 mb-4">
                    <Info className="w-4 h-4 text-red-600 mt-0.5" />
                    <p className="text-[10px] text-red-800 font-medium leading-tight">
                      Insufficient Balance. Your current balance is KES 0.00. Please top up first.
                    </p>
                  </div>
                  {/* Form fields same as deposit but for payment */}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Account Detail Card */}
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-sm font-bold">Account Meta</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold border-none">Active</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Methods</span>
                <div className="flex flex-wrap gap-1">
                  {['PAYBILL', 'TILL', 'POCHI', 'M-PESA'].map(m => (
                    <Badge key={m} variant="outline" className="text-[8px] py-0 border-primary/20 text-primary/60">{m}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Description</span>
                <p className="text-xs text-foreground italic">Demo project account</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
