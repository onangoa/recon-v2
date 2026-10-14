'use client';

import { RegisterPageComponent } from '@/components/register-page-component';
import { AuthNavbar } from '@/components/auth-navbar';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      <AuthNavbar />
      <div className="pt-20">
        <RegisterPageComponent />
      </div>
    </div>
  );
}