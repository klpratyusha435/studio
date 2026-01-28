'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { AuthenticatedHeader } from '@/components/AuthenticatedHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerBottomNav } from '@/components/CustomerBottomNav';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!session || !['Customer', 'Admin'].includes(session.role))) {
      router.replace('/');
    }
  }, [session, isLoading, router]);

  if (isLoading || !session || !['Customer', 'Admin'].includes(session.role)) {
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
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <CustomerBottomNav />
    </div>
  );
}
