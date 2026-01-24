"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { Frown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function CheckoutPage() {
    const { cart, isLoading: isCartLoading, getCartTotal, clearCart } = useCart();
    const { session, isLoading: isSessionLoading } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isCartLoading && (!cart || cart.items.length === 0)) {
            router.replace('/c/cart');
        }
    }, [cart, isCartLoading, router]);

    const handlePlaceOrder = () => {
        // This is where you would typically handle payment processing
        // and saving the order to the database.
        console.log("Placing order:", {
            customer: session?.name,
            ...cart,
            total: getCartTotal()
        });

        // For now, we'll just clear the cart and redirect.
        clearCart();
        router.replace('/c/order-success');
    }

    if (isCartLoading || isSessionLoading || !cart) {
        return (
            <div className="container mx-auto p-8 text-center">
                <p>Loading checkout...</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
             <div className="mb-8 text-center">
                <h1 className="text-3xl font-headline font-bold">Checkout</h1>
                <p className="text-muted-foreground">Finalize your order from {cart.cafeName}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Order Confirmation</CardTitle>
                    <CardDescription>
                        This is a placeholder for the checkout experience. In a real app,
                        this is where you would integrate a payment gateway.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="border rounded-lg p-4 space-y-2">
                        {cart.items.map(item => (
                            <div key={item.id} className="flex justify-between">
                                <span>{item.quantity} x {item.name}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                         <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                            <span>Total</span>
                            <span>${getCartTotal().toFixed(2)}</span>
                        </div>
                    </div>
                     {cart.specialInstructions && (
                        <div>
                            <h4 className="font-semibold">Special Instructions:</h4>
                            <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">{cart.specialInstructions}</p>
                        </div>
                     )}
                     <div>
                        <Button className="w-full" size="lg" onClick={handlePlaceOrder}>
                            Simulate Placing Order
                        </Button>
                     </div>
                </CardContent>
            </Card>
        </div>
    )
}
