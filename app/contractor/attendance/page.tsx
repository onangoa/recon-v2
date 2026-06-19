'use client';

import { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Eye,
  Info,
  MapPin,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useSite } from '@/hooks/use-site';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AttendanceLog {
  id: string;
  type: string;
  timestamp: string;
  deviceName: string | null;
}

interface Attendance {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  overtimeHours: number;
  status: string;
  notes: string | null;
  worker: {
    name: string;
    designation: { title: string } | null;
  };
  shift: {
    name: string;
    startTime: string;
    endTime: string;
  } | null;
  logs: AttendanceLog[];
}

export default function AttendancePage() {
  const { activeSite } = useSite();
  const { toast } = useToast();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (activeSite?.contractorId) {
      fetchAttendance();
    }
  }, [activeSite]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/web/api/attendance?contractorId=${activeSite?.contractorId}`);
      if (!res.ok) throw new Error('Failed to fetch attendance');
      const data = await res.json();
      setAttendances(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance logs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setIsDetailsOpen(true);
  };

  const filteredLogs = attendances.filter(log => 
    log.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Attendance Logs</h1>
          <p className="text-muted-foreground">Monitor worker check-ins, check-outs, and calculated hours.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchAttendance}>
            <Download className="size-4" /> Export Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by worker name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 shadow-sm"
              />
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground italic">
              Today: {format(new Date(), 'PPP')}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Clock className="h-8 w-8 animate-spin text-primary opacity-20" />
              <p className="text-sm text-muted-foreground italic">Syncing logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Fingerprint className="mx-auto h-12 w-12 opacity-10 mb-4" />
              <p>No attendance records found for today.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Worker</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Shift</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Clock In</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Clock Out</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Hours</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Overtime</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{log.worker.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                          {log.worker.designation?.title || 'No Designation'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.shift ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-primary">{log.shift.name}</span>
                          <span className="text-[10px] text-muted-foreground">{log.shift.startTime} - {log.shift.endTime}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-muted-foreground">No Shift</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium">
                          {log.checkIn ? format(new Date(log.checkIn), 'p') : '--:--'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-red-500" />
                        <span className="text-xs font-medium">
                          {log.checkOut ? format(new Date(log.checkOut), 'p') : 'Ongoing'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-bold">{log.totalHours.toFixed(2)}h</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {log.overtimeHours > 0 ? (
                        <Badge className="bg-orange-500/10 text-orange-600 border-none font-bold">
                          +{log.overtimeHours.toFixed(2)}h
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDetails(log)}>
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="size-5 text-primary" />
              Scan History
            </DialogTitle>
            <DialogDescription>
              Detailed biometric logs for <strong>{selectedAttendance?.worker.name}</strong> on {selectedAttendance?.date ? format(new Date(selectedAttendance.date), 'PPP') : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Work Time</p>
                <h4 className="text-xl font-bold">{selectedAttendance?.totalHours.toFixed(2)}h</h4>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Overtime Recorded</p>
                <h4 className="text-xl font-bold text-orange-600">+{selectedAttendance?.overtimeHours.toFixed(2)}h</h4>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Info className="size-3" /> Raw Device Scans
              </h5>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold h-8">TIME</TableHead>
                      <TableHead className="text-[10px] font-bold h-8">EVENT</TableHead>
                      <TableHead className="text-[10px] font-bold h-8">DEVICE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedAttendance?.logs && selectedAttendance.logs.length > 0 ? (
                      selectedAttendance.logs.map((log) => (
                        <TableRow key={log.id} className="h-10">
                          <TableCell className="text-xs font-medium">
                            {format(new Date(log.timestamp), 'p')}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[9px] h-5 px-1.5 ${log.type === 'IN' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                              {log.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground font-mono">
                            {log.deviceName || 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground italic">
                          No raw logs available for this session.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDetailsOpen(false)} className="w-full">
              Close History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
