'use client';

import Link from 'next/link';
import { useState } from 'react';

export function AuthNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 bg-[#FFF8DC]/95 backdrop-blur-sm border-b border-[#8B4513]/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#8B4513]">
          <img src="https://recon.code-work.space/storage/logos/default_full_logo.png" alt="ReconSMI" className="h-10" />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5D4037]">
          <Link href="/#features" className="hover:text-[#8B4513] transition-colors">Features</Link>
          <Link href="/#mobile" className="hover:text-[#8B4513] transition-colors">Mobile App</Link>
          <Link href="/#pricing" className="hover:text-[#8B4513] transition-colors">Pricing</Link>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-2xl text-[#8B4513]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-[#FFF8DC] z-40 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
        <div className="flex flex-col items-center justify-center h-full gap-8 text-2xl font-medium">
          <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#8B4513] transition-colors">Features</Link>
          <Link href="/#mobile" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#8B4513] transition-colors">Mobile App</Link>
          <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#8B4513] transition-colors">Pricing</Link>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#8B4513] transition-colors">Login</Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="px-8 py-3 bg-[#8B4513] text-white rounded-full hover:bg-[#6D3710] transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}