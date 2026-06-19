'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  Coins, 
  Package, 
  UserPlus,
  Trash2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationBell() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/web/api/notifications');
      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/web/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/web/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'all', isRead: true }),
      });
      toast({ title: "Success", description: "All notifications marked as read" });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'payroll': return <Coins className="w-4 h-4 text-emerald-500" />;
      case 'safety': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'inventory': return <Package className="w-4 h-4 text-amber-500" />;
      case 'team': return <UserPlus className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const getTimeLabel = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative h-9 w-9">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-[10px] font-black text-white flex items-center justify-center rounded-full border-2 border-background animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 border-none shadow-xl">
        <DropdownMenuLabel className="p-4 bg-muted/30 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-bold">Notifications</span>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5">
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2 italic">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Fetching alerts...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2 italic text-muted-foreground">
              <AlertCircle className="w-6 h-6 opacity-20" />
              <p className="text-xs">No new notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem 
                key={n.id} 
                className={`p-4 flex flex-col items-start gap-1 cursor-pointer transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
                onClick={() => !n.isRead && markAsRead(n.id)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getIcon(n.type)}
                    <span className={`text-xs font-bold ${!n.isRead ? 'text-primary' : ''}`}>{n.title}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium uppercase">{getTimeLabel(n.createdAt)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">{n.message}</p>
                {n.link && (
                  <Link href={n.link} className="flex items-center gap-1 text-[10px] font-bold text-primary pl-6 mt-1 hover:underline">
                    View Details <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-3 justify-center text-xs font-bold text-primary bg-muted/10" asChild>
          <Link href="/contractor/settings?tab=notifications">Manage Preferences</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
