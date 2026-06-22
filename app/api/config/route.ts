import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true } });

  return Response.json({
    success: true,
    data: {
      mobile_app_version: {
        current_version: '1.0.2',
        minimum_supported_version: '1.0.0',
        force_update_version: null,
        update_url: 'https://play.google.com/store',
        release_notes: 'Bug fixes and improvements',
        update_required: false,
        update_available: false,
        force_update: false,
        platform: 'android',
      },
      purchase_order_priorities: [
        { id: 1, name: 'low', color: 'success', description: 'Low Priority' },
        { id: 2, name: 'medium', color: 'warning', description: 'Medium Priority' },
        { id: 3, name: 'high', color: 'danger', description: 'High Priority' },
        { id: 4, name: 'urgent', color: 'danger', description: 'Urgent Priority' },
      ],
      machine_types: [
        { key: 'excavator', value: 'Excavator' },
        { key: 'loader', value: 'Wheel Loader' },
        { key: 'crane', value: 'Crane' },
        { key: 'bulldozer', value: 'Bulldozer' },
        { key: 'dump_truck', value: 'Dump Truck' },
      ],
      machine_conditions: [
        { key: 'excellent', value: 'Excellent' },
        { key: 'good', value: 'Good' },
        { key: 'fair', value: 'Fair' },
        { key: 'poor', value: 'Poor' },
      ],
      license_types: [
        { key: 'permit', value: 'Operating Permit' },
        { key: 'registration', value: 'Registration' },
        { key: 'certificate', value: 'Certificate' },
      ],
      wallet_transaction_types: [
        { key: 'mpesa', value: 'M-Pesa' },
        { key: 'bank', value: 'Bank Account' },
        { key: 'mobile_money', value: 'Mobile Money' },
      ],
      activity_log_types: [
        { key: 'create', value: 'Create' },
        { key: 'update', value: 'Update' },
        { key: 'delete', value: 'Delete' },
        { key: 'login', value: 'Login' },
        { key: 'logout', value: 'Logout' },
        { key: 'upload', value: 'Upload' },
        { key: 'download', value: 'Download' },
        { key: 'approve', value: 'Approve' },
        { key: 'reject', value: 'Reject' },
      ],
      currency: {
        full_form: 'Kenyan Shilling',
        symbol: 'KSh',
        code: 'KES',
        symbol_position: 'before',
        format: 'KSh 1,000.00',
        decimal_points: '2',
      },
    },
  });
}