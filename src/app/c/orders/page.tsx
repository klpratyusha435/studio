"use client";

import { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, writeBatch, increment, getDocs } from 'firebase/firestore';
import type { Order, Cafe } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PackageSearch, ShoppingBag, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function OrdersPage() {
  const { session, isLoading: isSessionLoading } = useSession();
  const firestore = useFirestore();
  const { reorder } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);

  // Fetch all approved cafes. This is a light query.
  const cafesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'cafes'), where('approved', '==', true));
  }, [firestore]);
  const { data: cafes, isLoading: areCafesLoading } = useCollection<Cafe>(cafesQuery);

  useEffect(() => {
    // Wait until we have the user session and the list of cafes.
    if (areCafesLoading || isSessionLoading || !firestore || !session?.uid || !cafes) {
      return;
    }

    const fetchAllUserOrders = async () => {
      setIsOrdersLoading(true);
      if (cafes.length === 0) {
        setOrders([]);
        setIsOrdersLoading(false);
        return;
      }
      
      const allOrders: Order[] = [];
      
      // For each cafe, create a promise to fetch the user's orders from it.
      const promises = cafes.map(cafe => {
        const ordersRef = collection(firestore, 'cafes', cafe.id, 'orders');
        const q = query(ordersRef, where('customerId', '==', session.uid));
        return getDocs(q);
      });

      try {
        const querySnapshots = await Promise.all(promises);
        querySnapshots.forEach(querySnapshot => {
          querySnapshot.forEach(doc => {
            allOrders.push({ id: doc.id, ...doc.data() } as Order);
          });
        });
        setOrders(allOrders);
      } catch (error) {
        console.error("Error fetching user orders:", error);
      } finally {
        setIsOrdersLoading(false);
      }
    };

    fetchAllUserOrders();
  }, [cafes, areCafesLoading, firestore, session?.uid, isSessionLoading]);


  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt as any).toDate() : new Date(0);
      const dateB = b.createdAt ? (b.createdAt as any).toDate() : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [orders]);
  
  const handleReorder = (order: Order) => {
    reorder(order);
    router.push('/c/cart');
  };

  const handleClaimPoints = async (order: Order) => {
    if (!firestore || !session?.uid) return;

    const pointsToClaim = Math.floor(order.totalAmount);
    if (pointsToClaim <= 0) {
        toast({
            variant: "destructive",
            title: "No Points to Claim",
            description: "This order is not eligible for loyalty points.",
        });
        return;
    };

    const userRef = doc(firestore, 'users', session.uid);
    const orderRef = doc(firestore, 'cafes', order.cafeId, 'orders', order.id);

    try {
        const batch = writeBatch(firestore);
        batch.update(userRef, { loyaltyPoints: increment(pointsToClaim) });
        batch.update(orderRef, { pointsClaimed: true });
        await batch.commit();

        toast({
            title: 'Points Claimed!',
            description: `You've earned ${pointsToClaim} points.`,
        });
    } catch (error) {
        console.error("Error claiming points:", error);
        toast({
            variant: "destructive",
            title: "Claim Failed",
            description: "Could not claim points. Please try again.",
        });
    }
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

      {!isLoading && (!sortedOrders || sortedOrders.length === 0) && (
         <div className="text-center text-muted-foreground py-16">
            <ShoppingBag className="mx-auto h-12 w-12" />
            <h2 className="mt-4 text-xl font-semibold">No Orders Yet</h2>
            <p>You haven't placed any orders. Let's change that!</p>
            <Button asChild className="mt-6">
                <Link href="/c/home">Start Browsing</Link>
            </Button>
        </div>
      )}

      {!isLoading && sortedOrders && sortedOrders.length > 0 && (
        <div className="space-y-4">
          {sortedOrders.map(order => (
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
                    <Link href={`/c/order/${order.cafeId}/${order.id}`}>
                      <PackageSearch className="mr-2 h-4 w-4" />
                      {order.status === 'completed' || order.status === 'rejected' ? 'View Receipt' : 'Track Order'}
                    </Link>
                 </Button>
                 {order.status === 'completed' && !order.pointsClaimed && order.totalAmount > 0 ? (
                    <Button onClick={() => handleClaimPoints(order)}>
                        <Star className="mr-2 h-4 w-4" />
                        Claim {Math.floor(order.totalAmount)} Points
                    </Button>
                 ) : null}
                 {(order.status === 'completed' || order.status === 'rejected') && (
                     <Button onClick={() => handleReorder(order)}>
                        Reorder
                    </Button>
                 ) }
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
