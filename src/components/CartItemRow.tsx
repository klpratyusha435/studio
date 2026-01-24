"use client";

import { useCart } from "@/hooks/use-cart";
import type { CartItem } from "@/lib/types";
import { Button } from "./ui/button";
import { Minus, Plus, X } from "lucide-react";
import { Input } from "./ui/input";

interface CartItemRowProps {
    item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
    const { updateItemQuantity } = useCart();

    const handleQuantityChange = (newQuantity: number) => {
        const quantity = Math.max(0, newQuantity);
        updateItemQuantity(item.id, quantity);
    };

    const itemTotal = item.price * item.quantity;

    return (
        <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(item.quantity - 1)}
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Input
                    type="number"
                    className="h-8 w-14 text-center"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
                    min="0"
                />
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(item.quantity + 1)}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <div className="w-20 text-right font-semibold">
                ${itemTotal.toFixed(2)}
            </div>
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleQuantityChange(0)}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    )
}
