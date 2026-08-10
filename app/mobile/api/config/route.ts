import { NextRequest } from 'next/server';
import { mobileSuccess, mobileError } from '@/lib/mobile-auth';

// ---------------------------------------------------------------------------
// App version configuration
// ---------------------------------------------------------------------------
// These values control the forced-update behaviour. When the client sends
// its installed version via the `X-App-Version` header (or `app_version`
// query param), the server compares it against `MINIMUM_SUPPORTED_VERSION`
// and `FORCE_UPDATE_VERSION` to dynamically set `update_required`.
//
// To force all clients below a certain version to update:
//   1. Bump `CURRENT_VERSION` to the newly published version.
//   2. Set `FORCE_UPDATE_VERSION` to the lowest version that is OK (i.e.
//      clients below this MUST update).
//   3. Set `MINIMUM_SUPPORTED_VERSION` to the same or lower floor.
//   4. Fill in `UPDATE_URL` and `RELEASE_NOTES`.
// ---------------------------------------------------------------------------

const CURRENT_VERSION = '1.0.2';
const MINIMUM_SUPPORTED_VERSION = '1.0.0';
const FORCE_UPDATE_VERSION: string | null = null; // e.g. '1.0.1' — clients below this must update
const UPDATE_URL = '';
const RELEASE_NOTES = '';
const PLATFORM = 'both';

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
};

// Compare two semver-ish strings (e.g. "1.0.2" vs "1.0.10").
// Returns -1 if a < b, 0 if equal, 1 if a > b.
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const va = partsA[i] || 0;
    const vb = partsB[i] || 0;
    if (va < vb) return -1;
    if (va > vb) return 1;
  }
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientVersion =
      request.headers.get('X-App-Version') ||
      searchParams.get('app_version') ||
      '';

    // Dynamically determine whether a forced update is required.
    let updateRequired = false;

    if (clientVersion) {
      // If the client version is below the minimum supported version, force update.
      if (compareVersions(clientVersion, MINIMUM_SUPPORTED_VERSION) < 0) {
        updateRequired = true;
      }
      // If a force_update_version is set and the client is below it, force update.
      if (
        FORCE_UPDATE_VERSION &&
        compareVersions(clientVersion, FORCE_UPDATE_VERSION) < 0
      ) {
        updateRequired = true;
      }
    }

    const mobileAppVersion = {
      current_version: CURRENT_VERSION,
      minimum_supported_version: MINIMUM_SUPPORTED_VERSION,
      force_update_version: FORCE_UPDATE_VERSION,
      update_url: UPDATE_URL,
      release_notes: RELEASE_NOTES,
      update_required: updateRequired,
      platform: PLATFORM,
    };

    return mobileSuccess({ ...MOBILE_CONFIG, mobile_app_version: mobileAppVersion }, 'Success');
  } catch (error) {
    console.error('Mobile config error:', error);
    return mobileError('Failed to fetch config', 500);
  }
}
