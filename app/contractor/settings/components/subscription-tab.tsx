'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Loader2, CheckCircle2, Star, Zap, Shield, Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function SubscriptionTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubscribingAgain, setIsSubscribingAgain] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [contractorId, setContractorId] = useState<string | null>(null);

  const fetchSubscription = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/web/api/contractors?limit=1');
      const data = await resp.json();
      const contractor = data.contractors[0];
      
      if (contractor) {
        setContractorId(contractor.id);
        const subResp = await fetch(`/web/api/contractors/${contractor.id}/subscription`);
        const subData = await subResp.json();
        setSubscriptionData(subData);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load subscription info", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpdatePlan = async (planId: string) => {
    if (!contractorId) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/web/api/contractors/${contractorId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) throw new Error('Failed to update plan');

      toast({ title: "Success", description: "Subscription updated successfully" });
      fetchSubscription();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !subscriptionData) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading subscription details...</p>
        </CardContent>
      </Card>
    );
  }

  const { currentPlan, availablePlans, status, endDate, purchasedSiteSlots, usedSiteSlots } = subscriptionData;
  const slots = purchasedSiteSlots ?? 1;
  const used = usedSiteSlots ?? 0;

  const getPlanIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'basic': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'professional': return <Star className="w-5 h-5 text-amber-500" />;
      case 'enterprise': return <Shield className="w-5 h-5 text-emerald-500" />;
      default: return <CreditCard className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Card className="border-none shadow-md bg-primary/5 border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">Current Subscription</CardTitle>
              <CardDescription>Your construction business is currently on the <span className="font-bold text-primary">{currentPlan?.name}</span> plan.</CardDescription>
            </div>
            <Badge className="bg-emerald-500 hover:bg-emerald-600 uppercase text-[10px] font-bold px-3 py-1">
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Monthly Billing</p>
              <p className="text-2xl font-black tracking-tight">KES {currentPlan?.price.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Next Renewal</p>
              <p className="text-lg font-bold">{endDate ? new Date(endDate).toLocaleDateString() : 'Active'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Team Members</p>
              <p className="text-lg font-bold">{currentPlan?.maxTeamMembers}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Site Slots</p>
              <p className="text-lg font-bold">{used} / {slots} used</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Slots Usage & Subscribe Again */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">Site Slots</h3>
              <p className="text-xs text-muted-foreground">
                Each subscription grants one site. You have created <span className="font-bold text-foreground">{used}</span> of <span className="font-bold text-foreground">{slots}</span> site{slots > 1 ? 's' : ''}.
                {used < slots ? ' You can add more sites without subscribing again.' : ' Subscribe again to add another site.'}
              </p>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${used >= slots ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, (used / Math.max(1, slots)) * 100)}%` }}
            />
          </div>
          <Button
            className="gap-2 w-full sm:w-auto"
            onClick={async () => {
              if (!contractorId) return;
              setIsSubscribingAgain(true);
              try {
                const response = await fetch(`/web/api/contractors/${contractorId}/subscription`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ subscribeAgain: true }),
                });
                if (!response.ok) throw new Error('Failed to add site slot');
                toast({ title: 'Success', description: 'New site slot added. You can now create another site.' });
                fetchSubscription();
              } catch (err: any) {
                toast({ title: 'Error', description: err.message, variant: 'destructive' });
              } finally {
                setIsSubscribingAgain(false);
              }
            }}
            disabled={isSubscribingAgain}
          >
            {isSubscribingAgain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Subscribe Again (Add Site Slot)
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availablePlans.map((plan: any) => (
          <Card key={plan.id} className={`border-none shadow-md flex flex-col ${plan.id === currentPlan?.id ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                {getPlanIcon(plan.name)}
                {plan.id === currentPlan?.id && (
                  <Badge variant="outline" className="text-[9px] font-bold uppercase text-primary border-primary/20">Active Plan</Badge>
                )}
              </div>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-black tracking-tighter">KES {plan.price.toLocaleString()}</span>
                <span className="text-muted-foreground text-xs ml-1">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <Separator />
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Up to <span className="font-bold">1 site</span> management</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Up to <span className="font-bold">{plan.maxTeamMembers} team members</span></span>
                </li>
                {JSON.parse(plan.features).map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-6">
              <Button 
                className="w-full h-11 font-bold"
                variant={plan.id === currentPlan?.id ? "outline" : "default"}
                disabled={plan.id === currentPlan?.id || isUpdating}
                onClick={() => handleUpdatePlan(plan.id)}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {plan.id === currentPlan?.id ? 'Your Current Plan' : `Upgrade to ${plan.name}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
