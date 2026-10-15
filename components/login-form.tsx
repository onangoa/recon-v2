'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/context/auth-context';

export function LoginForm() {
  const router = useRouter();
  const { setAuthData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      const response = await fetch('/web/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();

        setAuthData(data.user, data.contractor, data.sites || [], data.needsOnboarding);

        if (data.selectedSiteId) {
          localStorage.setItem('selectedSiteId', data.selectedSiteId);
        }

        if (data.user.role === 'superadmin') {
          router.push('/superadmin');
        } else if (data.needsOnboarding) {
          router.push('/contractor/sites/create');
        } else {
          router.push('/contractor');
        }
      } else {
        const err = await response.json();
        setError(err.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('A connection error occurred. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      headline={
        <>
          Site operations,
          <br />
          fully managed.
        </>
      }
      subline="Sign in to track safety, workers, wallets and reports across every site — in one workspace."
      mobileActionHref="/register"
      mobileActionLabel="Create account"
    >
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-teal">Welcome back</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-midnight leading-tight tracking-tight">
          Sign in to your workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your portal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-coral-light border border-coral/30 p-3 text-xs font-semibold text-coral flex items-center gap-2 animate-fade-in">
            <ExclamationTriangleIcon className="size-4 shrink-0" />
            {error}
          </div>
        )}

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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label
              htmlFor="password"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-[10px] font-bold uppercase tracking-widest text-midnight hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pl-10 pr-11 h-12"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-midnight transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full h-12" disabled={loading}>
          {loading ? (
            <>
              <ArrowPathIcon className="size-4 animate-spin" />
              Authenticating…
            </>
          ) : (
            <>
              Sign In
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Link href="/register" className="btn-secondary w-full h-12">
        Create Contractor Account
        <ChevronRightIcon className="size-4" />
      </Link>

      {/* Demo credentials info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="card-section p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-midnight flex items-center gap-2">
            <ShieldCheckIcon className="size-3.5 text-teal" /> Demo Credentials
          </p>
          <div className="grid grid-cols-1 gap-2 text-[11px] text-muted-foreground">
            <div className="flex justify-between items-center border-b border-border/60 pb-1.5">
              <span className="font-semibold">Superadmin</span>
              <code className="font-mono-data font-semibold text-midnight">
                admin@constructionhub.ke
              </code>
            </div>
            <div className="flex justify-between items-center border-b border-border/60 pb-1.5">
              <span className="font-semibold">Contractor</span>
              <code className="font-mono-data font-semibold text-midnight">
                info@nairobibuilders.ke
              </code>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Password for all demo accounts:{' '}
              <span className="font-mono-data font-bold text-midnight">12345678</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest">
        &copy; 2026 CalcSite Systems. All rights reserved.
      </p>
    </AuthShell>
  );
}
