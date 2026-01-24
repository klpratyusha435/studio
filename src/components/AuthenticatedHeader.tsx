"use client";

import { Coffee } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { LogoutButton } from '@/components/LogoutButton';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';

export function AuthenticatedHeader() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
       <header className="bg-card border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-10 w-10" />
        </div>
      </header>
    );
  }

  return (
    <header className="bg-card border-b p-4 flex justify-between items-center print:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Coffee className="h-7 w-7 text-primary" />
        <h1 className="font-headline text-2xl font-bold text-primary">CampusCafe</h1>
      </Link>
      {session && (
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="font-bold text-foreground">{session.name}</p>
            <p className="text-xs text-muted-foreground">{session.role} {session.cafeName ? `(${session.cafeName})` : ''}</p>
          </div>
          <LogoutButton />
        </div>
      )}
    </header>
  );
}
