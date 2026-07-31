'use client';

import { useState, useEffect } from 'react';
import {
  Fingerprint,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Save,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface Device {
  id: string;
  name: string;
  sn: string;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  online?: boolean;
  userCount?: number;
}

export default function DevicesTab() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sn: '',
    isActive: true,
  });

  const fetchDevices = async (withStatus = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/web/api/biometric/devices${withStatus ? '?status=1' : ''}`);
      if (!res.ok) throw new Error('Failed to fetch devices');
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch('/web/api/biometric/devices?status=1');
      if (!res.ok) throw new Error('Failed to check status');
      const data = await res.json();
      setDevices(data.devices || []);
      const onlineCount = (data.devices || []).filter((d: Device) => d.online).length;
      toast({
        title: 'Status refreshed',
        description: `${onlineCount} of ${(data.devices || []).length} device(s) online.`,
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const resetForm = () => {
setFormData({ name: '', sn: '', isActive: true });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (d: Device) => {
    setEditingId(d.id);
    setFormData({ name: d.name, sn: d.sn, isActive: d.isActive });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sn.trim()) {
      toast({ title: 'Validation', description: 'Name and Serial Number are required.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const url = editingId ? `/web/api/biometric/devices/${editingId}` : '/web/api/biometric/devices';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save device');
      toast({
        title: editingId ? 'Device updated' : 'Device added',
        description: `"${formData.name}" (${formData.sn}) saved.`,
      });
      resetForm();
      await fetchDevices();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this biometric device? This will not affect already-enrolled workers.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/web/api/biometric/devices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete device');
      toast({ title: 'Deleted', description: 'Device removed.' });
      await fetchDevices();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">Loading biometric devices…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Biometric Devices</h2>
          <p className="text-sm text-muted-foreground">
            Add the serial numbers of your attendance devices. Workers are enrolled to the device you pick on the worker form.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={checkStatus} disabled={isCheckingStatus}>
            {isCheckingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Check Status
          </Button>
          {!showForm ? (
            <Button size="sm" className="gap-2" onClick={() => { setEditingId(null); setFormData({ name: '', sn: '', isActive: true }); setShowForm(true); }}>
              <Plus className="w-4 h-4" /> Add Device
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="gap-2" onClick={resetForm}>
              <X className="w-4 h-4" /> Cancel
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="border-none shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-primary" />
              {editingId ? 'Edit Device' : 'Add Biometric Device'}
            </CardTitle>
            <CardDescription className="text-xs">
              Enter the device serial number exactly as it appears on the device (e.g. AYTI14109277).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">Device Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Main Gate Scanner"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">Serial Number (SN) *</label>
                <Input
                  value={formData.sn}
                  onChange={(e) => setFormData({ ...formData, sn: e.target.value })}
                  placeholder="e.g. AYTI14109277"
                  disabled={isSaving}
                  className="font-mono"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    disabled={isSaving}
                    className="h-4 w-4 rounded"
                  />
                  Active (available for enrollment & attendance)
                </label>
              </div>
              <div className="md:col-span-2 flex gap-2 pt-2">
                <Button type="submit" disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? 'Update Device' : 'Save Device'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Fingerprint className="h-12 w-12 opacity-10" />
          <p className="text-sm italic">No biometric devices configured yet. Click “Add Device” to get started.</p>
        </div>
      ) : (
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase">Device</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Serial Number</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-center">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-center">Connection</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-sm">{d.name}</TableCell>
                    <TableCell className="font-mono text-xs">{d.sn}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-[10px] font-bold ${d.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-300/30 text-gray-500'}`}>
                        {d.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {d.online === undefined ? (
                        <span className="text-[10px] text-muted-foreground italic">Unknown</span>
                      ) : d.online ? (
                        <Badge className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 gap-1">
                          <Wifi className="w-3 h-3" /> Online {d.userCount != null && `(${d.userCount})`}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold text-destructive gap-1">
                          <WifiOff className="w-3 h-3" /> Offline
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => startEdit(d)}>
                          <Pencil className="w-3 h-3" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-destructive"
                          onClick={() => handleDelete(d.id)}
                          disabled={deletingId === d.id}
                        >
                          {deletingId === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Only devices shown as <strong>Online</strong> can be selected when enrolling a worker.
        </p>
      </div>
    </div>
  );
}