'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type AppSidebarIcon = React.ComponentType<{ className?: string }>;

export interface AppSidebarNavItem {
  label: string;
  href: string;
  icon: AppSidebarIcon;
  badge?: number;
}

export interface AppSidebarUser {
  name: string;
  role: string;
  initials: string;
  avatar?: string;
  email?: string;
}

export interface AppSidebarMenuItem {
  label: string;
  href: string;
  icon: AppSidebarIcon;
}

interface AppSidebarProps {
  currentPath: string;
  navItems: AppSidebarNavItem[];
  sectionLabel?: string;
  brandTagline?: string;
  workspaceSelector?: React.ReactNode;
  user: AppSidebarUser;
  settingsHref: string;
  userMenuItems?: AppSidebarMenuItem[];
  onLogout?: () => void | Promise<void>;
  mobile?: boolean;
  onLinkClick?: () => void;
}

export default function AppSidebar({
  currentPath,
  navItems,
  sectionLabel = 'Workspace',
  brandTagline = 'Construction Hub',
  workspaceSelector,
  user,
  settingsHref,
  userMenuItems = [],
  onLogout,
  mobile = false,
  onLinkClick,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Highlight only the most specific matching nav item so nested routes
  // (e.g. /contractor/wallets/ledger) do not also highlight their parent.
  const isActive = (href: string) => {
    const matched = navItems.filter(
      (item) => currentPath === item.href || currentPath.startsWith(item.href + '/')
    );
    return (
      matched.some((item) => item.href === href) &&
      matched.every((item) => item.href.length <= href.length)
    );
  };

  const settingsActive =
    currentPath === settingsHref || currentPath.startsWith(settingsHref + '/');

  return (
    <aside
      className={`relative flex flex-col bg-midnight h-full transition-all duration-300 ease-in-out shrink-0 z-20 print:hidden ${
        mobile ? 'w-full' : ''
      }`}
      style={mobile ? undefined : { width: collapsed ? 64 : 240 }}
    >
      {/* Route dots background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        {[20, 80, 140, 200, 260, 320, 380, 440, 500].map((y, i) => (
          <div
            key={`dot-${i}`}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{ top: y, left: collapsed ? 28 : 210 }}
          />
        ))}
      </div>

      {/* Logo area */}
      <div
        className={`flex items-center h-16 px-4 border-b border-white/10 shrink-0 ${
          collapsed ? 'justify-center' : 'gap-3'
        }`}
      >
        <Link href={settingsHref.replace(/\/settings$/, '')} className="shrink-0">
          <img
            src="/icon.svg"
            alt="CalCite"
            className="h-8 w-8 brightness-0 invert"
          />
        </Link>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-display text-white font-bold text-base leading-tight tracking-tight">
              CalCite
            </span>
            <span className="text-blue-200/60 text-xs truncate">{brandTagline}</span>
          </div>
        )}
      </div>

      {/* Workspace selector */}
      {!collapsed && workspaceSelector && (
        <div className="mx-3 mt-3 mb-1">{workspaceSelector}</div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto scrollbar-thin">
        {!collapsed && (
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-200/40">
            {sectionLabel}
          </p>
        )}
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              title={collapsed ? item.label : undefined}
              className={`sidebar-nav-item mb-0.5 relative ${active ? 'active' : 'inactive'}`}
            >
              <span className={`shrink-0 ${active ? 'text-teal' : 'text-blue-200/70'}`}>
                <item.icon className="size-[18px]" />
              </span>
              {!collapsed && (
                <span className="flex-1 truncate text-sm">{item.label}</span>
              )}
              {!collapsed && item.badge != null && item.badge > 0 && (
                <span className="ml-auto bg-coral text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              {collapsed && item.badge != null && item.badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-coral rounded-full" />
              )}
            </Link>
          );
        })}

        {!collapsed && (
          <p className="px-3 py-1.5 mt-2 text-[10px] font-semibold uppercase tracking-widest text-blue-200/40">
            System
          </p>
        )}
        <Link
          href={settingsHref}
          onClick={onLinkClick}
          title={collapsed ? 'Settings' : undefined}
          className={`sidebar-nav-item mb-0.5 relative ${settingsActive ? 'active' : 'inactive'}`}
        >
          <span className={`shrink-0 ${settingsActive ? 'text-teal' : 'text-blue-200/70'}`}>
            <Cog6ToothIcon className="size-[18px]" />
          </span>
          {!collapsed && <span className="text-sm">Settings</span>}
        </Link>
      </nav>

      {/* Bottom: user + collapse */}
      <div className="border-t border-white/10 p-3 shrink-0">
        {!collapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 px-2 py-2 mb-2 rounded-xl hover:bg-white/8 cursor-pointer transition-colors duration-200 text-left">
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-full bg-sand text-midnight font-bold text-sm">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-teal rounded-full border-2 border-midnight" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{user.name}</p>
                  <p className="text-blue-200/50 text-[10px] truncate">{user.role}</p>
                </div>
                <ChevronUpDownIcon className="size-3.5 text-blue-200/40 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56 rounded-xl">
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email || user.role}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {userMenuItems.map((menuItem) => (
                <DropdownMenuItem key={menuItem.href} className="gap-2" asChild>
                  <Link href={menuItem.href}>
                    <menuItem.icon className="size-4" /> {menuItem.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem className="gap-2" asChild>
                <Link href={settingsHref}>
                  <Cog6ToothIcon className="size-4" /> Settings
                </Link>
              </DropdownMenuItem>
              {onLogout && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-destructive" onClick={onLogout}>
                    <ArrowRightOnRectangleIcon className="size-4" /> Log out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-blue-200/50 hover:text-white hover:bg-white/8 transition-all duration-200 text-xs"
          >
            {collapsed ? (
              <ChevronRightIcon className="size-4" />
            ) : (
              <>
                <ChevronLeftIcon className="size-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
