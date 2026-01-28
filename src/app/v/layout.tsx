"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { AuthenticatedHeader } from '@/components/AuthenticatedHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { VendorNav } from '@/components/VendorNav';

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!session || session.role !== 'Vendor')) {
      router.replace('/');
    }
  }, [session, isLoading, router]);

  // The guard prevents children from rendering until the session is loaded and validated.
  if (isLoading || !session || session.role !== 'Vendor') {
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

  return (
    <div className="min-h-screen flex flex-col">
      <AuthenticatedHeader />
      <div className="flex flex-1">
        <VendorNav />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}
