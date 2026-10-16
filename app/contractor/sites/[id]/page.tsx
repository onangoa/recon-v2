'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  UserMinus,
  Users,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { SITE_CATEGORY_LABELS } from '@/lib/site-report';

interface SiteDetail {
  id: string;
  name: string;
  location: string;
  coordinates: string | null;
  description: string | null;
  category: string | null;
  status: string;
  isPrimary: boolean;
  image: string | null;
  plotNumber: string | null;
  builtUpArea: string | null;
  numberOfFloors: number | null;
  commencementDate: string | null;
  expectedCompletionDate: string | null;
  contractPeriodMonths: number | null;
  overallProgress: number | null;
  progressDescription: string | null;
  createdAt: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  status: string;
  userId: string | null;
  sites: { id: string; name: string }[];
}

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50';

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'd MMMM yyyy');
  } catch {
    return '—';
  }
}

export default function SiteDetailPage() {
  const { id: siteId } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [site, setSite] = useState<SiteDetail | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [unassigning, setUnassigning] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ name: '', roleId: '', role: '', email: '', phone: '' });

  const fetchSite = useCallback(async () => {
    try {
      const [siteRes, staffRes, rolesRes] = await Promise.all([
        fetch(`/web/api/sites/${siteId}`),
        fetch(`/web/api/team?siteId=${siteId}&limit=100`),
        fetch('/web/api/roles'),
      ]);
      if (!siteRes.ok) {
        throw new Error('Site not found');
      }
      const siteJson = await siteRes.json();
      setSite(siteJson);
      if (staffRes.ok) {
        const staffJson = await staffRes.json();
        setStaff(staffJson.members || []);
      }
      if (rolesRes.ok) {
        const rolesJson = await rolesRes.json();
        setRoles(Array.isArray(rolesJson) ? rolesJson : []);
      }
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load the site. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    if (siteId) fetchSite();
  }, [siteId, fetchSite]);

  const handleRoleSelect = (roleId: string) => {
    const selected = roles.find((r) => r.id === roleId);
    setAddForm((prev) => ({ ...prev, roleId, role: selected?.name || '' }));
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) return;
    if (!addForm.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Staff name is required.',
        variant: 'destructive',
      });
      return;
    }
    if (!addForm.role.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please pick a role for the staff member.',
        variant: 'destructive',
      });
      return;
    }
    setAdding(true);
    try {
      const response = await fetch('/web/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          roleId: addForm.roleId || null,
          role: addForm.role.trim(),
          email: addForm.email.trim() || null,
          phone: addForm.phone.trim() || null,
          status: 'Active',
          siteIds: [siteId],
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(getApiError(result, 'Unable to add the staff member. Please try again.'));
      }
      toast({
        title: 'Staff added',
        description: `${result.name} has been added to this site as ${result.role}.`,
        variant: 'success',
        action: (
          <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
        ),
      });
      setAddForm({ name: '', roleId: '', role: '', email: '', phone: '' });
      await fetchSite();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(err, 'Unable to add the staff member. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleUnassign = async (member: StaffMember) => {
    if (!siteId || unassigning) return;
    setUnassigning(member.id);
    try {
      const detailRes = await fetch(`/web/api/team/${member.id}`);
      if (!detailRes.ok) throw new Error('Failed to load the staff member.');
      const detail = await detailRes.json();
      const remainingSites = (detail.sites || [])
        .map((s: { id: string }) => s.id)
        .filter((sid: string) => sid !== siteId);
      const response = await fetch(`/web/api/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteIds: remainingSites }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(getApiError(result, 'Unable to remove the staff member from this site.'));
      }
      toast({
        title: 'Staff removed',
        description: `${member.name} has been removed from this site.`,
        variant: 'success',
      });
      await fetchSite();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(err, 'Unable to remove the staff member. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setUnassigning(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/contractor/sites">Sites</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Site Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card className="border-none shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-medium">{error || 'Site not found.'}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/contractor/sites">Back to Sites</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor/sites">Sites</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{site.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">{site.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {site.isPrimary && (
              <Badge className="text-[10px] font-black uppercase bg-primary/10 text-primary border-primary/20">
                Primary
              </Badge>
            )}
            {site.category && (
              <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary/70">
                {SITE_CATEGORY_LABELS[site.category] || site.category}
              </Badge>
            )}
            <Badge className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border-none">
              {site.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Link href={`/contractor/sites/edit/${site.id}`}>
              <Pencil className="w-4 h-4" />
              Edit Site
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="p-4 md:p-6 border-b bg-muted/20">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Site Overview
          </CardTitle>
          <CardDescription className="text-sm italic">
            General information about this project site.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {site.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={site.image}
                alt={site.name}
                className="h-40 w-full md:w-72 rounded-lg border border-gray-200 object-cover"
              />
            )}
            <div className="space-y-3 flex-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">{site.location}</p>
                </div>
              </div>
              {site.coordinates && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coordinates</p>
                    <p className="text-sm font-medium">{site.coordinates}</p>
                  </div>
                </div>
              )}
              {site.description && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</p>
                  <p className="text-sm text-foreground/90">{site.description}</p>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{formatDate(site.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly report data */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="p-4 md:p-6 border-b bg-muted/20">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            Weekly Progress Report Data
          </CardTitle>
          <CardDescription className="text-sm italic">
            Project data printed on the generated weekly progress report.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              ['Plot / L.R No.', site.plotNumber || '—'],
              ['Built Up Area', site.builtUpArea || '—'],
              ['No. of Floors', site.numberOfFloors != null ? String(site.numberOfFloors) : '—'],
              ['Commencement Date', formatDate(site.commencementDate)],
              ['Expected Completion Date', formatDate(site.expectedCompletionDate)],
              [
                'Contract Period',
                site.contractPeriodMonths != null ? `${site.contractPeriodMonths} months` : '—',
              ],
              [
                'Overall Progress',
                site.overallProgress != null ? `${Math.round(site.overallProgress)}%` : '—',
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-gray-100 bg-muted/20 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-foreground mt-1">{value}</p>
              </div>
            ))}
            <div className="rounded-lg border border-gray-100 bg-muted/20 p-3 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description of Progress
              </p>
              <p className="text-sm text-foreground/90 mt-1">
                {site.progressDescription || '—'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned staff */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="p-4 md:p-6 border-b bg-muted/20">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Assigned Staff
          </CardTitle>
          <CardDescription className="text-sm italic">
            Staff assigned to this project — listed as the PROJECT TEAM on the
            weekly progress report.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 md:p-6 border-b bg-primary/5">
            <form onSubmit={handleAddStaff} className="space-y-4">
              <p className="text-sm font-bold text-foreground">Add staff to this site</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. ENG. JOHN DOE"
                    disabled={adding}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Role *
                  </label>
                  <select
                    value={addForm.roleId}
                    onChange={(e) => handleRoleSelect(e.target.value)}
                    disabled={adding}
                    className={inputClass}
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Creates a login if set"
                    disabled={adding}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Phone (optional)
                  </label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. +254 7XX XXX XXX"
                    disabled={adding}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground italic">
                  With an email the staff gets a login account (a welcome
                  email is sent); without one they are added as a non-login
                  staff record.
                </p>
                <Button
                  type="submit"
                  disabled={adding}
                  className="gap-2 bg-primary hover:bg-primary/90 text-white min-w-[150px]"
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add to Site
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Users className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">
                No staff assigned to this site yet. Add staff above or assign
                existing staff from the Team page.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase">Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Role</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Contact</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-center">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-center">Access</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{member.name}</span>
                        {member.sites.length > 1 && (
                          <span className="text-[10px] text-muted-foreground">
                            Also assigned to {member.sites.length - 1} other site
                            {member.sites.length > 2 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary/70">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{member.email || '—'}</span>
                        <span className="text-xs text-muted-foreground">{member.phone || ''}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={`text-[9px] font-bold uppercase px-2 py-0 border-none ${
                          member.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-amber-500/10 text-amber-700'
                        }`}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={`text-[9px] font-bold uppercase px-2 py-0 border-none ${
                          member.userId
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {member.userId ? 'Can log in' : 'Staff only'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        disabled={unassigning !== null}
                        onClick={() => handleUnassign(member)}
                      >
                        {unassigning === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                        <span className="text-xs font-bold hidden sm:inline">Remove</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
