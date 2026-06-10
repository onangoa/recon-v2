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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder logic
    toast({
      title: "Reset link sent",
      description: "If an account exists for this email, you will receive reset instructions.",
    });
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-primary">ReconSMI</h1>
          <p className="text-muted-foreground font-medium italic text-sm">Account Recovery</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
          <CardHeader className="bg-primary text-white p-8 text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <ShieldCheck className="w-6 h-6" /> Reset Password
            </CardTitle>
            <CardDescription className="text-primary-foreground/80 italic">We'll send you instructions to reset your password.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@company.com" 
                      className="pl-10 h-12 border-muted-foreground/20 focus:border-primary"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-md font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 transition-all"
                >
                  Send Reset Link <Send className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Send className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Check your email</h3>
                <p className="text-sm text-muted-foreground">We've sent a password reset link to <span className="font-bold text-foreground">{email}</span>.</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsSubmitted(false)}>
                  Didn't receive it? Try again
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 p-6 flex justify-center border-t">
            <Button variant="ghost" className="gap-2 text-primary font-bold" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
