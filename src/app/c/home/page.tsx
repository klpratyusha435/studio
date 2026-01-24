"use client";

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Announcement, Cafe } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { CafeCard } from '@/components/CafeCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerHomePage() {
  const firestore = useFirestore();

  const announcementsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'announcements'),
      where('active', '==', true)
    );
  }, [firestore]);
  const { data: announcements, isLoading: isLoadingAnnouncements } = useCollection<Announcement>(announcementsQuery);
  const activeAnnouncement = useMemo(() => announcements?.[0], [announcements]);


  const cafesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'cafes'),
      where('approved', '==', true),
      where('isDisabled', '==', false)
    );
  }, [firestore]);
  const { data: cafes, isLoading: isLoadingCafes } = useCollection<Cafe>(cafesQuery);

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="space-y-8">
        {isLoadingAnnouncements && <Skeleton className="h-20 w-full" />}
        {activeAnnouncement && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                    {activeAnnouncement.message}
                </AlertDescription>
            </Alert>
        )}

        <div>
            <h1 className="text-3xl font-headline font-bold mb-6">Explore Cafes</h1>
            {isLoadingCafes && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
            )}
            
            {!isLoadingCafes && cafes?.length === 0 && (
                <div className="text-center text-muted-foreground py-16">
                    <p className="text-lg">No cafes are open right now.</p>
                    <p>Please check back later!</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cafes?.map(cafe => (
                    <CafeCard key={cafe.id} cafe={cafe} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
