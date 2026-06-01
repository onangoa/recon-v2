'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Handshake, 
  Wallet, 
  Upload, 
  Settings, 
  Hammer, 
  ClipboardList, 
  Truck, 
  Construction, 
  FileText, 
  DoorOpen, 
  Coins, 
  Users, 
  BarChart3,
  Search,
  Bell,
  MessageSquare,
  LogOut,
  ChevronRight,
  HardHat
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
  SidebarInset
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ContractorLayout({
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
    { label: 'Dashboard', href: '/contractor', icon: LayoutDashboard },
    { label: 'Inventory', href: '/contractor/inventory', icon: Package },
    { label: 'Suppliers', href: '/contractor/suppliers', icon: Handshake },
    { label: 'Wallets', href: '/contractor/wallets', icon: Wallet },
    { label: 'Site Uploads', href: '/contractor/uploads', icon: Upload },
    { label: 'Machines & Equipment', href: '/contractor/equipment', icon: Hammer },
    { label: 'Purchase Orders', href: '/contractor/purchase-orders', icon: ClipboardList },
    { label: 'Material Deliveries', href: '/contractor/deliveries', icon: Truck },
    { label: 'Labour Management', href: '/contractor/labour', icon: Construction },
    { label: 'Licenses', href: '/contractor/licenses', icon: FileText },
    { label: 'Visitor Management', href: '/contractor/visitors', icon: DoorOpen },
    { label: 'Payroll', href: '/contractor/payroll', icon: Coins },
    { label: 'Staff', href: '/contractor/staff', icon: Users },
    { label: 'Reports', href: '/contractor/reports', icon: BarChart3 },
    { label: 'Settings', href: '/contractor/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar variant="inset" className="border-r border-border">
          <SidebarHeader className="p-0 overflow-hidden">
            <div className="bg-primary px-4 py-6 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="bg-primary-foreground/20 p-2 rounded-lg">
                  <HardHat className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">Active Project</p>
                  <p className="font-bold text-sm truncate">Karen Plains Road</p>
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4">
            <SidebarGroup>
              <SidebarGroupLabel className="px-2 mb-2">Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.href)}
                        tooltip={item.label}
                        className={isActive(item.href) ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" : ""}
                      >
                        <Link href={item.href}>
                          <item.icon className={isActive(item.href) ? "text-primary" : "text-muted-foreground"} />
                          <span className="font-medium">{item.label}</span>
                          {item.label === 'Inventory' && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border">
            <Button 
              variant="destructive" 
              className="w-full justify-start gap-2 h-9" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-6">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="-ml-1" />
              <div className="relative w-full max-w-md hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search project, materials, staff..."
                  className="w-full pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-9"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="h-6 w-px bg-border mx-2"></div>
              
              <div className="flex items-center gap-3 pl-2">
                <div className="flex flex-col items-end text-sm hidden sm:flex">
                  <span className="font-semibold leading-none">Antwon</span>
                  <span className="text-xs text-muted-foreground mt-1 uppercase tracking-tighter">Site Contractor</span>
                </div>
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">A</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-muted/10 p-4 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
