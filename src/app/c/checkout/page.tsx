'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, doc, serverTimestamp } from 'firebase/firestore';
import { useCart } from '@/hooks/use-cart';
import { useSession } from '@/hooks/use-session';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { Cafe, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useProfileLocations, type SavedLocation } from '@/hooks/use-profile-locations';

const checkoutSchema = z
  .object({
    deliveryMode: z.enum(['pickup', 'delivery'], { required_error: 'Please select a delivery option.' }),
    deliveryLocationType: z.string().optional(),
    deliveryLocationLabel: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.deliveryMode === 'delivery') {
        return !!data.deliveryLocationType && !!data.deliveryLocationLabel;
      }
      return true;
    },
    {
      message: 'Please provide full delivery details.',
      path: ['deliveryLocationLabel'], // Show error on the label input
    }
  );

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

function SavedLocations({
  setValue,
}: {
  setValue: UseFormSetValue<CheckoutFormValues>;
}) {
  const { locations } = useProfileLocations();

  if (locations.length === 0) {
    return null;
  }

  const handleSelectLocation = (location: SavedLocation) => {
    setValue('deliveryLocationType', location.type);
    setValue('deliveryLocationLabel', location.label, { shouldValidate: true });
    setValue('deliveryMode', 'delivery');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Select Location</CardTitle>
        <CardDescription>Choose from one of your saved delivery spots.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {locations.map((location, index) => (
          <Button key={index} variant="outline" size="sm" onClick={() => handleSelectLocation(location)}>
            <MapPin className="mr-2 h-4 w-4" />
            {location.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

export default function CheckoutPage() {
  const { cart, isLoading: isCartLoading, getCartTotal, clearCart } = useCart();
  const { session, isLoading: isSessionLoading } = useSession();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryMode: 'pickup',
    },
  });
  const deliveryMode = form.watch('deliveryMode');

  const cafeRef = useMemoFirebase(
    () => (firestore && cart?.cafeId ? doc(firestore, 'cafes', cart.cafeId) : null),
    [firestore, cart?.cafeId]
  );
  const { data: cafe, isLoading: isCafeLoading } = useDoc<Cafe>(cafeRef);

  useEffect(() => {
    if (!isCartLoading && (!cart || cart.items.length === 0)) {
      router.replace('/c/cart');
    }
  }, [cart, isCartLoading, router]);

  const handlePlaceOrder = (formData: CheckoutFormValues) => {
    if (!cart || !session || !cafe || !firestore) return;

    setIsPlacingOrder(true);

    const orderItems: OrderItem[] = cart.items.map((item) => ({
      itemId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      isVeg: item.isVeg,
    }));

    const orderData = {
      customerName: session.name,
      cafeId: cart.cafeId,
      cafeName: cart.cafeName,
      items: orderItems,
      specialInstructions: cart.specialInstructions,
      deliveryMode: formData.deliveryMode,
      deliveryLocation:
        formData.deliveryMode === 'delivery' && formData.deliveryLocationType && formData.deliveryLocationLabel
          ? {
              type: formData.deliveryLocationType,
              label: formData.deliveryLocationLabel,
            }
          : null,
      status: 'placed' as const,
      etaMins: cafe.avgPrepTimeMins,
      totalAmount: getCartTotal(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ordersCollection = collection(firestore, 'orders');

    addDoc(ordersCollection, orderData)
      .then((docRef) => {
        toast({
          title: 'Order Placed!',
          description: 'Your order has been successfully placed.',
        });
        clearCart();
        router.replace(`/c/order/${docRef.id}`);
      })
      .catch((error) => {
        console.error('Error placing order: ', error);
        const permissionError = new FirestorePermissionError({
          path: ordersCollection.path,
          operation: 'create',
          requestResourceData: orderData,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          variant: 'destructive',
          title: 'Order Failed',
          description: 'Could not place your order. Please try again.',
        });
      })
      .finally(() => {
        setIsPlacingOrder(false);
      });
  };

  const isLoading = isCartLoading || isSessionLoading || isCafeLoading;

  if (isLoading || !cart) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-headline font-bold">Checkout</h1>
        <p className="text-muted-foreground">Finalize your order from {cart.cafeName}</p>
      </div>

      <form onSubmit={form.handleSubmit(handlePlaceOrder)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <SavedLocations setValue={form.setValue} />
            <Card>
              <CardHeader>
                <CardTitle>Delivery Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Controller
                  control={form.control}
                  name="deliveryMode"
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                        <RadioGroupItem value="pickup" className="sr-only" />
                        Pickup
                      </Label>
                      <Label className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                        <RadioGroupItem value="delivery" className="sr-only" />
                        Delivery
                      </Label>
                    </RadioGroup>
                  )}
                />

                {deliveryMode === 'delivery' && (
                  <div className="space-y-4 rounded-md border p-4">
                    <Controller
                      control={form.control}
                      name="deliveryLocationType"
                      render={({ field }) => (
                        <div className="space-y-2">
                          <Label>Location Type</Label>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hostel">Hostel</SelectItem>
                              <SelectItem value="gate">Gate</SelectItem>
                              <SelectItem value="quarters">Quarters</SelectItem>
                              <SelectItem value="academic_block">Academic Block</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
                    <div className="space-y-2">
                      <Label>Room / Office Details</Label>
                      <Input {...form.register('deliveryLocationLabel')} placeholder="e.g. Hostel B, Room 203" />
                    </div>
                    {form.formState.errors.deliveryLocationLabel && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.deliveryLocationLabel.message}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity} x {item.name}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {cart.specialInstructions && (
                  <div>
                    <h4 className="font-semibold text-sm">Special Instructions:</h4>
                    <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                      {cart.specialInstructions}
                    </p>
                  </div>
                )}

                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" size="lg" disabled={isPlacingOrder || !form.formState.isValid}>
                  {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Place Order
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
