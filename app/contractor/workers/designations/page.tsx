'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  RotateCcw, 
  Briefcase,
  Loader2,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import Link from 'next/link';

interface OvertimeRule {
  id?: string;
  dayType: 'weekday' | 'rest_day' | 'public_holiday';
  rateType: string;
  rateAmount: number;
  capHoursPerDay: number | null;
  isActive: boolean;
}

interface Designation {
  id: string;
  title: string;
  description: string | null;
  salary: number | null;
  paymentFrequency: string | null;
  isActive: boolean;
  overtimeRules?: OvertimeRule[];
}

type OtDayType = 'weekday' | 'rest_day' | 'public_holiday';

const OT_DAY_TYPES: { key: OtDayType; label: string; hint: string }[] = [
  { key: 'weekday', label: 'Weekday', hint: 'e.g. 1.5' },
  { key: 'rest_day', label: 'Rest Day', hint: 'e.g. 2 (Sundays / off days)' },
  { key: 'public_holiday', label: 'Public Holiday', hint: 'e.g. 2 (gazetted holidays)' },
];

interface OtRuleFormState {
  enabled: boolean;
  rateType: string;
  rateAmount: string;
  capHoursPerDay: string;
}

const defaultOtRules = (): Record<OtDayType, OtRuleFormState> => ({
  weekday: { enabled: false, rateType: 'hourly', rateAmount: '1.5', capHoursPerDay: '' },
  rest_day: { enabled: false, rateType: 'hourly', rateAmount: '2', capHoursPerDay: '' },
  public_holiday: { enabled: false, rateType: 'hourly', rateAmount: '2', capHoursPerDay: '' },
});

export default function DesignationsPage() {
  const { toast } = useToast();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [designationToDelete, setDesignationToDelete] = useState<Designation | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    salary: '',
    paymentFrequency: 'monthly',
    isActive: true
  });
  const [otRules, setOtRules] = useState<Record<OtDayType, OtRuleFormState>>(defaultOtRules);

  const fetchDesignations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/web/api/designations?page=${currentPage}&limit=${limit}&search=${searchQuery}`);
      if (!response.ok) throw new Error('Failed to fetch designations');
      const data = await response.json();
      setDesignations(data.designations);
      setTotalPages(data.pagination.pages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load designations. Please refresh the page and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, [currentPage]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchDesignations();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = editingId ? `/web/api/designations/${editingId}` : '/web/api/designations';
      const method = editingId ? 'PUT' : 'POST';

      const overtimeRules = OT_DAY_TYPES
        .filter(({ key }) => otRules[key].enabled)
        .map(({ key }) => ({
          dayType: key,
          rateType: otRules[key].rateType,
          rateAmount: otRules[key].rateAmount ? parseFloat(otRules[key].rateAmount) : 0,
          capHoursPerDay: otRules[key].capHoursPerDay ? parseFloat(otRules[key].capHoursPerDay) : null,
        }));

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          overtimeRules,
          contractorId: 'placeholder-id' // In a real app, this would come from auth/context
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${editingId ? 'update' : 'save'} designation`);

      toast({ title: "Success", description: `Designation ${editingId ? 'updated' : 'saved'} successfully` });
      setIsDialogOpen(false);
      resetForm();
      fetchDesignations();
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, editingId ? "Unable to update the designation. Please verify the details and try again." : "Unable to create the designation. Please verify the details and try again."), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (design: Designation) => {
    setEditingId(design.id);
    setFormData({
      title: design.title,
      description: design.description || '',
      salary: design.salary?.toString() || '',
      paymentFrequency: design.paymentFrequency || 'monthly',
      isActive: design.isActive
    });
    const next = defaultOtRules();
    for (const rule of design.overtimeRules || []) {
      if (rule.dayType !== 'weekday' && rule.dayType !== 'rest_day' && rule.dayType !== 'public_holiday') continue;
      next[rule.dayType] = {
        enabled: rule.isActive !== false,
        rateType: rule.rateType === 'fixed' ? 'fixed' : 'hourly',
        rateAmount: rule.rateAmount != null ? String(rule.rateAmount) : next[rule.dayType].rateAmount,
        capHoursPerDay: rule.capHoursPerDay != null ? String(rule.capHoursPerDay) : '',
      };
    }
    setOtRules(next);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      salary: '',
      paymentFrequency: 'monthly',
      isActive: true
    });
    setOtRules(defaultOtRules());
  };

  const handleDelete = async () => {
    if (!designationToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/web/api/designations/${designationToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete designation');
      }

      toast({
        title: "Success",
        description: "Designation has been removed",
      });
      setIsDeleteDialogOpen(false);
      setDesignationToDelete(null);
      fetchDesignations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to delete the designation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6 text-foreground">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/contractor">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/contractor/workers">Workers</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Designations</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Job Designations</h1>
          <p className="text-muted-foreground mt-1 text-sm">Define roles and salary ranges for your workforce.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/contractor/workers"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Workers</Link>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="gap-2"><Plus className="w-4 h-4" /> Add Designation</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Designation' : 'Add New Designation'}</DialogTitle>
                <DialogDescription>
                  {editingId ? 'Modify the details of this job role.' : 'Create a new job role with its pay grade.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g., Site Supervisor, Mason, Electrician" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Briefly describe the responsibilities..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary (KES)</Label>
                    <Input id="salary" type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                    <select 
                      id="paymentFrequency"
                      value={formData.paymentFrequency}
                      onChange={e => setFormData({...formData, paymentFrequency: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border p-3">
                  <div>
                    <Label className="text-sm font-semibold">Overtime Rules (per day type)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Overrides the shift's overtime rate for this designation. Unchecked day types fall back to the shift's rate (then 1x). Work on a rest day or public holiday counts fully as overtime for that day.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {OT_DAY_TYPES.map(({ key, label, hint }) => {
                      const rule = otRules[key];
                      return (
                        <div key={key} className="grid grid-cols-[auto_1fr] md:grid-cols-[150px_110px_1fr_90px] gap-2 items-center">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`ot-${key}`}
                              checked={rule.enabled}
                              onCheckedChange={checked => setOtRules({
                                ...otRules,
                                [key]: { ...rule, enabled: checked === true },
                              })}
                            />
                            <Label htmlFor={`ot-${key}`} className="text-xs font-medium cursor-pointer">{label}</Label>
                          </div>
                          <select
                            aria-label={`${label} overtime rate type`}
                            value={rule.rateType}
                            disabled={!rule.enabled}
                            onChange={e => setOtRules({ ...otRules, [key]: { ...rule, rateType: e.target.value } })}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="hourly">Multiplier</option>
                            <option value="fixed">KES / hour</option>
                          </select>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              aria-label={`${label} overtime rate amount`}
                              placeholder={hint}
                              value={rule.rateAmount}
                              disabled={!rule.enabled}
                              onChange={e => setOtRules({ ...otRules, [key]: { ...rule, rateAmount: e.target.value } })}
                              className="h-9 text-xs"
                            />
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {rule.rateType === 'fixed' ? 'KES/h' : '× hourly'}
                            </span>
                          </div>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            aria-label={`${label} overtime cap hours per day`}
                            placeholder="Cap h/day"
                            value={rule.capHoursPerDay}
                            disabled={!rule.enabled}
                            onChange={e => setOtRules({ ...otRules, [key]: { ...rule, capHoursPerDay: e.target.value } })}
                            className="h-9 text-xs"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {editingId ? 'Update' : 'Save'} Designation
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Roles</p>
                <h3 className="text-2xl font-bold">{designations.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search designations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-none h-10 text-sm shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchDesignations}
                disabled={isLoading}
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading designations...</p>
            </div>
          ) : designations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Briefcase className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No designations found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Designation Title</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Salary</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designations.map((design) => (
                  <TableRow key={design.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{design.title}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-xs">{design.description || 'No description'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          <span>{formatCurrency(design.salary)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">{design.paymentFrequency || 'N/A'}</span>
                        {(design.overtimeRules || []).filter(r => r.isActive).length > 0 && (
                          <span className="text-[10px] text-orange-600 font-mono">
                            OT: {(design.overtimeRules || [])
                              .filter(r => r.isActive)
                              .sort((a, b) => a.dayType.localeCompare(b.dayType))
                              .map(r => r.rateType === 'fixed'
                                ? `${r.rateAmount}/h`
                                : `${r.rateAmount}x`)
                              .join(' · ')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={design.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}>
                        {design.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(design)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setDesignationToDelete(design);
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
              Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, totalCount)}</span> of <span className="font-bold">{totalCount}</span> results
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
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Designation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure you want to delete <strong>{designationToDelete?.title}</strong>? This action cannot be undone.
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
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
