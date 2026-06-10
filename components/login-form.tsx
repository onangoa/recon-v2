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
        
        // Redirect based on role
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
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[440px] space-y-8">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-primary">ReconSMI</h1>
          <p className="text-muted-foreground font-medium italic text-sm">Smart Site Management Platform</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-primary text-white p-8 text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <ShieldCheck className="w-6 h-6" /> Welcome Back
            </CardTitle>
            <CardDescription className="text-primary-foreground/80 italic">Enter your credentials to access your portal.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive flex items-center gap-2 animate-in shake-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@company.com" 
                    className="pl-10 h-12 border-muted-foreground/20 focus:border-primary"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                  <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-tighter text-primary hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-12 border-muted-foreground/20 focus:border-primary"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-md font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 transition-all"
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
          <CardFooter className="bg-muted/30 p-6 flex flex-col items-center gap-3 border-t">
            <p className="text-xs text-muted-foreground font-medium">Don't have a contractor account?</p>
            <Button variant="outline" className="w-full h-11 font-bold border-primary/20 text-primary hover:bg-primary/5 gap-2" asChild>
              <Link href="/register">
                Register Your Firm <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Demo credentials info */}
        <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> Demo Credentials
          </p>
          <div className="grid grid-cols-1 gap-2 text-[11px] text-muted-foreground">
            <div className="flex justify-between border-b border-primary/5 pb-1">
              <span className="font-bold">Superadmin:</span>
              <code className="text-primary font-bold">admin@constructionhub.ke</code>
            </div>
            <div className="flex justify-between border-b border-primary/5 pb-1">
              <span className="font-bold">Contractor:</span>
              <code className="text-primary font-bold">info@nairobibuilders.ke</code>
            </div>
            <div className="text-[9px] italic opacity-70">Password for all demo accounts: <span className="font-black text-foreground">12345678</span></div>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
          &copy; 2026 ReconSMI Systems. All rights reserved.
        </p>
      </div>
    </div>
  );
}
