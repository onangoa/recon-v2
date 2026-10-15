'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Search,
  Menu,
  Bell,
  MessageSquare,
  HardHat,
  ChevronRight,
} from 'lucide-react';
import {
  HomeIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentMagnifyingGlassIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import AppSidebar from '@/components/app-sidebar';
import type { AppSidebarIcon } from '@/components/app-sidebar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/context/auth-context';

function SuperadminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { logout } = useAuth();

  const navItems: { label: string; href: string; icon: AppSidebarIcon }[] = [
    { label: 'Dashboard', href: '/superadmin', icon: HomeIcon },
    { label: 'Contractors', href: '/superadmin/contractors', icon: BuildingOffice2Icon },
    { label: 'Plans', href: '/superadmin/plans', icon: ClipboardDocumentListIcon },
    { label: 'Subscriptions', href: '/superadmin/subscriptions', icon: CreditCardIcon },
    { label: 'Transactions', href: '/superadmin/transactions', icon: BanknotesIcon },
    { label: 'Payment Review', href: '/superadmin/transactions/review', icon: DocumentMagnifyingGlassIcon },
    { label: 'Wallet Ledger', href: '/superadmin/transactions/wallets', icon: ScaleIcon },
    { label: 'Admins', href: '/superadmin/admins', icon: ShieldCheckIcon },
  ];

  const platformSwitcher = (
    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/12 transition-colors duration-200 border border-white/10 text-left cursor-default">
      <div className="w-6 h-6 rounded-lg bg-teal flex items-center justify-center shrink-0">
        <HardHat size={12} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate">CalCite Platform</p>
        <p className="text-blue-200/50 text-[10px]">Super Admin</p>
      </div>
      <ChevronRight size={12} className="text-blue-200/40 shrink-0" />
    </button>
  );

  const sidebarProps = {
    currentPath: pathname,
    navItems,
    sectionLabel: 'Platform Management',
    brandTagline: 'Platform administration.',
    workspaceSelector: platformSwitcher,
    user: {
      name: 'Super Admin',
      role: 'Global Administrator',
      initials: 'SA',
      email: 'admin@reconhub.com',
    },
    settingsHref: '/superadmin/settings',
    userMenuItems: [
      { label: 'Profile', href: '/superadmin/profile', icon: UserCircleIcon },
    ],
    onLogout: () => logout(),
    onLinkClick: () => setMobileNavOpen(false),
  };

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex h-screen bg-cloud overflow-hidden print:block print:h-auto print:overflow-visible">
      <div className="hidden md:flex h-full print:hidden">
        <AppSidebar {...sidebarProps} />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="bg-white border-b border-border px-4 sm:px-6 lg:px-8 shrink-0 print:hidden">
          <div className="max-w-screen-2xl mx-auto flex items-center gap-4 py-3.5">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-cloud transition-colors duration-150"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-bold text-midnight leading-tight truncate">
                Platform Admin
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                CalCite · {today}
              </p>
            </div>
            <div className="relative hidden lg:block w-72">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search contractors, plans, transactions…"
                className="input-field pl-9 py-2 text-sm"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono bg-cloud-dark px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </div>
            <button className="relative p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-cloud hover:text-midnight transition-colors duration-150">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full" />
            </button>
            <button
              className="hidden sm:flex p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-cloud transition-colors duration-150"
              title="Messages"
            >
              <MessageSquare size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-cloud scrollbar-thin print:overflow-visible print:bg-white">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 pb-10 print:max-w-none print:p-0">
            {children}
          </div>
        </main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="bg-midnight border-r-0 p-0 w-[240px] max-w-[240px] overflow-hidden [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppSidebar {...sidebarProps} mobile />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperadminShell>{children}</SuperadminShell>
  );
}
