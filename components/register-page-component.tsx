'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { AuthShellIcon, AuthHighlight } from '@/components/auth-shell';
import { AuthShell } from '@/components/auth-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/toast-utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  maxSites: number;
  maxTeamMembers: number;
  features: string;
}

const steps: { id: number; title: string; icon: AuthShellIcon }[] = [
  { id: 1, title: 'Details', icon: UserIcon },
  { id: 2, title: 'Plan', icon: BuildingOffice2Icon },
  { id: 3, title: 'Payment', icon: CreditCardIcon },
];

const highlights: AuthHighlight[] = [
  {
    icon: UserIcon,
    chip: 'bg-teal/15 text-teal',
    title: 'Start in minutes',
    text: 'Register, pay via M-Pesa and onboard your first site.',
  },
  {
    icon: CreditCardIcon,
    chip: 'bg-[#3B82C4]/15 text-[#3B82C4]',
    title: 'Plans that scale',
    text: 'From single-site crews to multi-site contractors.',
  },
  {
    icon: DevicePhoneMobileIcon,
    chip: 'bg-coral/15 text-coral',
    title: 'M-Pesa built in',
    text: 'Subscriptions, payroll and disbursements on mobile money.',
  },
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

    const fetchPlans = async () => {
      try {
        const response = await fetch('/web/api/subscription-plans');
        if (!response.ok) {
          console.error('Failed to fetch plans:', response.status);
          return;
        }
        const data = await response.json();
        const plansData = Array.isArray(data) ? data : (data.data && Array.isArray(data.data)) ? data.data : [];
        setPlans(plansData);
      } catch (error) {
        console.error('Failed to fetch plans', error);
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
          amount: selectedPlan?.price ?? 0,
          email: formData.email,
          formData: formData,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Server error. Please try again later.');
      }
      if (!response.ok) throw new Error(data?.error || 'Failed to initiate payment');

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
      toast({ title: "Payment Error", description: getErrorMessage(error, "Unable to initiate the M-Pesa payment. Please check your details and try again."), variant: "destructive" });
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (checkoutRequestId: string) => {
    const interval = setInterval(async () => {
      try {
        console.log('Polling payment status for:', checkoutRequestId);
        const response = await fetch(`/web/api/payments/status?checkoutRequestId=${checkoutRequestId}`);
        if (!response.ok) {
          console.error('Payment status check failed:', response.status);
          return;
        }
        let data;
        try {
          data = await response.json();
        } catch {
          console.error('Failed to parse payment status response');
          return;
        }

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
      let data;
      try {
        data = await response.json();
      } catch {
        toast({ title: "Error", description: "Failed to check payment status. Please try again.", variant: "destructive" });
        setIsCheckingStatus(false);
        return;
      }

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
      toast({ title: "Error", description: getErrorMessage(error, "Unable to check the payment status. Please try again in a few moments."), variant: "destructive" });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.planId);

  return (
    <AuthShell
      eyebrow="Get started"
      headline={
        <>
          Run every site,
          <br />
          from day one.
        </>
      }
      subline="Create your contractor account, pick a plan and start managing sites in minutes."
      highlights={highlights}
      mobileActionHref="/login"
      mobileActionLabel="Sign in"
      wide
    >
      {/* Stepper */}
      <div className="flex items-center justify-center max-w-md mx-auto">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep > step.id
                    ? 'bg-teal border-teal text-white'
                    : currentStep === step.id
                    ? 'bg-midnight border-midnight text-white shadow-card'
                    : 'bg-white border-border text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? (
                  <CheckIcon className="size-5" />
                ) : (
                  <step.icon className="size-4" />
                )}
              </div>
              <span
                className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${
                  currentStep >= step.id ? 'text-midnight' : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${
                  currentStep > step.id ? 'bg-teal' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-10">
        {currentStep === 1 && (
          <div className="card-section animate-fade-in">
            <div className="px-6 lg:px-8 py-5 border-b border-border">
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal">Step 1</p>
              <h3 className="font-display text-lg font-bold text-midnight mt-0.5 tracking-tight">
                Account details
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tell us about you and your construction firm.
              </p>
            </div>

            <div className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
                  Admin Information
                </h4>
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Full Name *
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
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
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Email Address *
                  </Label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
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
                  <Label
                    htmlFor="password"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Password *
                  </Label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
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
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
                  Company Details
                </h4>
                <div className="space-y-2">
                  <Label
                    htmlFor="companyName"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Company Name *
                  </Label>
                  <div className="relative">
                    <BuildingOffice2Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
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
                  <Label
                    htmlFor="phoneNumber"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    Phone Number *
                  </Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
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
                    <Label
                      htmlFor="location"
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Location *
                    </Label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
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
                    <Label
                      htmlFor="license"
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      License No
                    </Label>
                    <div className="relative">
                      <DocumentTextIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
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
            </div>

            <div className="px-6 lg:px-8 py-5 bg-cloud/50 border-t border-border flex justify-end gap-3">
              <button type="button" onClick={() => router.push('/')} className="btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleNext} className="btn-primary">
                Select Plan
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal">Step 2</p>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-midnight tracking-tight">
                Choose your plan
              </h3>
              <p className="text-xs text-muted-foreground">
                Select the subscription level that fits your business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((plan) => {
                const isSelected = formData.planId === plan.id;
                const features: string[] = Array.isArray(plan.features)
                  ? (plan.features as unknown as string[])
                  : (() => {
                      try {
                        return JSON.parse(plan.features || '[]');
                      } catch {
                        return [];
                      }
                    })();
                return (
                  <div
                    key={plan.id}
                    className={`card-section cursor-pointer transition-all duration-200 relative ${
                      isSelected ? 'border-midnight shadow-elevated' : 'hover:shadow-elevated'
                    }`}
                    onClick={() => setFormData({ ...formData, planId: plan.id })}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-midnight text-white flex items-center justify-center z-10">
                        <CheckIcon className="size-3.5" />
                      </div>
                    )}
                    <div className="p-6 space-y-3">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-cloud-dark text-midnight">
                        {plan.name}
                      </span>
                      <p className="font-display text-3xl font-bold text-midnight leading-none">
                        <span className="text-xs font-semibold text-muted-foreground align-top mr-1 inline-block">
                          KES
                        </span>
                        {(Number(plan.price ?? 0)).toLocaleString()}
                        <span className="text-xs font-semibold text-muted-foreground">/mo</span>
                      </p>
                    </div>
                    <div className="px-6 pb-6 space-y-4">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max Sites</span>
                          <span className="font-bold text-midnight">{plan.maxSites ?? 1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Max Team</span>
                          <span className="font-bold text-midnight">{plan.maxTeamMembers ?? '-'}</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-border space-y-2">
                        {features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                            <CheckIcon className="size-3.5 text-teal shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-border bg-cloud/50">
                      <span
                        className={
                          isSelected
                            ? 'btn-primary w-full justify-center'
                            : 'btn-secondary w-full justify-center'
                        }
                      >
                        {isSelected ? 'Selected' : 'Select Plan'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card-section px-6 py-4 flex flex-wrap justify-between items-center gap-3">
              <button type="button" onClick={handleBack} className="btn-secondary">
                <ChevronLeftIcon className="size-4" />
                Back to Details
              </button>
              <button type="button" onClick={handleNext} className="btn-primary">
                Continue to Payment
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="card-section max-w-xl mx-auto animate-fade-in">
            <div className="px-6 lg:px-8 py-5 border-b border-border">
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal">Step 3</p>
              <h3 className="font-display text-lg font-bold text-midnight mt-0.5 tracking-tight">
                Payment
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Secure payment via Lipa na M-Pesa.
              </p>
            </div>

            <div className="p-6 lg:p-8 space-y-6">
              <div className="bg-cloud rounded-xl p-4 space-y-2 border border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Selected Plan</span>
                  <span className="font-bold text-midnight">{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2">
                  <span className="font-semibold text-midnight">Total Amount</span>
                  <span className="font-mono-data font-bold text-midnight">
                    KES {selectedPlan?.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {checkoutRequestId && !registrationComplete && (
                <div
                  className={`p-4 rounded-xl space-y-3 border ${
                    paymentStatus === 'failed' ||
                    paymentStatus === 'FAILED' ||
                    paymentStatus === 'CANCELLED' ||
                    paymentStatus === 'registration_failed'
                      ? 'bg-coral-light border-coral/30'
                      : paymentStatus === 'completed' ||
                        paymentStatus === 'SUCCESS' ||
                        paymentStatus === 'PENDING'
                      ? 'bg-[#EBF3FB] border-[#3B82C4]/30'
                      : 'bg-amber-light border-amber/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {paymentStatus === 'failed' ||
                    paymentStatus === 'FAILED' ||
                    paymentStatus === 'CANCELLED' ? (
                      <XCircleIcon className="size-4 text-coral" />
                    ) : paymentStatus === 'registration_failed' ? (
                      <ExclamationCircleIcon className="size-4 text-coral" />
                    ) : (
                      <ArrowPathIcon
                        className={`size-4 text-[#3B82C4] ${isLoading ? 'animate-spin' : ''}`}
                      />
                    )}
                    <span className="text-sm font-semibold">
                      {paymentStatus === 'failed' ||
                      paymentStatus === 'FAILED' ||
                      paymentStatus === 'CANCELLED' ? (
                        <span className="text-coral-dark">Payment Failed</span>
                      ) : paymentStatus === 'registration_failed' ? (
                        <span className="text-coral-dark">Account Creation Failed</span>
                      ) : (
                        <span className="text-[#3B82C4]">
                          Payment Status:{' '}
                          <span className="font-bold capitalize">{paymentStatus || 'Pending'}</span>
                        </span>
                      )}
                    </span>
                  </div>

                  {paymentStatus === 'failed' ||
                  paymentStatus === 'FAILED' ||
                  paymentStatus === 'CANCELLED' ? (
                    <div className="space-y-2">
                      <p className="text-xs text-coral-dark">
                        Your payment was not successful. You can try again or select a different plan.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleRetryPayment}
                          className="btn-primary h-9 text-xs px-3 py-2"
                        >
                          <ArrowPathIcon className="size-3.5" /> Try Again
                        </button>
                        <button
                          type="button"
                          onClick={handleChangePlan}
                          className="btn-secondary h-9 text-xs px-3 py-2"
                        >
                          <ChevronLeftIcon className="size-3.5" /> Change Plan
                        </button>
                      </div>
                    </div>
                  ) : paymentStatus === 'registration_failed' ? (
                    <div className="space-y-2">
                      <p className="text-xs text-coral-dark">
                        Payment was successful but there was an issue creating your account. Please
                        contact support.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => router.push('/login')}
                          className="btn-primary h-9 text-xs px-3 py-2"
                        >
                          Go to Login
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              'mailto:support@CalCite.com?subject=Registration Issue',
                              '_blank'
                            )
                          }
                          className="btn-secondary h-9 text-xs px-3 py-2"
                        >
                          Contact Support
                        </button>
                      </div>
                    </div>
                  ) : paymentStatus === 'completed' ||
                    paymentStatus === 'SUCCESS' ||
                    paymentStatus === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      <ArrowPathIcon className="size-4 animate-spin text-[#3B82C4]" />
                      <span className="text-sm font-medium text-[#3B82C4]">
                        Creating your account…{' '}
                        <span className="text-xs opacity-70">(this may take a moment)</span>
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600">
                      {isLoading
                        ? 'Waiting for payment confirmation…'
                        : 'Please check your phone and complete the payment.'}
                    </p>
                  )}
                </div>
              )}

              {registrationComplete && (
                <div className="bg-teal-light border border-teal/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckIcon className="size-4 text-teal" />
                    <span className="text-sm font-semibold text-teal-dark">Payment Successful!</span>
                  </div>
                  <p className="text-xs text-teal-dark">
                    Your account is being created. Redirecting to login…
                  </p>
                </div>
              )}

              {!checkoutRequestId && (
                <div className="space-y-3">
                  <Label
                    htmlFor="mpesaNumber"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    M-Pesa Phone Number
                  </Label>
                  <div className="relative">
                    <DevicePhoneMobileIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="mpesaNumber"
                      placeholder="e.g. 254712345678"
                      className="pl-10 h-12 text-lg font-bold tracking-widest font-mono-data"
                      value={formData.mpesaNumber}
                      onChange={(e) => setFormData({ ...formData, mpesaNumber: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CheckIcon className="size-3 text-teal shrink-0" />
                    You will receive an STK Push prompt on this number.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 lg:px-8 py-6 bg-cloud/50 border-t border-border flex flex-col gap-4">
              {!checkoutRequestId ? (
                <>
                  <button
                    type="button"
                    onClick={handleInitiatePayment}
                    className="btn-primary w-full h-14 text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <ArrowPathIcon className="size-5 animate-spin" />
                        Processing Payment…
                      </>
                    ) : (
                      `Pay KES ${selectedPlan?.price.toLocaleString()} Now`
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="btn-secondary w-full"
                  >
                    <ChevronLeftIcon className="size-4" />
                    Change Plan
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCheckStatus}
                    disabled={isCheckingStatus || registrationComplete}
                    className="btn-primary w-full h-12"
                  >
                    {isCheckingStatus ? (
                      <>
                        <ArrowPathIcon className="size-4 animate-spin" />
                        Checking Status…
                      </>
                    ) : (
                      'Check Payment Status'
                    )}
                  </button>
                  <p className="text-[10px] text-muted-foreground italic text-center">
                    If you've completed the payment but haven't been redirected, click above to
                    check your status.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
