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
  Smartphone,
  RotateCcw,
  XCircle,
  AlertCircle
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
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
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
        const response = await fetch('/web/api/subscription-plans');
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
      const response = await fetch('/web/api/payments/initiate-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.mpesaNumber,
          amount: selectedPlan?.price,
          email: formData.email,
          formData: formData,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initiate payment');

      console.log('Payment initiation response:', data);

      if (!data.checkoutRequestId) {
        throw new Error('Checkout request ID not received from M-Pesa');
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setTransactionId(data.transactionId);

      toast({ title: "Payment Initiated", description: "Please check your phone for the M-Pesa prompt." });
      
      // Start polling for payment status
      pollPaymentStatus(data.checkoutRequestId);
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast({ title: "Payment Error", description: error.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (checkoutRequestId: string) => {
    const interval = setInterval(async () => {
      try {
        console.log('Polling payment status for:', checkoutRequestId);
        const response = await fetch(`/web/api/payments/status?checkoutRequestId=${checkoutRequestId}`);
        const data = await response.json();
        
        console.log('Payment status response:', data);

        setPaymentStatus(data.status);

        // Wait for payment success AND registration completion
        const isPaymentSuccess = data.status === 'completed' || data.status === 'SUCCESS' || data.status === 'PENDING';
        const isRegistrationComplete = data.registrationStatus === 'completed';
        const isRegistrationFailed = data.registrationStatus === 'failed';
        const isUserExists = data.registrationStatus === 'user_exists';

        // Registration is complete (either created or user already exists)
        if (isPaymentSuccess && (isRegistrationComplete || isUserExists)) {
          clearInterval(interval);
          setIsLoading(false);
          setRegistrationComplete(true);
          toast({ 
            title: "Registration Complete!", 
            description: isUserExists ? 
              "Your account is already set up. Please proceed to login." :
              "Your account has been created successfully. You will receive a welcome email shortly.", 
            variant: "success" 
          });
          setTimeout(() => {
            localStorage.removeItem('registration_draft');
            router.push('/login');
          }, 3000);
        } else if (data.status === 'failed' || data.status === 'FAILED' || data.status === 'CANCELLED') {
          clearInterval(interval);
          setIsLoading(false);
          setPaymentStatus(data.status);
        } else if (isPaymentSuccess && isRegistrationFailed) {
          clearInterval(interval);
          setIsLoading(false);
          setPaymentStatus('registration_failed');
          toast({ 
            title: "Registration Failed", 
            description: "Payment was successful but account creation failed. Please contact support.", 
            variant: "destructive" 
          });
        }
      } catch (error) {
        console.error('Polling error', error);
      }
    }, 3000);

    // Stop polling after 3 minutes (extended to allow registration time)
    setTimeout(() => {
      clearInterval(interval);
      if (isLoading && !registrationComplete) {
        setIsLoading(false);
        toast({ 
          title: "Timeout", 
          description: "Registration is taking longer than expected. Please check your email for login credentials or try logging in.", 
          variant: "destructive" 
        });
      }
    }, 180000); // 3 minutes
  };

  const handleRetryPayment = () => {
    // Reset payment state
    setCheckoutRequestId(null);
    setTransactionId(null);
    setPaymentStatus(null);
    setIsLoading(false);
    setRegistrationComplete(false);
  };

  const handleChangePlan = () => {
    setCheckoutRequestId(null);
    setTransactionId(null);
    setPaymentStatus(null);
    setIsLoading(false);
    setRegistrationComplete(false);
    setCurrentStep(2);
  };

  const handleCheckStatus = async () => {
    if (!checkoutRequestId) {
      toast({ title: "Error", description: "No pending payment found", variant: "destructive" });
      return;
    }

    setIsCheckingStatus(true);
    try {
      const response = await fetch(`/web/api/payments/status?checkoutRequestId=${checkoutRequestId}`);
      const data = await response.json();
      
      console.log('Manual status check:', data);

      setPaymentStatus(data.status);

      const isPaymentSuccess = data.status === 'completed' || data.status === 'SUCCESS' || data.status === 'PENDING';
      const isRegistrationComplete = data.registrationStatus === 'completed';
      const isRegistrationFailed = data.registrationStatus === 'failed';
      const isUserExists = data.registrationStatus === 'user_exists';

      // Registration is complete (either created or user already exists)
      if (isPaymentSuccess && (isRegistrationComplete || isUserExists)) {
        toast({ 
          title: "Registration Complete!", 
          description: isUserExists ? 
            "Your account is already set up. Please proceed to login." :
            "Your account has been created successfully. You will receive a welcome email shortly.", 
          variant: "success" 
        });
        setRegistrationComplete(true);
        setTimeout(() => {
          localStorage.removeItem('registration_draft');
          router.push('/login');
        }, 3000);
      } else if (data.status === 'failed' || data.status === 'FAILED' || data.status === 'CANCELLED') {
        toast({ title: "Payment Failed", description: "Your payment was not successful. Please try again.", variant: "destructive" });
      } else if (isPaymentSuccess && isRegistrationFailed) {
        toast({ 
          title: "Registration Failed", 
          description: "Payment was successful but account creation failed. Please contact support.", 
          variant: "destructive" 
        });
      } else if (isPaymentSuccess && !isRegistrationComplete) {
        toast({ 
          title: "Registration in Progress", 
          description: "Your payment is still being processed. Please check again in a few moments.", 
          variant: "default" 
        });
      } else {
        toast({ title: "Payment Pending", description: "Your payment is still being processed. Please check again in a few moments.", variant: "default" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to check payment status", variant: "destructive" });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8DC] flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B4513]/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-4xl space-y-8 z-10">
        {/* Stepper */}
        <div className="flex items-center justify-center max-w-md mx-auto">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center relative">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${currentStep >= step.id ? 'bg-gradient-to-br from-[#8B4513] to-[#A0522D] border-[#8B4513] text-white shadow-lg shadow-[#8B4513]/20' : 'bg-white border-[#8B4513]/20 text-[#5D4037]'}
                `}>
                  {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                </div>
                <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${currentStep >= step.id ? 'text-[#8B4513]' : 'text-[#5D4037]'}`}>
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${currentStep > step.id ? 'bg-gradient-to-r from-[#8B4513] to-[#A0522D]' : 'bg-[#8B4513]/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12">
          {currentStep === 1 && (
            <Card className="border-[#8B4513]/20 bg-white/70 backdrop-blur-md shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="bg-gradient-to-br from-[#8B4513] to-[#A0522D] text-white p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <User className="w-6 h-6" /> Step 1: Account Details
                  </CardTitle>
                  <CardDescription className="text-white/90 italic mt-1">Tell us about you and your construction firm</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513] border-b border-[#8B4513]/20 pb-1">Admin Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                      <Input 
                        id="name" 
                        placeholder="e.g. John Doe" 
                        className="pl-10 h-11 border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john@example.com" 
                        className="pl-10 h-11 border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 h-11 border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513] border-b border-[#8B4513]/20 pb-1">Company Details</h3>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                      <Input 
                        id="companyName" 
                        placeholder="e.g. Peak Construction" 
                        className="pl-10 h-11 border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                      <Input 
                        id="phoneNumber" 
                        placeholder="2547XXXXXXXX" 
                        className="pl-10 h-11 border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                        <Input 
                          id="location" 
                          placeholder="Nairobi" 
                          className="pl-10 h-11 text-sm border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">License No *</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                        <Input 
                          id="license" 
                          placeholder="LIC-000" 
                          className="pl-10 h-11 text-sm border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                          value={formData.licenseNo}
                          onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-[#FFF8DC]/50 p-6 flex justify-end gap-3 border-t border-[#8B4513]/10">
                <Button variant="ghost" onClick={() => router.push('/')} className="text-[#8B4513] hover:bg-[#8B4513]/5">Cancel</Button>
                <Button onClick={handleNext} className="gap-2 px-8 h-11 bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#6D3710] hover:to-[#8B4513] shadow-lg shadow-[#8B4513]/20">
                  Select Plan <ChevronRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                <h2 className="text-2xl font-black text-[#8B4513] uppercase tracking-tight">Choose Your Plan</h2>
                <p className="text-[#5D4037] italic text-sm">Select the best subscription level for your business needs</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`
                      border-2 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col bg-white/70 backdrop-blur-md
                      ${formData.planId === plan.id ? 'border-[#8B4513] shadow-lg shadow-[#8B4513]/20 scale-105 z-10' : 'border-[#8B4513]/20 hover:border-[#8B4513]/40'}
                    `}
                    onClick={() => setFormData({ ...formData, planId: plan.id })}
                  >
                    {formData.planId === plan.id && (
                      <div className="absolute top-0 right-0 p-2 bg-gradient-to-br from-[#8B4513] to-[#A0522D] text-white rounded-bl-xl">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <CardHeader className="p-6">
                      <Badge variant="outline" className="w-fit mb-2 text-[10px] font-black uppercase tracking-widest border-[#8B4513]/20 text-[#8B4513]">{plan.name}</Badge>
                      <CardTitle className="text-3xl font-black text-[#8B4513]">
                        <span className="text-sm font-medium text-[#5D4037] align-top mt-1 inline-block mr-1">KES</span>
                        {plan.price.toLocaleString()}
                        <span className="text-xs font-medium text-[#5D4037] align-bottom ml-1">/mo</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#5D4037]">Max Sites</span>
                          <span className="font-bold text-[#3E2723]">{plan.maxSites}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#5D4037]">Max Team</span>
                          <span className="font-bold text-[#3E2723]">{plan.maxTeamMembers}</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-[#8B4513]/10 space-y-2">
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
                        className={`w-full font-bold ${formData.planId === plan.id ? 'bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#6D3710] hover:to-[#8B4513]' : 'border-[#8B4513]/20 text-[#8B4513] hover:bg-[#8B4513]/5'}`}
                      >
                        {formData.planId === plan.id ? 'Selected' : 'Select Plan'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-lg border border-[#8B4513]/10 backdrop-blur-sm">
                <Button variant="ghost" onClick={handleBack} className="gap-2 text-[#8B4513] hover:bg-[#8B4513]/5">
                  <ChevronLeft className="w-4 h-4" /> Back to Details
                </Button>
                <Button onClick={handleNext} className="gap-2 px-8 bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#6D3710] hover:to-[#8B4513] shadow-lg shadow-[#8B4513]/20 h-11">
                  Continue to Payment <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <Card className="border-[#8B4513]/20 bg-white/70 backdrop-blur-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-500 max-w-lg mx-auto">
              <CardHeader className="bg-gradient-to-br from-[#8B4513] to-[#A0522D] text-white p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Smartphone className="w-6 h-6" /> Step 3: Payment
                  </CardTitle>
                  <CardDescription className="text-white/90 italic mt-1">Secure payment via Lipa na M-Pesa</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="bg-[#FFF8DC]/50 p-4 rounded-xl space-y-2 border border-[#8B4513]/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5D4037] font-medium">Selected Plan</span>
                    <span className="font-bold text-[#8B4513]">{plans.find(p => p.id === formData.planId)?.name}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black border-t border-[#8B4513]/10 pt-2 mt-2">
                    <span className="text-[#8B4513]">Total Amount</span>
                    <span className="text-[#8B4513]">KES {plans.find(p => p.id === formData.planId)?.price.toLocaleString()}</span>
                  </div>
                </div>

                {checkoutRequestId && !registrationComplete && (
                  <div className={`p-4 rounded-xl space-y-3 border ${
                    (paymentStatus === 'completed' || paymentStatus === 'SUCCESS' || paymentStatus === 'PENDING')
                      ? 'bg-blue-50 border-blue-200' 
                      : paymentStatus === 'failed' || paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' || paymentStatus === 'registration_failed'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {paymentStatus === 'failed' || paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : paymentStatus === 'registration_failed' ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      )}
                      <span className="text-sm font-medium">
                        {paymentStatus === 'failed' || paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' ? (
                          <span className="text-red-800">Payment Failed</span>
                        ) : paymentStatus === 'registration_failed' ? (
                          <span className="text-red-800">Account Creation Failed</span>
                        ) : paymentStatus === 'completed' || paymentStatus === 'SUCCESS' || paymentStatus === 'PENDING' ? (
                          <span className="text-blue-800">Payment Status: <span className="font-bold capitalize">{paymentStatus || 'Pending'}</span></span>
                        ) : (
                          <span className="text-blue-800">Payment Status: <span className="font-bold capitalize">{paymentStatus || 'Pending'}</span></span>
                        )}
                      </span>
                    </div>
                    
                    {paymentStatus === 'failed' || paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED' ? (
                      <div className="space-y-2">
                        <p className="text-xs text-red-700">
                          Your payment was not successful. You can try again or select a different plan.
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleRetryPayment}
                            className="flex-1 h-8 text-xs font-bold bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#6D3710] hover:to-[#8B4513] text-white gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Try Again
                          </Button>
                          <Button 
                            onClick={handleChangePlan}
                            variant="outline"
                            className="flex-1 h-8 text-xs font-bold border-[#8B4513]/20 text-[#8B4513] hover:bg-[#8B4513]/5 gap-1"
                          >
                            <ChevronLeft className="w-3 h-3" /> Change Plan
                          </Button>
                        </div>
                      </div>
                    ) : paymentStatus === 'registration_failed' ? (
                      <div className="space-y-2">
                        <p className="text-xs text-red-700">
                          Payment was successful but there was an issue creating your account. Please contact support.
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => router.push('/login')}
                            className="flex-1 h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1"
                          >
                            Go to Login
                          </Button>
                          <Button 
                            onClick={() => window.open('mailto:support@reconsmi.com?subject=Registration Issue', '_blank')}
                            variant="outline"
                            className="flex-1 h-8 text-xs font-bold border-[#8B4513]/20 text-[#8B4513] hover:bg-[#8B4513]/5 gap-1"
                          >
                            Contact Support
                          </Button>
                        </div>
                      </div>
                    ) : paymentStatus === 'completed' || paymentStatus === 'SUCCESS' || paymentStatus === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium text-blue-800">
                          Creating your account... <span className="text-xs text-blue-600">(this may take a moment)</span>
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-blue-700">
                        {isLoading ? 'Waiting for payment confirmation...' : 'Please check your phone and complete the payment.'}
                      </p>
                    )}
                  </div>
                )}

                {registrationComplete && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">Payment Successful!</span>
                    </div>
                    <p className="text-xs text-emerald-700">
                      Your account is being created. Redirecting to login...
                    </p>
                  </div>
                )}

                {!checkoutRequestId && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="mpesaNumber" className="text-sm font-bold uppercase tracking-wider text-[#5D4037]">M-Pesa Phone Number</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                        <Input 
                          id="mpesaNumber" 
                          placeholder="e.g. 254712345678" 
                          className="pl-10 h-12 text-lg font-bold tracking-widest border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                          value={formData.mpesaNumber}
                          onChange={(e) => setFormData({ ...formData, mpesaNumber: e.target.value })}
                        />
                      </div>
                      <p className="text-[10px] text-[#5D4037] italic flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        You will receive an STK Push prompt on this number.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="bg-[#FFF8DC]/50 p-8 flex flex-col gap-4 border-t border-[#8B4513]/10">
                {!checkoutRequestId ? (
                  <>
                    <Button 
                      onClick={handleInitiatePayment} 
                      className="w-full h-14 text-lg font-black bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#6D3710] hover:to-[#8B4513] shadow-lg shadow-[#8B4513]/20 gap-2 transition-all duration-300"
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
                    <Button variant="ghost" onClick={handleBack} disabled={isLoading} className="w-full text-[#8B4513] hover:bg-[#8B4513]/5">
                      <ChevronLeft className="w-4 h-4 mr-2" /> Change Plan
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={handleCheckStatus}
                      disabled={isCheckingStatus || registrationComplete}
                      className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 transition-all duration-300"
                    >
                      {isCheckingStatus ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Checking Status...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Check Payment Status
                        </>
                      )}
                     </Button>
                     <p className="text-[10px] text-[#5D4037] italic text-center">
                       If you've completed the payment but haven't been redirected, click above to check your status.
                     </p>
                   </>
                 )}
               </CardFooter>
             </Card>
           )}
         </div>
       </div>
     </div>
   );
}
