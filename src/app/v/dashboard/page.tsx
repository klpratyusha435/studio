"use client";

import { useMemo } from 'react';
import { useSession } from '@/hooks/use-session';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, ListOrdered, Utensils } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function VendorDashboard() {
  const { session, isLoading: isSessionLoading } = useSession();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !session?.cafeId) return null;
    return query(
      collection(firestore, 'orders'),
      where('cafeId', '==', session.cafeId)
    );
  }, [firestore, session?.cafeId]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

  const stats = useMemo(() => {
    if (!orders) {
      return {
        totalRevenue: 0,
        activeOrders: 0,
        newCustomers: 0, // Placeholder
      };
    }

    const totalRevenue = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const activeOrders = orders.filter(order => 
      ['placed', 'accepted', 'preparing', 'ready'].includes(order.status)
    ).length;

    // A simple way to estimate new customers might be counting unique customer names.
    const newCustomers = new Set(orders.map(o => o.customerName)).size;

    return { totalRevenue, activeOrders, newCustomers };
  }, [orders]);

  const isLoading = isSessionLoading || isOrdersLoading;

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <div className="grid gap-6 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
             <Skeleton className="h-48" />
        </div>
    )
  }
  

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-headline font-bold">
          {session?.cafeName} Dashboard
        </h2>
        <p className="text-muted-foreground">Welcome back, {session?.name}!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <ListOrdered className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">+{stats.activeOrders}</div>
                <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.newCustomers}</div>
            <p className="text-xs text-muted-foreground">Served via the app</p>
          </CardContent>
        </Card>
         <Link href="/v/menu" className="block">
          <Card className="h-full hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Menu</CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Edit Items</div>
              <p className="text-xs text-muted-foreground">Update prices and availability.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Link href="/v/orders" passHref>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListOrdered />View & Track Orders</CardTitle>
                <CardDescription>Manage incoming orders and update their status in real-time.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
           <Link href="/v/menu" passHref>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Utensils />Manage Your Menu</CardTitle>
                <CardDescription>Toggle item availability, update prices, and add new items.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
