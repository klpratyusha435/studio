"use client";

import { Coffee, ListOrdered, ShoppingCart } from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { useCart } from '@/hooks/use-cart';
import { LogoutButton } from '@/components/LogoutButton';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function AuthenticatedHeader() {
  const { session, isLoading: isSessionLoading } = useSession();
  const { getCartItemCount, isLoading: isCartLoading } = useCart();
  const cartItemCount = getCartItemCount();

  const isLoading = isSessionLoading || isCartLoading;

  if (isLoading) {
    return (
       <header className="bg-card border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-10 w-10" />
        </div>
      </header>
    );
  }

  return (
    <header className="bg-card border-b p-4 flex justify-between items-center print:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Coffee className="h-7 w-7 text-primary" />
        <h1 className="font-headline text-2xl font-bold text-primary">CampusCafe</h1>
      </Link>
      
      {session && (
        <div className="flex items-center gap-4">
          {session.role === 'Customer' && (
            <>
              <Link href="/c/orders" passHref>
                <Button variant="outline">
                    <ListOrdered className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">My Orders</span>
                </Button>
              </Link>
              <Link href="/c/cart" passHref>
                <Button variant="outline" className="relative">
                    <ShoppingCart className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">View Cart</span>
                    {cartItemCount > 0 && (
                      <Badge variant="destructive" className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0">{cartItemCount}</Badge>
                    )}
                </Button>
              </Link>
            </>
          )}
          
          <div className="text-right hidden sm:block">
            <p className="font-bold text-foreground">{session.name}</p>
            <p className="text-xs text-muted-foreground">{session.role} {session.cafeName ? `(${session.cafeName})` : ''}</p>
          </div>
          <LogoutButton />
        </div>
      )}
    </header>
  );
}
