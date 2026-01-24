'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { Cafe } from '@/lib/types';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Search } from 'lucide-react';

const locationDisplay: Record<string, string> = {
    hostel: 'Hostel Zone',
    gate: 'Main Gate',
    academic_block: 'Academic Block',
    quarters: 'Residential Quarters',
};

export default function AdminCafesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');

    const cafesQuery = useMemoFirebase(
        () => (firestore ? collection(firestore, 'cafes') : null),
        [firestore]
    );
    const { data: cafes, isLoading } = useCollection<Cafe>(cafesQuery);

    const filteredCafes = useMemo(() => {
        if (!cafes) return [];
        return cafes.filter(cafe => 
            cafe.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [cafes, searchQuery]);

    const handleToggle = (cafeId: string, field: 'approved' | 'isDisabled', value: boolean) => {
        if (!firestore) return;

        const cafeRef = doc(firestore, 'cafes', cafeId);
        const updateData = { [field]: value };
        
        updateDoc(cafeRef, updateData)
            .then(() => {
                toast({
                    title: 'Cafe Updated',
                    description: `The cafe has been successfully updated.`
                });
            })
            .catch(error => {
                console.error(`Error toggling ${field}:`, error);
                const permissionError = new FirestorePermissionError({
                    path: cafeRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', permissionError);

                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: `Could not update the cafe's ${field} status.`,
                });
            });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-headline font-bold">Cafe Management</h1>
                <p className="text-muted-foreground">Approve, disable, and manage all cafes on the platform.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Cafes</CardTitle>
                    <CardDescription>
                        Use the toggles to instantly approve or disable a cafe. Changes are saved automatically.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by cafe name..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-center">Approved</TableHead>
                                    <TableHead className="text-center">Disabled</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCafes.map(cafe => (
                                    <TableRow key={cafe.id}>
                                        <TableCell className="font-medium">{cafe.name}</TableCell>
                                        <TableCell>{locationDisplay[cafe.locationTag] || cafe.locationTag}</TableCell>
                                        <TableCell>
                                            <Badge variant={cafe.isOpen ? 'default' : 'outline'}>
                                                {cafe.isOpen ? 'Open' : 'Closed'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Switch
                                                checked={cafe.approved}
                                                onCheckedChange={(checked) => handleToggle(cafe.id, 'approved', checked)}
                                                aria-label={`Toggle approval for ${cafe.name}`}
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                             <Switch
                                                checked={cafe.isDisabled}
                                                onCheckedChange={(checked) => handleToggle(cafe.id, 'isDisabled', checked)}
                                                aria-label={`Toggle disabled status for ${cafe.name}`}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     {!isLoading && filteredCafes.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                            {searchQuery ? `No cafes found for "${searchQuery}".` : "No cafes found."}
                        </p>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
