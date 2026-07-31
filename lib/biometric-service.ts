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

/** Resolve the serial number to use. A device SN must be provided explicitly
 *  (devices are now configured per contractor in the database, see the
 *  BiometricDevice model). Throws if none is supplied. */
export function resolveDeviceSn(sn?: string | null): string {
  const resolved = (sn || '').trim();
  if (!resolved) {
    throw new Error(
      'No device serial number provided. Add a biometric device under Settings → Devices.'
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

export interface DeviceInfo {
  sn: string;
  result: boolean;
  ret: string;
  [key: string]: unknown;
}

/** Fetch device info via /api/getDevInfo (used as the online health check). */
export async function getDevInfo(sn?: string | null): Promise<DeviceInfo> {
  const deviceSn = resolveDeviceSn(sn);
  return postJson<DeviceInfo>('/api/getDevInfo', { deviceSn });
}

export interface DeviceStatus {
  sn: string;
  online: boolean;
  /** Enrolled user count, when available from a parallel getUserList probe. */
  userCount?: number;
  error?: string;
}

/**
 * Determine whether a device is online by calling /api/getDevInfo.
 * A device is online only if the API responds with `result: true`; a timeout
 * or any error/missing result means the device is offline. Never throws —
 * returns an offline status on failure.
 */
export async function checkDeviceStatus(sn: string): Promise<DeviceStatus> {
  try {
    const info = await getDevInfoWithTimeout(sn, 5000);
    const online = !!info?.result;
    let userCount: number | undefined;
    if (online) {
      // Best-effort: also fetch the user count for the UI badge. Non-fatal.
      try {
        const list = await getUserList(sn);
        userCount = list?.count;
      } catch {
        /* online but getUserList failed — keep online, no count */
      }
    }
    return { sn, online, userCount };
  } catch (err: any) {
    return { sn, online: false, error: err?.message || 'unreachable' };
  }
}

/** getDevInfo with an explicit timeout so offline devices fail fast. */
async function getDevInfoWithTimeout(sn: string, ms: number): Promise<DeviceInfo> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const deviceSn = resolveDeviceSn(sn);
    const res = await fetch(`${BIOMETRIC_API_BASE_URL}/api/getDevInfo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceSn }),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`getDevInfo failed (${res.status}): ${text || res.statusText}`);
    }
    return (await res.json()) as DeviceInfo;
  } finally {
    clearTimeout(timer);
  }
}