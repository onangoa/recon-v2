import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityLogger } from '@/lib/activity-logger';
import { startOfDay, differenceInMinutes, parse } from 'date-fns';

/**
 * Webhook format:
 * [{
 *   'device_serial_num': 'AYTI14109277', 
 *   'enroll_id': 1, 
 *   'event': 0, 
 *   'intOut': 0, 
 *   'mode': 8, 
 *   'records_time': '2026-06-11 05:50:40', 
 *   'temperature': 0
 * }]
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const logs = Array.isArray(body) ? body : [body];

    const results = [];

    for (const log of logs) {
      const { enroll_id, records_time, intOut, device_serial_num } = log;

      if (!enroll_id || !records_time) continue;

      // Find worker by enrollId
      const worker = await prisma.worker.findUnique({
        where: { enrollId: String(enroll_id) },
        include: { shift: true }
      });

      if (!worker) {
        console.warn(`Worker with enrollId ${enroll_id} not found`);
        continue;
      }

      const logTime = new Date(records_time.replace(' ', 'T')); // Handle format '2026-06-11 05:50:40'
      const logDate = startOfDay(logTime);

      // Find or create attendance record for today
      let attendance = await prisma.attendance.findUnique({
        where: {
          workerId_date: {
            workerId: worker.id,
            date: logDate
          }
        }
      });

      // Simple Logic: 
      // - If no record exists today, this is a CLOCK_IN
      // - If record exists and no checkOut, this is a CLOCK_OUT
      // - (Optional) Use intOut if device provides reliable direction: 0=In, 1=Out
      
      const isCheckIn = intOut === 0 || !attendance;

      if (isCheckIn) {
        if (!attendance) {
          attendance = await prisma.attendance.create({
            data: {
              contractorId: worker.contractorId,
              workerId: worker.id,
              shiftId: worker.shiftId,
              date: logDate,
              checkIn: logTime,
              status: 'Present',
              notes: `Biometric In (${device_serial_num})`,
              logs: {
                create: {
                  type: 'IN',
                  timestamp: logTime,
                  deviceName: device_serial_num
                }
              }
            }
          });
        } else {
          // Record the log event even if we don't update checkIn
          await prisma.attendanceLog.create({
            data: {
              attendanceId: attendance.id,
              type: 'IN',
              timestamp: logTime,
              deviceName: device_serial_num
            }
          });

          if (!attendance.checkIn || logTime < new Date(attendance.checkIn)) {
            attendance = await prisma.attendance.update({
              where: { id: attendance.id },
              data: { checkIn: logTime }
            });
          }
        }
      } else {
        // Handle Check Out
        if (attendance) {
          // Record the log event
          await prisma.attendanceLog.create({
            data: {
              attendanceId: attendance.id,
              type: 'OUT',
              timestamp: logTime,
              deviceName: device_serial_num
            }
          });

          // Calculate hours
          const checkIn = new Date(attendance.checkIn!);
          const checkOut = logTime;
          
          if (checkOut > checkIn) {
            const totalMinutes = differenceInMinutes(checkOut, checkIn);
            const totalHours = totalMinutes / 60;

            let overtimeHours = 0;
            if (worker.shift) {
              const shiftStart = worker.shift.startTime.split(':').map(Number);
              const shiftEnd = worker.shift.endTime.split(':').map(Number);
              
              let shiftDurationMinutes = (shiftEnd[0] * 60 + shiftEnd[1]) - (shiftStart[0] * 60 + shiftStart[1]);
              if (shiftDurationMinutes < 0) shiftDurationMinutes += 24 * 60;
              shiftDurationMinutes -= worker.shift.breakDuration;
              
              const shiftDurationHours = shiftDurationMinutes / 60;
              if (worker.shift.allowOvertime && totalHours > shiftDurationHours) {
                overtimeHours = totalHours - shiftDurationHours;
              }
            }

            // Only update checkOut if it's later than current checkOut
            if (!attendance.checkOut || logTime > new Date(attendance.checkOut)) {
              attendance = await prisma.attendance.update({
                where: { id: attendance.id },
                data: {
                  checkOut: logTime,
                  totalHours,
                  overtimeHours,
                  notes: `${attendance.notes || ''} | Biometric Out (${device_serial_num})`.trim()
                }
              });
            }
          }
        }
      }

      results.push({ enroll_id, status: 'processed', attendanceId: attendance?.id });
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('Biometric webhook error:', error);
    return NextResponse.json({ error: 'Failed to process biometric data' }, { status: 500 });
  }
}
