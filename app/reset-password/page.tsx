'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import {
  ArrowLeftIcon,
  CheckIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth-shell';
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { useSearchParams } from 'next/navigation';

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
        title: 'Invalid Link',
        description: 'Reset token is missing. Please request a new password reset.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/web/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Password Reset Successful',
          description:
            'Your password has been reset. You can now log in with your new password.',
        });
        setIsSuccess(true);
      } else {
        toast({
          title: 'Error',
          description: getApiError(
            data,
            'Unable to reset your password. Please request a new password reset link.'
          ),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(
          error,
          'Unable to reset your password. Please check your connection and try again.'
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
          A fresh
          <br />
          start.
        </>
      }
      subline="Choose a new password for your workspace account."
      mobileActionHref="/login"
      mobileActionLabel="Sign in"
    >
      {!isSuccess ? (
        <>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal">
              Password help
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-midnight leading-tight tracking-tight">
              Choose a new password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
              >
                New Password
              </Label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirm-password"
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <ShieldCheckIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full h-12" disabled={isLoading}>
              {isLoading ? (
                <>
                  <ArrowPathIcon className="size-4 animate-spin" />
                  Resetting…
                </>
              ) : (
                'Reset Password'
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
              Password reset successful
            </h1>
            <p className="text-sm text-muted-foreground">
              Your password has been reset. You can now log in with your new password.
            </p>
          </div>
        </div>
      )}

      <Link href="/login" className="btn-secondary w-full h-11">
        <ArrowLeftIcon className="size-4" />
        Back to Sign In
      </Link>
    </AuthShell>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-cloud">
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      }
    >
      <ResetPasswordPage />
    </Suspense>
  );
}
