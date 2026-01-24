"use client";

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CartItemRow } from '@/components/CartItemRow';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartPage() {
  const { cart, isLoading, getCartTotal, setSpecialInstructions, clearCart } = useCart();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-8">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto p-4 sm:p-8 text-center">
        <div className="py-20">
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-6 text-2xl font-headline font-bold">Your cart is empty</h2>
          <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
          <Button asChild className="mt-6">
            <Link href="/c/home">Start Browsing</Link>
          </Button>
        </div>
      </div>
    );
  }

  const total = getCartTotal();

  return (
    <div className="container mx-auto p-4 sm:p-8">
       <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold">Your Shopping Cart</h1>
        <p className="text-muted-foreground">Review your order from <span className="font-bold text-primary">{cart.cafeName}</span>.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                    {cart.items.map(item => (
                        <CartItemRow key={item.id} item={item} />
                    ))}
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={clearCart}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Cart
                    </Button>
                </CardFooter>
            </Card>
        </div>

        <div className="space-y-8">
          <Card>
              <CardHeader>
                  <CardTitle>Special Instructions</CardTitle>
                  <CardDescription>Any special requests for the cafe?</CardDescription>
              </CardHeader>
              <CardContent>
                  <Textarea 
                    placeholder="e.g. Extra spicy, no onions..."
                    defaultValue={cart.specialInstructions}
                    onBlur={(e) => setSpecialInstructions(e.target.value)}
                  />
              </CardContent>
          </Card>
        
          <Card>
            <CardHeader>
              <CardTitle>Order Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => router.push('/c/checkout')}>
                Proceed to Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
