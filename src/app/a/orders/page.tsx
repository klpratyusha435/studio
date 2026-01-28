'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useSession } from '@/hooks/use-session';
import { collection, query, where, orderBy, collectionGroup } from 'firebase/firestore';
import type { Order, Cafe } from '@/lib/types';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { isToday } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ListFilter } from 'lucide-react';

const orderStatuses: Order['status'][] = ["placed", "accepted", "preparing", "ready", "completed", "rejected"];

export default function AdminOrdersPage() {
    const firestore = useFirestore();
    const { session, isLoading: isSessionLoading } = useSession();

    const [filterCafeId, setFilterCafeId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterToday, setFilterToday] = useState<boolean>(false);

    const ordersQuery = useMemoFirebase(
        () => {
            // Only admins should be able to fetch all orders.
            if (isSessionLoading || !firestore || !session || session.role !== 'Admin') {
                return null;
            }
            return query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
        },
        [firestore, session, isSessionLoading]
    );
    const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);

    const cafesQuery = useMemoFirebase(
        () => (firestore ? collection(firestore, 'cafes') : null),
        [firestore]
    );
    const { data: cafes, isLoading: isLoadingCafes } = useCollection<Cafe>(cafesQuery);

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        return orders.filter(order => {
            const createdAtDate = order.createdAt ? (order.createdAt as any).toDate() : null;
            if (filterToday && (!createdAtDate || !isToday(createdAtDate))) {
                return false;
            }
            if (filterCafeId !== 'all' && order.cafeId !== filterCafeId) {
                return false;
            }
            if (filterStatus !== 'all' && order.status !== filterStatus) {
                return false;
            }
            return true;
        });
    }, [orders, filterCafeId, filterStatus, filterToday]);
    

    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'completed': return 'default';
            case 'placed': return 'secondary';
            case 'accepted':
            case 'preparing':
                return 'secondary';
            case 'ready':
                return 'default';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };

    const isLoading = isLoadingOrders || isLoadingCafes || isSessionLoading;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-headline font-bold">All Campus Orders</h1>
                <p className="text-muted-foreground">Monitor all orders placed across the campus.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ListFilter className="h-5 w-5" /> Filter Orders</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Cafe</Label>
                        <Select value={filterCafeId} onValueChange={setFilterCafeId} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a cafe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cafes</SelectItem>
                                {cafes?.map(cafe => (
                                    <SelectItem key={cafe.id} value={cafe.id}>{cafe.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {orderStatuses.map(status => (
                                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-end pb-2">
                        <div className="flex items-center space-x-2">
                            <Switch id="today-filter" checked={filterToday} onCheckedChange={setFilterToday} />
                            <Label htmlFor="today-filter">Show Today Only</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Order List</CardTitle>
                    <CardDescription>
                        Displaying {filteredOrders.length} of {orders?.length || 0} total orders.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cafe</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.cafeName}</TableCell>
                                        <TableCell>{order.customerName}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(order.status)} className="capitalize">
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                                        <TableCell>{order.createdAt ? format((order.createdAt as any).toDate(), 'PP p') : 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     {!isLoading && filteredOrders.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                            No orders match the current filters.
                        </p>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
