'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { 
  Users, 
  CreditCard, 
  Wallet, 
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent 
} from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalRevenue: number;
  revenueTrend: number;
  totalContractors: number;
  contractorsTrend: number;
  activeSubscriptions: number;
  subscriptionsTrend: number;
  totalPlans: number;
}

interface Transaction {
  id: string;
  name: string;
  phone: string;
  email: string;
  amount: string;
  method: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  date: string;
}

const contractorsData = [
  { month: 'Jan', count: 4 },
  { month: 'Feb', count: 7 },
  { month: 'Mar', count: 5 },
  { month: 'Apr', count: 8 },
  { month: 'May', count: 12 },
  { month: 'Jun', count: 15 },
];

const revenueData = [
  { date: 'Jan', revenue: 1200 },
  { date: 'Feb', revenue: 2100 },
  { date: 'Mar', revenue: 1800 },
  { date: 'Apr', revenue: 2400 },
  { date: 'May', revenue: 3200 },
  { date: 'Jun', revenue: 4500 },
];

const planSalesData = [
  { name: 'Basic', value: 45, color: '#10b981' },
  { name: 'Professional', value: 35, color: '#3b82f6' },
  { name: 'Enterprise', value: 20, color: '#8b5cf6' },
];

const contractorsConfig = {
  count: { label: 'New Contractors', color: '#3b82f6' },
};

const revenueConfig = {
  revenue: { label: 'Revenue (KES)', color: '#10b981' },
};

const plansConfig = {
  basic: { label: 'Basic', color: '#10b981' },
  professional: { label: 'Professional', color: '#3b82f6' },
  enterprise: { label: 'Enterprise', color: '#8b5cf6' },
};

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/superadmin/dashboard');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        setStats(data.stats);
        setTransactions(data.recentTransactions);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const MetricCard = ({ label, value, icon: Icon, trend, trendValue, colorClass, prefix = "" }: any) => (
    <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight">
                {loading ? <Skeleton className="h-8 w-24" /> : `${prefix}${value.toLocaleString()}`}
              </h3>
              {!loading && trendValue !== undefined && (
                <span className={`flex items-center text-xs font-semibold ${trendValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trendValue >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(trendValue)}%
                </span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-2xl ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground">Comprehensive monitoring of contractors, subscriptions, and financial health.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Revenue" 
          value={stats?.totalRevenue || 0} 
          prefix="KES "
          icon={DollarSign} 
          trendValue={stats?.revenueTrend} 
          colorClass="bg-emerald-100 text-emerald-900" 
        />
        <MetricCard 
          label="Contractors" 
          value={stats?.totalContractors || 0} 
          icon={Users} 
          trendValue={stats?.contractorsTrend} 
          colorClass="bg-blue-100 text-blue-900" 
        />
        <MetricCard 
          label="Active Subs" 
          value={stats?.activeSubscriptions || 0} 
          icon={CreditCard} 
          trendValue={stats?.subscriptionsTrend} 
          colorClass="bg-orange-100 text-orange-900" 
        />
        <MetricCard 
          label="Available Plans" 
          value={stats?.totalPlans || 0} 
          icon={ClipboardList} 
          colorClass="bg-purple-100 text-purple-900" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold">Revenue Growth</CardTitle>
              <CardDescription>Monthly platform earnings (KES)</CardDescription>
            </div>
            <Badge variant="outline" className="font-medium">Year to Date</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={revenueConfig} className="aspect-[16/9] w-full">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tickMargin={10}
                  fontSize={12}
                />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--color-revenue)" 
                  fillOpacity={1} 
                  fill="url(#fillRevenue)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Contractors Chart */}
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold">Contractor Acquisition</CardTitle>
              <CardDescription>New contractors joining the platform</CardDescription>
            </div>
            <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Growth</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={contractorsConfig} className="aspect-[16/9] w-full">
              <BarChart data={contractorsData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tickMargin={10}
                  fontSize={12}
                />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  fill="var(--color-count)" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Plan Distribution */}
        <Card className="shadow-md border-none">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Plan Distribution</CardTitle>
            <CardDescription>Popularity of subscription tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={plansConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planSalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {planSalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {planSalesData.map((plan) => (
                <div key={plan.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }}></div>
                    <span className="text-sm font-medium">{plan.name}</span>
                  </div>
                  <span className="text-sm font-bold">{plan.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions Table */}
        <Card className="lg:col-span-2 shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
              <CardDescription>Latest financial activities across the platform</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/superadmin/transactions">View All</a>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Contractor</th>
                    <th className="text-left py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Amount</th>
                    <th className="text-left py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Method</th>
                    <th className="text-left py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Status</th>
                    <th className="text-left py-3 px-4 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                      </tr>
                    ))
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{transaction.name}</span>
                            <span className="text-[10px] text-muted-foreground">{transaction.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-primary">{transaction.amount}</td>
                        <td className="py-4 px-4 text-muted-foreground">{transaction.method}</td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={
                              transaction.status === 'COMPLETED' ? 'default' : 
                              transaction.status === 'FAILED' ? 'destructive' : 'secondary'
                            }
                            className="text-[10px] font-bold px-2 py-0"
                          >
                            {transaction.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-xs text-muted-foreground">{transaction.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 border-t border-border p-4">
            <p className="text-xs text-muted-foreground italic">Showing last 5 platform transactions.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
