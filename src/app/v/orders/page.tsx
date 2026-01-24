'use client';

import { useMemo } from 'react';
import { useSession } from '@/hooks/use-session';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ListOrdered } from 'lucide-react';
import { OrderCard } from '@/components/OrderCard';

export default function VendorOrdersPage() {
    const { session, isLoading: isSessionLoading } = useSession();
    const firestore = useFirestore();

    const ordersQuery = useMemoFirebase(
        () => (firestore && session?.cafeId ? query(
            collection(firestore, 'orders'),
            where('cafeId', '==', session.cafeId)
        ) : null),
        [firestore, session?.cafeId]
    );
    const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

    const filteredOrders = useMemo(() => {
        const sortedOrders = [...(orders || [])].sort((a, b) => {
            const dateA = a.createdAt ? (a.createdAt as any).toDate() : new Date(0);
            const dateB = b.createdAt ? (b.createdAt as any).toDate() : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });

        const active = sortedOrders.filter(o => ['placed', 'accepted', 'preparing'].includes(o.status)) || [];
        const ready = sortedOrders.filter(o => o.status === 'ready') || [];
        const completed = sortedOrders.filter(o => ['completed', 'rejected'].includes(o.status)) || [];
        return { active, ready, completed };
    }, [orders]);

    const isLoading = isSessionLoading || isOrdersLoading;

    const renderOrderList = (orderList: Order[], emptyMessage: string) => {
        if (isLoading) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            );
        }
        if (orderList.length === 0) {
            return (
                <div className="text-center text-muted-foreground py-16">
                    <ListOrdered className="mx-auto h-12 w-12" />
                    <p className="mt-4 text-lg">{emptyMessage}</p>
                </div>
            );
        }
        return (
            <div className="space-y-4">
                {orderList.map(order => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-headline font-bold">Order Management</h1>
                <p className="text-muted-foreground">View and manage orders for {session?.cafeName}.</p>
            </div>
            
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="active">Active ({filteredOrders.active.length})</TabsTrigger>
                    <TabsTrigger value="ready">Ready ({filteredOrders.ready.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({filteredOrders.completed.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-4">
                    {renderOrderList(filteredOrders.active, "No active orders right now.")}
                </TabsContent>
                <TabsContent value="ready" className="mt-4">
                    {renderOrderList(filteredOrders.ready, "No orders are ready for pickup or delivery.")}
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                     {renderOrderList(filteredOrders.completed, "No orders have been completed or rejected yet.")}
                </TabsContent>
            </Tabs>
        </div>
    );
}
