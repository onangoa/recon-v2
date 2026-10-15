'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Search,
  Menu,
  MessageSquare,
  LogOut,
  ChevronsUpDown,
  Building2,
  Plus,
  CheckCircle2,
  MapPin,
  Construction,
  ChevronRight,
} from 'lucide-react';
import {
  HomeIcon,
  ShieldExclamationIcon,
  CubeIcon,
  ArchiveBoxIcon,
  WalletIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  ArrowUpTrayIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  DocumentTextIcon,
  TicketIcon,
  BanknotesIcon,
  UserGroupIcon,
  UsersIcon,
  ClockIcon,
  FingerPrintIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import AppSidebar from '@/components/app-sidebar';
import type { AppSidebarIcon } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SiteProvider, useSite } from '@/hooks/use-site';
import { useAuth } from '@/context/auth-context';

import NotificationBell from '@/components/notification-bell';

function SidebarNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { activeSite, sites, setActiveSite, isLoading: sitesLoading } = useSite();
  const { hasPermission, user, logout } = useAuth();

  // Onboarding state: no sites yet and user is on the create page.
  // Show a minimal layout without the sidebar / active-site chrome.
  const isOnboarding =
    !sitesLoading && sites.length === 0 && pathname.startsWith('/contractor/sites/create');

  // Users whose role lacks sites:read are sent to the no-access page.
  // Render it with the same minimal chrome so it reads as a standalone page.
  const isNoAccess = pathname.startsWith('/contractor/no-access');

  const handleLogout = async () => {
    await logout();
  };

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const initials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  const avatarUrl = user?.avatar || undefined;

  if (isOnboarding || isNoAccess) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-cloud">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white shadow-sm px-6">
          <Link href="/contractor" className="flex items-center gap-2">
            <img src="/default_full_logo.png" alt="CalCite" className="h-9 w-auto" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 px-2">
                <Avatar className="h-7 w-7 rounded-lg">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold hidden sm:inline">{displayName}</span>
                <ChevronsUpDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive" onClick={handleLogout}>
                <LogOut className="size-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    );
  }

  const navItems: { label: string; href: string; icon: AppSidebarIcon; permission?: string }[] = [
    { label: 'Dashboard', href: '/contractor', icon: HomeIcon, permission: 'dashboard:read' },
    { label: 'Safety & Incidents', href: '/contractor/safety', icon: ShieldExclamationIcon, permission: 'safety:read' },
    { label: 'Inventory', href: '/contractor/inventory', icon: CubeIcon, permission: 'inventory:read' },
    { label: 'Suppliers', href: '/contractor/suppliers', icon: ArchiveBoxIcon, permission: 'suppliers:read' },
    { label: 'Wallets', href: '/contractor/wallets', icon: WalletIcon, permission: 'wallets:read' },
    { label: 'Wallet Approvals', href: '/contractor/wallets/approvals', icon: ClipboardDocumentCheckIcon, permission: 'approve' },
    { label: 'Wallet Ledger', href: '/contractor/wallets/ledger', icon: ScaleIcon, permission: 'wallets:read' },
    { label: 'Site Uploads', href: '/contractor/uploads', icon: ArrowUpTrayIcon, permission: 'documents:read' },
    { label: 'Machines & Equipment', href: '/contractor/equipment', icon: WrenchScrewdriverIcon, permission: 'equipment:read' },
    { label: 'Purchase Orders', href: '/contractor/purchase-orders', icon: ClipboardDocumentListIcon, permission: 'purchase_orders:read' },
    { label: 'Material Deliveries', href: '/contractor/materials', icon: TruckIcon, permission: 'materials:read' },
    { label: 'Licenses', href: '/contractor/licenses', icon: DocumentTextIcon, permission: 'licenses:read' },
    { label: 'Visitor Management', href: '/contractor/visitors', icon: TicketIcon, permission: 'visitors:read' },
    { label: 'Payroll', href: '/contractor/payroll', icon: BanknotesIcon, permission: 'payroll:read' },
    { label: 'Team Members', href: '/contractor/team', icon: UserGroupIcon, permission: 'team:read' },
    { label: 'Workers', href: '/contractor/workers', icon: UsersIcon, permission: 'workers:read' },
    { label: 'Shifts', href: '/contractor/shifts', icon: ClockIcon, permission: 'shifts:read' },
    { label: 'Attendance', href: '/contractor/attendance', icon: FingerPrintIcon, permission: 'attendance:read' },
    { label: 'Reports', href: '/contractor/reports', icon: ChartBarIcon, permission: 'reports:read' },
    { label: 'Site Reports', href: '/contractor/reports/daily', icon: CalendarDaysIcon, permission: 'reports:read' },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  const siteSwitcher = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/12 transition-colors duration-200 border border-white/10 text-left">
          <div className="w-6 h-6 rounded-lg bg-teal flex items-center justify-center shrink-0">
            {activeSite?.name?.includes('Road') ? (
              <Construction size={12} className="text-white" />
            ) : (
              <Building2 size={12} className="text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200/50">
              Active Site
            </p>
            <p className="text-white text-xs font-semibold truncate -mt-0.5">
              {activeSite?.name || 'Loading…'}
            </p>
          </div>
          <ChevronRight size={12} className="text-blue-200/40 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" sideOffset={8} className="w-64 rounded-xl">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Switch Site
        </DropdownMenuLabel>
        {sites.map((site) => (
          <DropdownMenuItem
            key={site.id}
            onClick={() => setActiveSite(site)}
            className="gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-lg border">
              {site.name.includes('Road') ? (
                <Construction className="size-3.5 shrink-0" />
              ) : (
                <Building2 className="size-3.5 shrink-0" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{site.name}</span>
              <span className="text-xs text-muted-foreground">{site.plan}</span>
            </div>
            {activeSite?.id === site.id && (
              <CheckCircle2 className="ml-auto size-3.5 text-teal" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 p-2" asChild>
          <Link href="/contractor/sites">
            <MapPin className="size-4" /> Manage Sites
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 p-2" asChild>
          <Link href="/contractor/sites/create">
            <Plus className="size-4" /> Create Site
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const sidebarProps = {
    currentPath: pathname,
    navItems: visibleNavItems,
    sectionLabel: 'Workspace',
    brandTagline: 'Site operations, fully managed.',
    workspaceSelector: siteSwitcher,
    user: {
      name: displayName,
      role: 'Site Contractor',
      initials,
      avatar: avatarUrl,
      email: displayEmail,
    },
    settingsHref: '/contractor/settings',
    onLogout: handleLogout,
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
                {activeSite?.name || 'Construction Hub'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                Site Operations · {today}
              </p>
            </div>
            <div className="relative hidden lg:block w-72">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search workers, sites, orders…"
                className="input-field pl-9 py-2 text-sm"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono bg-cloud-dark px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </div>
            <NotificationBell />
            <button
              className="hidden sm:flex p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-cloud hover:text-midnight transition-colors duration-150 relative"
              title="Messages"
            >
              <MessageSquare size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full" />
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

export default function ContractorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteProvider>
      <SidebarNav>{children}</SidebarNav>
    </SiteProvider>
  );
}
