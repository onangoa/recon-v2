'use client';

import { ForgotPasswordPage } from '@/components/forgot-password-page';
import { AuthNavbar } from '@/components/auth-navbar';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      <AuthNavbar />
      <div className="pt-20">
        <ForgotPasswordPage />
      </div>
    </div>
  );
}