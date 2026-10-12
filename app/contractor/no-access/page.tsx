'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ShieldX,
  LogOut,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';

export default function NoAccessPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const handleTryAgain = () => {
    setIsChecking(true);
    // Navigating back to the workspace re-runs the sites permission check.
    // If an administrator has granted the missing permission, the workspace
    // loads normally; otherwise you will be returned to this page.
    router.push('/contractor');
  };

  const handleLogout = async () => {
    setIsChecking(true);
    await logout();
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="border-none shadow-md w-full max-w-lg">
        <CardHeader className="items-center text-center pb-4">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="size-7 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">No Access Rights</CardTitle>
          <CardDescription className="text-sm">
            Your account is active, but your role does not include the permissions
            needed to enter this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Signed in as
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{user?.name || 'User'}</span>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              {user?.role && (
                <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                  {user.role.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Specifically, your role is missing the{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground">
                sites:read
              </code>{' '}
              permission, which is required to view your company&apos;s sites and
              workspace data.
            </p>
            <p>
              Please contact your contractor administrator and ask them to update
              your role&apos;s permissions{' '}
              <span className="font-medium text-foreground">
                (Settings → Roles → Edit your role → Sites)
              </span>
              . Once granted, press <span className="font-medium text-foreground">Try again</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={handleTryAgain} disabled={isChecking} className="gap-2 flex-1">
              {isChecking ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Try again
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isChecking}
              variant="outline"
              className="gap-2 flex-1 text-destructive hover:text-destructive"
            >
              <LogOut className="size-4" /> Log out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
