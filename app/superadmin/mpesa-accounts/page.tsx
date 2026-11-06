'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Landmark,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface MpesaAccount {
  name: string;
  currency: string | null;
  balance: number | null;
  raw: string;
}

interface LatestQuery {
  transactionId: string;
  status: string;
  resultCode: number | null;
  resultDesc: string | null;
  queriedAt: string;
  callbackReceivedAt: string | null;
  mpesaTransactionId: string | null;
  accounts: MpesaAccount[];
  accountStatus: string | null;
  rawAccountBalance: string | null;
}

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000;

const formatBalance = (account: MpesaAccount) => {
  if (account.balance == null) return account.raw;
  return `KES ${account.balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatTime = (value: string | null) => {
  if (!value) return '(never)';
  return new Date(value).toLocaleString();
};

const statusBadge = (status: string | undefined) => {
  if (status === 'SUCCESS') {
    return <Badge className="gap-1"><CheckCircle2 className="w-3 h-3" /> Success</Badge>;
  }
  if (status === 'FAILED') {
    return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
  }
  if (status === 'PENDING') {
    return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
  }
  return <Badge variant="outline">{status || '—'}</Badge>;
};

const isPrimaryAccount = (name: string) => /working|utility/i.test(name);

export default function MpesaAccountsPage() {
  const [loading, setLoading] = useState(true);
  const [querying, setQuerying] = useState(false);
  const [shortcode, setShortcode] = useState('');
  const [environment, setEnvironment] = useState('');
  const [latest, setLatest] = useState<LatestQuery | null>(null);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadline = useRef(0);

  const fetchState = useCallback(async (): Promise<LatestQuery | null> => {
    const res = await fetch('/web/api/superadmin/mpesa-accounts');
    if (!res.ok) throw new Error('Failed to load M-Pesa accounts');
    const data = await res.json();
    setShortcode(data.shortcode || '');
    setEnvironment(data.environment || '');
    setLatest(data.latest || null);
    return data.latest || null;
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    setQuerying(false);
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    setQuerying(true);
    pollDeadline.current = Date.now() + POLL_TIMEOUT_MS;
    pollTimer.current = setInterval(async () => {
      try {
        const current = await fetchState();
        if (current && current.status !== 'PENDING' && current.callbackReceivedAt) {
          stopPolling();
          if (current.status === 'SUCCESS') {
            toast.success('M-Pesa account balances updated');
          } else {
            toast.error(current.resultDesc || 'The balance query failed');
          }
          return;
        }
        if (Date.now() > pollDeadline.current) {
          stopPolling();
          toast.info('Still waiting for the M-Pesa result callback — balances will appear once it lands.');
        }
      } catch {
        // transient poll failure — keep trying until the deadline
      }
    }, POLL_INTERVAL_MS);
  }, [fetchState, stopPolling]);

  useEffect(() => {
    fetchState()
      .then((current) => {
        // Someone (another admin or the CLI) has a query in flight — follow it.
        if (current && current.status === 'PENDING') startPolling();
      })
      .catch(() => toast.error('Unable to load M-Pesa account balances'))
      .finally(() => setLoading(false));
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [fetchState, startPolling]);

  const handleQuery = async () => {
    try {
      const res = await fetch('/web/api/superadmin/mpesa-accounts', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to query balances');
      toast.success('Balance query sent to M-Pesa — waiting for the result…');
      startPolling();
    } catch (error: any) {
      toast.error(error.message || 'Failed to query balances');
    }
  };

  const accounts = latest?.accounts || [];
  const primaryAccounts = accounts.filter((a) => isPrimaryAccount(a.name));
  const otherAccounts = accounts.filter((a) => !isPrimaryAccount(a.name));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">M-Pesa Accounts</h1>
          <p className="text-muted-foreground">
            Live balances for the platform M-Pesa shortcode
            {shortcode ? ` ${shortcode}` : ''} — working, utility and every other organization account
            reported by Daraja{environment ? ` (${environment})` : ''}.
          </p>
        </div>
        <Button onClick={handleQuery} disabled={querying || loading} className="gap-2">
          {querying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {querying ? 'Querying…' : 'Query Balances'}
        </Button>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Account Balances</CardTitle>
              <CardDescription>
                One AccountBalance query returns every account on the shortcode. Results arrive
                asynchronously from Safaricom via the result callback.
              </CardDescription>
            </div>
            {latest ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {statusBadge(latest.status)}
                <span>Last queried: {formatTime(latest.queriedAt)}</span>
                {latest.mpesaTransactionId && (
                  <span className="font-mono text-xs">Ref: {latest.mpesaTransactionId}</span>
                )}
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : latest?.status === 'FAILED' ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Last balance query failed{latest.resultCode != null ? ` (code ${latest.resultCode})` : ''}:
              {latest.resultDesc || ' no failure description was returned.'}
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
              <Landmark className="h-10 w-10 opacity-40" />
              <p className="font-medium text-foreground">No balances yet</p>
              <p className="text-sm">Click “Query Balances” to fetch the current account balances from M-Pesa.</p>
            </div>
          ) : (
            <>
              {querying && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Query sent — waiting for the M-Pesa result callback…
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...primaryAccounts, ...otherAccounts].map((account) => {
                    const primary = isPrimaryAccount(account.name);
                    const zero = (account.balance ?? 0) === 0;
                    return (
                      <TableRow key={account.name}>
                        <TableCell className={primary ? 'font-semibold' : zero ? 'text-muted-foreground' : ''}>
                          <span className="flex items-center gap-2">
                            {primary && <Landmark className="h-4 w-4 text-primary" />}
                            {account.name}
                            {primary && <Badge variant="outline">Primary</Badge>}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono ${primary ? 'font-semibold' : zero ? 'text-muted-foreground' : ''}`}
                        >
                          {formatBalance(account)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Working and Utility are the operating accounts (the CLI transfers move funds between
                  them). The remaining accounts are reported by M-Pesa for the shortcode and are
                  currently settled at zero.
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
