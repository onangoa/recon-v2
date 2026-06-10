'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  ShieldCheck,
  ExternalLink,
  Filter,
  Download,
  RefreshCw,
  Copy,
  Lock
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Contractor {
  id: string;
  companyName: string;
  location: string;
  phoneNumber: string;
  licenseNo: string;
  subscriptionPlanId: string;
  user: {
    name: string;
    email: string;
  };
  subscriptionPlan: {
    name: string;
  };
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
}

export default function ContractorsPage() {
  const { toast } = useToast();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    location: '',
    phoneNumber: '',
    licenseNo: '',
    subscriptionPlanId: '',
    password: '',
  });

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  useEffect(() => {
    if (isCreateDialogOpen) {
      generatePassword();
    }
  }, [isCreateDialogOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractorsRes, plansRes] = await Promise.all([
        fetch('/api/superadmin/contractors'),
        fetch('/api/subscription-plans'),
      ]);
      const contractorsData = await contractorsRes.json();
      const plansData = await plansRes.json();
      setContractors(contractorsData);
      setPlans(plansData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subscriptionPlanId) {
      toast({
        title: "Required",
        description: "Please select a subscription plan",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/superadmin/contractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Success",
          description: "Contractor created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          email: '',
          companyName: '',
          location: '',
          phoneNumber: '',
          licenseNo: '',
          subscriptionPlanId: '',
          password: '',
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create contractor",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractor) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/superadmin/contractors/${selectedContractor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast({
          title: "Success",
          description: "Contractor updated successfully",
        });
        setIsEditDialogOpen(false);
        setSelectedContractor(null);
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to update contractor",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contractor? This will also delete their user account.')) return;
    try {
      const res = await fetch(`/api/superadmin/contractors/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast({
          title: "Deleted",
          description: "Contractor deleted",
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete contractor",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setFormData({
      name: contractor.user.name,
      email: contractor.user.email,
      companyName: contractor.companyName,
      location: contractor.location,
      phoneNumber: contractor.phoneNumber,
      licenseNo: contractor.licenseNo,
      subscriptionPlanId: contractor.subscriptionPlanId,
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const filteredContractors = contractors.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Contractor Management</h1>
          <p className="text-muted-foreground">Manage all registered contractors and their subscription tiers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add Contractor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Contractor</DialogTitle>
                <DialogDescription>Create a new contractor account and company profile.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Contact Name</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Login Password (Generated)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        className="pl-9 font-mono bg-muted/30"
                        required 
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={generatePassword}
                      title="Regenerate Password"
                      className="h-10 w-10"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => {
                        navigator.clipboard.writeText(formData.password);
                        toast.success('Password copied to clipboard');
                      }}
                      title="Copy Password"
                      className="h-10 w-10"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Legal Company Name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Nairobi" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} placeholder="+254..." required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNo">License Number *</Label>
                    <Input id="licenseNo" value={formData.licenseNo} onChange={e => setFormData({...formData, licenseNo: e.target.value})} placeholder="NCA-..." required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan">Subscription Plan *</Label>
                    <Select value={formData.subscriptionPlanId} onValueChange={val => setFormData({...formData, subscriptionPlanId: val})}>
                      <SelectTrigger id="plan">
                        <SelectValue placeholder="Select Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>Cancel</Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Contractor'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by company, name or email..." 
                className="pl-9 h-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-9 gap-2">
                <Filter className="w-4 h-4" /> Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Company</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Primary Contact</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Plan</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Location</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Created</TableHead>
                <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredContractors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No contractors found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredContractors.map((contractor) => (
                  <TableRow key={contractor.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary" />
                          {contractor.companyName}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          {contractor.licenseNo}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{contractor.user.name}</span>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {contractor.user.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {contractor.phoneNumber}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold uppercase text-[9px]">
                        {contractor.subscriptionPlan.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {contractor.location}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(contractor.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Contractor Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditDialog(contractor)} className="gap-2">
                            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <ExternalLink className="w-3.5 h-3.5" /> View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(contractor.id)} className="gap-2 text-destructive">
                            <Trash2 className="w-3.5 h-3.5" /> Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Contractor</DialogTitle>
            <DialogDescription>Update company and contact information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Contact Name</Label>
                <Input id="edit-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input id="edit-email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-companyName">Company Name</Label>
              <Input id="edit-companyName" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input id="edit-location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                <Input id="edit-phoneNumber" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-licenseNo">License Number</Label>
                <Input id="edit-licenseNo" value={formData.licenseNo} onChange={e => setFormData({...formData, licenseNo: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-plan">Subscription Plan</Label>
                <Select value={formData.subscriptionPlanId} onValueChange={val => setFormData({...formData, subscriptionPlanId: val})}>
                  <SelectTrigger id="edit-plan">
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>Cancel</Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
