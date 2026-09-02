'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  RefreshCw,
  CheckCircle2,
  Undo2,
  Clock,
  AlertTriangle,
  Banknote,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/toast-utils';

interface ReviewTransaction {
  id: string;
  reference: string | null;
  receiptNumber: string | null;
  amount: number;
  type: string;
  status: string;
  transactionType: string | null;
  transactionDesc: string | null;
  remarks: string | null;
  createdAt: string;
  callbackReceivedAt: string | null;
  metadata: string | null;
  wallet: {
    id: string;
    name: string;
  };
}

function parseMeta(raw?: string | null): any {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function PaymentReviewPage() {
  const [transactions, setTransactions] = useState<ReviewTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/web/api/superadmin/transactions/review');
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load held payments. Please refresh and try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'refund') => {
    if (action === 'approve' && !window.confirm('Credit the wallet with this held payment?')) {
      return;
    }
    setProcessingId(id);
    try {
      const res = await fetch('/web/api/superadmin/transactions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionIds: [id], action }),
      });
      const data = await res.json();
      if (res.ok && data.failed === 0) {
        toast.success(
          action === 'approve'
            ? 'Payment approved and wallet credited'
            : 'Payment marked as refunded'
        );
        fetchData();
      } else {
        toast.error(data?.errors?.[0]?.error || data?.error || 'Action failed');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to process the action. Please try again.'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Review</h1>
          <p className="text-muted-foreground">
            Suspected duplicate or unmatched bank payments held for a decision before the wallet is credited.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-2" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <div>
              <CardTitle className="text-base">Held Payments</CardTitle>
              <CardDescription>
                Approve to credit the wallet, or mark refunded once the money has been returned to the sender.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Reference / Receipt</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Wallet</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Sender / Narration</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Amount</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Duplicate Of</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Received</TableHead>
                <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-36 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No held payments awaiting review.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const meta = parseMeta(tx.metadata);
                  const busy = processingId === tx.id;
                  return (
                    <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="font-mono text-[10px] text-muted-foreground space-y-0.5">
                          <div>{tx.receiptNumber || tx.reference || tx.id.substring(0, 12)}</div>
                          {meta.paymentRef && meta.paymentRef !== tx.receiptNumber && (
                            <div className="text-muted-foreground/70">Ref: {meta.paymentRef}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-muted/50 border border-border">
                            <Wallet className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{tx.wallet?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[260px] truncate text-sm text-foreground" title={meta.narration || tx.transactionDesc || ''}>
                          {meta.senderName && (
                            <span className="font-medium">{meta.senderName} — </span>
                          )}
                          {meta.narration || tx.transactionDesc || 'Bank payment'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1.5 font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5 rotate-180" />}
                          KES {tx.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {meta.duplicateOfTransactionId ? (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {meta.duplicateOfTransactionId.substring(0, 14)}…
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0 h-5">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(tx.callbackReceivedAt || tx.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            disabled={busy}
                            onClick={() => handleAction(tx.id, 'approve')}
                          >
                            <Banknote className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            disabled={busy}
                            onClick={() => handleAction(tx.id, 'refund')}
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Refund
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Approve credits the wallet balance atomically. Refund only closes the record here — send the money back to the sender via your bank, then mark it refunded.
      </p>
    </div>
  );
}
