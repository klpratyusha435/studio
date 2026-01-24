"use client";

import { useSession } from '@/hooks/use-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Utensils, Star } from 'lucide-react';

export default function CustomerDashboard() {
  const { session } = useSession();

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-headline font-bold">Welcome, {session?.name}!</h2>
        <p className="text-muted-foreground">Ready to explore the best cafes on campus?</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Browse Cafes</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Find Your Spot</div>
            <p className="text-xs text-muted-foreground">
              Discover menus, opening hours, and locations.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Ahead</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Skip the Line</div>
            <p className="text-xs text-muted-foreground">
              Place your order and pick it up when it's ready.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Get Rewards</div>
            <p className="text-xs text-muted-foreground">
              Earn points with every purchase.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="font-headline">Your Customer Hub</CardTitle>
            <CardDescription>This is your personal dashboard. More features coming soon!</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Here you will be able to see your order history, manage your favorite items, and view exclusive deals.</p>
        </CardContent>
      </Card>
    </div>
  );
}
