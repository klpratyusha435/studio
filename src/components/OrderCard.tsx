'use client';

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OrderCardProps {
    order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleStatusUpdate = (newStatus: OrderStatus) => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'orders', order.id);
        const updateData = {
            status: newStatus,
            updatedAt: serverTimestamp(),
        };
        updateDoc(orderRef, updateData)
            .then(() => {
                toast({
                    title: 'Order Status Updated',
                    description: `Order for ${order.customerName} is now ${newStatus}.`,
                });
            })
            .catch((error) => {
                console.error("Error updating order status:", error);
                const permissionError = new FirestorePermissionError({
                    path: orderRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: 'Could not update order status.',
                });
            });
    };

    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'completed': return 'default';
            case 'accepted': return 'secondary';
            case 'preparing': return 'secondary';
            case 'ready': return 'secondary';
            case 'placed': return 'default';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    };
    
    const renderActionButtons = () => {
        switch (order.status) {
            case 'placed':
                return (
                    <div className="flex gap-2">
                        <Button onClick={() => handleStatusUpdate('accepted')}>Accept</Button>
                        <Button variant="destructive" onClick={() => handleStatusUpdate('rejected')}>Reject</Button>
                    </div>
                );
            case 'accepted':
                return <Button onClick={() => handleStatusUpdate('preparing')}>Start Preparing</Button>;
            case 'preparing':
                return <Button onClick={() => handleStatusUpdate('ready')}>Mark as Ready</Button>;
            case 'ready':
                return <Button onClick={() => handleStatusUpdate('completed')}>Complete Order</Button>;
            default:
                return null;
        }
    };


    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <CardTitle>Order for {order.customerName}</CardTitle>
                        <CardDescription>
                            {order.createdAt ? format((order.createdAt as any).toDate(), 'PPP p') : 'Date unavailable'}
                        </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(order.status)} className={cn("capitalize text-sm h-9", order.status === 'placed' && 'bg-blue-500 text-white hover:bg-blue-600')}>{order.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-sm mb-2">Items</h4>
                    <div className="border rounded-lg p-3 space-y-1 text-sm">
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

                {order.deliveryMode === 'delivery' && order.deliveryLocation ? (
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Delivery Details</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                            Deliver to <span className="font-medium text-foreground">{order.deliveryLocation.label}</span> (<span className="capitalize">{order.deliveryLocation.type.replace('_', ' ')}</span>)
                        </p>
                    </div>
                ) : (
                     <div>
                        <h4 className="font-semibold text-sm mb-2">Delivery Mode</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                            Pickup
                        </p>
                    </div>
                )}
                
                {order.specialInstructions && (
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Special Instructions</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                            {order.specialInstructions}
                        </p>
                    </div>
                )}

            </CardContent>
             <CardFooter className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">Order ID: {order.id}</p>
                <div className="flex justify-end">
                    {renderActionButtons()}
                </div>
             </CardFooter>
        </Card>
    );
}
