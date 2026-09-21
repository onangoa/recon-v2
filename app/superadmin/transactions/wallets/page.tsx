'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Wallet,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Landmark,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  TriangleAlert,
  Scale,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';

type LedgerChannel = 'mpesa' | 'bank' | 'internal';
type LedgerDirection = 'credit' | 'debit';

interface WalletReconciliation {
  id: string;
  name: string;
  description: string | null;
  balance: number;
  currency: string;
  status: string;
  contractor: { id: string; companyName: string } | null;
  transactionCount: number;
  totalCredit: number;
  totalDebit: number;
  computedBalance: number;
  variance: number;
  balanced: boolean;
}

interface WalletsResponse {
  wallets: WalletReconciliation[];
  summary: { totalWallets: number; balanced: number; unbalanced: number };
}

interface LedgerTransaction {
  id: string;
  type: string;
  status: string;
  channel: LedgerChannel;
  direction: LedgerDirection | null;
  settled: boolean;
  amount: number;
  description: string | null;
  transactionDesc: string | null;
  reference: string | null;
  receiptNumber: string | null;
  mpesaReceiptNumber: string | null;
  mpesaTransactionId: string | null;
  transactionType: string | null;
  accountReference: string | null;
  phoneNumber: string | null;
  remarks: string | null;
  recipientName: string | null;
  createdAt: string;
  balanceAfter: number;
}

interface ChannelTotals {
  credit: number;
  debit: number;
  creditCount: number;
  debitCount: number;
}

interface LedgerSummary {
  storedBalance: number;
  totalCredit: number;
  totalDebit: number;
  computedBalance: number;
  variance: number;
  balanced: boolean;
  transactionCount: number;
  settledCount: number;
  pendingCount: number;
  byChannel: Record<string, ChannelTotals>;
  statusCounts: Record<string, number>;
}

interface LedgerResponse {
  wallet: {
    id: string;
    name: string;
    description: string | null;
    balance: number;
    currency: string;
    status: string;
    contractor: { id: string; companyName: string } | null;
  };
  transactions: LedgerTransaction[];
  summary: LedgerSummary;
}

const STATUS_FILTERS: Record<string, (status: string) => boolean> = {
  all: () => true,
  settled: (s) => s === 'completed' || s === 'SUCCESS',
  pending: (s) =>
    ['pending', 'PENDING', 'pending_approval', 'PENDING_APPROVAL', 'pending_review'].includes(s),
  failed: (s) =>
    ['failed', 'FAILED', 'cancelled', 'CANCELLED', 'timeout', 'TIMEOUT'].includes(s),
  refunded: (s) => s === 'refunded',
};

const CHANNEL_META: Record<LedgerChannel, { label: string; icon: LucideIcon; className: string }> = {
  bank: { label: 'Bank', icon: Landmark, className: 'bg-blue-500/10 text-blue-600' },
  mpesa: { label: 'M-Pesa', icon: Smartphone, className: 'bg-emerald-500/10 text-emerald-600' },
  internal: { label: 'Internal', icon: Wallet, className: 'bg-muted text-muted-foreground' },
};

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function statusClassName(status: string) {
  if (status === 'completed' || status === 'SUCCESS') return 'bg-emerald-500/10 text-emerald-600';
  if (['pending', 'PENDING', 'pending_approval', 'PENDING_APPROVAL', 'pending_review'].includes(status))
    return 'bg-amber-500/10 text-amber-600';
  if (status === 'refunded') return 'bg-blue-500/10 text-blue-600';
  return 'bg-red-500/10 text-red-600';
}

function SummaryStat({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className={`mt-2 text-xl font-bold font-mono ${className ?? ''}`}>{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function WalletLedgerPage() {
  const [walletsData, setWalletsData] = useState<WalletsResponse | null>(null);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [selectedWalletId, setSelectedWalletId] = useState('all');
  const [ledger, setLedger] = useState<LedgerResponse | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchWallets = useCallback(async () => {
    setWalletsLoading(true);
    try {
      const res = await fetch('/web/api/superadmin/wallets');
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(getApiError(data, 'Failed to fetch wallets'));
      }
      setWalletsData(await res.json());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load wallets. Please refresh the page and try again.'));
    } finally {
      setWalletsLoading(false);
    }
  }, []);

  const fetchLedger = useCallback(async (walletId: string) => {
    setLedgerLoading(true);
    try {
      const res = await fetch(`/web/api/superadmin/wallets/${walletId}/transactions`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(getApiError(data, 'Failed to fetch wallet transactions'));
      }
      setLedger(await res.json());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load the wallet ledger. Please try again.'));
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    if (selectedWalletId !== 'all') {
      setSearchTerm('');
      setChannelFilter('all');
      setDirectionFilter('all');
      setStatusFilter('all');
      fetchLedger(selectedWalletId);
    } else {
      setLedger(null);
    }
  }, [selectedWalletId, fetchLedger]);

  const handleRefresh = () => {
    if (selectedWalletId !== 'all') {
      fetchLedger(selectedWalletId);
    } else {
      fetchWallets();
    }
  };

  const filteredTransactions = ledger
    ? ledger.transactions.filter((tx) => {
        if (channelFilter !== 'all' && tx.channel !== channelFilter) return false;
        if (directionFilter !== 'all' && tx.direction !== directionFilter) return false;
        if (statusFilter !== 'all' && !(STATUS_FILTERS[statusFilter]?.(tx.status) ?? false))
          return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const haystack = [
            tx.reference,
            tx.receiptNumber,
            tx.mpesaReceiptNumber,
            tx.mpesaTransactionId,
            tx.description,
            tx.transactionDesc,
            tx.recipientName,
            tx.accountReference,
            tx.phoneNumber,
            tx.transactionType,
            tx.id,
          ];
          if (!haystack.some((v) => v?.toLowerCase().includes(q))) return false;
        }
        return true;
      })
    : [];

  const summary = ledger?.summary;
  const creditCount = summary
    ? Object.values(summary.byChannel).reduce((sum, c) => sum + c.creditCount, 0)
    : 0;
  const debitCount = summary
    ? Object.values(summary.byChannel).reduce((sum, c) => sum + c.debitCount, 0)
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Wallet Ledger</h1>
          <p className="text-muted-foreground">
            Trace every bank, M-Pesa and internal credit or debit per wallet and verify the ledger
            against the stored balance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-full md:w-72">
            <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
              <SelectTrigger>
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wallets — overview</SelectItem>
                {walletsData?.wallets.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} · KES {fmt(w.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 shrink-0"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      {selectedWalletId === 'all' ? (
        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg">Wallet Reconciliation</CardTitle>
            {walletsData && (
              <CardDescription>
                {walletsData.summary.balanced} of {walletsData.summary.totalWallets} wallets
                balance
                {walletsData.summary.unbalanced > 0
                  ? ` — ${walletsData.summary.unbalanced} with a discrepancy`
                  : ''}
                .
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Wallet</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Owner</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right">Stored Balance</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right">Ledger Credits</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right">Ledger Debits</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right">Ledger Balance</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right">Variance</TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">Ledger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walletsLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        {Array(9)
                          .fill(0)
                          .map((__, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-6 w-20" />
                            </TableCell>
                          ))}
                      </TableRow>
                    ))
                ) : !walletsData || walletsData.wallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      No wallets found.
                    </TableCell>
                  </TableRow>
                ) : (
                  walletsData.wallets.map((w) => (
                    <TableRow key={w.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-muted/50 border border-border">
                            <Wallet className="w-3 h-3 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{w.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {w.transactionCount} transactions
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {w.contractor?.companyName ?? 'System'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold">
                        KES {fmt(w.balance)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-600">
                        +KES {fmt(w.totalCredit)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        -KES {fmt(w.totalDebit)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold">
                        KES {fmt(w.computedBalance)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-sm font-bold ${
                          w.balanced ? 'text-muted-foreground' : 'text-red-600'
                        }`}
                      >
                        {w.balanced ? '—' : `${w.variance > 0 ? '+' : '-'}KES ${fmt(Math.abs(w.variance))}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={w.balanced ? 'default' : 'destructive'}
                          className="text-[10px] font-bold px-2 py-0 h-5"
                        >
                          {w.balanced ? (
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                          ) : (
                            <TriangleAlert className="w-2.5 h-2.5 mr-1" />
                          )}
                          {w.balanced ? 'Balanced' : 'Out of balance'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-primary hover:text-primary"
                          onClick={() => setSelectedWalletId(w.id)}
                        >
                          View <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedWalletId('all')}
            >
              <ArrowLeft className="w-4 h-4" /> All wallets
            </Button>
          </div>

          {ledgerLoading || !ledger || !summary ? (
            <div className="space-y-6">
              <Skeleton className="h-28 w-full rounded-xl" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))}
              </div>
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <Card className="border-none shadow-md">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="p-2 rounded bg-muted/50 border border-border">
                        <Wallet className="w-4 h-4 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">{ledger.wallet.name}</h2>
                      <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 h-5">
                        {ledger.wallet.contractor?.companyName ?? 'System wallet'}
                      </Badge>
                      <Badge
                        variant={ledger.wallet.status === 'active' ? 'default' : 'secondary'}
                        className="text-[10px] font-bold px-2 py-0 h-5"
                      >
                        {ledger.wallet.status}
                      </Badge>
                    </div>
                    {ledger.wallet.description && (
                      <p className="text-sm text-muted-foreground">{ledger.wallet.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {summary.settledCount} settled · {summary.pendingCount} non-settled ·{' '}
                      {summary.transactionCount} total transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
                      Stored Balance
                    </p>
                    <p className="text-3xl font-bold font-mono text-primary">
                      KES {fmt(summary.storedBalance)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {summary.balanced ? (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-700">
                    Balanced — settled credits minus debits matches the stored wallet balance of
                    KES {fmt(summary.storedBalance)}.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <TriangleAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">
                    Out of balance — the stored wallet balance (KES {fmt(summary.storedBalance)}) is
                    KES {fmt(Math.abs(summary.variance))}{' '}
                    {summary.variance > 0 ? 'higher' : 'lower'} than the ledger total (KES{' '}
                    {fmt(summary.computedBalance)}).
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <SummaryStat
                  label="Ledger Credits"
                  value={`KES ${fmt(summary.totalCredit)}`}
                  hint={`${creditCount} settled credits`}
                  icon={ArrowDownLeft}
                  className="text-emerald-600"
                />
                <SummaryStat
                  label="Ledger Debits"
                  value={`KES ${fmt(summary.totalDebit)}`}
                  hint={`${debitCount} settled debits`}
                  icon={ArrowUpRight}
                  className="text-red-600"
                />
                <SummaryStat
                  label="Ledger Balance"
                  value={`KES ${fmt(summary.computedBalance)}`}
                  hint="Credits − debits (settled)"
                  icon={Scale}
                />
                <SummaryStat
                  label="Stored Balance"
                  value={`KES ${fmt(summary.storedBalance)}`}
                  hint="Wallet balance record"
                  icon={Wallet}
                />
                <SummaryStat
                  label="Variance"
                  value={
                    summary.balanced
                      ? 'KES 0.00'
                      : `KES ${summary.variance > 0 ? '+' : '-'}${fmt(Math.abs(summary.variance))}`
                  }
                  hint={summary.balanced ? 'Ledger matches stored balance' : 'Stored − ledger'}
                  icon={summary.balanced ? CheckCircle2 : TriangleAlert}
                  className={summary.balanced ? 'text-emerald-600' : 'text-red-600'}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['mpesa', 'bank', 'internal'] as const).map((ch) => {
                  const meta = CHANNEL_META[ch];
                  const totals =
                    summary.byChannel[ch] ?? { credit: 0, debit: 0, creditCount: 0, debitCount: 0 };
                  return (
                    <Card key={ch} className="border-none shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded border border-border ${meta.className}`}>
                            <meta.icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-sm font-bold">{meta.label}</span>
                        </div>
                        <div className="mt-3 space-y-1.5 font-mono text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Money in</span>
                            <span className="text-emerald-600 font-bold">
                              +KES {fmt(totals.credit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Money out</span>
                            <span className="text-red-600 font-bold">-KES {fmt(totals.debit)}</span>
                          </div>
                          <div className="flex justify-between border-t border-border/50 pt-1.5">
                            <span className="text-muted-foreground">Net</span>
                            <span className="font-bold">KES {fmt(totals.credit - totals.debit)}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {totals.creditCount} in / {totals.debitCount} out · settled only
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="border-none shadow-md">
                <CardHeader className="border-b border-border/50 pb-4 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="relative w-full lg:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search reference, receipt, name..."
                        className="pl-9 h-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={channelFilter} onValueChange={setChannelFilter}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All channels</SelectItem>
                          <SelectItem value="bank">Bank</SelectItem>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="internal">Internal</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={directionFilter} onValueChange={setDirectionFilter}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All directions</SelectItem>
                          <SelectItem value="credit">Credit (money in)</SelectItem>
                          <SelectItem value="debit">Debit (money out)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="settled">Settled</SelectItem>
                          <SelectItem value="pending">Pending / held</SelectItem>
                          <SelectItem value="failed">Failed / cancelled</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredTransactions.length} of {ledger.transactions.length}{' '}
                    transactions · balance after reflects settled movements only
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="font-bold text-[11px] uppercase tracking-wider">Date</TableHead>
                        <TableHead className="font-bold text-[11px] uppercase tracking-wider">Channel</TableHead>
                        <TableHead className="font-bold text-[11px] uppercase tracking-wider">Reference</TableHead>
                        <TableHead className="font-bold text-[11px] uppercase tracking-wider">Description</TableHead>
                        <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right">Amount</TableHead>
                        <TableHead className="font-bold text-[11px] uppercase tracking-wider">Status</TableHead>
                        <TableHead className="font-bold text-[11px] uppercase tracking-wider text-right">Balance After</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledger.transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                            No transactions recorded for this wallet yet.
                          </TableCell>
                        </TableRow>
                      ) : filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                            No transactions match the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((tx) => {
                          const meta = CHANNEL_META[tx.channel];
                          return (
                            <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(tx.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold px-2 py-0 h-5 border-none gap-1 ${meta.className}`}
                                >
                                  <meta.icon className="w-2.5 h-2.5" />
                                  {meta.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                <div className="flex flex-col gap-1">
                                  <span className="opacity-50 text-[10px]">
                                    {tx.reference || tx.id.slice(0, 8)}
                                  </span>
                                  <span className="font-bold text-primary text-[10px]">
                                    {tx.mpesaReceiptNumber ||
                                      tx.receiptNumber ||
                                      tx.accountReference ||
                                      tx.phoneNumber ||
                                      '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-foreground">
                                  {tx.description || tx.transactionDesc || tx.remarks || '-'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div
                                  className={`flex items-center justify-end gap-1.5 font-bold font-mono text-xs whitespace-nowrap ${
                                    tx.direction === 'credit'
                                      ? 'text-emerald-600'
                                      : tx.direction === 'debit'
                                        ? 'text-red-600'
                                        : 'text-muted-foreground'
                                  }`}
                                >
                                  {tx.direction === 'credit' ? (
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                  ) : tx.direction === 'debit' ? (
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  ) : null}
                                  {tx.direction === 'credit'
                                    ? '+'
                                    : tx.direction === 'debit'
                                      ? '-'
                                      : ''}
                                  KES {fmt(tx.amount)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold px-2 py-0 h-5 border-none ${statusClassName(tx.status)}`}
                                >
                                  {(tx.status || 'UNKNOWN').replace(/_/g, ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs whitespace-nowrap">
                                {tx.settled ? (
                                  <span className="font-bold">KES {fmt(tx.balanceAfter)}</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
