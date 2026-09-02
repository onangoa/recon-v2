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
  AlertCircle,
  QrCode,
  User,
  ShoppingBag,
  ChevronLeft,
  Landmark,
  Building2,
  Upload,
  Paperclip,
  Copy,
  X
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
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { Separator } from '@/components/ui/separator';
import { KENYAN_BANKS } from '@/lib/bank-codes';

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
  reference: string | null;
  receiptNumber: string | null;
  createdAt: Date;
}

function BankDepositSummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 px-4">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-sm ${strong ? 'font-bold' : 'font-medium'}`}>{value}</span>
    </div>
  );
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
  const [paymentAccountNumber, setPaymentAccountNumber] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');
  const [payoutType, setPayoutType] = useState('phone');
  const [isMakingPayment, setIsMakingPayment] = useState(false);

  const [showBankDeposit, setShowBankDeposit] = useState(false);
  const [bankDepositAmount, setBankDepositAmount] = useState('');
  const [bankDepositAccount, setBankDepositAccount] = useState('');
  const [bankDepositConfirming, setBankDepositConfirming] = useState(false);
  const [bankSourceAccount, setBankSourceAccount] = useState('');
  const [bankDepositMemo, setBankDepositMemo] = useState('');
  const [isBankDepositing, setIsBankDepositing] = useState(false);

  const [showBankPayout, setShowBankPayout] = useState(false);
  const [bankPayoutChannel, setBankPayoutChannel] = useState('pesalink');
  const [bankPayoutAmount, setBankPayoutAmount] = useState('');
  const [bankPayoutAccount, setBankPayoutAccount] = useState('');
  const [bankPayoutBankCode, setBankPayoutBankCode] = useState('');
  const [bankPayoutMobile, setBankPayoutMobile] = useState('');
  const [bankPayoutMemo, setBankPayoutMemo] = useState('');
  const [isBankPaying, setIsBankPaying] = useState(false);

  // Recipient name + proof document fields shared across all 4 payment forms
  const [depositRecipientName, setDepositRecipientName] = useState('');
  const [depositProofFile, setDepositProofFile] = useState<File | null>(null);
  const [paymentRecipientName, setPaymentRecipientName] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [bankDepositRecipientName, setBankDepositRecipientName] = useState('');
  const [bankDepositProofFile, setBankDepositProofFile] = useState<File | null>(null);
  const [bankPayoutRecipientName, setBankPayoutRecipientName] = useState('');
  const [bankPayoutProofFile, setBankPayoutProofFile] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const uploadProofDocument = async (file: File | null): Promise<{ url: string; fileName: string } | null> => {
    if (!file) return null;
    setIsUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/web/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Failed to upload document');
      const data = await res.json();
      return { url: data.url || data.fileData || '', fileName: data.fileName || file.name };
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Transaction pagination states
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [transactionsTotalCount, setTransactionsTotalCount] = useState(0);
  const [transactionsSearch, setTransactionsSearch] = useState('');
  const [transactionsLimit] = useState(10);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, [walletId]);

  useEffect(() => {
    const fetchBankConfig = async () => {
      try {
        const response = await fetch('/web/api/bank/config');
        if (!response.ok) return;
        const data = await response.json();
        setBankSourceAccount(data.sourceAccount || '');
      } catch {
        return;
      }
    };
    fetchBankConfig();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (transactionsPage !== 1) setTransactionsPage(1);
      else fetchTransactions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [transactionsSearch]);

  useEffect(() => {
    fetchTransactions();
  }, [transactionsPage]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch(`/web/api/wallets/${walletId}`);
      if (!response.ok) throw new Error('Unable to load the wallet. Please refresh the page and try again.');
      const data = await response.json();
      setWallet(data);
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to load the wallet. Please refresh the page and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setIsTransactionsLoading(true);
    try {
      let url = `/web/api/wallets/${walletId}/transactions?page=${transactionsPage}&limit=${transactionsLimit}`;
      if (transactionsSearch) url += `&search=${transactionsSearch}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTransactionsTotalPages(data.pagination.pages);
      setTransactionsTotalCount(data.pagination.total);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setIsTransactionsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !depositSource) {
      toast({
        title: "Validation Error",
        description: "Amount and phone number are required.",
        variant: "destructive",
      });
      return;
    }

    setIsDepositing(true);
    try {
      const proof = await uploadProofDocument(depositProofFile);
      const response = await fetch(`/web/api/wallets/${walletId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'credit',
          method: 'mpesa',
          amount: parseFloat(depositAmount),
          description: depositMemo || `Deposit to Wallet`,
          referenceNumber: depositSource, // Phone for STK Push
          recipientName: depositRecipientName || undefined,
          proofDocumentUrl: proof?.url || undefined,
          proofDocumentName: proof?.fileName || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(getApiError(data, "Unable to initiate the wallet deposit. Please verify the details and try again."));

      toast({
        title: "STK Push Initiated",
        description: "Please check your phone to complete the transaction.",
        variant: "success",
      });

      setDepositAmount('');
      setDepositSource('');
      setDepositMemo('');
      setDepositRecipientName('');
      setDepositProofFile(null);
      setShowAddFunds(false);
      fetchTransactions(); // Show the pending transaction
      fetchWalletData(); // Update wallet balance
    } catch (err: any) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to initiate the wallet deposit. Please check your connection and try again."),
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
        description: "Amount and recipient details are required.",
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
      const proof = await uploadProofDocument(paymentProofFile);
      const response = await fetch(`/web/api/wallets/${walletId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'debit',
          method: 'mpesa',
          payoutType: payoutType,
          amount: parseFloat(paymentAmount),
          description: paymentMemo || `Payment to ${paymentRecipient}`,
          referenceNumber: paymentRecipient,
          accountNumber: payoutType === 'paybill' && paymentAccountNumber ? paymentAccountNumber : undefined,
          recipientName: paymentRecipientName || undefined,
          proofDocumentUrl: proof?.url || undefined,
          proofDocumentName: proof?.fileName || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(getApiError(data, "Unable to initiate the wallet payment. Please verify the details and try again."));

      toast({
        title: "Payment Initiated",
        description: "Your M-Pesa payout is being processed.",
        variant: "success",
      });

      setPaymentAmount('');
      setPaymentRecipient('');
      setPaymentAccountNumber('');
      setPaymentMemo('');
      setPaymentRecipientName('');
      setPaymentProofFile(null);
      setShowMakePayment(false);
      fetchTransactions(); // Show pending transaction
      fetchWalletData(); // Update wallet balance
    } catch (err: any) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to initiate the wallet payment. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setIsMakingPayment(false);
    }
  };

const handleBankDeposit = async () => {
    if (!bankDepositAmount || !bankDepositAccount) {
      toast({
        title: "Validation Error",
        description: "Amount and sender account number are required.",
        variant: "destructive",
      });
      return;
    }

    setIsBankDepositing(true);
    try {
      const proof = await uploadProofDocument(bankDepositProofFile);
      const response = await fetch(`/web/api/wallets/${walletId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'credit',
          method: 'bank',
          amount: parseFloat(bankDepositAmount),
          accountNumber: bankDepositAccount,
          description: bankDepositMemo || `Bank top-up from ${bankDepositAccount}`,
          recipientName: bankDepositRecipientName || undefined,
          proofDocumentUrl: proof?.url || undefined,
          proofDocumentName: proof?.fileName || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(getApiError(data, "Unable to initiate the bank top-up. Please verify the details and try again."));

      toast({
        title: "Bank Top-up Initiated",
        description: bankSourceAccount
          ? `Sender account validated. Send KES ${Number(bankDepositAmount).toLocaleString()} to Co-op Bank A/C ${bankSourceAccount} to complete the top-up.`
          : 'Sender account validated. Top-up will be confirmed on receipt.',
        variant: "success",
      });

      setBankDepositAmount('');
      setBankDepositAccount('');
      setBankDepositMemo('');
      setBankDepositRecipientName('');
      setBankDepositProofFile(null);
      setBankDepositConfirming(false);
      setShowBankDeposit(false);
      fetchTransactions();
      fetchWalletData();
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to initiate the bank top-up. Please check your connection and try again."), variant: "destructive" });
    } finally {
      setIsBankDepositing(false);
    }
  };

  const handleStartBankDepositConfirm = () => {
    if (!bankDepositAmount || !bankDepositAccount) {
      toast({
        title: "Validation Error",
        description: "Amount and sender account number are required.",
        variant: "destructive",
      });
      return;
    }
    setBankDepositConfirming(true);
  };

  const handleBankPayout = async () => {
    if (!bankPayoutAmount) {
      toast({ title: "Validation Error", description: "Amount is required.", variant: "destructive" });
      return;
    }
    if (bankPayoutChannel !== 'mpesa' && !bankPayoutAccount) {
      toast({ title: "Validation Error", description: "Destination account number is required.", variant: "destructive" });
      return;
    }
    if (bankPayoutChannel === 'mpesa' && !bankPayoutMobile) {
      toast({ title: "Validation Error", description: "Recipient mobile number is required.", variant: "destructive" });
      return;
    }
    if (wallet && parseFloat(bankPayoutAmount) > wallet.balance) {
      toast({
        title: "Insufficient Balance",
        description: `Available balance: ${wallet.currency} ${wallet.balance.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setIsBankPaying(true);
    try {
      const proof = await uploadProofDocument(bankPayoutProofFile);
      const response = await fetch(`/web/api/wallets/${walletId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'debit',
          method: 'bank',
          payoutChannel: bankPayoutChannel,
          amount: parseFloat(bankPayoutAmount),
          destinationAccount: bankPayoutChannel === 'mpesa' ? undefined : bankPayoutAccount,
          bankCode: bankPayoutChannel !== 'mpesa' ? (bankPayoutBankCode || undefined) : undefined,
          mobileNumber: bankPayoutChannel === 'mpesa' ? bankPayoutMobile : undefined,
          description: bankPayoutMemo || `Bank payout (${bankPayoutChannel.toUpperCase()})`,
          recipientName: bankPayoutRecipientName || undefined,
          proofDocumentUrl: proof?.url || undefined,
          proofDocumentName: proof?.fileName || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(getApiError(data, "Unable to create the bank payout. Please verify the details and try again."));

      toast({
        title: "Bank Payout Created",
        description: "The payout is pending approval before disbursement.",
        variant: "success",
      });

      setBankPayoutAmount('');
      setBankPayoutAccount('');
      setBankPayoutBankCode('');
      setBankPayoutMobile('');
      setBankPayoutMemo('');
      setBankPayoutRecipientName('');
      setBankPayoutProofFile(null);
      setShowBankPayout(false);
      fetchTransactions();
      fetchWalletData();
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to create the bank payout. Please check your connection and try again."), variant: "destructive" });
    } finally {
      setIsBankPaying(false);
    }
  };

  const totalCredits = transactions.filter(t => 
    (t.type === 'credit' || t.type === 'STK_PUSH') && 
    (t.status === 'completed' || t.status === 'SUCCESS')
  ).reduce((sum, t) => sum + t.amount, 0);
   
  const totalDebits = transactions.filter(t => 
    (t.type === 'debit' || ['B2C', 'B2B', 'B2POCHI'].includes(t.type)) && 
    (t.status === 'completed' || t.status === 'SUCCESS')
  ).reduce((sum, t) => sum + t.amount, 0);

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
            <CardHeader className="p-4 md:p-6 border-b bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Transaction History
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={transactionsSearch}
                      onChange={(e) => setTransactionsSearch(e.target.value)}
                      className="pl-10 bg-background border-none h-10 text-sm shadow-sm"
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 hover:bg-background hover:text-primary transition-colors"
                    onClick={fetchTransactions}
                    disabled={isTransactionsLoading}
                  >
                    <RotateCcw className={`w-4 h-4 text-muted-foreground ${isTransactionsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button asChild variant="outline" className="h-10 text-xs border-primary/20 hover:bg-primary/5 text-primary">
                    <Link href={`/contractor/wallets/approvals?walletId=${walletId}`}>
                      <ShieldCheck className="w-4 h-4 mr-1" /> Approvals
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isTransactionsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground italic">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                  <History className="h-6 w-6 opacity-20" />
                  <p className="text-xs italic">No recent financial activity recorded.</p>
                </div>
              ) : (
                <>
                  <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase">Ref / Receipt</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Amount</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-center">Type</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Description</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-center">Status</TableHead>
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
                       <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                         <TableCell className="font-mono text-xs">
                           <div className="flex flex-col gap-1">
                             <span className="opacity-50 text-[10px]">{tx.reference || tx.id.slice(0, 8)}</span>
                             <span className="font-bold text-primary text-xs">{tx.receiptNumber || '-'}</span>
                           </div>
                         </TableCell>
                         <TableCell className={`font-bold font-mono text-xs ${
                           tx.type === 'credit' || tx.type === 'STK_PUSH' || tx.type === 'C2B' ? 'text-emerald-600' : 
                           tx.type === 'debit' || ['B2C', 'B2B', 'B2POCHI'].includes(tx.type) ? 'text-red-600' : 'text-gray-600'
                         }`}>
                           {tx.type === 'credit' || tx.type === 'STK_PUSH' || tx.type === 'C2B' ? '+' : 
                            tx.type === 'debit' || ['B2C', 'B2B', 'B2POCHI'].includes(tx.type) ? '-' : ''}{wallet.currency} {tx.amount.toFixed(2)}
                         </TableCell>
                         <TableCell className="text-center">
                           <Badge variant={tx.type === 'credit' || tx.type === 'STK_PUSH' || tx.type === 'C2B' ? 'default' : 
                                         tx.type === 'debit' || ['B2C', 'B2B', 'B2POCHI'].includes(tx.type) ? 'destructive' : 'secondary'} 
                                   className="text-[10px] py-0">
                             {tx.type.replace('_', ' ')}
                           </Badge>
                         </TableCell>
                         <TableCell className="text-xs">{tx.description || '-'}</TableCell>
                         <TableCell className="text-center">
                           <Badge 
                             variant="outline" 
                             className={`text-[10px] py-0 border-none ${
                               tx.status === 'completed' || tx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600' : 
                               tx.status === 'pending' || tx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' : 
                               'bg-red-500/10 text-red-600'
                             }`}
                           >
                             {(tx.status || 'UNKNOWN').replace('_', ' ')}
                           </Badge>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                </TableBody>
              </Table>

              {transactionsTotalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-muted/5">
                  <p className="text-sm text-muted-foreground italic">
                    Showing <span className="font-bold">{(transactionsPage - 1) * transactionsLimit + 1}</span> to <span className="font-bold">{Math.min(transactionsPage * transactionsLimit, transactionsTotalCount)}</span> of <span className="font-bold">{transactionsTotalCount}</span> transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTransactionsPage(prev => Math.max(1, prev - 1))}
                      disabled={transactionsPage === 1 || isTransactionsLoading}
                      className="gap-1 h-8 px-3 text-xs"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, transactionsTotalPages) }, (_, i) => {
                        let page;
                        if (transactionsTotalPages <= 5) {
                          page = i + 1;
                        } else if (transactionsPage <= 3) {
                          page = i + 1;
                        } else if (transactionsPage >= transactionsTotalPages - 2) {
                          page = transactionsTotalPages - 4 + i;
                        } else {
                          page = transactionsPage - 2 + i;
                        }
                        return (
                          <Button
                            key={page}
                            variant={transactionsPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTransactionsPage(page)}
                            disabled={isTransactionsLoading}
                            className={`h-8 w-8 p-0 text-xs ${transactionsPage === page ? 'bg-primary text-white' : ''}`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTransactionsPage(prev => Math.min(transactionsTotalPages, prev + 1))}
                      disabled={transactionsPage === transactionsTotalPages || isTransactionsLoading}
                      className="gap-1 h-8 px-3 text-xs"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
              )}
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
                    <Plus className="w-4 h-4" /> Deposit via M-Pesa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-emerald-700 flex items-center gap-2">
                      <Smartphone className="w-5 h-5" /> Add Funds (M-Pesa STK Push)
                    </DialogTitle>
                    <DialogDescription>Initiate an STK Push to your phone to top up your wallet.</DialogDescription>
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
                      <Label>M-Pesa Number *</Label>
                      <Input 
                        type="tel" 
                        placeholder="2547XXXXXXXX" 
                        value={depositSource}
                        onChange={(e) => setDepositSource(e.target.value)}
                        className="bg-muted/30 border-none h-11" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Textarea 
                        placeholder="e.g. Wallet top-up" 
                        value={depositMemo}
                        onChange={(e) => setDepositMemo(e.target.value)}
                        className="bg-muted/30 border-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Recipient Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter recipient name"
                        value={depositRecipientName}
                        onChange={(e) => setDepositRecipientName(e.target.value)}
                        className="bg-muted/30 border-none h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Payment Document</Label>
                      {depositProofFile ? (
                        <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-3 py-2">
                          <Paperclip className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm truncate flex-1">{depositProofFile.name}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setDepositProofFile(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-4 text-sm text-muted-foreground transition hover:bg-muted/40">
                          <Upload className="w-4 h-4" /> Click to upload
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setDepositProofFile(e.target.files?.[0] || null)} />
                        </label>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddFunds(false)}>Cancel</Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      onClick={handleDeposit}
                      disabled={isDepositing || isUploadingProof}
                    >
                      {isDepositing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Push STK
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showBankDeposit} onOpenChange={(open) => { setShowBankDeposit(open); if (!open) setBankDepositConfirming(false); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5 gap-2 h-11 shadow-sm">
                    <Landmark className="w-4 h-4" /> Deposit via Bank
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-emerald-700 flex items-center gap-2">
                      <Landmark className="w-5 h-5" /> Add Funds (Bank Transfer)
                    </DialogTitle>
                    <DialogDescription>
                      {bankDepositConfirming
                        ? 'Confirm the details below, then send the amount to the Co-op Bank account shown.'
                        : 'Top up your wallet from a bank account via Co-op Bank validation.'}
                    </DialogDescription>
                  </DialogHeader>
                  {!bankDepositConfirming && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Amount ({wallet.currency}) *</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={bankDepositAmount}
                        onChange={(e) => setBankDepositAmount(e.target.value)}
                        className="bg-muted/30 border-none h-11 font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sender Account Number *</Label>
                      <Input
                        type="text"
                        placeholder="e.g. 01192588813000"
                        value={bankDepositAccount}
                        onChange={(e) => setBankDepositAccount(e.target.value)}
                        className="bg-muted/30 border-none h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (Optional)</Label>
                      <Textarea
                        placeholder="e.g. Bank wallet top-up"
                        value={bankDepositMemo}
                        onChange={(e) => setBankDepositMemo(e.target.value)}
                        className="bg-muted/30 border-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Recipient Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter recipient name"
                        value={bankDepositRecipientName}
                        onChange={(e) => setBankDepositRecipientName(e.target.value)}
                        className="bg-muted/30 border-none h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Payment Document</Label>
                      {bankDepositProofFile ? (
                        <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-3 py-2">
                          <Paperclip className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm truncate flex-1">{bankDepositProofFile.name}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setBankDepositProofFile(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-4 text-sm text-muted-foreground transition hover:bg-muted/40">
                          <Upload className="w-4 h-4" /> Click to upload
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setBankDepositProofFile(e.target.files?.[0] || null)} />
                        </label>
                      )}
                    </div>
                  </div>
                  )}
                  {bankDepositConfirming && (
                  <div className="space-y-4 py-4">
                    <div className="rounded-md border border-muted bg-muted/20 divide-y divide-border/60">
                      <BankDepositSummaryRow label="Amount" value={`KES ${Number(bankDepositAmount).toLocaleString()}`} strong />
                      <BankDepositSummaryRow label="Sender Account" value={bankDepositAccount} />
                      {bankDepositRecipientName && <BankDepositSummaryRow label="Recipient Name" value={bankDepositRecipientName} />}
                      {bankDepositMemo && <BankDepositSummaryRow label="Description" value={bankDepositMemo} />}
                      {bankDepositProofFile && <BankDepositSummaryRow label="Payment Document" value={bankDepositProofFile.name} />}
                    </div>

                    <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                        <Landmark className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Transfer Instructions</span>
                      </div>
                      <p className="text-sm text-foreground">
                        Send exactly <span className="font-bold">KES {Number(bankDepositAmount).toLocaleString()}</span> from account{' '}
                        <span className="font-mono text-xs">{bankDepositAccount}</span> to:
                      </p>
                      <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-background/80 px-3 py-2.5">
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">Co-operative Bank of Kenya</div>
                          <div className="font-mono font-bold tracking-wide">{bankSourceAccount || 'Contact support for the account number'}</div>
                        </div>
                        {bankSourceAccount && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => {
                              navigator.clipboard?.writeText(bankSourceAccount);
                              toast({ title: 'Copied', description: 'Account number copied to clipboard.', variant: 'success' });
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your wallet will be credited automatically once the bank confirms receipt of your payment.
                      </p>
                    </div>
                  </div>
                  )}
                  <DialogFooter>
                    {bankDepositConfirming ? (
                      <>
                        <Button variant="outline" onClick={() => setBankDepositConfirming(false)} disabled={isBankDepositing || isUploadingProof}>
                          <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          onClick={handleBankDeposit}
                          disabled={isBankDepositing || isUploadingProof}
                        >
                          {isBankDepositing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Proceed with Top-Up
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => setShowBankDeposit(false)}>Cancel</Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          onClick={handleStartBankDepositConfirm}
                          disabled={isBankDepositing || isUploadingProof}
                        >
                          Validate & Top Up
                        </Button>
                      </>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showBankPayout} onOpenChange={setShowBankPayout}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full border-blue-600/40 text-blue-700 hover:bg-blue-50 gap-2 h-11 shadow-sm">
                    <Building2 className="w-4 h-4" /> Send Bank Payout
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-blue-700 flex items-center gap-2">
                      <Building2 className="w-5 h-5" /> Outward Bank Payout
                    </DialogTitle>
                    <DialogDescription>Pay to a bank account or mobile wallet via Co-op Bank.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Payout Channel</Label>
                      <Select value={bankPayoutChannel} onValueChange={setBankPayoutChannel}>
                        <SelectTrigger className="bg-muted/30 border-none h-11">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pesalink">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" /> PesaLink (Any Bank)
                            </div>
                          </SelectItem>
                          <SelectItem value="ift">
                            <div className="flex items-center gap-2">
                              <Landmark className="w-4 h-4" /> IFT (Co-op to Co-op)
                            </div>
                          </SelectItem>
                          <SelectItem value="mpesa">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4" /> Bank to M-Pesa
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Amount ({wallet.currency}) *</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={bankPayoutAmount}
                        onChange={(e) => setBankPayoutAmount(e.target.value)}
                        className="bg-muted/30 border-none h-11 font-mono font-bold"
                      />
                    </div>

                    {bankPayoutChannel === 'mpesa' ? (
                      <div className="space-y-2">
                        <Label>Recipient Mobile No. *</Label>
                        <Input
                          type="tel"
                          placeholder="2547XXXXXXXX"
                          value={bankPayoutMobile}
                          onChange={(e) => setBankPayoutMobile(e.target.value)}
                          className="bg-muted/30 border-none h-11"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Destination Account Number *</Label>
                          <Input
                            type="text"
                            placeholder="e.g. 01102789645002"
                            value={bankPayoutAccount}
                            onChange={(e) => setBankPayoutAccount(e.target.value)}
                            className="bg-muted/30 border-none h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Destination Bank {bankPayoutChannel === 'pesalink' ? '*' : '(Optional)'}</Label>
                          <Select
                            value={bankPayoutBankCode}
                            onValueChange={setBankPayoutBankCode}
                          >
                            <SelectTrigger className="bg-muted/30 border-none h-11">
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                              {KENYAN_BANKS.map((bank) => (
                                <SelectItem key={bank.code} value={bank.code}>
                                  {bank.name} ({bank.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Description / Remarks</Label>
                        <span className={`text-xs font-mono ${bankPayoutMemo.length >= 15 ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                          {bankPayoutMemo.length}/15
                        </span>
                      </div>
                      <Textarea
                        placeholder="Max 15 characters..."
                        value={bankPayoutMemo}
                        onChange={(e) => setBankPayoutMemo(e.target.value.slice(0, 15))}
                        className="bg-muted/30 border-none"
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Recipient Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter recipient name"
                        value={bankPayoutRecipientName}
                        onChange={(e) => setBankPayoutRecipientName(e.target.value)}
                        className="bg-muted/30 border-none h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Payment Document</Label>
                      {bankPayoutProofFile ? (
                        <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-3 py-2">
                          <Paperclip className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm truncate flex-1">{bankPayoutProofFile.name}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setBankPayoutProofFile(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-4 text-sm text-muted-foreground transition hover:bg-muted/40">
                          <Upload className="w-4 h-4" /> Click to upload
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setBankPayoutProofFile(e.target.files?.[0] || null)} />
                        </label>
                      )}
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col gap-2">
                    {wallet.balance < parseFloat(bankPayoutAmount || '0') && (
                      <p className="text-[10px] text-red-600 font-bold mb-2">Insufficient Balance!</p>
                    )}
                    <div className="flex justify-end gap-2 w-full">
                      <Button variant="outline" onClick={() => setShowBankPayout(false)}>Cancel</Button>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        onClick={handleBankPayout}
                        disabled={isBankPaying || isUploadingProof || wallet.balance < parseFloat(bankPayoutAmount || '0')}
                      >
                        {isBankPaying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create Bank Payout
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showMakePayment} onOpenChange={setShowMakePayment}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 shadow-sm border-none">
                    <Smartphone className="w-4 h-4" /> Send M-Pesa Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-blue-700 flex items-center gap-2">
                      <ArrowDownLeft className="w-5 h-5" /> Outward M-Pesa Payout
                    </DialogTitle>
                    <DialogDescription>Pay suppliers or staff via M-Pesa services.</DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Payment Type</Label>
                      <Select value={payoutType} onValueChange={setPayoutType}>
                        <SelectTrigger className="bg-muted/30 border-none h-11">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4" /> Phone Number (B2C)
                            </div>
                          </SelectItem>
                          <SelectItem value="pochi">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" /> Pochi la Biashara
                            </div>
                          </SelectItem>
                          <SelectItem value="till">
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4" /> Buy Goods (Till)
                            </div>
                          </SelectItem>
                          <SelectItem value="paybill">
                            <div className="flex items-center gap-2">
                              <QrCode className="w-4 h-4" /> Paybill
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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
                      <Label>
                        {payoutType === 'phone' || payoutType === 'pochi' ? 'Recipient Mobile No.' : payoutType === 'paybill' ? 'Business Short Code' : 'Till Number'} *
                      </Label>
                      <Input 
                        type="text" 
                        placeholder={payoutType === 'phone' || payoutType === 'pochi' ? '2547XXXXXXXX' : payoutType === 'paybill' ? 'Enter business short code' : 'Enter till number'} 
                        value={paymentRecipient}
                        onChange={(e) => setPaymentRecipient(e.target.value)}
                        className="bg-muted/30 border-none h-11" 
                      />
                    </div>
                    {payoutType === 'paybill' && (
                      <div className="space-y-2">
                        <Label>Account Number *</Label>
                        <Input 
                          type="text" 
                          placeholder="Enter account number (optional)" 
                          value={paymentAccountNumber}
                          onChange={(e) => setPaymentAccountNumber(e.target.value)}
                          className="bg-muted/30 border-none h-11" 
                        />
                        <p className="text-[10px] text-muted-foreground italic">Leave blank if the paybill doesn't require an account number</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Description / Remarks</Label>
                      <Textarea 
                        placeholder="Payment reason..." 
                        value={paymentMemo}
                        onChange={(e) => setPaymentMemo(e.target.value)}
                        className="bg-muted/30 border-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Recipient Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter recipient name"
                        value={paymentRecipientName}
                        onChange={(e) => setPaymentRecipientName(e.target.value)}
                        className="bg-muted/30 border-none h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Upload Payment Document</Label>
                      {paymentProofFile ? (
                        <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-3 py-2">
                          <Paperclip className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm truncate flex-1">{paymentProofFile.name}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setPaymentProofFile(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-4 text-sm text-muted-foreground transition hover:bg-muted/40">
                          <Upload className="w-4 h-4" /> Click to upload
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)} />
                        </label>
                      )}
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col gap-2">
                    {wallet.balance < parseFloat(paymentAmount || '0') && (
                      <p className="text-[10px] text-red-600 font-bold mb-2">Insufficient Balance!</p>
                    )}
                    <div className="flex justify-end gap-2 w-full">
                      <Button variant="outline" onClick={() => setShowMakePayment(false)}>Cancel</Button>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        onClick={handlePayment}
                        disabled={isMakingPayment || isUploadingProof || wallet.balance < parseFloat(paymentAmount || '0')}
                      >
                        {isMakingPayment && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Execute Payment
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Account Meta</CardTitle>
              </div>
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
