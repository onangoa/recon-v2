/**
 * Reusable service for talking to the biometric device-facing API
 * (see docs/device_api.postman_collection.json).
 *
 * Endpoints used:
 *  - POST /api/getRecords        -> attendance / scan records
 *  - POST /api/getUserList       -> enrolled users on a device
 *  - POST /api/sendUserToDevice  -> push a user profile to a device
 *
 * Configuration is read from env:
 *  - BIOMETRIC_API_BASE_URL  e.g. http://192.168.8.12:7788
 *  - BIOMETRIC_DEVICE_SN     e.g. AYTI14109277  (default device serial number)
 */

const BIOMETRIC_API_BASE_URL = process.env.BIOMETRIC_API_BASE_URL || '';
const DEFAULT_DEVICE_SN = process.env.BIOMETRIC_DEVICE_SN || '';

export interface BiometricRecord {
  id: number;
  device_serial_num: string;
  enroll_id: number;
  event: number;
  intOut: number;
  mode: number;
  records_time: string;
  temperature: number;
  image: string | null;
}

export interface GetRecordsResponse {
  total: number;
  pn: number;
  pageSize: number;
  records: BiometricRecord[];
}

export interface BiometricUser {
  enrollid: number;
  admin: string;
  backupnum: number;
}

export interface GetUserListResponse {
  ret: string;
  sn: string;
  result: boolean;
  count: number;
  from: number;
  to: number;
  record: BiometricUser[];
}

export interface SendUserToDevicePayload {
  sn: string;
  enrollid: number;
  name: string;
  /** base64-encoded JPEG face photo (optional) */
  face?: string;
  admin?: number;
  access_times?: number;
  birthday?: string;
  card?: number;
  department?: string;
  endtime?: string;
  groupid?: number;
  password?: string;
  pwd?: number;
  shiftid?: number;
  starttime?: string;
  userprofile?: string;
  verifymode?: number;
  zoneid?: number;
}

export interface SendUserToDeviceResponse {
  ret: string;
  enrollid: number;
  sn: string;
  result: boolean;
}

function ensureConfigured() {
  if (!BIOMETRIC_API_BASE_URL) {
    throw new Error(
      'Biometric API is not configured. Set BIOMETRIC_API_BASE_URL in your environment.'
    );
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  ensureConfigured();
  const url = `${BIOMETRIC_API_BASE_URL}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    // The device API may occasionally be slow while waiting for the device.
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Biometric API ${path} failed (${res.status}): ${text || res.statusText}`
    );
  }

  return res.json() as Promise<T>;
}

/** Resolve the serial number to use, falling back to the env default. */
export function resolveDeviceSn(sn?: string | null): string {
  const resolved = (sn || DEFAULT_DEVICE_SN || '').trim();
  if (!resolved) {
    throw new Error(
      'No device serial number provided and BIOMETRIC_DEVICE_SN is not set.'
    );
  }
  return resolved;
}

/**
 * Fetch attendance / scan records from the biometric API.
 * Results are ordered newest-first by the remote API.
 */
export async function getRecords(
  sn?: string | null,
  options: { enrollId?: number | null; pn?: number; pageSize?: number } = {}
): Promise<GetRecordsResponse> {
  const deviceSn = resolveDeviceSn(sn);
  return postJson<GetRecordsResponse>('/api/getRecords', {
    deviceSn,
    enrollId: options.enrollId ?? null,
    pn: options.pn ?? 1,
    pageSize: options.pageSize ?? 100,
  });
}

/**
 * Fetch the list of users enrolled on a device.
 */
export async function getUserList(sn?: string | null): Promise<GetUserListResponse> {
  const deviceSn = resolveDeviceSn(sn);
  return postJson<GetUserListResponse>('/api/getUserList', {
    deviceSn,
  });
}

/**
 * Push (enroll) a user profile to a device.
 */
export async function sendUserToDevice(
  payload: Omit<SendUserToDevicePayload, 'sn'> & { sn?: string | null }
): Promise<SendUserToDeviceResponse> {
  const { sn, ...rest } = payload;
  const deviceSn = resolveDeviceSn(sn);
  return postJson<SendUserToDeviceResponse>('/api/sendUserToDevice', {
    ...rest,
    sn: deviceSn,
  });
}

/**
 * Convenience: return just the enrolled enroll-ids for a device.
 */
export async function getEnrolledEnrollIds(sn?: string | null): Promise<number[]> {
  const list = await getUserList(sn);
  if (!list?.record) return [];
  return list.record.map((r) => r.enrollid);
}