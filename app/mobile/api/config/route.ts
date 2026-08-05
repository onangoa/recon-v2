import { mobileSuccess, mobileError } from '@/lib/mobile-auth';

const MOBILE_CONFIG = {
  purchase_order_priorities: [
    { id: 1, name: 'High', color: '#F44336', description: 'High priority' },
    { id: 2, name: 'Medium', color: '#FFC107', description: 'Medium priority' },
    { id: 3, name: 'Low', color: '#4CAF50', description: 'Low priority' },
  ],
  machine_types: [
    { key: 'heavy', value: 'Heavy' },
    { key: 'light', value: 'Light' },
  ],
  machine_conditions: [
    { key: 'new', value: 'New' },
    { key: 'used', value: 'Used' },
    { key: 'damaged', value: 'Damaged' },
  ],
  license_types: [{ key: 'medical', value: 'Medical' }],
  wallet_transaction_types: [
    { key: 'credit', value: 'Credit' },
    { key: 'debit', value: 'Debit' },
  ],
  activity_log_types: [
    { key: 'create', value: 'Create' },
    { key: 'update', value: 'Update' },
    { key: 'delete', value: 'Delete' },
  ],
  currency: {
    full_form: 'Kenyan Shilling',
    symbol: 'KSh',
    code: 'KES',
    symbol_position: 'before',
    format: 'comma_separated',
    decimal_points: '2',
  },
  mobile_app_version: {
    current_version: '1.0.2',
    minimum_supported_version: '1.0.0',
    force_update_version: null,
    update_url: '',
    release_notes: '',
    update_required: false,
    platform: 'both',
  },
};

export async function GET() {
  try {
    return mobileSuccess(MOBILE_CONFIG, 'Success');
  } catch (error) {
    console.error('Mobile config error:', error);
    return mobileError('Failed to fetch config', 500);
  }
}