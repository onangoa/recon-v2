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
  CheckCircle2
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
import { Input } from "@/components/ui/input";
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
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      const response = await fetch('/api/salary-components');
      if (!response.ok) throw new Error('Failed to fetch components');
      const data = await response.json();
      setComponents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/salary-components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          percentage: formData.percentage ? parseFloat(formData.percentage) : null,
          sortOrder: parseInt(formData.sortOrder),
          contractorId: 'placeholder-id' // In a real app, this would come from auth/context
        }),
      });

      if (!response.ok) throw new Error('Failed to save component');

      toast({ title: "Success", description: "Salary component saved successfully" });
      setIsDialogOpen(false);
      fetchComponents();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Component</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Salary Component</DialogTitle>
                <DialogDescription>Define a new earning or deduction for your payroll slips.</DialogDescription>
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
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Component
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
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
                  <TableRow key={comp.id}>
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
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
