"use client";

import { UtensilsCrossed, ListOrdered, ShoppingCart, User, LogOut } from 'lucide-react';
import { useSession, useLogout } from '@/hooks/use-session';
import { useCart } from '@/hooks/use-cart';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


export function AuthenticatedHeader() {
  const { session, isLoading: isSessionLoading } = useSession();
  const { getCartItemCount, isLoading: isCartLoading } = useCart();
  const logout = useLogout();
  const cartItemCount = getCartItemCount();

  const isLoading = isSessionLoading || isCartLoading;

  const getProfileLink = () => {
    if (!session) return '/';
    switch (session.role) {
      case 'Admin':
      case 'Customer':
        return '/c/profile';
      case 'Vendor':
        return '/v/profile';
      default:
        return '/';
    }
  };

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
        <UtensilsCrossed className="h-7 w-7 text-primary" />
        <h1 className="font-headline text-2xl font-bold text-primary">XLEats</h1>
      </Link>
      
      {session && (
        <div className="flex items-center gap-4">
          {['Customer', 'Admin'].includes(session.role) && (
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${session.name}`} alt={session.name} />
                        <AvatarFallback>{session.name.substring(0,2)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{session.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                   <Link href={getProfileLink()}><User className="mr-2" />Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout} className="cursor-pointer">
                   <LogOut className="mr-2 h-4 w-4" />
                   <span>Log Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      )}
    </header>
  );
}
