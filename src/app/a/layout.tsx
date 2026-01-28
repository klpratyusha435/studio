'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { AuthenticatedHeader } from '@/components/AuthenticatedHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminNav } from '@/components/AdminNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useSession();
  const router = useRouter();

  // This effect handles redirection if the user is not an admin.
  // It runs after the initial render and whenever session or isLoading changes.
  useEffect(() => {
    if (!isLoading && (!session || session.role !== 'Admin')) {
      router.replace('/');
    }
  }, [session, isLoading, router]);

  // This is the main guard. It prevents the children (the admin pages)
  // from rendering until we are sure the user is a logged-in admin.
  // While loading, or if the user is not an admin, we show a skeleton screen.
  if (isLoading || !session || session.role !== 'Admin') {
    return (
      <div className="flex flex-col min-h-screen">
        <AuthenticatedHeader />
        <main className="flex-1 p-8 space-y-4">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-48 w-full" />
        </main>
      </div>
    );
  }

  // Only render the admin layout and its children if the guard passes.
  return (
    <div className="min-h-screen flex flex-col">
      <AuthenticatedHeader />
      <div className="flex flex-1">
        <AdminNav />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}
