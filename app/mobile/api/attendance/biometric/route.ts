import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, differenceInMinutes } from 'date-fns';
import {
  mobileSuccess,
  mobileError,
} from '@/lib/mobile-auth';
import { computeWorkedHours } from '@/lib/attendance-utils';

const BREAK_THRESHOLD_MINUTES = 60;

function parseLogTime(timeStr: string): Date {
  return new Date(timeStr.replace(' ', 'T'));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const logs = Array.isArray(body) ? body : [body];

    if (logs.length === 0) {
      return mobileError('No records provided', 400);
    }

    const results: Array<{
      enroll_id: number;
      workerId?: string;
      workerName?: string;
      action: string;
      time: string;
      attendanceId?: string;
      status: string;
    }> = [];

    const errors: Array<{ enroll_id: number; error: string }> = [];

    for (const log of logs) {
      const { enroll_id, records_time, intOut, device_serial_num, temperature } = log;

      if (!enroll_id || !records_time) {
        errors.push({ enroll_id: enroll_id || 0, error: 'Missing enroll_id or records_time' });
        continue;
      }

      const logTime = parseLogTime(records_time);
      const logDate = startOfDay(logTime);

      const worker = await prisma.worker.findUnique({
        where: { enrollId: String(enroll_id) },
        include: { shift: true },
      });

      if (!worker) {
        errors.push({ enroll_id, error: `Worker with enroll_id ${enroll_id} not found` });
        continue;
      }

      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          workerId_date: {
            workerId: worker.id,
            date: logDate,
          },
        },
      });

      let action: string;
      let attendanceId: string;

      if (intOut === 1) {
        action = 'check-out';
      } else {
        if (!existingAttendance) {
          action = 'check-in';
        } else if (existingAttendance.checkIn && !existingAttendance.checkOut) {
          action = 'check-out';
        } else {
          action = 'check-in';
        }
      }

      if (action === 'check-in') {
        if (!existingAttendance) {
          const attendance = await prisma.attendance.create({
            data: {
              contractorId: worker.contractorId,
              workerId: worker.id,
              shiftId: worker.shiftId,
              date: logDate,
              checkIn: logTime,
              status: 'Present',
              notes: device_serial_num ? `Biometric In (${device_serial_num})` : 'Biometric In',
              logs: {
                create: {
                  type: 'IN',
                  timestamp: logTime,
                  deviceName: device_serial_num || null,
                },
              },
            },
          });
          attendanceId = attendance.id;
        } else if (existingAttendance.checkIn && existingAttendance.checkOut) {
          const gapMinutes = existingAttendance.checkOut
            ? differenceInMinutes(logTime, new Date(existingAttendance.checkOut))
            : 0;

          if (gapMinutes <= BREAK_THRESHOLD_MINUTES) {
            await prisma.attendanceLog.create({
              data: {
                attendanceId: existingAttendance.id,
                type: 'BREAK_END',
                timestamp: logTime,
                deviceName: device_serial_num || null,
              },
            });

            const checkInTime = new Date(existingAttendance.checkIn!);
            const totalMinutes = differenceInMinutes(logTime, checkInTime);

            await prisma.attendance.update({
              where: { id: existingAttendance.id },
              data: {
                checkOut: null,
                overtimeHours: 0,
                totalHours: 0,
                notes: `${existingAttendance.notes || ''} | Break ended, re-entered (${device_serial_num || 'biometric'})`.trim(),
              },
            });

            attendanceId = existingAttendance.id;
            action = 'break-end';
          } else {
            await prisma.attendanceLog.create({
              data: {
                attendanceId: existingAttendance.id,
                type: 'IN',
                timestamp: logTime,
                deviceName: device_serial_num || null,
              },
            });

            if (logTime < new Date(existingAttendance.checkIn!)) {
              await prisma.attendance.update({
                where: { id: existingAttendance.id },
                data: {
                  checkIn: logTime,
                  notes: `${existingAttendance.notes || ''} | Earlier check-in updated (${device_serial_num || 'biometric'})`.trim(),
                },
              });
            }

            attendanceId = existingAttendance.id;
            action = 'check-in (existing)';
          }
        } else {
          await prisma.attendanceLog.create({
            data: {
              attendanceId: existingAttendance.id,
              type: 'IN',
              timestamp: logTime,
              deviceName: device_serial_num || null,
            },
          });

          if (!existingAttendance.checkIn || logTime < new Date(existingAttendance.checkIn!)) {
            await prisma.attendance.update({
              where: { id: existingAttendance.id },
              data: { checkIn: logTime },
            });
          }

          attendanceId = existingAttendance.id;
        }
      } else {
        if (!existingAttendance) {
          const attendance = await prisma.attendance.create({
            data: {
              contractorId: worker.contractorId,
              workerId: worker.id,
              shiftId: worker.shiftId,
              date: logDate,
              checkOut: logTime,
              status: 'Present',
              notes: `Biometric Out (no prior check-in) (${device_serial_num || 'biometric'})`,
              logs: {
                create: {
                  type: 'OUT',
                  timestamp: logTime,
                  deviceName: device_serial_num || null,
                },
              },
            },
          });
          attendanceId = attendance.id;
        } else if (existingAttendance.checkOut) {
          const currentCheckOut = new Date(existingAttendance.checkOut);

          if (logTime > currentCheckOut) {
            await prisma.attendanceLog.create({
              data: {
                attendanceId: existingAttendance.id,
                type: 'OUT',
                timestamp: logTime,
                deviceName: device_serial_num || null,
              },
            });

            const checkInTime = existingAttendance.checkIn
              ? new Date(existingAttendance.checkIn)
              : logTime;

            const worked = computeWorkedHours(checkInTime, logTime, worker.shift);

            await prisma.attendance.update({
              where: { id: existingAttendance.id },
              data: {
                checkOut: logTime,
                totalHours: worked.totalHours,
                overtimeHours: worked.overtimeHours,
                lateHours: worked.lateHours,
                lateDays: worked.lateDays,
                notes: `${existingAttendance.notes || ''} | Biometric Out (${device_serial_num || 'biometric'})`.trim(),
              },
            });
          } else {
            await prisma.attendanceLog.create({
              data: {
                attendanceId: existingAttendance.id,
                type: 'OUT',
                timestamp: logTime,
                deviceName: device_serial_num || null,
              },
            });
          }

          attendanceId = existingAttendance.id;
          action = 'check-out (updated)';
        } else {
          await prisma.attendanceLog.create({
            data: {
              attendanceId: existingAttendance.id,
              type: 'OUT',
              timestamp: logTime,
              deviceName: device_serial_num || null,
            },
          });

          const checkInTime = existingAttendance.checkIn
            ? new Date(existingAttendance.checkIn)
            : logTime;

          if (logTime > checkInTime) {
            const worked = computeWorkedHours(checkInTime, logTime, worker.shift);

            await prisma.attendance.update({
              where: { id: existingAttendance.id },
              data: {
                checkIn: existingAttendance.checkIn || logTime,
                checkOut: logTime,
                totalHours: worked.totalHours,
                overtimeHours: worked.overtimeHours,
                lateHours: worked.lateHours,
                lateDays: worked.lateDays,
                notes: `${existingAttendance.notes || ''} | Biometric Out (${device_serial_num || 'biometric'})`.trim(),
              },
            });
          } else {
            await prisma.attendance.update({
              where: { id: existingAttendance.id },
              data: {
                checkOut: logTime,
                notes: `${existingAttendance.notes || ''} | Biometric Out (${device_serial_num || 'biometric'})`.trim(),
              },
            });
          }

          attendanceId = existingAttendance.id;
        }
      }

      const freshAttendance = await prisma.attendance.findUnique({ where: { id: attendanceId } });
      results.push({
        enroll_id,
        workerId: worker.id,
        workerName: worker.name,
        action,
        time: records_time,
        attendanceId,
        status: freshAttendance?.status || 'Present',
      });
    }

    return mobileSuccess({
      processed: results.length,
      results,
      ...(errors.length > 0 ? { errors } : {}),
    }, 'Biometric data processed');
  } catch (error) {
    console.error('Biometric webhook error:', error);
    return mobileError('Failed to process biometric data', 500);
  }
}
