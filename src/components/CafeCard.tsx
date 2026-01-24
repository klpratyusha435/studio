"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Timer } from 'lucide-react';
import type { Cafe } from '@/lib/types';

interface CafeCardProps {
  cafe: Cafe;
}

export function CafeCard({ cafe }: CafeCardProps) {
  const locationDisplay: Record<Cafe['locationTag'], string> = {
    hostel: 'Hostel Zone',
    gate: 'Main Gate',
    academic_block: 'Academic Block',
    quarters: 'Residential Quarters',
  };

  return (
    <Link href={`/c/cafe/${cafe.id}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card className={`h-full transition-all hover:shadow-lg hover:border-primary/50 ${!cafe.isOpen ? 'bg-card/60' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle>{cafe.name}</CardTitle>
            <Badge variant={cafe.isOpen ? 'default' : 'outline'} className="shrink-0">
              {cafe.isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>
          <CardDescription>{locationDisplay[cafe.locationTag]}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
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
    </Link>
  );
}
