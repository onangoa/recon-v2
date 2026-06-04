'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
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
  ShieldCheck,
  Loader2,
  AlertCircle
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
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface Wallet {
  id: string;
  name: string;
  description: string | null;
  balance: number;
  currency: string;
  status: string;
  createdAt: Date;
}

interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string | null;
  status: string;
  referenceNumber: string | null;
  createdAt: Date;
}

export default function WalletDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showMakePayment, setShowMakePayment] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const resolvedParams = use(params);
  const walletId = resolvedParams.id;
  
  const [depositAmount, setDepositAmount] = useState('');
  const [depositSource, setDepositSource] = useState('');
  const [depositMemo, setDepositMemo] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRecipient, setPaymentRecipient] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');
  const [isMakingPayment, setIsMakingPayment] = useState(false);

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, [walletId]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch(`/api/wallets/${walletId}`);
      if (!response.ok) throw new Error('Failed to fetch wallet');
      const data = await response.json();
      setWallet(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/wallets/${walletId}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !depositSource) {
      toast({
        title: "Validation Error",
        description: "Amount and source are required.",
        variant: "destructive",
      });
      return;
    }

    setIsDepositing(true);
    try {
      const response = await fetch(`/api/wallets/${walletId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'credit',
          amount: parseFloat(depositAmount),
          description: depositMemo || `Deposit from ${depositSource}`,
          referenceNumber: depositSource,
        }),
      });

      if (!response.ok) throw new Error('Failed to deposit funds');

      toast({
        title: "Success",
        description: "Funds deposited successfully!",
        variant: "success",
      });

      setDepositAmount('');
      setDepositSource('');
      setDepositMemo('');
      setShowAddFunds(false);
      fetchWalletData();
      fetchTransactions();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || !paymentRecipient) {
      toast({
        title: "Validation Error",
        description: "Amount and recipient are required.",
        variant: "destructive",
      });
      return;
    }

    if (wallet && parseFloat(paymentAmount) > wallet.balance) {
      toast({
        title: "Insufficient Balance",
        description: `Available balance: ${wallet.currency} ${wallet.balance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setIsMakingPayment(true);
    try {
      const response = await fetch(`/api/wallets/${walletId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'debit',
          amount: parseFloat(paymentAmount),
          description: paymentMemo || `Payment to ${paymentRecipient}`,
          referenceNumber: paymentRecipient,
        }),
      });

      if (!response.ok) throw new Error('Failed to make payment');

      toast({
        title: "Success",
        description: "Payment sent successfully!",
        variant: "success",
      });

      setPaymentAmount('');
      setPaymentRecipient('');
      setPaymentMemo('');
      setShowMakePayment(false);
      fetchWalletData();
      fetchTransactions();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsMakingPayment(false);
    }
  };

  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{error || 'Wallet not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <BreadcrumbPage>{wallet.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">{wallet.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm italic">{wallet.description || 'Project account'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-10 w-10 text-primary border-primary/20 hover:bg-primary/5">
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-primary to-accent text-primary-foreground relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">Current Balance</span>
              <span className="text-3xl font-black tracking-tighter">{wallet.currency} {wallet.balance.toFixed(2)}</span>
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
                <span className="text-2xl font-bold">{wallet.currency} {totalCredits.toFixed(2)}</span>
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
                <span className="text-2xl font-bold">{wallet.currency} {totalDebits.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Transaction History
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchTransactions}>
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
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center">
                        <p className="text-muted-foreground text-sm italic">No recent financial activity recorded.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-muted/20">
                        <TableCell className="font-mono text-[10px]">{tx.referenceNumber || tx.id.slice(0, 8)}</TableCell>
                        <TableCell className={`font-bold font-mono ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{wallet.currency} {tx.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={tx.type === 'credit' ? 'default' : 'secondary'} className="text-[8px] py-0">
                            {tx.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{tx.description || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[8px] py-0 border-emerald-200 text-emerald-700">
                            {tx.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
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
                      <Label>Amount ({wallet.currency}) *</Label>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="bg-muted/30 border-none h-11 font-mono font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Source Mobile No. *</Label>
                      <Input 
                        type="tel" 
                        placeholder="254..." 
                        value={depositSource}
                        onChange={(e) => setDepositSource(e.target.value)}
                        className="bg-muted/30 border-none h-11" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Internal Memo</Label>
                      <Textarea 
                        placeholder="Reason for deposit..." 
                        value={depositMemo}
                        onChange={(e) => setDepositMemo(e.target.value)}
                        className="bg-muted/30 border-none" 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddFunds(false)}>Cancel</Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      onClick={handleDeposit}
                      disabled={isDepositing}
                    >
                      {isDepositing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Confirm Deposit
                    </Button>
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
                  {wallet.balance <= 0 ? (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2 mb-4">
                      <Info className="w-4 h-4 text-red-600 mt-0.5" />
                      <p className="text-[10px] text-red-800 font-medium leading-tight">
                        Insufficient Balance. Your current balance is {wallet.currency} {wallet.balance.toFixed(2)}. Please top up first.
                      </p>
                    </div>
                  ) : null}
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Amount ({wallet.currency}) *</Label>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="bg-muted/30 border-none h-11 font-mono font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Recipient Mobile No. *</Label>
                      <Input 
                        type="tel" 
                        placeholder="254..." 
                        value={paymentRecipient}
                        onChange={(e) => setPaymentRecipient(e.target.value)}
                        className="bg-muted/30 border-none h-11" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Internal Memo</Label>
                      <Textarea 
                        placeholder="Reason for payment..." 
                        value={paymentMemo}
                        onChange={(e) => setPaymentMemo(e.target.value)}
                        className="bg-muted/30 border-none" 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowMakePayment(false)}>Cancel</Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      onClick={handlePayment}
                      disabled={isMakingPayment || wallet.balance <= 0}
                    >
                      {isMakingPayment && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Send Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-sm font-bold">Account Meta</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold border-none">
                  {wallet.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Created</span>
                <p className="text-xs text-foreground">{new Date(wallet.createdAt).toLocaleDateString()}</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Description</span>
                <p className="text-xs text-foreground italic">{wallet.description || 'No description'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
