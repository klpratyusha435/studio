'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useSession } from '@/hooks/use-session';
import { collection, query, where } from 'firebase/firestore';
import type { Order, Cafe } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { isToday, getHours } from 'date-fns';
import { BarChart2, Clock } from 'lucide-react';

export default function AdminAnalyticsPage() {
    const firestore = useFirestore();
    const { session } = useSession();

    const ordersQuery = useMemoFirebase(
        () => {
            if (!firestore || !session) return null;
            if (session.role === 'Admin') {
                return collection(firestore, 'orders');
            }
            // For non-admins, return a query that fetches no documents to prevent permission errors.
            return query(collection(firestore, 'orders'), where('__fake_field__', '==', 'should_not_exist'));
        },
        [firestore, session]
    );
    const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);

    const cafesQuery = useMemoFirebase(
        () => (firestore ? collection(firestore, 'cafes') : null),
        [firestore]
    );
    const { data: cafes, isLoading: isLoadingCafes } = useCollection<Cafe>(cafesQuery);
    
    const todaysOrders = useMemo(() => {
        if (!orders) return [];
        return orders.filter(order => {
            const createdAtDate = order.createdAt ? (order.createdAt as any).toDate() : null;
            return createdAtDate && isToday(createdAtDate);
        });
    }, [orders]);
    
    const ordersPerCafe = useMemo(() => {
        if (!todaysOrders || !cafes) return [];
        
        const cafeMap = new Map(cafes.map(cafe => [cafe.id, cafe.name]));
        
        const counts = todaysOrders.reduce((acc, order) => {
            const cafeName = cafeMap.get(order.cafeId) || 'Unknown Cafe';
            acc[cafeName] = (acc[cafeName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(counts).map(([name, count]) => ({ name, orders: count }));
        
    }, [todaysOrders, cafes]);
    
    const ordersByHour = useMemo(() => {
        if (!todaysOrders) return [];
        
        const hourlyCounts = Array(24).fill(0);
        
        todaysOrders.forEach(order => {
            const createdAtDate = order.createdAt ? (order.createdAt as any).toDate() : null;
            if (createdAtDate) {
                const hour = getHours(createdAtDate);
                hourlyCounts[hour]++;
            }
        });
        
        return hourlyCounts.map((count, hour) => ({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            orders: count,
        })).filter(item => item.orders > 0); // Only show hours with orders
    }, [todaysOrders]);


    const isLoading = isLoadingOrders || isLoadingCafes || !session;
    
    if (isLoading) {
        return (
             <div className="space-y-6">
                <div>
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-headline font-bold">Campus Analytics</h1>
                <p className="text-muted-foreground">Today's trends across all cafes.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5" /> Today's Orders per Cafe</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ordersPerCafe.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={ordersPerCafe} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="orders" fill="hsl(var(--primary))" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-muted-foreground py-16">No orders today to display analytics.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Peak Hours Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {ordersByHour.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={ordersByHour} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" />
                                    <YAxis allowDecimals={false}/>
                                    <Tooltip />
                                    <Bar dataKey="orders" fill="hsl(var(--primary))" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-muted-foreground py-16">No orders today to display analytics.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
