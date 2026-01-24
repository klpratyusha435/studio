'use client';

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';

interface OrderCardProps {
    order: Order;
}

const statusOptions: OrderStatus[] = ["placed", "accepted", "preparing", "ready", "completed", "rejected"];

export function OrderCard({ order }: OrderCardProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleStatusChange = (newStatus: OrderStatus) => {
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
            case 'placed':
            case 'accepted':
            case 'preparing':
            case 'ready':
                return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
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
                    <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(order.status)} className="capitalize text-sm h-9">{order.status}</Badge>
                        <Select onValueChange={(value: OrderStatus) => handleStatusChange(value)} defaultValue={order.status}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(status => (
                                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
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

                {order.deliveryMode === 'delivery' && order.deliveryLocation && (
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Delivery Details</h4>
                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                            Deliver to <span className="font-medium text-foreground">{order.deliveryLocation.label}</span> (<span className="capitalize">{order.deliveryLocation.type.replace('_', ' ')}</span>)
                        </p>
                    </div>
                )}
                 {order.deliveryMode === 'pickup' && (
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
             <CardFooter className="text-xs text-muted-foreground">
                Order ID: {order.id}
             </CardFooter>
        </Card>
    );
}
