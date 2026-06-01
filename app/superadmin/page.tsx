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
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const contractorsData = [
  { month: 'Jan', count: 0 },
  { month: 'Feb', count: 1 },
  { month: 'Mar', count: 1 },
  { month: 'Apr', count: 0 },
  { month: 'May', count: 0 },
  { month: 'Jun', count: 0 },
  { month: 'Jul', count: 0 },
  { month: 'Aug', count: 0 },
  { month: 'Sep', count: 0 },
  { month: 'Oct', count: 1 },
  { month: 'Nov', count: 1 },
  { month: 'Dec', count: 0 },
];

const revenueData = [
  { date: 'Dec 25', revenue: 0 },
  { date: '20 Dec', revenue: 10 },
  { date: 'Jan 26', revenue: 30 },
  { date: '10 Jan', revenue: 70 },
  { date: '20 Jan', revenue: 80 },
  { date: 'Feb 26', revenue: 50 },
];

const subscriptionRateData = [
  { day: 1, rate: 80 },
  { day: 2, rate: 60 },
  { day: 3, rate: 50 },
  { day: 4, rate: 40 },
  { day: 5, rate: 30 },
  { day: 6, rate: 35 },
  { day: 7, rate: 45 },
  { day: 8, rate: 55 },
  { day: 9, rate: 65 },
  { day: 10, rate: 75 },
  { day: 11, rate: 70 },
  { day: 12, rate: 65 },
  { day: 13, rate: 60 },
  { day: 14, rate: 50 },
  { day: 15, rate: 45 },
  { day: 16, rate: 40 },
];

const planSalesData = [
  { name: 'Demo Plan Free', value: 65, color: '#10b981' },
  { name: 'Plan 1', value: 35, color: '#3b82f6' },
];

const transactionsData = [
  { name: 'Antwon Ullrich', phone: '0700000009', email: 'ananaga@gmail.com', amount: 'Kshs. 3.00', method: 'Mpesa', status: 'COMPLETED', date: '2026-02-10 14:02' },
  { name: 'Antwon Ullrich', phone: '0700000009', email: 'ananaga@gmail.com', amount: 'Kshs. 3.00', method: 'Mpesa', status: 'FAILED', date: '2026-02-10 14:01' },
  { name: 'Antwon Ullrich', phone: '0700000009', email: 'ananaga@gmail.com', amount: 'Kshs. 3.00', method: 'Mpesa', status: 'FAILED', date: '2026-02-10 14:00' },
  { name: 'Antwon Ullrich', phone: '0700000009', email: 'ananaga@gmail.com', amount: 'Kshs. 3.00', method: 'Mpesa', status: 'FAILED', date: '2026-02-10 14:00' },
  { name: 'Antwon Ullrich', phone: '0700000009', email: 'ananaga@gmail.com', amount: 'Kshs. 3.00', method: 'Mpesa', status: 'FAILED', date: '2026-02-10 13:59' },
];

const topContractorsData = [
  { name: 'Delphine Jakubowski-Gorczany', phone: '0700000000', email: 'demo3@gmail.com', earnings: 'KSHs. 100.00' },
  { name: 'Antwon Ullrich', phone: '0700000009', email: 'ananaga@gmail.com', earnings: 'KSHs. 27.00' },
  { name: 'Jennifer Emard', phone: '0634427523', email: 'test0@gmail.com', earnings: 'KSHs. 12.00' },
  { name: 'Antwon Ullrich', phone: '7000000000', email: 'demo@gmail.com', earnings: 'KSHs. 6.00' },
  { name: 'Rebarcrete Construction', phone: '0706491785', email: 'rebarcreteconstruction@gmail.com', earnings: 'KSHs. 6.00' },
];

export default function SuperadminDashboard() {
  const [breadcrumbs, setBreadcrumbs] = useState('Home');

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">{breadcrumbs}</span>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue (Monthly)</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">Kshs. 0.00</p>
              <p className="mt-1 text-xs text-gray-500">0% change from last month</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contractor (Monthly)</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-xs text-gray-500">0% change from last month</p>
            </div>
            <div className="text-3xl">👷</div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Subscriptions (Monthly)</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-xs text-gray-500">0% change from last month</p>
            </div>
            <div className="text-3xl">💳</div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Plans</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">3</p>
              <p className="mt-1 text-xs text-gray-500">Active plans</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Total Contractors Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Total Contractors</h3>
            <span className="text-xs font-medium text-gray-500">Total Count of Contractors</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contractorsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b2f2f" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Total Revenue Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Total Revenue</h3>
            <span className="text-xs font-medium text-gray-500">Total Revenue obtained</span>
            <span className="text-lg font-bold text-gray-900">Kshs. 205.00</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Rate Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Subscription Rate</h3>
            <p className="text-xs font-medium text-gray-500">Subscription Rate of Plans</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={subscriptionRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#10b981"
                dot={false}
                name="Demo Plan Free"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Sales Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Plan Sales</h3>
            <p className="text-xs font-medium text-gray-500">Active Subscriptions Per Plans</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planSalesData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {planSalesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Recent Transactions</h3>
        <p className="mb-4 text-xs text-gray-500">Recently Added Transactions</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">NAME</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">PHONE NUMBER</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">E-MAIL</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">AMOUNT</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">PAYMENT METHOD</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">STATUS</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">CREATED AT</th>
              </tr>
            </thead>
            <tbody>
              {transactionsData.map((transaction, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{transaction.name}</td>
                  <td className="py-3 px-4 text-gray-600">{transaction.phone}</td>
                  <td className="py-3 px-4 text-gray-600">{transaction.email}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{transaction.amount}</td>
                  <td className="py-3 px-4 text-gray-600">{transaction.method}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{transaction.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-600">Showing 1 to 10 of 10 rows</span>
          <button className="rounded-md border border-gray-300 bg-gray-500 text-white px-3 py-1">10</button>
        </div>
      </div>

      {/* Top Contractors */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Top Contractors</h3>
        <p className="mb-4 text-xs text-gray-500">Top 5 Contractors by Maximum Purchase</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">NAME</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">PHONE NUMBER</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">E-MAIL</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">TOTAL EARNINGS</th>
              </tr>
            </thead>
            <tbody>
              {topContractorsData.map((contractor, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{contractor.name}</td>
                  <td className="py-3 px-4 text-gray-600">{contractor.phone}</td>
                  <td className="py-3 px-4 text-gray-600">{contractor.email}</td>
                  <td className="py-3 px-4 text-blue-600 font-semibold">{contractor.earnings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-600">Showing 1 to 5 of 5 rows</span>
        </div>
      </div>
    </div>
  );
}
