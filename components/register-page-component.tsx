'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Phone,
  Mail,
  Lock,
  MapPin,
  FileText,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Plan {
  id: string;
  name: string;
  price: number;
  maxSites: number;
  maxTeamMembers: number;
  features: string;
}

const steps = [
  { id: 1, title: 'Details', icon: <User className="w-4 h-4" /> },
  { id: 2, title: 'Plan', icon: <Building2 className="w-4 h-4" /> },
  { id: 3, title: 'Payment', icon: <CreditCard className="w-4 h-4" /> },
];

export function RegisterPageComponent() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    phoneNumber: '',
    licenseNo: '',
    location: '',
    mpesaNumber: '',
    planId: '',
  });

  useEffect(() => {
    // Load saved data if any
    const savedData = localStorage.getItem('registration_draft');
    if (savedData) {
      setFormData(prev => ({ ...prev, ...JSON.parse(savedData) }));
    }

    // Fetch plans
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/subscription-plans');
        const data = await response.json();
        setPlans(data);
      } catch (error) {
        console.error('Failed to fetch plans');
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    localStorage.setItem('registration_draft', JSON.stringify(formData));
  }, [formData]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.email || !formData.password || !formData.companyName) {
        toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.planId) {
        toast({ title: "Error", description: "Please select a plan", variant: "destructive" });
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleInitiatePayment = async () => {
    if (!formData.mpesaNumber) {
      toast({ title: "Error", description: "Please enter your M-Pesa number", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const selectedPlan = plans.find(p => p.id === formData.planId);
      const response = await fetch('/api/payments/initiate-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.mpesaNumber,
          amount: selectedPlan?.price,
          email: formData.email,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initiate payment');

      toast({ title: "Payment Initiated", description: "Please check your phone for the M-Pesa prompt." });
      
      // Start polling for payment status
      pollPaymentStatus(data.checkoutRequestId);
    } catch (error: any) {
      toast({ title: "Payment Error", description: error.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (checkoutRequestId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/status?checkoutRequestId=${checkoutRequestId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          finalizeRegistration(checkoutRequestId);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          toast({ title: "Payment Failed", description: "Your payment was not successful. Please try again.", variant: "destructive" });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Polling error', error);
      }
    }, 3000);

    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (isLoading) {
        setIsLoading(false);
        toast({ title: "Timeout", description: "Payment confirmation timed out. Please try again if you paid.", variant: "destructive" });
      }
    }, 120000);
  };

  const finalizeRegistration = async (checkoutRequestId: string) => {
    try {
      const response = await fetch('/api/auth/register-contractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, checkoutRequestId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      toast({ title: "Success!", description: "Account created successfully. Welcome aboard!", variant: "success" });
      localStorage.removeItem('registration_draft');
      router.push('/login');
    } catch (error: any) {
      toast({ title: "Registration Error", description: error.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-4xl space-y-8">
        {/* Stepper */}
        <div className="flex items-center justify-center max-w-md mx-auto">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center relative">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${currentStep >= step.id ? 'bg-primary border-primary text-white shadow-md' : 'bg-background border-muted-foreground/20 text-muted-foreground'}
                `}>
                  {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                </div>
                <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12">
          {currentStep === 1 && (
            <Card className="border-none shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-primary text-white p-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <User className="w-6 h-6" /> Step 1: Account Details
                </CardTitle>
                <CardDescription className="text-primary-foreground/80 italic">Tell us about you and your construction firm.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-1">Admin Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="name" 
                        placeholder="e.g. John Doe" 
                        className="pl-10 h-11"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john@example.com" 
                        className="pl-10 h-11"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 h-11"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-1">Company Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="companyName" 
                        placeholder="e.g. Peak Construction" 
                        className="pl-10 h-11"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="phoneNumber" 
                        placeholder="2547XXXXXXXX" 
                        className="pl-10 h-11"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="location" 
                          placeholder="Nairobi" 
                          className="pl-10 h-11 text-sm"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">License No *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="license" 
                          placeholder="LIC-000" 
                          className="pl-10 h-11 text-sm"
                          value={formData.licenseNo}
                          onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => router.push('/')}>Cancel</Button>
                <Button onClick={handleNext} className="gap-2 px-8 h-11 bg-primary hover:bg-primary/90">
                  Select Plan <ChevronRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-2xl font-black text-primary uppercase tracking-tight">Choose Your Plan</h2>
                <p className="text-muted-foreground italic text-sm">Select the best subscription level for your business needs.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`
                      border-2 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col
                      ${formData.planId === plan.id ? 'border-primary shadow-lg scale-105 z-10' : 'hover:border-primary/40'}
                    `}
                    onClick={() => setFormData({ ...formData, planId: plan.id })}
                  >
                    {formData.planId === plan.id && (
                      <div className="absolute top-0 right-0 p-2 bg-primary text-white rounded-bl-xl">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <CardHeader className="p-6">
                      <Badge variant="outline" className="w-fit mb-2 text-[10px] font-black uppercase tracking-widest">{plan.name}</Badge>
                      <CardTitle className="text-3xl font-black text-primary">
                        <span className="text-sm font-medium text-muted-foreground align-top mt-1 inline-block mr-1">KES</span>
                        {plan.price.toLocaleString()}
                        <span className="text-xs font-medium text-muted-foreground align-bottom ml-1">/mo</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Max Sites</span>
                          <span className="font-bold">{plan.maxSites}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Max Team</span>
                          <span className="font-bold">{plan.maxTeamMembers}</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t space-y-2">
                        {JSON.parse(plan.features || '[]').map((feature: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                      <Button 
                        variant={formData.planId === plan.id ? 'default' : 'outline'} 
                        className="w-full font-bold"
                      >
                        {formData.planId === plan.id ? 'Selected' : 'Select Plan'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md">
                <Button variant="ghost" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back to Details
                </Button>
                <Button onClick={handleNext} className="gap-2 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-11">
                  Continue to Payment <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <Card className="border-none shadow-xl overflow-hidden animate-in zoom-in-95 duration-500 max-w-lg mx-auto">
              <CardHeader className="bg-primary text-white p-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Smartphone className="w-6 h-6" /> Step 3: Payment
                </CardTitle>
                <CardDescription className="text-primary-foreground/80 italic">Secure payment via Lipa na M-Pesa.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="bg-muted/50 p-4 rounded-xl space-y-2 border border-primary/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Selected Plan</span>
                    <span className="font-bold text-primary">{plans.find(p => p.id === formData.planId)?.name}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black border-t pt-2 mt-2">
                    <span className="text-primary">Total Amount</span>
                    <span className="text-primary">KES {plans.find(p => p.id === formData.planId)?.price.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="mpesaNumber" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">M-Pesa Phone Number</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="mpesaNumber" 
                      placeholder="e.g. 254712345678" 
                      className="pl-10 h-12 text-lg font-bold tracking-widest"
                      value={formData.mpesaNumber}
                      onChange={(e) => setFormData({ ...formData, mpesaNumber: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    You will receive an STK Push prompt on this number.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-8 flex flex-col gap-4">
                <Button 
                  onClick={handleInitiatePayment} 
                  className="w-full h-14 text-lg font-black bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 gap-2 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      Pay KES {plans.find(p => p.id === formData.planId)?.price.toLocaleString()} Now
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={handleBack} disabled={isLoading} className="w-full">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Change Plan
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
