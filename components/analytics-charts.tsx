'use client';

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 4000, subscriptions: 2400 },
  { month: 'Feb', revenue: 3000, subscriptions: 1398 },
  { month: 'Mar', revenue: 2000, subscriptions: 9800 },
  { month: 'Apr', revenue: 2780, subscriptions: 3908 },
  { month: 'May', revenue: 1890, subscriptions: 4800 },
  { month: 'Jun', revenue: 2390, subscriptions: 3800 },
];

const projectStatusData = [
  { name: 'Active', value: 3, fill: '#8B4513' },
  { name: 'Completed', value: 2, fill: '#A0522D' },
  { name: 'Paused', value: 1, fill: '#D2B48C' },
];

const contractorPerformanceData = [
  { name: 'Nairobi Builders', projects: 2, safety: 98 },
  { name: 'Kisumu Construction', projects: 1, safety: 98 },
  { name: 'Mombasa Developers', projects: 1, safety: 89 },
];

export function AnalyticsCharts() {
  return (
    <div className="space-y-6">
      {/* Revenue Chart */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Revenue Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: `1px solid var(--border)`,
                color: 'var(--foreground)',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} />
            <Line type="monotone" dataKey="subscriptions" stroke="var(--accent)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Status */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: `1px solid var(--border)`,
                  color: 'var(--foreground)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Contractor Performance */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Contractor Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={contractorPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: `1px solid var(--border)`,
                  color: 'var(--foreground)',
                }}
              />
              <Legend />
              <Bar dataKey="safety" fill="var(--primary)" />
              <Bar dataKey="projects" fill="var(--accent)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Platform Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-foreground">Metric</th>
                <th className="px-4 py-3 text-right font-medium text-foreground">Q1 2024</th>
                <th className="px-4 py-3 text-right font-medium text-foreground">Q2 2024</th>
                <th className="px-4 py-3 text-right font-medium text-foreground">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-secondary/30">
                <td className="px-4 py-3 text-foreground">Total Revenue (KES)</td>
                <td className="px-4 py-3 text-right text-muted-foreground">2.5M</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">3.2M</td>
                <td className="px-4 py-3 text-right font-medium text-green-600">+28%</td>
              </tr>
              <tr className="border-b border-border hover:bg-secondary/30">
                <td className="px-4 py-3 text-foreground">Active Contractors</td>
                <td className="px-4 py-3 text-right text-muted-foreground">2</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">3</td>
                <td className="px-4 py-3 text-right font-medium text-green-600">+50%</td>
              </tr>
              <tr className="border-b border-border hover:bg-secondary/30">
                <td className="px-4 py-3 text-foreground">Active Projects</td>
                <td className="px-4 py-3 text-right text-muted-foreground">2</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">3</td>
                <td className="px-4 py-3 text-right font-medium text-green-600">+50%</td>
              </tr>
              <tr className="border-b border-border hover:bg-secondary/30">
                <td className="px-4 py-3 text-foreground">Avg Safety Score</td>
                <td className="px-4 py-3 text-right text-muted-foreground">92%</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">95%</td>
                <td className="px-4 py-3 text-right font-medium text-green-600">+3%</td>
              </tr>
              <tr className="hover:bg-secondary/30">
                <td className="px-4 py-3 text-foreground">Project Completion Rate</td>
                <td className="px-4 py-3 text-right text-muted-foreground">75%</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">82%</td>
                <td className="px-4 py-3 text-right font-medium text-green-600">+7%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
