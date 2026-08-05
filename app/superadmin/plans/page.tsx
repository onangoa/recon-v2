'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ClipboardList, 
  CheckCircle2, 
  DollarSign, 
  Users, 
  Layout,
  MoreVertical,
  Layers,
  Power,
  PowerOff,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useToast } from "@/hooks/use-toast";
import { getApiError, getErrorMessage } from '@/lib/toast-utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  maxSites: number;
  maxTeamMembers: number;
  features: string;
  createdAt: string;
  isActive: boolean;
}

export default function PlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    maxSites: '',
    maxTeamMembers: '',
    features: [''],
  });

  const safeParseFeatures = (featuresStr: string): string[] => {
    try {
      const parsed = JSON.parse(featuresStr);
      if (Array.isArray(parsed)) return parsed;
      return [featuresStr];
    } catch (e) {
      // If it's not valid JSON, it might be a comma-separated string (legacy)
      if (featuresStr.includes(',')) {
        return featuresStr.split(',').map(f => f.trim());
      }
      return [featuresStr];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/web/api/superadmin/plans');
      const data = await res.json();
      setPlans(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to load subscription plans. Please refresh the page and try again.",
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
    try {
      const res = await fetch('/web/api/superadmin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          features: formData.features.filter(f => f.trim() !== ''),
        }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "Success",
          description: "Plan created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({ name: '', price: '', maxSites: '', maxTeamMembers: '', features: [''] });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: getApiError(data, "Unable to create the subscription plan. Please verify the details and try again."),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to create the subscription plan. Please check your connection and try again."),
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      const res = await fetch(`/web/api/superadmin/plans/${selectedPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          features: formData.features.filter(f => f.trim() !== ''),
        }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "Success",
          description: "Plan updated successfully",
        });
        setIsEditDialogOpen(false);
        setSelectedPlan(null);
        fetchData();
      } else {
        toast({
          title: "Error",
          description: getApiError(data, "Unable to update the subscription plan. Please verify the details and try again."),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to update the subscription plan. Please check your connection and try again."),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await fetch(`/web/api/superadmin/plans/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "Deleted",
          description: "Plan deleted",
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: getApiError(data, "Unable to delete the subscription plan. Please try again."),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to delete the subscription plan. Please check your connection and try again."),
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    const action = plan.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this plan? ${plan.isActive ? 'Contractors will not be able to select this plan for new subscriptions.' : 'This plan will be available for contractors to select.'}`)) return;

    try {
      const res = await fetch(`/web/api/superadmin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "Success",
          description: `Plan ${plan.isActive ? 'deactivated' : 'activated'} successfully`,
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: getApiError(data, `Unable to ${action} the subscription plan. Please try again.`),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: getErrorMessage(error, `Unable to ${action} the subscription plan. Please check your connection and try again.`),
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (plan: Plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      maxSites: plan.maxSites.toString(),
      maxTeamMembers: plan.maxTeamMembers.toString(),
      features: safeParseFeatures(plan.features),
    });
    setIsEditDialogOpen(true);
  };

  const addFeatureField = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const updateFeatureField = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeatureField = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length > 0 ? newFeatures : [''] });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Subscription Plans</h1>
          <p className="text-muted-foreground">Define and manage the pricing tiers available for contractors.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Create New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
              <DialogDescription>Define a new tier with specific features and limits.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Professional" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Price (KES)</Label>
                <Input id="price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTeamMembers">Max Team Members per Site</Label>
                <Input id="maxTeamMembers" type="number" value={formData.maxTeamMembers} onChange={e => setFormData({...formData, maxTeamMembers: e.target.value})} placeholder="20" required />
              </div>
              <div className="space-y-2">
                <Label>Features</Label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={feature} onChange={e => updateFeatureField(index, e.target.value)} placeholder="Feature description" required />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFeatureField(index)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addFeatureField} className="w-full mt-2 border-dashed">
                  <Plus className="w-3 h-3 mr-2" /> Add Feature
                </Button>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Plan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border-none shadow-md overflow-hidden">
              <CardHeader><Skeleton className="h-24 w-full" /></CardHeader>
              <CardContent><Skeleton className="h-48 w-full" /></CardContent>
            </Card>
          ))
        ) : plans.length === 0 ? (
          <div className="col-span-full h-48 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <Layers className="w-8 h-8 mb-2 opacity-20" />
            <p>No subscription plans defined yet.</p>
          </div>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} className={`border-none shadow-md overflow-hidden group relative flex flex-col ${!plan.isActive ? 'opacity-60' : ''}`}>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="flex gap-1">
                  <Button 
                    variant={plan.isActive ? "secondary" : "outline"} 
                    size="icon" 
                    className={`h-8 w-8 ${plan.isActive ? 'bg-white/90 backdrop-blur shadow-sm' : 'border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground'}`}
                    onClick={() => handleToggleActive(plan)}
                    title={plan.isActive ? "Deactivate Plan" : "Activate Plan"}
                  >
                    {plan.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur shadow-sm" onClick={() => openEditDialog(plan)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <CardHeader className={`bg-primary/5 pb-8 ${!plan.isActive ? 'bg-muted/20' : ''}`}>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  {plan.name}
                  {plan.price === 0 && <Badge className="bg-emerald-500 hover:bg-emerald-600">Free</Badge>}
                  {!plan.isActive && (
                    <Badge variant="outline" className="border-destructive text-destructive">
                      Inactive
                    </Badge>
                  )}
                </CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-primary">KES {plan.price.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex-1">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-primary mb-1">
                        <Layout className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Max Sites</span>
                      </div>
                      <span className="text-lg font-bold">1</span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 text-primary mb-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Team Size</span>
                      </div>
                      <span className="text-lg font-bold">{plan.maxTeamMembers}</span>
                    </div>
                  </div>
                  <div className="space-y-2.5 mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Included Features</p>
                    {safeParseFeatures(plan.features).map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 border-t border-border/50 py-4 px-6 mt-auto">
                <p className="text-[10px] text-muted-foreground italic">
                  Created on {new Date(plan.createdAt).toLocaleDateString()}
                </p>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>Update the tier details and limits.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input id="edit-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Monthly Price (KES)</Label>
              <Input id="edit-price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-maxTeamMembers">Max Team Members per Site</Label>
              <Input id="edit-maxTeamMembers" type="number" value={formData.maxTeamMembers} onChange={e => setFormData({...formData, maxTeamMembers: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Features</Label>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={feature} onChange={e => updateFeatureField(index, e.target.value)} placeholder="Feature description" required />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFeatureField(index)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addFeatureField} className="w-full mt-2 border-dashed">
                <Plus className="w-3 h-3 mr-2" /> Add Feature
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
