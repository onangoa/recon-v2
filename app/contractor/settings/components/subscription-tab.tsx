'use client';

import { useState, useEffect, useRef } from 'react';
import { CreditCard, Loader2, CheckCircle2, Star, Zap, Shield, Building2, Plus, Phone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

type PayAction =
  | { kind: 'subscribeAgain' }
  | { kind: 'upgrade'; planId: string; planName: string };

export default function SubscriptionTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [mpesaNumber, setMpesaNumber] = useState('');

  // Payment state
  const [isPaying, setIsPaying] = useState(false);
  const [payAction, setPayAction] = useState<PayAction | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSubscription = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/web/api/contractors?limit=1');
      const data = await resp.json();
      const contractor = data.contractors[0];
      
      if (contractor) {
        setContractorId(contractor.id);
        if (contractor.phoneNumber) setMpesaNumber(contractor.phoneNumber);
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
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const pollPaymentStatus = (crid: string, onDone: () => void) => {
    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/web/api/payments/status?checkoutRequestId=${crid}`);
        if (!response.ok) return;
        const data = await response.json();

        setPaymentStatus(data.status);

        const isPaymentSuccess =
          data.status === 'completed' || data.status === 'SUCCESS' || data.status === 'PENDING';
        const isSubscriptionComplete = data.subscriptionStatus === 'completed';
        const isSubscriptionFailed = data.subscriptionStatus === 'failed';

        if (isPaymentSuccess && isSubscriptionComplete) {
          stopPolling();
          setIsPaying(false);
          setPayAction(null);
          setPaymentStatus(null);
          setCheckoutRequestId(null);
          toast({
            title: 'Subscription Updated',
            description: 'Your payment was successful and your subscription is now active.',
            variant: 'success',
          });
          fetchSubscription();
          onDone();
        } else if (
          data.status === 'failed' ||
          data.status === 'FAILED' ||
          data.status === 'CANCELLED' ||
          data.status === 'TIMEOUT'
        ) {
          stopPolling();
          setIsPaying(false);
          setPayAction(null);
          toast({
            title: 'Payment Not Completed',
            description:
              data.status === 'CANCELLED'
                ? 'You cancelled the M-Pesa prompt.'
                : data.status === 'TIMEOUT'
                ? 'The M-Pesa prompt timed out.'
                : 'Payment failed. Please try again.',
            variant: 'destructive',
          });
        } else if (isPaymentSuccess && isSubscriptionFailed) {
          stopPolling();
          setIsPaying(false);
          setPayAction(null);
          toast({
            title: 'Subscription Update Failed',
            description: 'Payment succeeded but the subscription could not be updated. Please contact support.',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 3000);

    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setIsPaying(false);
      setPayAction(null);
      toast({
        title: 'Timeout',
        description: 'Payment confirmation is taking longer than expected. Please check back shortly.',
        variant: 'destructive',
      });
    }, 180000);
  };

  const initiatePayment = async (action: PayAction) => {
    if (!contractorId) return;
    if (!mpesaNumber.trim()) {
      toast({ title: 'M-Pesa Number Required', description: 'Please enter the M-Pesa number to charge.', variant: 'destructive' });
      return;
    }

    setIsPaying(true);
    setPayAction(action);
    setPaymentStatus(null);
    setCheckoutRequestId(null);

    try {
      const response = await fetch('/web/api/payments/initiate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: mpesaNumber,
          planId: action.kind === 'upgrade' ? action.planId : undefined,
          subscribeAgain: action.kind === 'subscribeAgain',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to initiate payment');
      if (!data.checkoutRequestId) throw new Error('Checkout request ID not received from M-Pesa');

      setCheckoutRequestId(data.checkoutRequestId);
      toast({ title: 'Payment Initiated', description: 'Please check your phone for the M-Pesa prompt.' });

      pollPaymentStatus(data.checkoutRequestId, () => {});
    } catch (err: any) {
      setIsPaying(false);
      setPayAction(null);
      toast({ title: 'Payment Error', description: err.message, variant: 'destructive' });
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

  const isBusy = isPaying;

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

      {/* M-Pesa payment panel */}
      <Card className="border-none shadow-md">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Phone className="size-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-sm">Pay via M-Pesa</h3>
              <p className="text-xs text-muted-foreground">
                Enter the M-Pesa number to charge. You'll receive an STK push prompt to authorize the payment.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={mpesaNumber}
              onChange={(e) => setMpesaNumber(e.target.value)}
              placeholder="e.g. 0712345678"
              disabled={isBusy}
              className="font-mono sm:max-w-xs"
            />
            {isBusy && (
              <Badge variant="outline" className="self-start gap-1.5 py-1.5 px-3 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {paymentStatus ? `Status: ${paymentStatus}` : 'Awaiting confirmation...'}
              </Badge>
            )}
          </div>
          {isBusy && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Check your phone for the M-Pesa prompt. This page will update automatically once payment is confirmed.
              </p>
            </div>
          )}
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
            onClick={() => initiatePayment({ kind: 'subscribeAgain' })}
            disabled={isBusy}
          >
            {isBusy && payAction?.kind === 'subscribeAgain' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Subscribe Again (Add Site Slot)
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availablePlans.map((plan: any) => {
          const isCurrent = plan.id === currentPlan?.id;
          const isThisBusy = isBusy && payAction?.kind === 'upgrade' && payAction?.planId === plan.id;
          return (
            <Card key={plan.id} className={`border-none shadow-md flex flex-col ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  {getPlanIcon(plan.name)}
                  {isCurrent && (
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
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || isBusy}
                  onClick={() => initiatePayment({ kind: 'upgrade', planId: plan.id, planName: plan.name })}
                >
                  {isThisBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isCurrent ? 'Your Current Plan' : `Upgrade to ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}