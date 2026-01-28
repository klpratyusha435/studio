'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Frown, ChefHat, Utensils, ShoppingBag, PartyPopper } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const StatusTimeline = ({ currentStatus }: { currentStatus: OrderStatus }) => {
    const statuses: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
        { status: 'placed', label: 'Order Placed', icon: CheckCircle },
        { status: 'accepted', label: 'Order Accepted', icon: ChefHat },
        { status: 'preparing', label: 'Preparing Food', icon: Utensils },
        { status: 'ready', label: 'Ready', icon: ShoppingBag },
        { status: 'completed', label: 'Completed', icon: PartyPopper },
    ];

    const currentStatusIndex = statuses.findIndex(s => s.status === currentStatus);
    
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Order Status</h3>
            <div className="space-y-4">
                {statuses.map(({ status, label, icon: Icon }, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    
                    return (
                        <div key={status} className="flex items-center gap-4">
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full",
                                isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <p className={cn("font-medium", isCompleted ? "text-foreground" : "text-muted-foreground")}>{label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default function OrderTrackingPage() {
    const params = useParams();
    const cafeId = params.cafeId as string;
    const orderId = params.orderId as string;
    const firestore = useFirestore();

    const orderRef = useMemoFirebase(
        () => (firestore && cafeId && orderId ? doc(firestore, 'cafes', cafeId, 'orders', orderId) : null),
        [firestore, cafeId, orderId]
    );
    const { data: order, isLoading, error } = useDoc<Order>(orderRef);

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
                <Skeleton className="h-12 w-1/3 mb-4" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
                <Alert variant="destructive">
                    <Frown className="h-4 w-4" />
                    <AlertTitle>Order Not Found</AlertTitle>
                    <AlertDescription>
                        We couldn't find the order you're looking for. It may have been moved or deleted.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if (order.status === 'rejected') {
        return (
             <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
                <Card>
                    <CardHeader className="text-center">
                        <Frown className="mx-auto h-12 w-12 text-destructive" />
                        <CardTitle className="mt-4 font-headline text-3xl">Order Rejected</CardTitle>
                        <CardDescription>Unfortunately, the cafe was unable to fulfill this order. You have not been charged.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button asChild>
                            <Link href="/c/home">Back to Cafes</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // Firestore serverTimestamp is null on client until it's set on server.
    const createdAtDate = order.createdAt ? (order.createdAt as any).toDate() : new Date();


    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Track Your Order</CardTitle>
                    <CardDescription>A summary of your order from {order.cafeName}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <StatusTimeline currentStatus={order.status} />
                    
                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-semibold">Order ID</p>
                            <p className="text-muted-foreground truncate">{order.id}</p>
                        </div>
                         <div>
                            <p className="font-semibold">Order Date</p>
                            <p className="text-muted-foreground">{format(createdAtDate, "PPP p")}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Cafe</p>
                            <p className="text-muted-foreground">{order.cafeName}</p>
                        </div>
                         <div>
                            <p className="font-semibold">Estimated Wait</p>
                            <p className="text-muted-foreground">{order.etaMins} minutes</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold mb-2">Items</h4>
                         <div className="border rounded-lg p-4 space-y-2 text-sm">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between">
                                    <span>{item.quantity} x {item.name}</span>
                                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <Separator className="my-2" />
                            <div className="flex justify-between font-bold">
                                <span>Total</span>
                                <span>${order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {order.deliveryMode === 'delivery' && order.deliveryLocation && (
                        <div>
                            <h4 className="font-semibold mb-2">Delivery Details</h4>
                             <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                                Delivering to <span className="font-medium text-foreground">{order.deliveryLocation.label}</span> ({order.deliveryLocation.type})
                            </p>
                        </div>
                    )}
                     {order.specialInstructions && (
                        <div>
                            <h4 className="font-semibold mb-2">Special Instructions</h4>
                             <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                                {order.specialInstructions}
                            </p>
                        </div>
                    )}
                    <Button asChild className="w-full">
                        <Link href="/c/home">Continue Browsing</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
