'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Package, 
  Hammer, 
  ClipboardList, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar,
  Clock
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
import { useSite } from '@/hooks/use-site';

interface DashboardData {
  inventory: number;
  machines: number;
  purchaseOrders: number;
  workers: number;
}

interface ActivityItem {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  type: 'create' | 'update' | 'delete' | 'info';
}

const attendanceData = [
  { date: 'Sun 1 Jan', overtime: 0.4, attained: 1.8, late: 0.1, leave: 0.2 },
  { date: 'Mon 2 Jan', overtime: 0.2, attained: 1.9, late: 0, leave: 0 },
  { date: 'Tue 3 Jan', overtime: 0.5, attained: 1.7, late: 0.2, leave: 0.1 },
  { date: 'Wed 4 Jan', overtime: 0.3, attained: 1.8, late: 0, leave: 0 },
  { date: 'Thu 5 Jan', overtime: 0.4, attained: 1.9, late: 0.1, leave: 0 },
  { date: 'Fri 6 Jan', overtime: 0.6, attained: 1.6, late: 0.3, leave: 0.2 },
  { date: 'Sat 7 Jan', overtime: 0, attained: 0, late: 0, leave: 2 },
];

const workersData = [
  { date: 'Sun 1 Jan', count: 32 },
  { date: 'Mon 2 Jan', count: 35 },
  { date: 'Tue 3 Jan', count: 28 },
  { date: 'Wed 4 Jan', count: 38 },
  { date: 'Thu 5 Jan', count: 35 },
  { date: 'Fri 6 Jan', count: 40 },
  { date: 'Sat 7 Jan', count: 15 },
];

const walletData = [
  { month: 'Jan', credits: 2.0, debits: 1.2 },
  { month: 'Feb', credits: 1.8, debits: 0.9 },
  { month: 'Mar', credits: 2.2, debits: 1.4 },
  { month: 'Apr', credits: 1.9, debits: 1.1 },
  { month: 'May', credits: 2.4, debits: 1.3 },
  { month: 'Jun', credits: 2.1, debits: 1.0 },
  { month: 'Jul', credits: 2.0, debits: 1.2 },
  { month: 'Aug', credits: 2.3, debits: 1.5 },
  { month: 'Sep', credits: 2.2, debits: 1.1 },
  { month: 'Oct', credits: 2.5, debits: 1.4 },
  { month: 'Nov', credits: 2.4, debits: 1.3 },
  { month: 'Dec', credits: 2.6, debits: 1.6 },
];

const attendanceConfig = {
  overtime: { label: 'Overtime', color: '#8B4513' },
  attained: { label: 'Attained', color: '#10b981' },
  late: { label: 'Late', color: '#f97316' },
  leave: { label: 'Leave', color: '#ef4444' },
};

const workersConfig = {
  count: { label: 'Workers Present', color: '#10b981' },
};

const walletConfig = {
  credits: { label: 'Credits', color: '#10b981' },
  debits: { label: 'Debits', color: '#ef4444' },
};

export default function ContractorDashboard() {
  const { activeSite } = useSite();
  const [data, setData] = useState<DashboardData>({
    inventory: 0,
    machines: 0,
    purchaseOrders: 0,
    workers: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query = activeSite ? `?siteId=${activeSite.id}` : '';
        const [materialsRes, tasksRes, poRes, visitorsRes] = await Promise.all([
          fetch(`/api/materials${query}`),
          fetch(`/api/tasks${query}`),
          fetch(`/api/purchase-orders${query}`),
          fetch(`/api/visitors${query}`),
        ]);

        const materials = await materialsRes.json();
        const tasks = await tasksRes.json();
        const poData = await poRes.json();
        const visitorsData = await visitorsRes.json();

        setData({
          inventory: Array.isArray(materials) ? materials.length : 0,
          machines: tasks.tasks ? tasks.tasks.length : (Array.isArray(tasks) ? tasks.length : 0),
          purchaseOrders: poData.purchaseOrders ? poData.purchaseOrders.length : (Array.isArray(poData) ? poData.length : 0),
          workers: visitorsData.visitors ? visitorsData.visitors.length : (Array.isArray(visitorsData) ? visitorsData.length : 0),
        });

        // Fetch real activity logs
        const contractorIdParam = activeSite ? `&contractorId=${activeSite.contractorId}` : '';
        const logsRes = await fetch(`/api/activity-logs?limit=5${contractorIdParam}`);
        const logsData = await logsRes.json();
        if (logsData.logs) {
          setActivities(logsData.logs.map((log: any) => ({
            id: log.id,
            action: log.description,
            timestamp: getTimeLabel(log.createdAt),
            user: log.user.name,
            type: log.action.toLowerCase() === 'create' ? 'create' : 
                  log.action.toLowerCase() === 'update' ? 'update' : 
                  log.action.toLowerCase() === 'delete' ? 'delete' : 'info'
          })));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
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

  const MetricCard = ({ label, value, icon: Icon, trend, trendValue, colorClass }: any) => (
    <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">
                {loading ? <Skeleton className="h-9 w-12" /> : value}
              </h3>
              {!loading && trend && (
                <span className={`flex items-center text-xs font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {trendValue}%
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Project Overview</h1>
        <p className="text-muted-foreground">Real-time performance and resource monitoring for {activeSite?.name || 'All Sites'}.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Inventory" 
          value={data.inventory} 
          icon={Package} 
          trend="up" 
          trendValue={12} 
          colorClass="bg-brown-100 text-brown-900 bg-primary/10 text-primary" 
        />
        <MetricCard 
          label="Machines" 
          value={data.machines} 
          icon={Hammer} 
          trend="down" 
          trendValue={2.4} 
          colorClass="bg-blue-100 text-blue-900" 
        />
        <MetricCard 
          label="Orders" 
          value={data.purchaseOrders} 
          icon={ClipboardList} 
          trend="up" 
          trendValue={8.5} 
          colorClass="bg-orange-100 text-orange-900" 
        />
        <MetricCard 
          label="Workers" 
          value={data.workers} 
          icon={Users} 
          trend="up" 
          trendValue={5} 
          colorClass="bg-emerald-100 text-emerald-900" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Chart */}
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold">Attendance & Hours</CardTitle>
              <CardDescription>Weekly breakdown of labour hours</CardDescription>
            </div>
            <Badge variant="outline" className="font-medium">Last 7 Days</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={attendanceConfig} className="aspect-[16/9] w-full">
              <BarChart data={attendanceData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tickMargin={10}
                  fontSize={10}
                />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="overtime" stackId="a" fill="var(--color-overtime)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="attained" stackId="a" fill="var(--color-attained)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="late" stackId="a" fill="var(--color-late)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="leave" stackId="a" fill="var(--color-leave)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Workers Chart */}
        <Card className="shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold">Workforce Trend</CardTitle>
              <CardDescription>Daily worker count on site</CardDescription>
            </div>
            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Live Status</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={workersConfig} className="aspect-[16/9] w-full">
              <LineChart data={workersData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tickMargin={10}
                  fontSize={10}
                />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--color-count)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "var(--color-count)", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallet Area Chart */}
        <Card className="lg:col-span-2 shadow-md border-none">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold text-primary">Financial Flow</CardTitle>
                <CardDescription>Monthly credits vs debits</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">Download CSV</Button>
                <Button size="sm" className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-white">View Ledger</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={walletConfig} className="aspect-[21/9] w-full">
              <AreaChart data={walletData}>
                <defs>
                  <linearGradient id="fillCredits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-credits)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-credits)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="fillDebits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-debits)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-debits)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tickMargin={10}
                />
                <YAxis axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="credits" 
                  stroke="var(--color-credits)" 
                  fillOpacity={1} 
                  fill="url(#fillCredits)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="debits" 
                  stroke="var(--color-debits)" 
                  fillOpacity={1} 
                  fill="url(#fillDebits)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-md border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Logs
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] uppercase">Live Updates</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.type === 'create' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                    activity.type === 'update' ? 'bg-blue-500' : 
                    activity.type === 'delete' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-tight">
                      <span className="font-bold text-primary">{activity.user}</span> {activity.action}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="p-4 bg-muted/20">
            <Button variant="ghost" className="w-full text-xs font-semibold text-muted-foreground hover:text-primary">
              View Activity Timeline
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
