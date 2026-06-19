'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  Package, ClipboardList, Users,
  Activity, Clock, ShieldAlert, AlertCircle,
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSite } from '@/hooks/use-site';
import Link from 'next/link';

interface DashboardStats {
  totalWorkers: number;
  workersPresentToday: number;
  totalEquipment: number;
  totalInventory: number;
  totalPurchaseOrders: number;
  pendingPurchaseOrders: number;
  activeTasks: number;
  totalSites: number;
  safetyIncidents: number;
  monthlyCredits: number;
  monthlyDebits: number;
}

interface ActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  user: { name: string };
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';
  module: string;
  createdAt: string;
}

interface AttendanceItem {
  date: string;
  totalHours: number;
  overtimeHours: number;
  avgHours: number;
  workersPresent: number;
}

interface POStatus {
  status: string;
  count: number;
  totalValue: number;
}

interface InventoryStatus {
  status: string;
  count: number;
}

const attendanceConfig = {
  overtime: { label: 'Overtime', color: '#f97316' },
  attained: { label: 'Regular', color: '#10b981' },
};

const poConfig = {
  pending: { label: 'Pending', color: '#f59e0b' },
  processing: { label: 'Processing', color: '#3b82f6' },
  delivered: { label: 'Delivered', color: '#10b981' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
};

const ACTIVITY_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  UPDATE: 'bg-blue-500',
  DELETE: 'bg-red-500',
  LOGIN: 'bg-purple-500',
};

const ACTIVITY_MODULE_COLORS: Record<string, string> = {
  WORKERS: 'bg-blue-100 text-blue-700',
  INVENTORY: 'bg-amber-100 text-amber-700',
  PURCHASE_ORDERS: 'bg-purple-100 text-purple-700',
  SAFETY: 'bg-red-100 text-red-700',
  TEAM: 'bg-indigo-100 text-indigo-700',
  PAYROLL: 'bg-emerald-100 text-emerald-700',
  SETTINGS: 'bg-gray-100 text-gray-700',
  WALLETS: 'bg-green-100 text-green-700',
};

export default function ContractorDashboard() {
  const { activeSite } = useSite();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceItem[]>([]);
  const [poSummary, setPoSummary] = useState<POStatus[]>([]);
  const [inventoryByStatus, setInventoryByStatus] = useState<InventoryStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = activeSite ? `?siteId=${activeSite.id}` : '';
        const response = await fetch(`/web/api/contractor/dashboard${query}`);
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setStats(data.stats);
        setActivities(data.recentActivityLogs || []);
        setAttendanceData(data.attendanceData || []);
        setPoSummary(data.poSummary || []);
        setInventoryByStatus(data.inventoryByStatus || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeSite]);

  const getTimeLabel = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {activeSite ? `Overview for ${activeSite.name}` : 'Overview across all sites'}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Workers Present', value: stats?.workersPresentToday ?? '-', sub: stats ? `${stats.totalWorkers} total` : '', icon: Users, color: 'bg-blue-100 text-blue-700' },
          { label: 'Inventory', value: stats?.totalInventory ?? '-', sub: '', icon: Package, color: 'bg-amber-100 text-amber-700' },
          { label: 'Purchase Orders', value: stats?.totalPurchaseOrders ?? '-', sub: stats ? `${stats.pendingPurchaseOrders} pending` : '', icon: ClipboardList, color: 'bg-purple-100 text-purple-700' },
          { label: 'Safety', value: stats?.safetyIncidents ?? '-', sub: '', icon: ShieldAlert, color: stats?.safetyIncidents ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700' },
        ].map((card) => (
          <Card key={card.label} className="border-none shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-lg ${card.color}`}><card.icon className="w-3.5 h-3.5" /></div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">{card.label}</p>
              </div>
              <p className="text-xl font-bold">{loading ? <Skeleton className="h-6 w-16" /> : card.value}</p>
              {card.sub && <p className="text-[10px] text-muted-foreground">{card.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold">Attendance & Hours</CardTitle>
              <CardDescription>Last 7 days — hours and worker count</CardDescription>
            </div>
            <Badge variant="outline" className="font-medium text-[10px]">Last 7 Days</Badge>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? <Skeleton className="h-64 w-full" /> : attendanceData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No attendance data yet</div>
            ) : (
              <ChartContainer config={attendanceConfig} className="aspect-[16/9] w-full">
                <BarChart data={attendanceData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tickMargin={8} fontSize={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="overtime" stackId="a" fill="var(--color-overtime)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="attained" stackId="a" fill="var(--color-attained)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* PO Status */}
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold">Purchase Orders</CardTitle>
              <CardDescription>By status for {activeSite?.name || 'all sites'}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? <Skeleton className="h-64 w-full" /> : poSummary.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No purchase orders yet</div>
            ) : (
              <ChartContainer config={poConfig} className="aspect-[16/9] w-full">
                <BarChart data={poSummary}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="status" axisLine={false} tickLine={false} tickMargin={8} fontSize={10} />
                  <YAxis axisLine={false} tickLine={false} fontSize={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Status */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Inventory Status</CardTitle>
            <CardDescription>Stock levels by status</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? <Skeleton className="h-48 w-full" /> : inventoryByStatus.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No inventory data</div>
            ) : (
              <div className="space-y-3">
                {inventoryByStatus.map((item) => {
                  const total = inventoryByStatus.reduce((s, i) => s + i.count, 0);
                  const pct = total > 0 ? (item.count / total) * 100 : 0;
                  const colorMap: Record<string, string> = {
                    'in-stock': 'bg-emerald-500',
                    'low-stock': 'bg-amber-500',
                    'out-of-stock': 'bg-red-500',
                  };
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{item.status.replace('-', ' ')}</span>
                        <span className="text-muted-foreground">{item.count} items</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colorMap[item.status] || 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Recent Activity
                </CardTitle>
                <CardDescription>Latest actions across your sites</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px] uppercase">Live</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No recent activity</div>
            ) : (
              <div className="divide-y divide-border">
                {activities.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${ACTIVITY_COLORS[activity.action] || 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight">
                        <span className="font-bold text-primary">{activity.user?.name || 'System'}</span>{' '}
                        {activity.description || activity.action}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-[9px] px-1.5 py-0 border-none ${ACTIVITY_MODULE_COLORS[activity.module] || 'bg-gray-100 text-gray-700'}`}>
                          {activity.module}
                        </Badge>
                        <span className="flex items-center text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3 mr-0.5" />{getTimeLabel(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 bg-muted/20 border-t">
            <Link href="/contractor/reports" className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
              View Full Report
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}