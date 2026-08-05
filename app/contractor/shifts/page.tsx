'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  Calendar, 
  Users, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSite } from '@/hooks/use-site';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/toast-utils';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  workingDays: string;
  allowOvertime: boolean;
  _count?: {
    workers: number;
  };
}

export default function ShiftsPage() {
  const { activeSite } = useSite();
  const { toast } = useToast();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    startTime: '08:00',
    endTime: '17:00',
    breakDuration: 60,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    allowOvertime: true
  });

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  useEffect(() => {
    if (activeSite?.contractorId) {
      fetchShifts();
    }
  }, [activeSite]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/web/api/shifts?contractorId=${activeSite?.contractorId}`);
      if (!res.ok) throw new Error('Failed to fetch shifts');
      const data = await res.json();
      setShifts(data);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Unable to load shifts. Please refresh the page and try again.'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startTime: '08:00',
      endTime: '17:00',
      breakDuration: 60,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      allowOvertime: true
    });
    setEditingShift(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: shift.breakDuration,
      workingDays: shift.workingDays.split(','),
      allowOvertime: shift.allowOvertime
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingShift ? `/web/api/shifts/${editingShift.id}` : '/web/api/shifts';
      const method = editingShift ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contractorId: activeSite?.contractorId,
          workingDays: formData.workingDays.join(',')
        })
      });

      if (!res.ok) throw new Error(`Failed to ${editingShift ? 'update' : 'create'} shift`);
      
      toast({
        title: 'Success',
        description: `Shift ${editingShift ? 'updated' : 'created'} successfully`
      });
      setIsDialogOpen(false);
      fetchShifts();
      resetForm();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: getErrorMessage(error, editingShift ? "Unable to update the shift. Please verify the details and try again." : "Unable to create the shift. Please verify the details and try again."),
        variant: 'destructive'
      });
    }
  };

  const handleDeleteShift = async (id: string) => {
    setShiftToDelete(shifts.find(s => s.id === id) || null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteShift = async () => {
    if (!shiftToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/web/api/shifts/${shiftToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete shift');
      toast({
        title: 'Success',
        description: 'Shift deleted'
      });
      setIsDeleteDialogOpen(false);
      setShiftToDelete(null);
      fetchShifts();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Unable to delete the shift. Please try again.'),
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const filteredShifts = shifts.filter(shift => 
    shift.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Shift Management</h1>
          <p className="text-muted-foreground">Define and manage working hours for your workers.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <Button className="gap-2" onClick={handleOpenCreate}>
            <Plus className="size-4" /> Create Shift
          </Button>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingShift ? 'Edit Shift' : 'Create New Shift'}</DialogTitle>
                <DialogDescription>
                  {editingShift ? 'Update the details for this shift.' : 'Set up working hours and days for this shift.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">Shift Name</label>
                  <Input 
                    id="name" 
                    placeholder="e.g., Morning Shift, Night Shift" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="startTime" className="text-sm font-medium">Start Time</label>
                    <Input 
                      id="startTime" 
                      type="time" 
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="endTime" className="text-sm font-medium">End Time</label>
                    <Input 
                      id="endTime" 
                      type="time" 
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="break" className="text-sm font-medium">Break Duration (minutes)</label>
                  <Input 
                    id="break" 
                    type="number" 
                    value={formData.breakDuration}
                    onChange={e => setFormData({...formData, breakDuration: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <Badge 
                        key={day}
                        variant={formData.workingDays.includes(day) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => toggleDay(day)}
                      >
                        {day.substring(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="overtime" 
                    checked={formData.allowOvertime}
                    onChange={e => setFormData({...formData, allowOvertime: e.target.checked})}
                    className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="overtime" className="text-sm font-medium cursor-pointer">Allow Overtime Calculation</label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editingShift ? 'Update Shift' : 'Create Shift'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Shifts</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shifts..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">Loading shifts...</div>
          ) : filteredShifts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-medium">No shifts found</h3>
              <p className="text-muted-foreground">Create your first shift to start tracking attendance.</p>
              <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                <Plus className="size-4 mr-2" /> Create Shift
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredShifts.map((shift) => (
                <Card key={shift.id} className="overflow-hidden border-muted">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Clock className="size-4 text-primary" />
                        </div>
                        <h3 className="font-bold">{shift.name}</h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleOpenEdit(shift)}>
                            <Edit2 className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => handleDeleteShift(shift.id)}
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Clock className="size-3.5" /> Timing
                        </span>
                        <span className="font-medium">{shift.startTime} - {shift.endTime}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="size-3.5" /> Break
                        </span>
                        <span className="font-medium">{shift.breakDuration} mins</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Users className="size-3.5" /> Assigned Workers
                        </span>
                        <Badge variant="secondary">{shift._count?.workers || 0}</Badge>
                      </div>
                      
                      <div className="pt-3 border-t">
                        <div className="flex flex-wrap gap-1">
                          {shift.workingDays.split(',').map(day => (
                            <Badge key={day} variant="outline" className="text-[10px] py-0 h-5">
                              {day.substring(0, 3)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
             </div>
           )}
         </CardContent>
       </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Shift
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure you want to delete <strong>{shiftToDelete?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteShift();
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
