'use client';

import React from 'react';
import Link from 'next/link';
import {
  BanknotesIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export type AuthShellIcon = React.ComponentType<{ className?: string }>;

export interface AuthHighlight {
  icon: AuthShellIcon;
  chip: string;
  title: string;
  text: string;
}

interface AuthShellProps {
  children: React.ReactNode;
  eyebrow?: string;
  headline?: React.ReactNode;
  subline?: string;
  highlights?: AuthHighlight[];
  mobileActionHref?: string;
  mobileActionLabel?: string;
  wide?: boolean;
}

const defaultHighlights: AuthHighlight[] = [
  {
    icon: ShieldCheckIcon,
    chip: 'bg-teal/15 text-teal',
    title: 'Safety compliance, tracked',
    text: 'Incidents, licenses and inspections in one register.',
  },
  {
    icon: BanknotesIcon,
    chip: 'bg-[#3B82C4]/15 text-[#3B82C4]',
    title: 'Wallets & payroll, reconciled',
    text: 'Every disbursement logged to the last shilling.',
  },
  {
    icon: DocumentChartBarIcon,
    chip: 'bg-amber/15 text-amber',
    title: 'Reports that build themselves',
    text: 'Daily site reports ready before you leave the gate.',
  },
];

export function AuthShell({
  children,
  eyebrow = 'Construction Hub',
  headline = (
    <>
      Site operations,
      <br />
      fully managed.
    </>
  ),
  subline = 'Track safety, workers, wallets and reports across every site — in one workspace.',
  highlights = defaultHighlights,
  mobileActionHref = '/login',
  mobileActionLabel = 'Sign in',
  wide = false,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-cloud">
      {/* Brand panel */}
      <div className="hidden lg:flex w-[44%] max-w-xl bg-midnight relative flex-col justify-between p-10 xl:p-12 overflow-hidden">
        {/* Decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute top-1/3 -left-20 w-56 h-56 rounded-full bg-teal/10" />
          <div className="absolute bottom-10 right-16 w-40 h-40 rounded-full bg-sand/10" />
          {[40, 100, 160, 220, 280, 340, 400, 460, 520, 580, 640, 700].map((y, i) => (
            <div
              key={`dot-${i}`}
              className="absolute w-1 h-1 rounded-full bg-white opacity-10"
              style={{ top: y, right: 24 }}
            />
          ))}
        </div>

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/icon.svg" alt="Calcite" className="h-9 w-9" />
          <div className="flex flex-col">
            <span className="font-display text-white font-bold text-lg leading-tight tracking-tight">
              Calcite
            </span>
            <span className="text-blue-200/60 text-xs">Construction Hub</span>
          </div>
        </div>

        {/* Headline + highlights */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal">{eyebrow}</p>
            <h2 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
              {headline}
            </h2>
            <p className="text-blue-200/70 text-sm leading-relaxed max-w-sm">{subline}</p>
          </div>

          <div className="space-y-4">
            {highlights.map((item) => (
              <div key={item.title} className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.chip}`}
                >
                  <item.icon className="size-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold leading-tight">{item.title}</p>
                  <p className="text-blue-200/60 text-xs mt-0.5">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-[10px] text-blue-200/50">
          <span className="w-1.5 h-1.5 rounded-full bg-teal" />
          <span>&copy; 2026 CalcSite Systems. All rights reserved.</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col">
        {/* Mobile brand bar */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 bg-white border-b border-border">
          <div className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="Calcite" className="h-8 w-8" />
            <div className="flex flex-col">
              <span className="font-display text-midnight font-bold text-base leading-tight tracking-tight">
                Calcite
              </span>
              <span className="text-muted-foreground text-[10px]">Construction Hub</span>
            </div>
          </div>
          <Link href={mobileActionHref} className="text-xs font-bold text-midnight hover:underline">
            {mobileActionLabel}
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10">
          <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} space-y-8`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
