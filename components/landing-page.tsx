'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/subscription-plans');
        const data = await response.json();
        setPlans(data);
      } catch (error) {
        console.error('Failed to fetch plans');
      }
    };
    fetchPlans();

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
    script.async = true;
    document.body.appendChild(script);

    const script2 = document.createElement('script');
    script2.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js';
    script2.async = true;
    document.body.appendChild(script2);

    return () => {
      document.body.removeChild(script);
      document.body.removeChild(script2);
    };
  }, []);

  return (
    <div className="antialiased bg-[#FFF8DC] text-[#3E2723]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 bg-[#FFF8DC]/95 backdrop-blur-sm border-b border-[#8B4513]/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-[#8B4513]">
            <img src="https://recon.code-work.space/storage/logos/default_full_logo.png" alt="ReconSMI" className="h-10" />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5D4037]">
            <Link href="/#features" className="hover:text-[#8B4513] transition-colors">Features</Link>
            <Link href="/#mobile" className="hover:text-[#8B4513] transition-colors">Mobile App</Link>
            <Link href="/#pricing" className="hover:text-[#8B4513] transition-colors">Pricing</Link>
            <Link href="/login" className="px-6 py-2 bg-[#8B4513] text-white rounded-full hover:bg-[#6D3710] transition-colors">
              Get Started
            </Link>
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
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-[#FFF8DC] z-40 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
        <div className="flex flex-col items-center justify-center h-full gap-8 text-2xl font-medium">
          <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#8B4513] transition-colors">Features</Link>
          <Link href="/#mobile" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#8B4513] transition-colors">Mobile App</Link>
          <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#8B4513] transition-colors">Pricing</Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="px-8 py-3 bg-[#8B4513] text-white rounded-full hover:bg-[#6D3710] transition-colors">
            Start Free Trial
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-20 px-6">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B4513]/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-[#D2691E]/5 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center z-10">
          <div className="space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#8B4513]/20 bg-[#8B4513]/5 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-[#8B4513] animate-ping"></span>
              <span className="text-xs font-bold tracking-widest uppercase text-[#5D4037]">Manage multiple sites</span>
            </div>
            
            <h1 className="text-5xl md:text-5xl lg:text-8xl font-bold leading-[0.9] tracking-tight text-[#3E2723]">
              Manage Every <br />
              <span className="text-[#8B4513]">Construction Site.</span><br />
              From Anywhere.
            </h1>
            
            <p className="text-lg md:text-xl text-[#5D4037] max-w-lg mx-auto md:mx-0 leading-relaxed">
              Real-time construction management that works the way your crew does. Mobile-first. No training required. Full job site visibility in your pocket.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/register" className="px-8 py-4 rounded-full bg-[#8B4513] text-white font-bold text-lg hover:bg-[#6D3710] transition-all shadow-lg shadow-[#8B4513]/20 text-center">
                Get Started
              </Link>
              <Link href="#pricing" className="px-8 py-4 rounded-full border border-[#8B4513]/30 bg-white/50 backdrop-blur-sm font-bold text-lg hover:bg-white transition-all text-center">
                View Pricing
              </Link>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-[#8B4513]/10 rounded-3xl blur-3xl group-hover:blur-2xl transition-all duration-700"></div>
            <div className="relative aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden border border-[#8B4513]/20 shadow-2xl">
              <img 
                src="https://recon.code-work.space/storage/construction-site-manager.webp" 
                alt="Construction site manager using tablet on job site with workers and equipment in background" 
                className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3E2723]/60 via-transparent to-transparent"></div>
              
              {/* Floating Card 1: Dashboard */}
              <div className="absolute top-8 left-8 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-xl float-card">
                <div className="text-xs font-mono text-[#5D4037] mb-2 uppercase tracking-wider">Live Dashboard</div>
                <div className="flex items-end gap-2">
                  <div className="h-12 w-2 bg-[#8B4513] rounded-full"></div>
                  <div className="h-16 w-2 bg-[#D2691E] rounded-full"></div>
                  <div className="h-10 w-2 bg-[#8B4513] rounded-full"></div>
                  <div className="h-14 w-2 bg-[#D2691E] rounded-full"></div>
                </div>
              </div>

              {/* Floating Card 2: Mobile Interface */}
              <div className="absolute top-1/2 right-8 bg-white/70 backdrop-blur-md p-3 rounded-2xl border border-white/30 shadow-xl float-card" style={{ animationDelay: '0.2s' }}>
                <div className="text-xs font-mono text-[#5D4037] mb-2 uppercase tracking-wider">Clock In</div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#8B4513]"></div>
                  <div className="space-y-1">
                    <div className="h-2 w-16 bg-[#8B4513]/50 rounded-full"></div>
                    <div className="h-2 w-12 bg-[#8B4513]/30 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Floating Card 3: Metric */}
              <div className="absolute bottom-24 left-8 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-xl float-card" style={{ animationDelay: '0.4s' }}>
                <div className="text-2xl font-bold text-[#8B4513]">47%</div>
                <div className="text-xs font-mono text-[#5D4037] uppercase tracking-wider">Faster Completion</div>
              </div>

              {/* Floating Card 4: Team */}
              <div className="absolute bottom-8 right-8 bg-white/70 backdrop-blur-md p-3 rounded-2xl border border-white/30 shadow-xl float-card" style={{ animationDelay: '0.6s' }}>
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full bg-[#8B4513] border-2 border-white"></div>
                  <div className="h-8 w-8 rounded-full bg-[#D2691E] border-2 border-white"></div>
                  <div className="h-8 w-8 rounded-full bg-[#8B4513] border-2 border-white"></div>
                  <div className="h-8 w-8 rounded-full bg-[#D2691E] border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                    +8
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-[#8B4513]/20 relative z-10 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="text-center md:text-left space-y-2">
            <p className="text-5xl md:text-6xl font-bold tracking-tighter text-[#8B4513]">15+</p>
            <p className="text-xs uppercase tracking-widest text-[#5D4037] font-bold">Modules Available</p>
          </div>
          <div className="text-center md:text-left space-y-2">
            <p className="text-5xl md:text-6xl font-bold tracking-tighter text-[#8B4513]">24/7</p>
            <p className="text-xs uppercase tracking-widest text-[#5D4037] font-bold">Support Available</p>
          </div>
          <div className="text-center md:text-left space-y-2">
            <p className="text-5xl md:text-6xl font-bold tracking-tighter text-[#8B4513]">99%</p>
            <p className="text-xs uppercase tracking-widest text-[#5D4037] font-bold">System Uptime</p>
          </div>
          <div className="text-center md:text-left space-y-2">
            <p className="text-5xl md:text-6xl font-bold tracking-tighter text-[#8B4513]">50%</p>
            <p className="text-xs uppercase tracking-widest text-[#5D4037] font-bold">Cost Savings</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-[#FFF8DC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <p className="text-[#8B4513] font-bold uppercase tracking-[0.3em] text-xs">EVERYTHING YOU NEED</p>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-[#3E2723]">Built for <span className="text-[#8B4513]">Construction.</span></h2>
            <p className="text-xl text-[#5D4037] max-w-2xl mx-auto leading-relaxed">
              Purpose-built tools that understand how construction sites actually work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '📦', title: 'Dashboard', desc: 'Comprehensive overview of all project activities, statistics, and quick access to key modules. Monitor your entire operation at a glance.' },
              { icon: '🏭', title: 'Inventory', desc: 'Track and manage inventory items, categories, and stock levels across all construction sites. Never run out of essential materials.' },
              { icon: '💳', title: 'Suppliers', desc: 'Manage supplier information, contacts, and procurement relationships. Build strong partnerships with your material vendors.' },
              { icon: '📤', title: 'Wallets', desc: 'Handle digital wallets, petty cash, and financial transactions with M-Pesa integration. Manage payments seamlessly.' },
              { icon: '⚙️', title: 'Site Uploads', desc: 'Manage construction sites, upload site-related documents, photos, and media. Keep all site documentation organized.' },
              { icon: '🚜', title: 'Machines & Equipment', desc: 'Track equipment assignments, maintenance schedules, and availability. Optimize your heavy machinery utilization.' },
              { icon: '🚚', title: 'Purchase Orders', desc: 'Create and manage purchase orders for materials and supplies. Streamline your procurement process.' },
              { icon: '📦', title: 'Material Deliveries', desc: 'Track material deliveries, receipts, and inventory updates. Ensure materials arrive on time and are properly accounted for.' },
              { icon: '👷', title: 'Labour Management', desc: 'Manage workers, attendance, time tracking, and labor allocation. Optimize your workforce productivity.' },
              { icon: '📜', title: 'Licenses', desc: 'Track licenses, certifications, and compliance documents. Stay compliant with regulatory requirements.' },
              { icon: '🚪', title: 'Visitor Management', desc: 'Manage site visitors, visitor logs, and access control. Enhance site security and track all site access.' },
              { icon: '💰', title: 'Payroll', desc: 'Calculate and manage payroll, salary slips, and worker payments. Automate your payroll processing.' },
              { icon: '👤', title: 'Staff', desc: 'Manage user accounts, roles, permissions, and staff profiles. Control access and organize your team.' },
              { icon: '📊', title: 'Reports', desc: 'Generate comprehensive reports on projects, inventory, payroll, and more. Make data-driven decisions.' },
              { icon: '⚙️', title: 'Settings', desc: 'Configure system settings, preferences, and customization options. Tailor the system to your needs.' },
            ].map((feature, idx) => (
              <div key={idx} className="group p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-[#8B4513]/20 hover:bg-white hover:shadow-xl transition-all duration-300">
                <div className="h-14 w-14 rounded-2xl bg-[#8B4513]/10 flex items-center justify-center mb-6 group-hover:bg-[#8B4513] transition-colors">
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-[#3E2723]">{feature.title}</h3>
                <p className="text-[#5D4037] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Showcase Section */}
      <section id="mobile" className="py-32 px-6 bg-[#3E2723] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[#D2691E] font-bold uppercase tracking-[0.3em] text-xs">MOBILE-FIRST DESIGN</p>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight">Built for the <br /><span className="text-[#D2691E]">Field.</span></h2>
              </div>
              <p className="text-xl text-white/80 leading-relaxed">
                Your crew doesn't sit at desks. Neither should your software. Full construction management power in your pocket.
              </p>
              <div className="space-y-6">
                {[
                  { title: 'Attendance', desc: 'Track worker attendance with verified clock in/out. Prevent buddy punching and ensure accurate timekeeping.' },
                  { title: 'Photo Documentation', desc: 'Snap photos with automatic date/time/location stamps. Organized by sites automatically.' },
                  { title: 'Payroll', desc: 'Automated payroll processing with salary slips, tax calculations, and direct disbursements options. Save time and reduce errors.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-[#8B4513] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-white/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-[#8B4513]/20 rounded-3xl blur-3xl"></div>
              <div className="relative">
                <img 
                  src="https://recon.code-work.space/storage/construction-workers.webp" 
                  alt="Construction worker using Recon SMI mobile app on smartphone at job site to track project progress and log time" 
                  className="rounded-3xl border border-white/10 shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-[#FFF8DC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <p className="text-[#8B4513] font-bold uppercase tracking-[0.3em] text-xs">SIMPLE PRICING</p>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-[#3E2723]">Choose Your <span className="text-[#8B4513]">Plan.</span></h2>
            <p className="text-xl text-[#5D4037] max-w-2xl mx-auto leading-relaxed">
              No hidden fees. Just straightforward pricing that scales with your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.length > 0 ? plans.map((plan) => (
              <div key={plan.id} className="bg-white/50 backdrop-blur-sm rounded-3xl border border-[#8B4513]/20 hover:bg-white hover:shadow-xl transition-all duration-300 p-8 flex flex-col">
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#8B4513]">{plan.name}</span>
                  <div className="text-4xl font-black text-[#3E2723] mt-2">
                    <span className="text-lg font-medium text-[#5D4037] align-top mt-1 inline-block mr-1">KES</span>
                    {plan.price.toLocaleString()}
                    <span className="text-sm font-medium text-[#5D4037] align-bottom ml-1">/mo</span>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5D4037]">Max Sites</span>
                    <span className="font-bold text-[#3E2723]">{plan.maxSites}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5D4037]">Max Team</span>
                    <span className="font-bold text-[#3E2723]">{plan.maxTeamMembers}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 mb-6">
                  {JSON.parse(plan.features || '[]').map((feature: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-[#5D4037]">
                      <svg className="w-4 h-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" className="w-full py-3 rounded-full bg-[#8B4513] text-white font-bold text-center hover:bg-[#6D3710] transition-all">
                  Get Started
                </Link>
              </div>
            )) : (
              <div className="col-span-full text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B4513]"></div>
                <p className="mt-4 text-[#5D4037]">Loading pricing plans...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile App Download Section */}
      <section className="py-32 px-6 bg-[#FFF8DC]" id="apps">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <p className="text-[#8B4513] font-bold uppercase tracking-[0.3em] text-xs">DOWNLOAD THE APP</p>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-[#3E2723]">Get the <span className="text-[#8B4513]">Mobile App.</span></h2>
            <p className="text-xl text-[#5D4037] max-w-2xl mx-auto leading-relaxed">
              Take your construction management anywhere. Download our mobile app for iOS and Android devices.
            </p>
          </div>
          
          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {/* Google Play Store Button */}
            <a 
              href="https://play.google.com/store/apps" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-6 py-3 bg-[#3E2723] rounded-xl hover:bg-[#5D4037] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-white/70 font-medium">GET IT ON</div>
                <div className="text-lg font-bold text-white">Google Play</div>
              </div>
            </a>

            {/* Apple App Store Button */}
            <a 
              href="https://apps.apple.com/app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-6 py-3 bg-[#3E2723] rounded-xl hover:bg-[#5D4037] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-white/70 font-medium">DOWNLOAD ON THE</div>
                <div className="text-lg font-bold text-white">App Store</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3E2723] text-white py-12 border-t border-[#8B4513]/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="text-2xl font-bold text-[#D2691E]">
              <img src="https://recon.code-work.space/storage/logos/light-logo.png" alt="ReconSMI" className="h-8" />
            </Link>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link href="/#features" className="hover:text-[#D2691E] transition-colors">Features</Link>
              <Link href="/#pricing" className="hover:text-[#D2691E] transition-colors">Pricing</Link>
              <Link href="#" className="hover:text-[#D2691E] transition-colors">About</Link>
              <Link href="#" className="hover:text-[#D2691E] transition-colors">Contact</Link>
              <Link href="/privacy-policy" className="hover:text-[#D2691E] transition-colors">Privacy</Link>
              <Link href="/terms-and-condition" className="hover:text-[#D2691E] transition-colors">Terms</Link>
            </div>

            <div className="text-sm text-white/60">
              © 2026 Recon SMI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .float-card {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}