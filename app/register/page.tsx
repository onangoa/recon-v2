'use client';

import { RegisterPageComponent } from '@/components/register-page-component';
import { AuthNavbar } from '@/components/auth-navbar';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#FFF8DC]">
      <AuthNavbar />
      <div className="pt-20">
        <RegisterPageComponent />
      </div>
    </div>
  );
}