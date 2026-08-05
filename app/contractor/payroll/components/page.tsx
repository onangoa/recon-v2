'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  RotateCcw, 
  Settings2,
  Loader2,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowLeft,
  CheckCircle2,
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
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { useSite } from '@/hooks/use-site';
import Link from 'next/link';

interface SalaryComponent {
  id: string;
  name: string;
  type: string;
  deductionType: string | null;
  calculationType: string;
  amount: number | null;
  percentage: number | null;
  isTaxable: boolean;
  isStatutory: boolean;
  isActive: boolean;
  sortOrder: number;
}

export default function SalaryComponentsPage() {
  const { toast } = useToast();
  const { activeSite } = useSite();
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null);
  const [componentToDelete, setComponentToDelete] = useState<SalaryComponent | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'earning',
    deductionType: 'pre_tax',
    calculationType: 'fixed',
    amount: '',
    percentage: '',
    isTaxable: true,
    isStatutory: false,
    isActive: true,
    sortOrder: '0'
  });

  const fetchComponents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/web/api/salary-components?page=${currentPage}&limit=${limit}&search=${searchQuery}${activeSite?.contractorId ? `&contractorId=${activeSite.contractorId}` : ''}`);
      if (!response.ok) throw new Error('Unable to load the payroll components. Please refresh the page and try again.');
      const data = await response.json();
      setComponents(data.components);
      setTotalPages(data.pagination.pages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to load the payroll components. Please refresh the page and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, [currentPage]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchComponents();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = editingComponent ? 'PUT' : 'POST';
      const url = editingComponent ? `/web/api/salary-components/${editingComponent.id}` : '/web/api/salary-components';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          percentage: formData.percentage ? parseFloat(formData.percentage) : null,
          sortOrder: parseInt(formData.sortOrder),
          contractorId: activeSite?.contractorId || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getApiError(errorData, "Unable to save the payroll component. Please verify the details and try again."));
      }

      toast({ title: "Success", description: `Salary component ${editingComponent ? 'updated' : 'created'} successfully` });
      handleCloseDialog();
      fetchComponents();
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to save the payroll component. Please check your connection and try again."), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (comp: SalaryComponent) => {
    setEditingComponent(comp);
    setFormData({
      name: comp.name,
      type: comp.type,
      deductionType: comp.deductionType || 'pre_tax',
      calculationType: comp.calculationType,
      amount: comp.amount?.toString() || '',
      percentage: comp.percentage?.toString() || '',
      isTaxable: comp.isTaxable,
      isStatutory: comp.isStatutory,
      isActive: comp.isActive,
      sortOrder: comp.sortOrder.toString()
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingComponent(null);
    setFormData({
      name: '',
      type: 'earning',
      deductionType: 'pre_tax',
      calculationType: 'fixed',
      amount: '',
      percentage: '',
      isTaxable: true,
      isStatutory: false,
      isActive: true,
      sortOrder: '0'
    });
  };

  const handleDelete = async () => {
    if (!componentToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/web/api/salary-components/${componentToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Unable to delete the payroll component. Please try again.');
      }

      toast({
        title: "Success",
        description: "Salary component has been removed",
      });
      setIsDeleteDialogOpen(false);
      setComponentToDelete(null);
      fetchComponents();
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to delete the payroll component. Please check your connection and try again."),
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
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/contractor">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/contractor/payroll">Payroll</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Salary Components</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Salary Components</h1>
          <p className="text-muted-foreground mt-1 text-sm">Configure earnings and deductions for your payroll.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/contractor/payroll"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Payroll</Link>
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Component
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-none h-10 text-sm shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchComponents}
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
              <p className="text-sm text-muted-foreground">Loading components...</p>
            </div>
          ) : components.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Settings2 className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No salary components configured.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Type</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Calculation</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Value</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((comp) => (
                  <TableRow key={comp.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-bold text-sm">{comp.name}</TableCell>
                    <TableCell>
                      <Badge variant={comp.type === 'earning' ? 'default' : 'destructive'} className="text-[10px] uppercase">
                        {comp.type}
                        {comp.deductionType && ` (${comp.deductionType.replace('_', ' ')})`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{comp.calculationType === 'fixed' ? 'Fixed Amount' : 'Percentage'}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {comp.calculationType === 'fixed' ? `KES ${comp.amount?.toLocaleString()}` : `${comp.percentage}%`}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={comp.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}>
                        {comp.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4 text-muted-foreground" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(comp)}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setComponentToDelete(comp);
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
              Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, totalCount)}</span> of <span className="font-bold">{totalCount}</span> components
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading} className="gap-1 h-8 px-3">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(p)} disabled={isLoading} className={`h-8 w-8 p-0 ${currentPage === p ? 'bg-primary text-white' : ''}`}>
                    {p}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || isLoading} className="gap-1 h-8 px-3">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingComponent ? 'Edit' : 'Add'} Salary Component</DialogTitle>
            <DialogDescription>Define an earning or deduction for your payroll slips.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Component Name</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., House Allowance, NHIF" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earning">Earning</SelectItem>
                    <SelectItem value="deduction">Deduction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Calculation</Label>
                <Select value={formData.calculationType} onValueChange={v => setFormData({...formData, calculationType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.type === 'deduction' && (
              <div className="space-y-2">
                <Label>Deduction Timing</Label>
                <Select value={formData.deductionType} onValueChange={v => setFormData({...formData, deductionType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_tax">Pre-Tax (Before PAYE)</SelectItem>
                    <SelectItem value="post_tax">Post-Tax (After PAYE)</SelectItem>
                    <SelectItem value="employer_only">Employer Only Cost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{formData.calculationType === 'fixed' ? 'Amount (KES)' : 'Percentage (%)'}</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={formData.calculationType === 'fixed' ? formData.amount : formData.percentage} 
                  onChange={e => setFormData({
                    ...formData, 
                    [formData.calculationType === 'fixed' ? 'amount' : 'percentage']: e.target.value
                  })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded-md">
              <Label htmlFor="taxable">Is Taxable?</Label>
              <Switch id="taxable" checked={formData.isTaxable} onCheckedChange={v => setFormData({...formData, isTaxable: v})} />
            </div>
            <div className="flex items-center justify-between p-2 border rounded-md">
              <Label htmlFor="statutory">Statutory Component?</Label>
              <Switch id="statutory" checked={formData.isStatutory} onCheckedChange={v => setFormData({...formData, isStatutory: v})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingComponent ? 'Update' : 'Save'} Component
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Component
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure you want to delete <strong>{componentToDelete?.name}</strong>? This action cannot be undone.
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
