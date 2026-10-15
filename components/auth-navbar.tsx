'use client';

import Link from 'next/link';
import { useState } from 'react';

export function AuthNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 bg-[#F8F6F2]/95 backdrop-blur-sm border-b border-[#0F1F3D]/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#0F1F3D]">
          <img src="/default_full_logo.png" alt="ReconSMI" className="h-10" />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4A5568]">
          <Link href="/#" className="hover:text-[#0F1F3D] transition-colors">Home</Link>
          {/* <Link href="/#features" className="hover:text-[#0F1F3D] transition-colors">Features</Link>
          <Link href="/#mobile" className="hover:text-[#0F1F3D] transition-colors">Mobile App</Link>
          <Link href="/#pricing" className="hover:text-[#0F1F3D] transition-colors">Pricing</Link> */}
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-2xl text-[#0F1F3D]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-[#F8F6F2] z-40 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
        <div className="flex flex-col items-center justify-center h-full gap-8 text-2xl font-medium">
          <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#0F1F3D] transition-colors">Features</Link>
          <Link href="/#mobile" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#0F1F3D] transition-colors">Mobile App</Link>
          <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#0F1F3D] transition-colors">Pricing</Link>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#0F1F3D] transition-colors">Login</Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="px-8 py-3 bg-[#0F1F3D] text-white rounded-full hover:bg-[#0A1630] transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}