'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar,
  Zap,
  MoreVertical,
  History
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';

interface Subscription {
  id: string;
  companyName: string;
  subscriptionPlan: {
    id: string;
    name: string;
    price: number;
  };
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [newPlanId, setNewPlanId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, plansRes] = await Promise.all([
        fetch('/web/api/superadmin/subscriptions'),
        fetch('/web/api/superadmin/plans'),
      ]);
      const subsData = await subsRes.json();
      const plansData = await plansRes.json();
      setSubscriptions(subsData);
      setPlans(plansData);
    } catch (error) {
      toast.error('Unable to load subscriptions. Please refresh the page and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdatePlan = async () => {
    if (!selectedSub || !newPlanId) return;
    try {
      const res = await fetch('/web/api/superadmin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId: selectedSub.id,
          planId: newPlanId,
        }),
      });
      if (res.ok) {
        toast.success('Subscription updated successfully');
        setIsUpdateDialogOpen(false);
        fetchData();
      } else {
        toast.error('Unable to update the subscription plan. Please verify the selection and try again.');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update the subscription plan. Please check your connection and try again.'));
    }
  };

  const openUpdateDialog = (sub: Subscription) => {
    setSelectedSub(sub);
    setNewPlanId(sub.subscriptionPlan.id);
    setIsUpdateDialogOpen(true);
  };

  const filteredSubs = subscriptions.filter(s => 
    s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground">Monitor and manage contractor subscription plans and billing status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2" onClick={fetchData}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Subscriptions</p>
                <h3 className="text-2xl font-bold">{subscriptions.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Revenue (Monthly)</p>
                <h3 className="text-2xl font-bold">KES {subscriptions.reduce((acc, s) => acc + s.subscriptionPlan.price, 0).toLocaleString()}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-orange-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Expiring Soon</p>
                <h3 className="text-2xl font-bold">0</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by company or contact..." 
              className="pl-9 h-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Contractor</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Current Plan</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Amount</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Last Updated</TableHead>
                <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredSubs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No subscriptions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubs.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {sub.companyName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-sm">{sub.companyName}</span>
                          <span className="text-[10px] text-muted-foreground">{sub.user.name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-bold uppercase text-[9px]">
                        {sub.subscriptionPlan.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-xs font-medium">Active</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-sm">
                      KES {sub.subscriptionPlan.price.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(sub.updatedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold" onClick={() => openUpdateDialog(sub)}>
                        Update Plan
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Plan Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Subscription Plan</DialogTitle>
            <DialogDescription>Change the subscription tier for {selectedSub?.companyName}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Current Plan</Label>
              <div className="p-3 rounded-lg bg-muted/50 border border-border flex justify-between items-center">
                <span className="font-bold">{selectedSub?.subscriptionPlan.name}</span>
                <span className="text-sm text-muted-foreground">KES {selectedSub?.subscriptionPlan.price.toLocaleString()}/mo</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-plan">New Subscription Plan</Label>
              <Select value={newPlanId} onValueChange={setNewPlanId}>
                <SelectTrigger id="new-plan">
                  <SelectValue placeholder="Select New Plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - KES {plan.price.toLocaleString()}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePlan}>Confirm Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
