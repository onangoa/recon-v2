'use client';

import Link from 'next/link';
import { 
  Building2, 
  Mail, 
  ArrowLeft,
  ShieldCheck,
  Send
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
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting forgot password request for email:', email);
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        toast({
          title: "Reset link sent",
          description: data.message,
        });
        setIsSubmitted(true);
        setResendTimer(30);
      } else {
        toast({
          title: "Error",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8DC] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8B4513]/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-[440px] space-y-8 z-10">
        <Card className="border-[#8B4513]/20 bg-white/70 backdrop-blur-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
          <CardHeader className="bg-gradient-to-br from-[#8B4513] to-[#A0522D] text-white p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <img src="/light-logo.png" alt="ReconSMI" className="h-12" />
              </div>
              <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
              <CardDescription className="text-white/90 italic mt-1">We'll send you instructions to reset your password</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-[#5D4037]">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@company.com" 
                      className="pl-10 h-12 border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-md font-bold bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#6D3710] hover:to-[#8B4513] shadow-lg shadow-[#8B4513]/20 gap-2 transition-all disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'} <Send className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="bg-emerald-100 text-emerald-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Send className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#3E2723]">Check your email</h3>
                <p className="text-sm text-[#5D4037]">We've sent a password reset link to <span className="font-bold text-[#8B4513]">{email}</span>.</p>
                {resendTimer > 0 ? (
                  <Button variant="outline" className="mt-4 border-[#8B4513]/20 text-[#8B4513]/50 hover:bg-[#8B4513]/5" disabled>
                    Resend in {resendTimer}s
                  </Button>
                ) : (
                  <Button variant="outline" className="mt-4 border-[#8B4513]/20 text-[#8B4513] hover:bg-[#8B4513]/5" onClick={() => setIsSubmitted(false)}>
                    Didn't receive it? Try again
                  </Button>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-[#FFF8DC]/50 p-6 flex justify-center border-t border-[#8B4513]/10">
            <Button variant="ghost" className="gap-2 text-[#8B4513] font-bold hover:bg-[#8B4513]/5" asChild>
              <Link href="/login">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}