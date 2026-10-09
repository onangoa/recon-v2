'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getErrorMessage } from '@/lib/toast-utils';

interface ActivityLog {
  id: string;
  action: string;
  module: string;
  description: string;
  details: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

interface Pagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

const ACTIVITY_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500',
  UPDATE: 'bg-blue-500',
  DELETE: 'bg-red-500',
  LOGIN: 'bg-purple-500',
  LOGOUT: 'bg-purple-500',
  PROCESS: 'bg-amber-500',
  APPROVE: 'bg-emerald-500',
  CANCEL: 'bg-red-500',
};

const ACTIVITY_MODULE_COLORS: Record<string, string> = {
  WORKERS: 'bg-blue-100 text-blue-700',
  DESIGNATIONS: 'bg-blue-100 text-blue-700',
  PAYROLL: 'bg-emerald-100 text-emerald-700',
  SITES: 'bg-cyan-100 text-cyan-700',
  INVENTORY: 'bg-amber-100 text-amber-700',
  EQUIPMENT: 'bg-orange-100 text-orange-700',
  PURCHASE_ORDERS: 'bg-purple-100 text-purple-700',
  MATERIALS: 'bg-orange-100 text-orange-700',
  VISITORS: 'bg-teal-100 text-teal-700',
  DOCUMENTS: 'bg-gray-100 text-gray-700',
  SAFETY: 'bg-red-100 text-red-700',
  TEAM: 'bg-indigo-100 text-indigo-700',
  SETTINGS: 'bg-gray-100 text-gray-700',
  SHIFTS: 'bg-cyan-100 text-cyan-700',
  ATTENDANCE: 'bg-teal-100 text-teal-700',
  REPORTS: 'bg-green-100 text-green-700',
  WALLETS: 'bg-green-100 text-green-700',
};

const MODULES = [
  'WORKERS',
  'DESIGNATIONS',
  'PAYROLL',
  'SITES',
  'INVENTORY',
  'EQUIPMENT',
  'PURCHASE_ORDERS',
  'MATERIALS',
  'VISITORS',
  'DOCUMENTS',
  'SAFETY',
  'TEAM',
  'SETTINGS',
  'SHIFTS',
  'ATTENDANCE',
  'REPORTS',
  'WALLETS',
];

const limit = 25;

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, pages: 1, page: 1, limit });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(limit) });
      if (moduleFilter !== 'all') params.set('module', moduleFilter);
      const response = await fetch(`/web/api/activity-logs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load activity logs. Please refresh the page and try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, moduleFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleModuleChange = (value: string) => {
    setModuleFilter(value);
    setCurrentPage(1);
  };

  const formatTimestamp = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleString();
  };

  const totalPages = Math.max(1, pagination.pages);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Activity Logs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Activity Logs</h1>
          <p className="text-muted-foreground mt-1 text-sm">Complete audit trail of actions across your account.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={moduleFilter} onValueChange={handleModuleChange}>
            <SelectTrigger className="w-[180px] gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {MODULES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchLogs} disabled={isLoading} aria-label="Refresh">
            <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> All Activity
          </CardTitle>
          <CardDescription>
            {pagination.total} {pagination.total === 1 ? 'log' : 'logs'} recorded
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchLogs}>Retry</Button>
            </div>
          ) : isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No activity logs found{moduleFilter !== 'all' ? ' for this module' : ''}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="flex items-center gap-2 font-semibold capitalize">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ACTIVITY_COLORS[log.action] || 'bg-gray-400'}`} />
                        {log.action.toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm leading-tight">
                        <span className="font-bold text-primary">{log.user?.name || 'System'}</span>{' '}
                        {log.description || log.action}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[9px] px-1.5 py-0 border-none ${ACTIVITY_MODULE_COLORS[log.module] || 'bg-gray-100 text-gray-700'}`}>
                        {log.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.user?.email || '-'}</TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(log.createdAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {!isLoading && pagination.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to{' '}
              <span className="font-bold">{Math.min(currentPage * limit, pagination.total)}</span> of{' '}
              <span className="font-bold">{pagination.total}</span> results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="gap-1 h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map((p) => (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(p)}
                    disabled={isLoading}
                    className={`h-8 w-8 p-0 ${currentPage === p ? 'bg-primary text-white' : ''}`}
                  >
                    {p}
                  </Button>
                ))}
                {totalPages > 7 && <span className="text-xs text-muted-foreground px-1">…</span>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="gap-1 h-8 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
