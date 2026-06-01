'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function ContractorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('user');
    router.push('/');
  };

  const navItems = [
    { label: 'Dashboard', href: '/contractor', icon: '🏠' },
    { label: 'Inventory', href: '/contractor/inventory', icon: '📦' },
    { label: 'Suppliers', href: '/contractor/suppliers', icon: '🤝' },
    { label: 'Wallets', href: '/contractor/wallets', icon: '💳' },
    { label: 'Site Uploads', href: '/contractor/uploads', icon: '📤' },
    { label: 'Machines & Equipment', href: '/contractor/equipment', icon: '⚙️' },
    { label: 'Purchase Orders', href: '/contractor/purchase-orders', icon: '📋' },
    { label: 'Material Deliveries', href: '/contractor/deliveries', icon: '🚚' },
    { label: 'Labour Management', href: '/contractor/labour', icon: '👷' },
    { label: 'Licenses', href: '/contractor/licenses', icon: '📜' },
    { label: 'Visitor Management', href: '/contractor/visitors', icon: '🚪' },
    { label: 'Payroll', href: '/contractor/payroll', icon: '💰' },
    { label: 'Staff', href: '/contractor/staff', icon: '👥' },
    { label: 'Reports', href: '/contractor/reports', icon: '📊' },
    { label: 'Settings', href: '/contractor/settings', icon: '⚙️' },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-white flex flex-col">
        {/* Project Header */}
        <div className="bg-primary px-4 py-4 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <div className="flex-1">
              <p className="text-xs opacity-90">Current Project</p>
              <p className="font-semibold text-sm">Karen plains Road Project</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-border px-3 py-3">
          <input
            type="text"
            placeholder="Search Menu..."
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors mb-1 ${
                isActive(item.href)
                  ? 'bg-orange-50 text-primary border-l-4 border-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === 'Inventory' && <span className="ml-auto text-xs">›</span>}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="w-full rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative w-96">
                <input
                  type="text"
                  placeholder="Search (CTRL + K)"
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-gray-500 hover:text-gray-700">
                <span className="text-xl">🔔</span>
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <span className="text-xl">💬</span>
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-700">Hi</span>
                <span className="font-semibold text-gray-900">Antwon</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
