'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  CheckIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth-shell';
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';

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

    setIsLoading(true);

    try {
      const response = await fetch('/web/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Server error. Please try again later.');
      }

      if (response.ok) {
        toast({
          title: 'Reset link sent',
          description:
            data?.message ||
            "If an account exists for this email, you will receive reset instructions.",
        });
        setIsSubmitted(true);
        setResendTimer(30);
      } else {
        toast({
          title: 'Error',
          description: getApiError(
            data,
            'Unable to send the password reset link. Please try again.'
          ),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(
          error,
          'Unable to send the password reset link. Please check your connection and try again.'
        ),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Password help"
      headline={
        <>
          Back in,
          <br />
          no time.
        </>
      }
      subline="Enter the email linked to your account and we'll send you a reset link."
      mobileActionHref="/login"
      mobileActionLabel="Sign in"
    >
      {!isSubmitted ? (
        <>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal">
              Password help
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-midnight leading-tight tracking-tight">
              Reset your password
            </h1>
            <p className="text-sm text-muted-foreground">
              We'll send you instructions to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
              >
                Email Address
              </Label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full h-12" disabled={isLoading}>
              {isLoading ? (
                <>
                  <ArrowPathIcon className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send Reset Link
                  <PaperAirplaneIcon className="size-4" />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-light text-teal flex items-center justify-center mx-auto">
            <CheckIcon className="size-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-midnight tracking-tight">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground">
              We've sent a password reset link to{' '}
              <span className="font-mono-data font-semibold text-midnight">{email}</span>.
            </p>
          </div>
          {resendTimer > 0 ? (
            <button className="btn-secondary w-full h-11" disabled>
              Resend in {resendTimer}s
            </button>
          ) : (
            <button className="btn-secondary w-full h-11" onClick={() => setIsSubmitted(false)}>
              Didn't receive it? Try again
            </button>
          )}
        </div>
      )}

      <Link href="/login" className="btn-secondary w-full h-11">
        <ArrowLeftIcon className="size-4" />
        Back to Sign In
      </Link>
    </AuthShell>
  );
}
