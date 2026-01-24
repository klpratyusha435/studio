'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Frown } from 'lucide-react';
import { format } from 'date-fns';

export default function OrderConfirmationPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const firestore = useFirestore();

    const orderRef = useMemoFirebase(
        () => (firestore && orderId ? doc(firestore, 'orders', orderId) : null),
        [firestore, orderId]
    );
    const { data: order, isLoading, error } = useDoc<Order>(orderRef);

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
                <Skeleton className="h-12 w-1/3 mb-4" />
                <Skeleton className="h-64 w-full" />
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
    
    // Firestore serverTimestamp is null on client until it's set on server.
    // So we need to handle this case. The date will pop in once synced.
    const createdAtDate = order.createdAt ? (order.createdAt as any).toDate() : new Date();


    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
            <Card className="text-center">
                <CardHeader>
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <CardTitle className="mt-4 font-headline text-3xl">Order Placed Successfully!</CardTitle>
                    <CardDescription>Thank you, {order.customerName}. Here is your order summary.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-left">
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
                    <Separator />
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
