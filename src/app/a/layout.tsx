"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { AuthenticatedHeader } from '@/components/AuthenticatedHeader';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!session || session.role !== 'Admin')) {
      router.replace('/');
    }
  }, [session, isLoading, router]);

  if (isLoading || !session) {
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
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
