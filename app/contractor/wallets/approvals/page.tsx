'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  ShoppingBag,
  QrCode,
  User,
  Wallet,
  DollarSign
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
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { Separator } from '@/components/ui/separator';

interface PendingTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: string;
  description: string | null;
  status: string;
  transactionType: string;
  accountReference: string | null;
  phoneNumber: string | null;
  remarks: string | null;
  createdAt: Date;
  wallet: {
    id: string;
    name: string;
    currency: string;
    balance: number;
  };
}

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <ApprovalsContent />
    </Suspense>
  );
}

function ApprovalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const walletId = searchParams.get('walletId');
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isApproving, setIsApproving] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [transactionToReject, setTransactionToReject] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApprovingSingle, setIsApprovingSingle] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 20;

  useEffect(() => {
    fetchPendingTransactions();
  }, [walletId, currentPage]);

  const fetchPendingTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/web/api/wallets/transactions/approvals?page=${currentPage}&limit=${limit}`;
      if (walletId) url += `&walletId=${walletId}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Unable to load the wallet approvals. Please refresh the page and try again.');
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination.pages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to load the wallet approvals. Please refresh the page and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  const handleApproveSelected = async () => {
    if (selectedTransactions.size === 0) {
      toast({
        title: "No Transactions Selected",
        description: "Please select at least one transaction to approve.",
        variant: "destructive",
      });
      return;
    }

    setIsApproving(true);
    try {
      const response = await fetch('/web/api/wallets/transactions/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionIds: Array.from(selectedTransactions)
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(getApiError(data, "Unable to approve the wallet requests. Please try again."));

      toast({
        title: "Approvals Processed",
        description: `${data.approved} transaction(s) approved successfully. ${data.failed} failed.`,
        variant: data.failed > 0 ? "destructive" : "success",
      });

      setSelectedTransactions(new Set());
      fetchPendingTransactions();
    } catch (err: any) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to approve the wallet requests. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!transactionToReject || !rejectReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    setIsRejecting(true);
    try {
      const response = await fetch(`/web/api/wallets/transactions/${transactionToReject}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(getApiError(data, "Unable to reject the wallet request. Please try again."));

      toast({
        title: "Transaction Rejected",
        description: "Transaction has been rejected successfully.",
        variant: "success",
      });

      setRejectDialogOpen(false);
      setRejectReason('');
      setTransactionToReject(null);
      fetchPendingTransactions();
    } catch (err: any) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to reject the wallet request. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedTransactions.size === 0) {
      toast({
        title: "No Transactions Selected",
        description: "Please select at least one transaction to reject.",
        variant: "destructive",
      });
      return;
    }

    if (!rejectReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    setIsRejecting(true);
    try {
      const results = [];
      const errors = [];

      for (const transactionId of selectedTransactions) {
        try {
          const response = await fetch(`/web/api/wallets/transactions/${transactionId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: rejectReason }),
          });

          const data = await response.json();
          if (!response.ok) throw new Error(getApiError(data, "Unable to reject the wallet request. Please try again."));
          results.push(transactionId);
        } catch (error: any) {
          errors.push({ transactionId, error: getErrorMessage(error, "Unable to reject the wallet request.") });
        }
      }

      toast({
        title: "Bulk Rejection Processed",
        description: `${results.length} transaction(s) rejected successfully. ${errors.length} failed.`,
        variant: errors.length > 0 ? "destructive" : "success",
      });

      setBulkRejectDialogOpen(false);
      setRejectReason('');
      setSelectedTransactions(new Set());
      fetchPendingTransactions();
    } catch (err: any) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to reject the wallet requests. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleApproveSingle = async (transactionId: string) => {
    setIsApprovingSingle(true);
    try {
      const response = await fetch('/web/api/wallets/transactions/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionIds: [transactionId]
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(getApiError(data, "Unable to approve the wallet request. Please try again."));

      if (data.failed > 0) {
        toast({
          title: "Approval Failed",
          description: data.errors?.[0]?.error || "Unable to approve the wallet request. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Transaction Approved",
          description: "Transaction has been approved successfully.",
          variant: "success",
        });
      }

      fetchPendingTransactions();
    } catch (err: any) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to approve the wallet request. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setIsApprovingSingle(false);
    }
  };

  const getTransactionIcon = (transactionType: string) => {
    switch (transactionType) {
      case 'B2C':
        return <Smartphone className="w-4 h-4" />;
      case 'B2POCHI':
        return <User className="w-4 h-4" />;
      case 'B2B':
        if (remarks === 'paybill') return <QrCode className="w-4 h-4" />;
        return <ShoppingBag className="w-4 h-4" />;
      default:
        return <Smartphone className="w-4 h-4" />;
    }
  };

  const getTransactionTypeLabel = (transactionType: string, remarks: string | null) => {
    switch (transactionType) {
      case 'B2C':
        return 'Phone Payment';
      case 'B2POCHI':
        return 'Pochi Payment';
      case 'B2B':
        return remarks === 'paybill' ? 'Paybill Payment' : 'Till Payment';
      default:
        return 'Unknown';
    }
  };

  const selectedTotal = transactions
    .filter(t => selectedTransactions.has(t.id))
    .reduce((sum, t) => sum + t.amount, 0);

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
            <BreadcrumbPage>Approvals</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold tracking-tight text-primary">Transaction Approvals</h1>
            <p className="text-muted-foreground mt-1 text-sm">Review and approve pending payout transactions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-amber-50 border border-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Pending Approval</p>
                <h3 className="text-2xl font-bold">{totalCount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-blue-50 border border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">Selected for Approval</p>
                <h3 className="text-2xl font-bold">{selectedTransactions.size}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-emerald-50 border border-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Selected Total</p>
                <h3 className="text-2xl font-bold">
                  {transactions.length > 0 ? transactions[0].wallet.currency : 'KES'} {selectedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="p-4 md:p-6 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Pending Transactions
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background border-none h-10 text-sm shadow-sm"
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 hover:bg-background hover:text-primary transition-colors"
                onClick={fetchPendingTransactions}
                disabled={isLoading}
              >
                <RotateCcw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              {selectedTransactions.size > 0 && (
                <>
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white gap-2 h-10"
                    onClick={() => setBulkRejectDialogOpen(true)}
                    disabled={isRejecting}
                  >
                    {isRejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <XCircle className="w-4 h-4" />
                    Reject Selected ({selectedTransactions.size})
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10"
                    onClick={handleApproveSelected}
                    disabled={isApproving}
                  >
                    {isApproving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Selected ({selectedTransactions.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground italic">Loading pending transactions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <ShieldCheck className="h-8 w-8 opacity-20" />
              <p className="text-xs italic">No pending transactions to review.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase w-12">
                      <Checkbox
                        checked={selectedTransactions.size === transactions.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase">Details</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Wallet</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Amount</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Created</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-mono text-xs">
                        <Checkbox
                          checked={selectedTransactions.has(tx.id)}
                          onCheckedChange={() => handleSelectTransaction(tx.id)}
                        />
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-primary text-xs">{tx.description || tx.transactionType}</span>
                          <span className="opacity-50 text-[10px]">ID: {tx.id.slice(0, 8)}</span>
                          <div className="flex items-center gap-2 opacity-70">
                            {tx.remarks === 'phone' && <span className="text-[10px]">📱 {tx.phoneNumber || tx.accountReference}</span>}
                            {tx.remarks === 'pochi' && <span className="text-[10px]">👤 {tx.phoneNumber || tx.accountReference}</span>}
                            {tx.remarks === 'paybill' && <span className="text-[10px]">📋 {tx.accountReference}</span>}
                            {tx.remarks === 'till' && <span className="text-[10px]">🛒 {tx.accountReference}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(tx.transactionType)}
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
                            {getTransactionTypeLabel(tx.transactionType, tx.remarks)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{tx.wallet.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Balance: {tx.wallet.currency} {tx.wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className={`font-bold font-mono text-xs text-right`}>
                        {tx.wallet.currency} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleApproveSingle(tx.id)}
                            disabled={isApprovingSingle}
                          >
                            {isApprovingSingle ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setTransactionToReject(tx.id);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-muted/5">
                  <p className="text-sm text-muted-foreground italic">
                    Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, totalCount)}</span> of <span className="font-bold">{totalCount}</span> transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || isLoading}
                      className="gap-1 h-8 px-3 text-xs"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            disabled={isLoading}
                            className={`h-8 w-8 p-0 text-xs ${currentPage === page ? 'bg-primary text-white' : ''}`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || isLoading}
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

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Reject Transaction
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-muted/30 border-none min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                onClick={handleReject}
                disabled={isRejecting}
              >
                {isRejecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reject Transaction
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Bulk Reject Transactions
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedTransactions.size} transaction(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                placeholder="Enter the reason for rejecting all selected transactions..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-muted/30 border-none min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setBulkRejectDialogOpen(false)}>Cancel</Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                onClick={handleBulkReject}
                disabled={isRejecting}
              >
                {isRejecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reject {selectedTransactions.size} Transaction(s)
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}