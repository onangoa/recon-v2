-- AlterTable: Attendance.notes stores the full joined biometric punch-event log (IN/OUT/break/new-session per day). Days with many punches exceed VARCHAR(191), which made the payroll attendance sync upsert fail with P2000 and silently drop those days. Widen to TEXT.
ALTER TABLE `Attendance` MODIFY `notes` TEXT NULL;
