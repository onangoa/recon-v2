'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Building2,
  CheckCircle2,
  Loader2,
  Phone,
  Mail,
  Lock,
  MapPin,
  FileText,
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
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage, getApiError } from '@/lib/toast-utils';

export function RegisterPageComponent() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
  });

  useEffect(() => {
    const savedData = localStorage.getItem('registration_draft');
    if (savedData) {
      try {
        setFormData(prev => ({ ...prev, ...JSON.parse(savedData) }));
      } catch {
        localStorage.removeItem('registration_draft');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('registration_draft', JSON.stringify(formData));
  }, [formData]);

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.companyName || !formData.name) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/web/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Server error. Please try again later.');
      }
      if (!response.ok) throw new Error(getApiError(data, 'Registration failed. Please try again.'));

      setRegistrationComplete(true);
      toast({
        title: "Registration Complete!",
        description: "Your account has been created successfully. You can now sign in.",
        variant: "success"
      });
      setTimeout(() => {
        localStorage.removeItem('registration_draft');
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      toast({ title: "Registration Error", description: getErrorMessage(error, "Unable to create your account. Please check your details and try again."), variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8DC] flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B4513]/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-4xl space-y-8 z-10">
        <div className="text-center">
          <div className="mx-auto w-fit flex items-center gap-3 rounded-full bg-white/70 backdrop-blur-md border border-[#8B4513]/20 px-6 py-2 shadow-sm">
            <User className="w-4 h-4 text-[#8B4513]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#8B4513]">Open Registration</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <Card className="border-[#8B4513]/20 bg-white/70 backdrop-blur-md shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-gradient-to-br from-[#8B4513] to-[#A0522D] text-white p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <User className="w-6 h-6" /> Create Your Account
              </CardTitle>
              <CardDescription className="text-white/90 italic mt-1">Tell us about you and your construction firm — no payment required</CardDescription>
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
                  <Label htmlFor="license">License No</Label>
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
          <CardFooter className="bg-[#FFF8DC]/50 p-6 flex flex-col gap-4 border-t border-[#8B4513]/10">
            {registrationComplete ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Account created successfully!</span>
                </div>
                <p className="text-xs text-emerald-700">Redirecting to login...</p>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleRegister}
                  className="w-full h-14 text-lg font-black bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#6D3710] hover:to-[#8B4513] shadow-lg shadow-[#8B4513]/20 gap-2 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Creating Your Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </Button>
                <div className="flex justify-between w-full">
                  <Button variant="ghost" onClick={() => router.push('/')} className="text-[#8B4513] hover:bg-[#8B4513]/5">Cancel</Button>
                  <Button variant="ghost" onClick={() => router.push('/login')} className="text-[#8B4513] hover:bg-[#8B4513]/5">Already have an account? Login</Button>
                </div>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
