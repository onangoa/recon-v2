'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

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
}

const attendanceData = [
  { date: 'Sun 1 Jan', 'Overtime Hours': 0.4, 'Attained Hours': 1.8, 'Late Hours': 0.1, 'Leave Hours': 0.2 },
  { date: 'Mon 2 Jan', 'Overtime Hours': 0.2, 'Attained Hours': 1.9, 'Late Hours': 0, 'Leave Hours': 0 },
  { date: 'Tue 3 Jan', 'Overtime Hours': 0.5, 'Attained Hours': 1.7, 'Late Hours': 0.2, 'Leave Hours': 0.1 },
  { date: 'Wed 4 Jan', 'Overtime Hours': 0.3, 'Attained Hours': 1.8, 'Late Hours': 0, 'Leave Hours': 0 },
  { date: 'Thu 5 Jan', 'Overtime Hours': 0.4, 'Attained Hours': 1.9, 'Late Hours': 0.1, 'Leave Hours': 0 },
  { date: 'Fri 6 Jan', 'Overtime Hours': 0.6, 'Attained Hours': 1.6, 'Late Hours': 0.3, 'Leave Hours': 0.2 },
  { date: 'Sat 7 Jan', 'Overtime Hours': 0, 'Attained Hours': 0, 'Late Hours': 0, 'Leave Hours': 2 },
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
  { month: 'Jan', Credits: 2.0, Debits: 1.2 },
  { month: 'Feb', Credits: 1.8, Debits: 0.9 },
  { month: 'Mar', Credits: 2.2, Debits: 1.4 },
  { month: 'Apr', Credits: 1.9, Debits: 1.1 },
  { month: 'May', Credits: 2.4, Debits: 1.3 },
  { month: 'Jun', Credits: 2.1, Debits: 1.0 },
  { month: 'Jul', Credits: 2.0, Debits: 1.2 },
  { month: 'Aug', Credits: 2.3, Debits: 1.5 },
  { month: 'Sep', Credits: 2.2, Debits: 1.1 },
  { month: 'Oct', Credits: 2.5, Debits: 1.4 },
  { month: 'Nov', Credits: 2.4, Debits: 1.3 },
  { month: 'Dec', Credits: 2.6, Debits: 1.6 },
];

export default function ContractorDashboard() {
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
      try {
        const [materialsRes, equipmentRes, ordersRes, visitorsRes] = await Promise.all([
          fetch('/api/materials'),
          fetch('/api/tasks'),
          fetch('/api/contractors'),
          fetch('/api/visitors'),
        ]);

        const materials = await materialsRes.json();
        const equipment = await equipmentRes.json();
        const orders = await ordersRes.json();
        const visitors = await visitorsRes.json();

        setData({
          inventory: Array.isArray(materials) ? materials.length : 0,
          machines: Array.isArray(equipment) ? equipment.length : 0,
          purchaseOrders: Array.isArray(orders) ? orders.length : 0,
          workers: Array.isArray(visitors) ? visitors.length : 0,
        });

        // Mock activities
        setActivities([
          {
            id: '1',
            action: 'created company test a',
            timestamp: '3 months ago',
            user: 'Antwon',
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const MetricCard = ({ label, value, icon, bgColor }: any) => (
    <div className={`rounded-lg p-6 text-white ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="mt-2 text-4xl font-bold">{loading ? '...' : value}</p>
          <p className="mt-2 text-xs opacity-75">▶ View more</p>
        </div>
        <div className="text-5xl opacity-70">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Inventory" value={data.inventory} icon="📦" bgColor="bg-green-100 text-green-900" />
        <MetricCard label="Machines" value={data.machines} icon="⚙️" bgColor="bg-blue-100 text-blue-900" />
        <MetricCard label="Purchase Orders" value={data.purchaseOrders} icon="🛒" bgColor="bg-orange-100 text-orange-900" />
        <MetricCard label="Workers" value={data.workers} icon="👥" bgColor="bg-sky-100 text-sky-900" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Overtime Hours" stackId="a" fill="#6366f1" />
              <Bar dataKey="Attained Hours" stackId="a" fill="#10b981" />
              <Bar dataKey="Late Hours" stackId="a" fill="#f97316" />
              <Bar dataKey="Leave Hours" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Workers Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workers</h3>
          <div className="mb-4 flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">Absent</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={workersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Wallet Credits & Debits */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Credits & Debits</h3>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Date Between</label>
            <input
              type="text"
              placeholder="Date between"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400"
            />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={walletData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Credits" stackId="1" fill="#10b981" />
              <Area type="monotone" dataKey="Debits" stackId="1" fill="#ef4444" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activities */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-0">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
            View all
          </button>
        </div>
      </div>
    </div>
  );
}
