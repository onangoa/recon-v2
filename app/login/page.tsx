'use client';

import { LoginForm } from '@/components/login-form';
import { AuthNavbar } from '@/components/auth-navbar';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FFF8DC]">
      <AuthNavbar />
      <div className="pt-20">
        <LoginForm />
      </div>
    </div>
  );
}