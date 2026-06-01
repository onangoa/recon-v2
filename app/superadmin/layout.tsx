'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('user');
    router.push('/');
  };

  const navItems = [
    { label: 'Dashboard', href: '/superadmin', icon: '🏠' },
    { label: 'Contractors', href: '/superadmin/contractors', icon: '👷' },
    { label: 'Plans', href: '/superadmin/plans', icon: '📋' },
    { label: 'Subscriptions', href: '/superadmin/subscriptions', icon: '💳' },
    { label: 'Transactions', href: '/superadmin/transactions', icon: '💰' },
    { label: 'Admins', href: '/superadmin/admins', icon: '👥' },
    { label: 'Support', href: '/superadmin/support', icon: '🆘' },
    { label: 'Settings', href: '/superadmin/settings', icon: '⚙️' },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 border-r border-gray-200 bg-white flex flex-col">
        {/* Logo */}
        <div className="border-b border-gray-200 px-4 py-4">
          <Link href="/superadmin" className="flex items-center gap-2">
            <div className="text-2xl">🏢</div>
            <span className="font-semibold text-gray-900">RECON</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-orange-50 text-primary border-l-4 border-primary'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 p-3">
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
                <span className="font-semibold text-gray-900">Super</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
                S
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
