'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  CreditCard, 
  Wallet, 
  ShieldCheck, 
  Settings,
  Search,
  Bell,
  MessageSquare,
  LogOut,
  HardHat,
  ChevronsUpDown,
  Building2,
  Plus,
  CheckCircle2,
  Construction,
  MapPin,
  UserCircle,
  SearchCheck,
  Scale
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarRail
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/context/auth-context';

function SidebarNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
    { label: 'Contractors', href: '/superadmin/contractors', icon: Users },
    { label: 'Plans', href: '/superadmin/plans', icon: ClipboardList },
    { label: 'Subscriptions', href: '/superadmin/subscriptions', icon: CreditCard },
    { label: 'Transactions', href: '/superadmin/transactions', icon: Wallet },
    { label: 'Payment Review', href: '/superadmin/transactions/review', icon: SearchCheck },
    { label: 'Wallet Ledger', href: '/superadmin/transactions/wallets', icon: Scale },
    { label: 'Admins', href: '/superadmin/admins', icon: ShieldCheck },
    { label: 'Profile', href: '/superadmin/profile', icon: UserCircle },
    { label: 'Settings', href: '/superadmin/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    const matched = navItems.filter(
      (item) => pathname === item.href || pathname.startsWith(item.href + '/')
    );
    return (
      matched.some((item) => item.href === href) &&
      matched.every((item) => item.href.length <= href.length)
    );
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="border-b border-sidebar-border pb-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-3 px-2 py-4 group-data-[collapsible=icon]:justify-center">
                <Link href="/superadmin" className="flex items-center gap-3">
                  <img src="/default_full_logo.png" alt="ReconSMI" className="h-10 w-auto brightness-0 invert group-data-[collapsible=icon]:hidden" />
                  <img src="/icon.svg" alt="ReconSMI" className="h-8 w-auto hidden brightness-0 invert group-data-[collapsible=icon]:block" />
                </Link>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4 custom-scrollbar">
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-blue-200/40">Platform Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                      className={`h-10 rounded-xl transition-all duration-200 ${isActive(item.href) ? "bg-white/15 text-white hover:bg-white/15 hover:text-white data-[active=true]:bg-white/15 data-[active=true]:text-white font-semibold" : "text-blue-200/70 hover:bg-white/10 hover:text-white"}`}
                    >
                      <Link href={item.href}>
                        <item.icon className={isActive(item.href) ? "text-teal" : "text-blue-200/70"} />
                        <span className="font-medium">{item.label}</span>
                        {isActive(item.href) && <div className="ml-auto size-1.5 rounded-full bg-teal group-data-[collapsible=icon]:hidden" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="rounded-xl text-white hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/placeholder-user.jpg" alt="Admin" />
                      <AvatarFallback className="rounded-full bg-sand text-midnight font-bold">SA</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold text-white">Super Admin</span>
                      <span className="truncate text-xs text-blue-200/50">Global Administrator</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-blue-200/50 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src="/placeholder-user.jpg" alt="Admin" />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">SA</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">Super Admin</span>
                        <span className="truncate text-xs text-muted-foreground">admin@reconhub.com</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" asChild>
                    <Link href="/superadmin/profile">
                      <UserCircle className="size-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" asChild>
                    <Link href="/superadmin/settings">
                      <Settings className="size-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-destructive" onClick={() => logout()}>
                    <LogOut className="size-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex flex-col flex-1 overflow-hidden">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-white shadow-sm px-6">
          <div className="flex items-center gap-4 flex-1">
            <SidebarTrigger className="-ml-1 rounded-xl text-midnight hover:bg-cloud" />
            <div className="h-4 w-px bg-border mx-2"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest hidden sm:inline">Portal</span>
              <span className="font-display text-sm font-bold text-midnight">Super Administrator</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden lg:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search platform..."
                className="w-full pl-8 bg-cloud border-border rounded-xl focus-visible:ring-2 focus-visible:ring-midnight/20 h-9 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="rounded-xl border border-border text-muted-foreground hover:bg-cloud hover:text-foreground relative h-9 w-9">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-coral rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl border border-border text-muted-foreground hover:bg-cloud hover:text-foreground h-9 w-9">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-cloud p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <SidebarNav>{children}</SidebarNav>
    </SidebarProvider>
  );
}
