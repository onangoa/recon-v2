'use client';

import { useEffect, useState } from 'react';
import {
  Users, CreditCard, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/toast-utils';
import Link from 'next/link';

interface DashboardStats {
  totalRevenue: number;
  revenueTrend: number;
  totalContractors: number;
  contractorsTrend: number;
  totalWorkers: number;
  totalSites: number;
}

interface Transaction {
  id: string;
  name: string;
  amount: string;
  method: string;
  status: string;
  date: string;
}

interface DashboardResponse {
  stats: DashboardStats;
  recentTransactions: Transaction[];
}

const ksh = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n);

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/web/api/superadmin/dashboard');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const data: DashboardResponse = await res.json();
        setStats(data.stats);
        setTransactions(data.recentTransactions || []);
      } catch (err: any) {
        setError(getErrorMessage(err, "Unable to load dashboard data. Please refresh the page and try again."));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <p className="text-sm font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground text-sm">Monitor contractors and financial activity.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Revenue', value: stats ? ksh(stats.totalRevenue) : '-', icon: CreditCard, trend: stats?.revenueTrend, color: 'bg-emerald-100 text-emerald-900' },
          { label: 'Contractors', value: stats?.totalContractors ?? '-', icon: Users, trend: stats?.contractorsTrend, color: 'bg-blue-100 text-blue-900' },
          { label: 'Sites', value: stats?.totalSites ?? '-', icon: Users, trend: undefined, color: 'bg-orange-100 text-orange-900' },
        ].map((card) => (
          <Card key={card.label} className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold tracking-tight">
                      {loading ? <Skeleton className="h-7 w-20" /> : card.value}
                    </h3>
                    {!loading && card.trend !== undefined && card.trend !== null && (
                      <span className={`flex items-center text-[10px] font-semibold ${card.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {card.trend >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                        {Math.abs(card.trend).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className={`p-2.5 rounded-2xl ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Workers</p>
            <p className="text-xl font-bold">{loading ? <Skeleton className="h-6 w-12 mx-auto" /> : stats?.totalWorkers}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Sites</p>
            <p className="text-xl font-bold">{loading ? <Skeleton className="h-6 w-12 mx-auto" /> : stats?.totalSites}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Recent Transactions</CardTitle>
            <CardDescription>Latest financial activities across the platform</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/superadmin/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Wallet</th>
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Amount</th>
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Method</th>
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Status</th>
                  <th className="text-left py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No transactions yet</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{tx.name}</td>
                      <td className="py-3 px-4 font-bold text-primary">{tx.amount}</td>
                      <td className="py-3 px-4 text-muted-foreground">{tx.method}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[9px] font-bold uppercase px-1.5 py-0 border-none ${
                            tx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                            tx.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{tx.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t border-border p-3">
          <p className="text-[10px] text-muted-foreground italic">Showing latest platform transactions.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
