'use client';

import Link from 'next/link';
import { 
  Building2, 
  Lock,
  ArrowLeft,
  ShieldCheck,
  CheckCircle
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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { AuthNavbar } from '@/components/auth-navbar';

export function ResetPasswordPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: "Invalid Link",
        description: "Reset token is missing. Please request a new password reset.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset. You can now log in with your new password.",
        });
        setIsSuccess(true);
      } else {
        toast({
          title: "Error",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
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
    <div className="min-h-screen bg-[#FFF8DC]">
      <AuthNavbar />
      <div className="pt-20 flex items-center justify-center p-4 relative overflow-hidden">
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
                <CardDescription className="text-white/90 italic mt-1">Enter your new password below</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-[#5D4037]">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 h-12 border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-widest text-[#5D4037]">Confirm Password</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B4513]/60" />
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 h-12 border-[#8B4513]/20 focus:border-[#8B4513] focus:ring-[#8B4513]/20 bg-white/50"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-md font-bold bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#6D3710] hover:to-[#8B4513] shadow-lg shadow-[#8B4513]/20 transition-all disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <div className="bg-emerald-100 text-emerald-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-[#3E2723]">Password Reset Successful!</h3>
                  <p className="text-sm text-[#5D4037]">Your password has been successfully reset. You can now log in with your new password.</p>
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
    </div>
  );
}

export default function ResetPassword() {
  return <ResetPasswordPage />;
}