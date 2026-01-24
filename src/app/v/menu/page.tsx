'use client';

import { useSession } from '@/hooks/use-session';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { MenuItem } from '@/lib/types';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Utensils, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MenuManagementPage() {
    const { session, isLoading: isSessionLoading } = useSession();
    const firestore = useFirestore();
    const { toast } = useToast();

    const menuItemsQuery = useMemoFirebase(
        () => (firestore && session?.cafeId ? collection(firestore, `cafes/${session.cafeId}/menuItems`) : null),
        [firestore, session?.cafeId]
    );
    const { data: menuItems, isLoading: isMenuLoading } = useCollection<MenuItem>(menuItemsQuery);

    const handleAvailabilityChange = (itemId: string, isAvailable: boolean) => {
        if (!firestore || !session?.cafeId) return;

        const itemRef = doc(firestore, `cafes/${session.cafeId}/menuItems`, itemId);
        const updateData = { isAvailable, updatedAt: serverTimestamp() };

        updateDoc(itemRef, updateData)
            .catch(error => {
                console.error("Error updating item availability:", error);
                const permissionError = new FirestorePermissionError({
                    path: itemRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);

                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: 'Could not update item availability.',
                });
            });
    };
    
    const isLoading = isSessionLoading || isMenuLoading;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-headline font-bold">Menu Management</h1>
                <p className="text-muted-foreground">
                    Manage item availability for {session?.cafeName}. Changes are reflected in real-time.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Your Menu Items</CardTitle>
                    <CardDescription>Toggle the switch to mark an item as available or unavailable.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="space-y-2">
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                    )}
                    {!isLoading && menuItems && menuItems.length > 0 && (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="text-center">Popular</TableHead>
                                    <TableHead className="text-right">Availability</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {menuItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>${item.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">{item.isPopular ? 'Yes' : 'No'}</TableCell>
                                        <TableCell className="text-right">
                                            <Switch
                                                checked={item.isAvailable}
                                                onCheckedChange={(checked) => handleAvailabilityChange(item.id, checked)}
                                                aria-label={`Toggle availability for ${item.name}`}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {!isLoading && (!menuItems || menuItems.length === 0) && (
                         <Alert>
                            <Utensils className="h-4 w-4" />
                            <AlertTitle>No Menu Items Found</AlertTitle>
                            <AlertDescription>
                                Your cafe doesn't have any menu items yet. An admin can add them for you.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
