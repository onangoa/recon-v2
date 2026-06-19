import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mobileSuccess } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true } });

  return mobileSuccess({
    currency: { code: 'KES', symbol: 'KSh', full_form: 'Kenyan Shilling' },
    mobile_app_version: {
      current_version: '1.0.2',
      minimum_supported_version: '1.0.0',
      update_required: false,
    },
    purchase_order_priorities: [
      { id: 1, name: 'Low', color: '#00FF00' },
      { id: 2, name: 'Medium', color: '#FFA500' },
      { id: 3, name: 'High', color: '#FF0000' },
    ],
    machine_types: [
      { key: 'excavator', value: 'Excavator' },
      { key: 'loader', value: 'Wheel Loader' },
    ],
    machine_conditions: [
      { key: 'excellent', value: 'Excellent' },
      { key: 'fair', value: 'Fair' },
      { key: 'poor', value: 'Poor' },
    ],
    license_types: [
      { key: 'permit', value: 'Operating Permit' },
    ],
    wallet_transaction_types: [
      { key: 'deposit', value: 'Deposit' },
      { key: 'payment', value: 'Payment' },
    ],
    activity_log_types: [
      { key: 'auth', value: 'Authentication' },
    ],
  });
}