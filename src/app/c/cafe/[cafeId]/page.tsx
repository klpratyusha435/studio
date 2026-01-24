'use client';

import { useParams } from 'next/navigation';
import { collection, doc } from 'firebase/firestore';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Cafe, MenuItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Timer, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MenuItemCard } from '@/components/MenuItemCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CafePage() {
  const params = useParams();
  const cafeId = params.cafeId as string;
  const firestore = useFirestore();

  const cafeRef = useMemoFirebase(
    () => (firestore && cafeId ? doc(firestore, 'cafes', cafeId) : null),
    [firestore, cafeId]
  );
  const { data: cafe, isLoading: isLoadingCafe } = useDoc<Cafe>(cafeRef);

  const menuItemsQuery = useMemoFirebase(
    () => (firestore && cafeId ? collection(firestore, `cafes/${cafeId}/menuItems`) : null),
    [firestore, cafeId]
  );
  const { data: menuItems, isLoading: isLoadingMenu } = useCollection<MenuItem>(menuItemsQuery);
  
  const locationDisplay: Record<string, string> = {
    hostel: 'Hostel Zone',
    gate: 'Main Gate',
    academic_block: 'Academic Block',
    quarters: 'Residential Quarters',
  };


  if (isLoadingCafe) {
    return (
      <div className="container mx-auto p-4 sm:p-8 space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-1/4" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="container mx-auto p-4 sm:p-8 text-center">
         <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Cafe Not Found</AlertTitle>
            <AlertDescription>
                The cafe you are looking for does not exist or may have been removed.
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="font-headline text-4xl">{cafe.name}</CardTitle>
              <CardDescription className="mt-2">{locationDisplay[cafe.locationTag]}</CardDescription>
            </div>
            <Badge variant={cafe.isOpen ? 'default' : 'destructive'} className="text-base shrink-0">
              {cafe.isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{cafe.openingTime} – {cafe.closingTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 shrink-0" />
            <span>Avg. {cafe.avgPrepTimeMins} min prep time</span>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-6">Menu</h2>
        {isLoadingMenu && (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
        )}
        {!isLoadingMenu && menuItems?.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
                <p className="text-lg">This cafe has no menu items yet.</p>
                <p>Check back soon!</p>
            </div>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {menuItems?.map(item => (
            <MenuItemCard key={item.id} item={item} cafe={cafe} />
          ))}
        </div>
      </div>
    </div>
  );
}
