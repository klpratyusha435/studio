"use client";

import { useState } from 'react';
import type { MenuItem, Cafe } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Leaf, UtensilsCrossed, Star, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { CartConfirmationDialog } from './CartConfirmationDialog';

interface MenuItemCardProps {
  item: MenuItem;
  cafe: Pick<Cafe, 'id' | 'name' | 'isOpen'>;
}

export function MenuItemCard({ item, cafe }: MenuItemCardProps) {
  const { cart, addToCart, clearCartAndAddToCart } = useCart() as any; // Use 'as any' to access internal method
  const [isDialogOpen, setDialogOpen] = useState(false);

  const canAddToCart = item.isAvailable && cafe.isOpen;
  
  const handleAddToCart = () => {
    if (cart && cart.cafeId !== cafe.id) {
      setDialogOpen(true);
    } else {
      addToCart(item, cafe);
    }
  };

  const handleConfirmAddToCart = () => {
    clearCartAndAddToCart(item, cafe);
    setDialogOpen(false);
  };


  return (
    <>
      <CartConfirmationDialog 
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmAddToCart}
        newCafeName={cafe.name}
        currentCafeName={cart?.cafeName}
      />
      <Card className={`flex flex-col ${!item.isAvailable ? 'bg-muted/50' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-xl">{item.name}</CardTitle>
            <div className="flex gap-2">
              {item.isPopular && <Badge variant="secondary" className="bg-amber-200 text-amber-800 hover:bg-amber-200/80"><Star className="h-3 w-3 mr-1" /> Popular</Badge>}
              <Badge variant="outline" className={item.isVeg ? 'border-green-600 text-green-700' : 'border-red-600 text-red-700'}>
                {item.isVeg ? <Leaf className="h-3 w-3 mr-1" /> : <UtensilsCrossed className="h-3 w-3 mr-1" />}
                {item.isVeg ? 'Veg' : 'Non-Veg'}
              </Badge>
            </div>
          </div>
          <CardDescription className="font-bold text-lg text-primary">
              ${item.price.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {!item.isAvailable && (
              <p className="text-sm text-destructive font-medium">Currently unavailable</p>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled={!canAddToCart} onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {cafe.isOpen ? 'Add to Cart' : 'Cafe Closed'}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
