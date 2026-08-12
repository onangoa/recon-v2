'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  RotateCcw, 
  UserPlus,
  Mail,
  Phone,
  Shield,
  HardHat,
  MoreVertical,
  Filter,
  X,
  BadgeCheck,
  Clock,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  Briefcase,
  Fingerprint,
  ScanLine,
  Eye
} from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { useRouter } from 'next/navigation';

interface Worker {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  nationalId: string | null;
  enrollId: string | null;
  status: string;
  designation: {
    title: string;
  } | null;
  shift: {
    name: string;
    startTime: string;
    endTime: string;
  } | null;
  joinedAt: string;
  paymentMode?: string;
}

interface BiometricWorkerRow {
  id: string;
  name: string;
  enrollId: string | null;
  designation: string | null;
  enrolled: boolean;
}

interface DeviceConfig {
  id: string;
  name: string;
  sn: string;
  location: string | null;
  isActive: boolean;
  online?: boolean;
}

interface DesignationOption {
  id: string;
  title: string;
}

interface ByDesignationStat {
  designationId: string | null;
  title: string;
  count: number;
}

export default function WorkersPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // ---- Filter & stats ----
  const [designations, setDesignations] = useState<DesignationOption[]>([]);
  const [filterDesignationId, setFilterDesignationId] = useState<string>('');
  const [byDesignation, setByDesignation] = useState<ByDesignationStat[]>([]);
  const [totalActive, setTotalActive] = useState(0);

  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---- Biometric device enrollment state ----
  const [enrolledEnrollIds, setEnrolledEnrollIds] = useState<number[]>([]);
  const [deviceAvailable, setDeviceAvailable] = useState<boolean | null>(null);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricRows, setBiometricRows] = useState<BiometricWorkerRow[]>([]);
  const [enrollingIds, setEnrollingIds] = useState<string[]>([]);
  const [enrollAllRunning, setEnrollAllRunning] = useState(false);
  const [devices, setDevices] = useState<DeviceConfig[]>([]);
  const [selectedDeviceSn, setSelectedDeviceSn] = useState<string>('');

  const fetchWorkers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/web/api/workers?page=${currentPage}&limit=${limit}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (filterDesignationId === 'unassigned') url += `&unassigned=1`;
      else if (filterDesignationId) url += `&designationId=${filterDesignationId}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch workers');
      const data = await response.json();
      setWorkers(data.workers);
      setTotalPages(data.pagination.pages);
      setTotalCount(data.pagination.total);
      if (data.stats) {
        setTotalActive(data.stats.totalActive ?? 0);
        setByDesignation(Array.isArray(data.stats.byDesignation) ? data.stats.byDesignation : []);
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load workers. Please refresh the page and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch designations for the filter dropdown (one-time).
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const res = await fetch('/web/api/designations?limit=1000');
        if (!res.ok) return;
        const data = await res.json();
        setDesignations(Array.isArray(data.designations) ? data.designations.map((d: any) => ({ id: d.id, title: d.title })) : []);
      } catch {
        /* silent */
      }
    };
    fetchDesignations();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchWorkers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
    else fetchWorkers();
  }, [filterDesignationId]);

  useEffect(() => {
    fetchWorkers();
  }, [currentPage]);

  // ---- Biometric device enrollment helpers ----
  const fetchDevices = async () => {
    try {
      const res = await fetch('/web/api/biometric/devices?status=1');
      if (!res.ok) return;
      const data = await res.json();
      const list: DeviceConfig[] = data.devices || [];
      setDevices(list);
      // Keep a valid selection (prefer the previously selected, else first online).
      const stillExists = list.some((d) => d.sn === selectedDeviceSn);
      if (!stillExists) {
        const firstOnline = list.find((d) => d.isActive && d.online);
        setSelectedDeviceSn(firstOnline?.sn || (list.find((d) => d.isActive)?.sn || ''));
      }
    } catch {
      /* silent */
    }
  };

  const fetchBiometricUsers = async () => {
    setBiometricLoading(true);
    try {
      const snParam = selectedDeviceSn ? `?deviceSn=${encodeURIComponent(selectedDeviceSn)}` : '';
      const res = await fetch(`/web/api/biometric/users${snParam}`);
      if (!res.ok) throw new Error('Failed to fetch biometric users');
      const data = await res.json();
      setEnrolledEnrollIds(Array.isArray(data.enrolledEnrollIds) ? data.enrolledEnrollIds : []);
      setDeviceAvailable(data.device?.available ?? false);
      setBiometricRows(Array.isArray(data.workers) ? data.workers : []);
    } catch (err: any) {
      toast({
        title: 'Biometric Error',
        description: getErrorMessage(err, "Unable to reach the biometric device. Please check the connection and try again."),
        variant: 'destructive',
      });
      setDeviceAvailable(false);
      setBiometricRows([]);
    } finally {
      setBiometricLoading(false);
    }
  };

  const enrollWorkerToDevice = async (workerId: string): Promise<boolean> => {
    if (!selectedDeviceSn) {
      toast({ title: 'No device selected', description: 'Pick a device first.', variant: 'destructive' });
      return false;
    }
    setEnrollingIds((prev) => [...prev, workerId]);
    try {
      const res = await fetch('/web/api/biometric/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, deviceSn: selectedDeviceSn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll');
      return true;
    } catch (err: any) {
      toast({
        title: 'Enrollment Failed',
        description: getErrorMessage(err, "Unable to reach the biometric device. Please check the connection and try again."),
        variant: 'destructive',
      });
      return false;
    } finally {
      setEnrollingIds((prev) => prev.filter((id) => id !== workerId));
    }
  };

  const enrollAllUnenrolled = async () => {
    const unenrolled = biometricRows.filter((w) => !w.enrolled && w.enrollId);
    if (unenrolled.length === 0) {
      toast({ title: 'Nothing to enroll', description: 'All workers are already enrolled to the device.' });
      return;
    }
    setEnrollAllRunning(true);
    let ok = 0;
    for (const w of unenrolled) {
      const success = await enrollWorkerToDevice(w.id);
      if (success) ok++;
    }
    setEnrollAllRunning(false);
    toast({
      title: 'Enrollment complete',
      description: `${ok} of ${unenrolled.length} worker(s) enrolled to the device.`,
      variant: ok === unenrolled.length ? 'success' : 'destructive',
    });
    await fetchBiometricUsers();
  };

  const openBiometric = async () => {
    setIsBiometricOpen(true);
    await fetchDevices();
    await fetchBiometricUsers();
  };

  // Preload device list + enrollment status so the table column can render.
  useEffect(() => {
    (async () => {
      await fetchDevices();
      await fetchBiometricUsers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the selected device changes inside the dialog, refresh the user list.
  useEffect(() => {
    if (isBiometricOpen && selectedDeviceSn) {
      fetchBiometricUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceSn, isBiometricOpen]);

  const handleDelete = async () => {
    if (!workerToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/web/api/workers/${workerToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Worker has been removed",
          variant: "default",
        });
        setIsDeleteDialogOpen(false);
        fetchWorkers();
      } else {
        throw new Error('Failed to delete worker');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to remove the worker. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Workers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Workers Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your site workers, designations and payroll status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={openBiometric}>
            <Fingerprint className="w-4 h-4" />
            <span>Biometric</span>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/contractor/workers/designations">
              <Briefcase className="w-4 h-4" />
              <span>Designations</span>
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/contractor/workers/create">
              <UserPlus className="w-4 h-4" />
              <span>Add Worker</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Workers</p>
                <h3 className="text-2xl font-bold">{totalCount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Active</p>
                <h3 className="text-2xl font-bold">{totalActive}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HardHat className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">On-Site Today</p>
                <h3 className="text-2xl font-bold">{totalActive}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workers per category (across all workers, not just the current page) */}
      {byDesignation.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Workers per Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {byDesignation.map((d) => {
                const active = filterDesignationId === (d.designationId || 'unassigned');
                return (
                  <button
                    key={d.designationId || 'unassigned'}
                    type="button"
                    onClick={() => setFilterDesignationId(active ? '' : (d.designationId || 'unassigned'))}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border transition-colors ${active ? 'bg-primary text-white border-primary' : 'bg-muted/40 text-foreground border-gray-200 hover:bg-muted/70'}`}
                  >
                    {d.title}
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                      {d.count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-none h-10 text-sm shadow-sm"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={filterDesignationId}
                  onChange={(e) => setFilterDesignationId(e.target.value)}
                  disabled={isLoading}
                  className="h-10 pl-10 pr-8 rounded-md bg-background border-none text-sm shadow-sm focus:ring-2 focus:ring-primary disabled:opacity-50 appearance-none"
                >
                  <option value="">All categories</option>
                  <option value="unassigned">Unassigned</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              {(filterDesignationId || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterDesignationId(''); setSearchQuery(''); }}
                  disabled={isLoading}
                  className="gap-1 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                  Clear filters
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchWorkers}
                disabled={isLoading}
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {filterDesignationId && (
            <p className="text-xs text-muted-foreground italic mt-2">
              Filtered by: <span className="font-bold text-foreground">
                {filterDesignationId === 'unassigned' ? 'Unassigned' : (designations.find((d) => d.id === filterDesignationId)?.title || 'category')}
              </span>
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading workers...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : workers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Users className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No workers found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Worker</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Designation</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Shift</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">ID / Phone</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Enrolled to Device</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(worker.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{worker.name}</span>
                          <span className="text-[10px] text-muted-foreground">{worker.email || 'No email'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {worker.designation?.title || 'Unassigned'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {worker.shift ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{worker.shift.name}</span>
                          <span className="text-[10px] text-muted-foreground">{worker.shift.startTime} - {worker.shift.endTime}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">No shift</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground font-medium">
                        <div className="flex items-center">
                          <CreditCard className="w-3 h-3 mr-1 opacity-60" />
                          ID: {worker.nationalId || 'N/A'}
                        </div>
                        <div className="flex items-center text-primary">
                          <Shield className="w-3 h-3 mr-1 opacity-60" />
                          Enroll: {worker.enrollId || 'N/A'}
                        </div>
                        <div className="flex items-center">
                          <CreditCard className="w-3 h-3 mr-1 opacity-60" />
                          {worker.paymentMode === 'manual' || !worker.paymentMode ? 'Manual' :
                            worker.paymentMode === 'phone' ? 'Direct M-Pesa' :
                            worker.paymentMode === 'pochi' ? 'Pochi' :
                            worker.paymentMode === 'till' ? 'Till' :
                            worker.paymentMode === 'paybill' ? 'Paybill' : worker.paymentMode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-[10px] uppercase font-bold ${worker.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {worker.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {worker.enrollId && enrolledEnrollIds.includes(Number(worker.enrollId)) ? (
                        <Badge className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Enrolled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">
                          <ScanLine className="w-3 h-3 mr-1" /> Not Enrolled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/contractor/workers/${worker.id}`)}>
                            <Eye className="w-4 h-4 mr-2" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/contractor/workers/edit/${worker.id}`)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setWorkerToDelete(worker);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-muted/5">
            <p className="text-sm text-muted-foreground italic">
              Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, totalCount)}</span> of <span className="font-bold">{totalCount}</span> workers
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete worker <strong>{workerToDelete?.name}</strong> and all associated payroll records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Delete Worker'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBiometricOpen} onOpenChange={setIsBiometricOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="size-5 text-primary" />
              Biometric Device Enrollment
            </DialogTitle>
            <DialogDescription>
              Workers enrolled on the connected device. Enroll any that are missing from the device — the device requires a unique enroll ID.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5">Select Device</label>
              {devices.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No devices configured. Add one under Settings → Devices.
                </p>
              ) : (
                <select
                  value={selectedDeviceSn}
                  onChange={(e) => setSelectedDeviceSn(e.target.value)}
                  disabled={biometricLoading}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.sn}>
                      {d.name} — {d.sn}{d.online ? ' (online)' : (d.isActive ? ' (offline)' : ' (inactive)')}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {deviceAvailable === false && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                <AlertCircle className="size-4 shrink-0" />
                Device could not be reached. Check that BIOMETRIC_API_BASE_URL is set and the selected device is online.
              </div>
            )}

            {biometricLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Checking device enrollment…</p>
              </div>
            ) : biometricRows.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground italic py-10">No workers to compare.</p>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    <strong className="text-foreground">{biometricRows.filter(w => w.enrolled).length}</strong> / {biometricRows.length} enrolled to device
                  </span>
                  <span>{biometricRows.filter(w => !w.enrolled && w.enrollId).length} can be enrolled</span>
                </div>
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Worker</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Enroll ID</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {biometricRows.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-xs font-medium">{w.name}</TableCell>
                        <TableCell className="text-xs font-mono">{w.enrollId || '—'}</TableCell>
                        <TableCell className="text-center">
                          {w.enrolled ? (
                            <Badge className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Enrolled
                            </Badge>
                          ) : w.enrollId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] gap-1"
                              disabled={enrollingIds.includes(w.id) || enrollAllRunning}
                              onClick={() => enrollWorkerToDevice(w.id).then(() => fetchBiometricUsers())}
                            >
                              {enrollingIds.includes(w.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanLine className="w-3 h-3" />}
                              Enroll
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground">No ID</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="default"
              className="gap-2"
              disabled={biometricLoading || enrollAllRunning || biometricRows.filter(w => !w.enrolled && w.enrollId).length === 0}
              onClick={enrollAllUnenrolled}
            >
              {enrollAllRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              Enroll All Unenrolled
            </Button>
            <Button variant="outline" size="sm" disabled={biometricLoading} onClick={fetchBiometricUsers}>
              <RotateCcw className="w-4 h-4" /> Refresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
