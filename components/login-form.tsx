'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  Lock, 
  Mail, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  ChevronRight,
  ShieldCheck
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

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data));

        if (data.contractor) {
          const contractor = data.contractor;
          localStorage.setItem('contractor', JSON.stringify(contractor));

          fetch(`/api/sites?contractorId=${contractor.id}`)
            .then(res => res.json())
            .then(sitesData => {
              const sites = Array.isArray(sitesData.sites) ? sitesData.sites : sitesData;
              localStorage.setItem('sites', JSON.stringify(sites));
            })
            .catch(err => console.error('Failed to fetch sites:', err));
        }

        if (data.role === 'superadmin') {
          router.push('/superadmin');
        } else {
          router.push('/contractor');
        }
      } else {
        const error = await response.json();
        setError(error.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('A connection error occurred. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8DC] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8B4513]/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[440px] space-y-8 z-10">

        <Card className="border-[#8B4513]/20 bg-white/70 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-gradient-to-br from-[#8B4513] to-[#A0522D] text-white p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <img src="https://recon.code-work.space/storage/logos/light-logo.png" alt="ReconSMI" className="h-12" />
              </div>
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-white/90 italic mt-1">Enter your credentials to access your portal</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-700 flex items-center gap-2 animate-in shake-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-[#5D4037]">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@company.com" 
                    className="pl-10 h-12 border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-[#5D4037]">Password</Label>
                  <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-tighter text-[#8B4513] hover:text-[#6D3710] hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-12 border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-md font-bold bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#6D3710] hover:to-[#8B4513] shadow-lg shadow-[#8B4513]/20 gap-2 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-[#FFF8DC]/50 p-6 flex flex-col items-center gap-3 border-t border-[#8B4513]/10">
            <p className="text-xs text-[#5D4037] font-medium">Don't have a contractor account?</p>
            <Button variant="outline" className="w-full h-11 font-bold border-[#8B4513]/20 text-[#8B4513] hover:bg-[#8B4513]/5 hover:border-[#8B4513] gap-2" asChild>
              <Link href="/register">
                Register Your Firm <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Demo credentials info */}
        <div className="rounded-xl border border-[#8B4513]/20 bg-[#8B4513]/5 p-4 space-y-3 backdrop-blur-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8B4513] flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> Demo Credentials
          </p>
          <div className="grid grid-cols-1 gap-2 text-[11px] text-[#5D4037]">
            <div className="flex justify-between border-b border-[#8B4513]/10 pb-1">
              <span className="font-bold">Superadmin:</span>
              <code className="text-[#8B4513] font-bold">admin@constructionhub.ke</code>
            </div>
            <div className="flex justify-between border-b border-[#8B4513]/10 pb-1">
              <span className="font-bold">Contractor:</span>
              <code className="text-[#8B4513] font-bold">info@nairobibuilders.ke</code>
            </div>
            <div className="text-[9px] italic opacity-70">Password for all demo accounts: <span className="font-black text-[#3E2723]">12345678</span></div>
          </div>
        </div>

        <p className="text-center text-[10px] text-[#5D4037] font-medium uppercase tracking-tighter">
          &copy; 2026 ReconSMI Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
}
