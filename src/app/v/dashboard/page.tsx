"use client";

import { useSession } from '@/hooks/use-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, ListOrdered } from 'lucide-react';

export default function VendorDashboard() {
  const { session } = useSession();

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-headline font-bold">
          {session?.cafeName} Dashboard
        </h2>
        <p className="text-muted-foreground">Welcome back, {session?.name}!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <ListOrdered className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+23</div>
            <p className="text-xs text-muted-foreground">+5 since yesterday</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-headline">Your Vendor Hub</CardTitle>
          <CardDescription>
            You are logged in for <span className="font-bold text-primary">{session?.cafeName}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            This is your vendor dashboard. Here you will be able to manage your menu, view incoming orders, and see sales analytics. More features coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
