"use client";

import { useSession } from '@/hooks/use-session';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PackageSearch, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OrdersPage() {
  const { session, isLoading: isSessionLoading } = useSession();
  const firestore = useFirestore();
  const { reorder } = useCart();
  const router = useRouter();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !session?.name) return null;
    return query(
      collection(firestore, 'orders'),
      where('customerName', '==', session.name),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, session?.name]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);
  
  const handleReorder = (order: Order) => {
    reorder(order);
    router.push('/c/cart');
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
  }
  
  const isLoading = isSessionLoading || isOrdersLoading;

  return (
    <div className="container mx-auto p-4 sm:p-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold">Your Orders</h1>
        <p className="text-muted-foreground">A history of all your past and active orders.</p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {!isLoading && (!orders || orders.length === 0) && (
         <div className="text-center text-muted-foreground py-16">
            <ShoppingBag className="mx-auto h-12 w-12" />
            <h2 className="mt-4 text-xl font-semibold">No Orders Yet</h2>
            <p>You haven't placed any orders. Let's change that!</p>
            <Button asChild className="mt-6">
                <Link href="/c/home">Start Browsing</Link>
            </Button>
        </div>
      )}

      {!isLoading && orders && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">{order.cafeName}</CardTitle>
                        <CardDescription>
                            {order.createdAt ? format((order.createdAt as any).toDate(), 'PPP p') : 'Date not available'}
                        </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                 <Button variant="outline" asChild>
                    <Link href={`/c/order/${order.id}`}>
                      <PackageSearch className="mr-2 h-4 w-4" />
                      {order.status === 'completed' || order.status === 'rejected' ? 'View Receipt' : 'Track Order'}
                    </Link>
                 </Button>
                 {order.status === 'completed' || order.status === 'rejected' ? (
                     <Button onClick={() => handleReorder(order)}>
                        Reorder
                    </Button>
                 ) : null}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
