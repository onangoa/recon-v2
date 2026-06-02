'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
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
  HardHat,
  ChevronsUpDown,
  Building2,
  Plus,
  CheckCircle2
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
  SidebarRail,
  useSidebar
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
import Image from 'next/image';

const projects = [
  {
    name: "Karen Plains Road",
    location: "Nairobi, KE",
    logo: HardHat,
    plan: "Infrastructure",
  },
  {
    name: "Westlands Complex",
    location: "Westlands, KE",
    logo: Building2,
    plan: "Commercial",
  },
  {
    name: "Syokimau Estate",
    location: "Macha, KE",
    logo: Construction,
    plan: "Residential",
  },
]

export default function ContractorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeProject, setActiveProject] = useState(projects[0]);

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
    { label: 'Material Deliveries', href: '/contractor/materials', icon: Truck },
    { label: 'Labour Management', href: '/contractor/labour', icon: Construction },
    { label: 'Licenses', href: '/contractor/licenses', icon: FileText },
    { label: 'Visitor Management', href: '/contractor/visitors', icon: DoorOpen },
    { label: 'Payroll', href: '/contractor/payroll', icon: Coins },
    { label: 'Staff', href: '/contractor/team', icon: Users },
    { label: 'Reports', href: '/contractor/reports', icon: BarChart3 },
    { label: 'Settings', href: '/contractor/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon" variant="inset" className="border-r border-border">
          <SidebarHeader className="border-b border-border/50 pb-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-3 px-2 py-4 group-data-[collapsible=icon]:justify-center">
                  <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <HardHat className="size-6" />
                  </div>
                  <div className="flex flex-col gap-0 group-data-[collapsible=icon]:hidden">
                    <span className="font-black text-xl tracking-tighter text-foreground leading-none">RECON<span className="text-primary">HUB</span></span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-0.5">Site Management</span>
                  </div>
                </div>
              </SidebarMenuItem>
              
              <SidebarMenuItem className="px-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="bg-primary/5 border border-primary/10 hover:bg-primary/10 hover:border-primary/20 transition-all data-[state=open]:bg-primary/10 data-[state=open]:border-primary/20"
                    >
                      <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                        <activeProject.logo className="size-5" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-1">
                        <span className="truncate font-black text-primary uppercase tracking-tighter text-[11px]">
                          Active Site
                        </span>
                        <span className="truncate font-bold text-foreground -mt-0.5">
                          {activeProject.name}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                      Switch Project
                    </DropdownMenuLabel>
                    {projects.map((project) => (
                      <DropdownMenuItem
                        key={project.name}
                        onClick={() => setActiveProject(project)}
                        className="gap-2 p-2"
                      >
                        <div className="flex size-6 items-center justify-center rounded-sm border">
                          <project.logo className="size-4 shrink-0" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{project.name}</span>
                          <span className="text-xs text-muted-foreground">{project.plan}</span>
                        </div>
                        {activeProject.name === project.name && (
                          <DropdownMenuShortcut>
                            <CheckCircle2 className="size-3 text-primary" />
                          </DropdownMenuShortcut>
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 p-2">
                      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                        <Plus className="size-4" />
                      </div>
                      <div className="font-medium text-muted-foreground text-sm">Add project</div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="px-2 py-4 custom-scrollbar">
            <SidebarGroup>
              <SidebarGroupLabel className="px-2 mb-2">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.href)}
                        tooltip={item.label}
                        className={isActive(item.href) ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-bold" : ""}
                      >
                        <Link href={item.href}>
                          <item.icon className={isActive(item.href) ? "text-primary" : "text-muted-foreground"} />
                          <span className="font-medium">{item.label}</span>
                          {isActive(item.href) && <div className="ml-auto size-1.5 rounded-full bg-primary group-data-[collapsible=icon]:hidden" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src="/placeholder-user.jpg" alt="Antwon" />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">A</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold text-primary">Antwon</span>
                        <span className="truncate text-xs opacity-70">Site Contractor</span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
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
                          <AvatarImage src="/placeholder-user.jpg" alt="Antwon" />
                          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">A</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">Antwon</span>
                          <span className="truncate text-xs text-muted-foreground">antwon@construction.ke</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2" asChild>
                      <Link href="/contractor/settings/profile">
                        <Users className="size-4" /> Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" asChild>
                      <Link href="/contractor/settings">
                        <Settings className="size-4" /> Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 text-destructive" onClick={handleLogout}>
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
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-6">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="-ml-1 text-primary" />
              <div className="h-4 w-px bg-border mx-2"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest hidden sm:inline">Project</span>
                <span className="text-sm font-bold text-primary">{activeProject.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden lg:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Global search..."
                  className="w-full pl-8 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-8 text-xs"
                />
              </div>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative h-9 w-9">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full border border-background"></span>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-9 w-9">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-muted/5 p-4 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
