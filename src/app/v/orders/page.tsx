'use client';

import { useMemo } from 'react';
import { useSession } from '@/hooks/use-session';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ListOrdered } from 'lucide-react';
import { OrderCard } from '@/components/OrderCard';

export default function VendorOrdersPage() {
    const { session, isLoading: isSessionLoading } = useSession();
    const firestore = useFirestore();

    const ordersQuery = useMemoFirebase(
        () => (firestore && session?.cafeId ? query(
            collection(firestore, 'cafes', session.cafeId, 'orders'),
            orderBy('createdAt', 'asc')
        ) : null),
        [firestore, session?.cafeId]
    );
    const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

    const filteredOrders = useMemo(() => {
        const sortedOrders = orders || []; // Already sorted by Firestore

        const incoming = sortedOrders.filter(o => o.status === 'placed');
        const active = sortedOrders.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status));
        const completed = sortedOrders.filter(o => ['completed', 'rejected'].includes(o.status));
        
        return { incoming, active, completed };
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
            
            <Tabs defaultValue="incoming" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="incoming">Incoming ({filteredOrders.incoming.length})</TabsTrigger>
                    <TabsTrigger value="active">Active ({filteredOrders.active.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({filteredOrders.completed.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="incoming" className="mt-4">
                    {renderOrderList(filteredOrders.incoming, "No new orders right now.")}
                </TabsContent>
                <TabsContent value="active" className="mt-4">
                    {renderOrderList(filteredOrders.active, "No orders are currently active.")}
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                     {renderOrderList(filteredOrders.completed, "No orders have been completed or rejected yet.")}
                </TabsContent>
            </Tabs>
        </div>
    );
}
