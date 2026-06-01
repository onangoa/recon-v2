'use client';

import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Search, 
  RotateCcw, 
  UserPlus,
  Mail,
  Phone,
  Shield,
  HardHat,
  MoreVertical,
  Filter,
  BadgeCheck,
  Clock
} from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function TeamPage() {
  const members = [
    {
      id: 'MEM-001',
      name: 'James Mwangi',
      role: 'Site Supervisor',
      email: 'james.m@constructionhub.ke',
      phone: '+254 700 111 222',
      status: 'On-Site',
      initials: 'JM'
    },
    {
      id: 'MEM-002',
      name: 'Sarah Chengo',
      role: 'Safety Officer',
      email: 'sarah.c@constructionhub.ke',
      phone: '+254 700 333 444',
      status: 'On-Site',
      initials: 'SC'
    },
    {
      id: 'MEM-003',
      name: 'David Otieno',
      role: 'Foreman',
      email: 'david.o@constructionhub.ke',
      phone: '+254 700 555 666',
      status: 'Off-Duty',
      initials: 'DO'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Workforce & Staff</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Workforce Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Oversee your project team, assign roles, and track site attendance.</p>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
          <Link href="/contractor/team/create">
            <UserPlus className="w-4 h-4" />
            <span>Add Team Member</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-md bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Staff</p>
                <h3 className="text-2xl font-bold">42</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <HardHat className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Active On-Site</p>
                <h3 className="text-2xl font-bold">35</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Supervisors</p>
                <h3 className="text-2xl font-bold">04</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or role..."
                className="pl-10 bg-background border-none h-9 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 h-9 border-muted-foreground/20">
                <Clock className="w-4 h-4" />
                <span>Attendance Log</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2 h-9 border-muted-foreground/20">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Member Details</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Role</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Contact Info</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="text-right w-[80px] font-bold text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{member.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{member.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{member.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary/80">
                        {member.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center text-[10px] text-muted-foreground">
                        <Mail className="w-3 h-3 mr-1.5 opacity-60" />
                        {member.email}
                      </div>
                      <div className="flex items-center text-[10px] text-muted-foreground">
                        <Phone className="w-3 h-3 mr-1.5 opacity-60" />
                        {member.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={`
                      text-[10px] uppercase font-bold px-2 py-0 border-none
                      ${member.status === 'On-Site' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-600'}
                    `}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center bg-muted/5">
                  <p className="text-muted-foreground text-xs italic">Workforce management interface - member assignment coming soon</p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
