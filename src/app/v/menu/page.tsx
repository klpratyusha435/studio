'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import type { MenuItem } from '@/lib/types';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Utensils, Info, PlusCircle, Edit, Leaf, UtensilsCrossed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { MenuItemDialog, type MenuItemFormValues } from '@/components/MenuItemDialog';
import { Badge } from '@/components/ui/badge';


export default function MenuManagementPage() {
    const { session, isLoading: isSessionLoading } = useSession();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

    const menuItemsQuery = useMemoFirebase(
        () => (isSessionLoading || !firestore || !session?.cafeId ? null : collection(firestore, `cafes/${session.cafeId}/menuItems`)),
        [firestore, session?.cafeId, isSessionLoading]
    );
    const { data: menuItems, isLoading: isMenuLoading } = useCollection<MenuItem>(menuItemsQuery);

    const handleToggleChange = (itemId: string, field: 'isAvailable' | 'isPopular', value: boolean) => {
        if (!firestore || !session?.cafeId) return;

        const itemRef = doc(firestore, `cafes/${session.cafeId}/menuItems`, itemId);
        const updateData = { [field]: value, updatedAt: serverTimestamp() };

        updateDoc(itemRef, updateData)
            .catch(error => {
                console.error(`Error updating item ${field}:`, error);
                const permissionError = new FirestorePermissionError({
                    path: itemRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);

                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: `Could not update item ${field}.`,
                });
            });
    };

    const handleOpenDialog = (item: MenuItem | null = null) => {
        setSelectedItem(item);
        setDialogOpen(true);
    };

    const handleFormSubmit = (values: MenuItemFormValues) => {
        if (!firestore || !session?.cafeId) return;
        setIsSaving(true);
        
        const itemData = {
            ...values,
            updatedAt: serverTimestamp(),
        };

        let promise;
        if (selectedItem) {
            // Editing existing item
            const itemRef = doc(firestore, `cafes/${session.cafeId}/menuItems`, selectedItem.id);
            promise = updateDoc(itemRef, itemData);
        } else {
            // Adding new item
            const menuCollection = collection(firestore, `cafes/${session.cafeId}/menuItems`);
            promise = addDoc(menuCollection, itemData);
        }

        promise.then(() => {
            toast({
                title: selectedItem ? 'Item Updated' : 'Item Added',
                description: `${values.name} has been successfully saved.`,
            });
            setDialogOpen(false);
        }).catch(error => {
            console.error("Error saving menu item:", error);
             const permissionError = new FirestorePermissionError({
                path: selectedItem ? doc(collection(firestore, `cafes/${session.cafeId}/menuItems`), selectedItem.id).path : collection(firestore, `cafes/${session.cafeId}/menuItems`).path,
                operation: selectedItem ? 'update' : 'create',
                requestResourceData: itemData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save the menu item.',
            });
        }).finally(() => {
            setIsSaving(false);
        });
    };
    
    const isLoading = isSessionLoading || isMenuLoading;

    return (
        <>
            <MenuItemDialog 
                open={isDialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleFormSubmit}
                isSaving={isSaving}
                menuItem={selectedItem}
            />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-headline font-bold">Menu Management</h1>
                        <p className="text-muted-foreground">
                            Manage item availability, popularity, and details for {session?.cafeName}.
                        </p>
                    </div>
                     <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Item
                    </Button>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Your Menu Items</CardTitle>
                        <CardDescription>Toggle switches for quick updates or edit items for more details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && (
                            <div className="space-y-2">
                               <Skeleton className="h-12 w-full" />
                               <Skeleton className="h-12 w-full" />
                               <Skeleton className="h-12 w-full" />
                            </div>
                        )}
                        {!isLoading && menuItems && menuItems.length > 0 && (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-center">Popular</TableHead>
                                        <TableHead className="text-center">Available</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {menuItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={item.isVeg ? 'border-green-600 text-green-700' : 'border-red-600 text-red-700'}>
                                                    {item.isVeg ? <Leaf className="h-3 w-3 mr-1" /> : <UtensilsCrossed className="h-3 w-3 mr-1" />}
                                                    {item.isVeg ? 'Veg' : 'Non-Veg'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Switch
                                                    checked={item.isPopular}
                                                    onCheckedChange={(checked) => handleToggleChange(item.id, 'isPopular', checked)}
                                                    aria-label={`Toggle popular status for ${item.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Switch
                                                    checked={item.isAvailable}
                                                    onCheckedChange={(checked) => handleToggleChange(item.id, 'isAvailable', checked)}
                                                    aria-label={`Toggle availability for ${item.name}`}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
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
                                    Click "Add New Item" to start building your menu.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
