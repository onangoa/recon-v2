'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Loader2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Pencil,
  Trash2,
  FileText,
  Eye,
  Upload,
  X,
  Paperclip
} from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/toast-utils';

interface Site {
  id: string;
  name: string;
}

interface Incident {
  id: string;
  siteId: string;
  site: Site;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  incidentDate: string;
  reportedBy: string;
  attachments: string | null;
  createdAt: string;
}

export default function SafetyIncidentsPage() {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    siteId: '',
    title: '',
    description: '',
    type: 'Near Miss',
    severity: 'Low',
    status: 'Reported',
    incidentDate: new Date().toISOString().split('T')[0],
    reportedBy: '',
    attachments: '',
  });

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/web/api/safety-incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      const data = await response.json();
      setIncidents(data);
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to load safety incidents. Please refresh the page and try again."), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch('/web/api/sites?limit=100');
      if (!response.ok) throw new Error('Failed to fetch sites');
      const data = await response.json();
      setSites(data.sites || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchSites();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let attachments = formData.attachments;
      if (attachmentFile) {
        setIsUploading(true);
        const fd = new FormData();
        fd.append('file', attachmentFile);
        const uploadRes = await fetch('/web/api/upload', { method: 'POST', body: fd });
        if (!uploadRes.ok) throw new Error('Failed to upload attachment');
        const uploadData = await uploadRes.json();
        attachments = uploadData.url || uploadData.fileData || '';
        setIsUploading(false);
      }

      const url = editingIncident ? `/web/api/safety-incidents/${editingIncident.id}` : '/web/api/safety-incidents';
      const method = editingIncident ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, attachments }),
      });

      if (!response.ok) throw new Error('Failed to save incident');

      toast({ 
        title: "Success", 
        description: `Incident ${editingIncident ? 'updated' : 'reported'} successfully` 
      });
      setIsDialogOpen(false);
      resetForm();
      fetchIncidents();
    } catch (err: any) {
      setIsUploading(false);
      toast({ title: "Error", description: getErrorMessage(err, editingIncident ? "Unable to update the safety report. Please verify the details and try again." : "Unable to report the safety incident. Please verify the details and try again."), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (incident: Incident) => {
    setEditingIncident(incident);
    setAttachmentFile(null);
    setFormData({
      siteId: incident.siteId,
      title: incident.title,
      description: incident.description,
      type: incident.type,
      severity: incident.severity,
      status: incident.status,
      incidentDate: new Date(incident.incidentDate).toISOString().split('T')[0],
      reportedBy: incident.reportedBy,
      attachments: incident.attachments || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident report?')) return;
    try {
      const response = await fetch(`/web/api/safety-incidents/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete incident');
      toast({ title: "Deleted", description: "Incident report removed" });
      fetchIncidents();
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to delete the safety report. Please try again."), variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingIncident(null);
    setAttachmentFile(null);
    setFormData({
      siteId: '',
      title: '',
      description: '',
      type: 'Near Miss',
      severity: 'Low',
      status: 'Reported',
      incidentDate: new Date().toISOString().split('T')[0],
      reportedBy: '',
      attachments: '',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'reported': return <Clock className="w-3 h-3" />;
      case 'under investigation': return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'resolved': return <CheckCircle2 className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/contractor">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Safety & Incidents</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Safety Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track, report and manage on-site safety incidents and near misses.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Report Incident
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-red-50/50 border-none shadow-sm border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Critical Incidents</p>
            <h3 className="text-2xl font-bold">{incidents.filter(i => i.severity === 'Critical').length}</h3>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-none shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Under Investigation</p>
            <h3 className="text-2xl font-bold">{incidents.filter(i => i.status === 'Under Investigation').length}</h3>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-none shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Resolved</p>
            <h3 className="text-2xl font-bold">{incidents.filter(i => i.status === 'Resolved').length}</h3>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-none shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Total Reported</p>
            <h3 className="text-2xl font-bold">{incidents.length}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Incident Logs
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search incidents..." className="h-9 pl-10 text-xs shadow-sm border-none bg-background" />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9"><Filter className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground italic">Loading safety data...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No incidents reported yet.</p>
              <Button variant="link" onClick={() => setIsDialogOpen(true)} className="text-primary">Report an incident</Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Incident Details</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Site</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Severity</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <div className="flex flex-col max-w-xs">
                        <span className="font-bold text-sm truncate">{incident.title}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1 italic">{incident.description}</span>
                        <Badge variant="outline" className="w-fit mt-1 text-[9px] font-bold h-4 px-1">{incident.type}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium">{incident.site.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] font-bold border ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold gap-1 px-2">
                        {getStatusIcon(incident.status)}
                        {incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[10px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(incident.incidentDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1 mt-0.5"><User className="w-3 h-3" /> {incident.reportedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/contractor/safety/${incident.id}`}><Eye className="w-4 h-4 mr-2" /> View Incident</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(incident)}><Pencil className="w-4 h-4 mr-2" /> Edit Report</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(incident.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete Report</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingIncident ? 'Edit Incident Report' : 'Report New Safety Incident'}</DialogTitle>
            <DialogDescription>Provide detailed information about the safety event or near miss.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="siteId">Affected Site *</Label>
                <Select 
                  value={formData.siteId} 
                  onValueChange={(val) => setFormData({...formData, siteId: val})}
                  required
                >
                  <SelectTrigger id="siteId" className="bg-muted/30 border-none">
                    <SelectValue placeholder="Select a site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Incident Title *</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Equipment Malfunction near Site B" 
                  className="bg-muted/30 border-none"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Incident Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val) => setFormData({...formData, type: val})}
                >
                  <SelectTrigger id="type" className="bg-muted/30 border-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Near Miss">Near Miss</SelectItem>
                    <SelectItem value="Injury">Injury</SelectItem>
                    <SelectItem value="Property Damage">Property Damage</SelectItem>
                    <SelectItem value="Environmental">Environmental</SelectItem>
                    <SelectItem value="Fire">Fire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity Level *</Label>
                <Select 
                  value={formData.severity} 
                  onValueChange={(val) => setFormData({...formData, severity: val})}
                >
                  <SelectTrigger id="severity" className="bg-muted/30 border-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low (No harm/damage)</SelectItem>
                    <SelectItem value="Medium">Medium (Minor harm/damage)</SelectItem>
                    <SelectItem value="High">High (Serious harm/damage)</SelectItem>
                    <SelectItem value="Critical">Critical (Severe harm/loss of life)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentDate">Incident Date *</Label>
                <Input 
                  id="incidentDate" 
                  type="date" 
                  value={formData.incidentDate} 
                  onChange={e => setFormData({...formData, incidentDate: e.target.value})}
                  className="bg-muted/30 border-none"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reportedBy">Reported By *</Label>
                <Input 
                  id="reportedBy" 
                  value={formData.reportedBy} 
                  onChange={e => setFormData({...formData, reportedBy: e.target.value})}
                  placeholder="Full Name" 
                  className="bg-muted/30 border-none"
                  required 
                />
              </div>
              {editingIncident && (
                <div className="space-y-2">
                  <Label htmlFor="status">Investigation Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData({...formData, status: val})}
                  >
                    <SelectTrigger id="status" className="bg-muted/30 border-none text-primary font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reported">Reported</SelectItem>
                      <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Full Description *</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Describe exactly what happened, including any immediate actions taken..." 
                rows={4}
                className="bg-muted/30 border-none"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Image or Document</Label>
              {attachmentFile || formData.attachments ? (
                <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-3 py-2">
                  <Paperclip className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm truncate flex-1">
                    {attachmentFile ? attachmentFile.name : (formData.attachments?.split('/').pop() || 'Attached file')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => { setAttachmentFile(null); setFormData({ ...formData, attachments: '' }); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="incident-attachment"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-6 text-sm text-muted-foreground transition hover:bg-muted/40"
                >
                  <Upload className="w-4 h-4" />
                  Click to upload an image or document
                  <input
                    id="incident-attachment"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0] || null;
                      setAttachmentFile(f);
                    }}
                  />
                </label>
              )}
            </div>
            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-muted hover:bg-muted/50">Cancel</Button>
              <Button type="submit" disabled={isSaving || isUploading} className="min-w-[120px]">
                {isSaving || isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                {isUploading ? 'Uploading...' : editingIncident ? 'Update Report' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
