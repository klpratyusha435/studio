'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp, query, orderBy, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Announcement } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Loader2, Megaphone, Trash2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const announcementSchema = z.object({
  message: z.string().min(10, { message: 'Announcement message must be at least 10 characters long.' }),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function AnnouncementsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { message: '' },
  });

  const announcementsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: announcements, isLoading } = useCollection<Announcement>(announcementsQuery);

  const handleAddAnnouncement = (data: AnnouncementFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);

    const announcementData = {
      message: data.message,
      active: false, // New announcements are inactive by default
      createdAt: serverTimestamp(),
    };

    const announcementsCollection = collection(firestore, 'announcements');
    addDoc(announcementsCollection, announcementData)
      .then(() => {
        toast({
          title: 'Announcement Created',
          description: 'The new announcement has been added.',
        });
        form.reset();
      })
      .catch((error) => {
        console.error('Error creating announcement:', error);
        const permissionError = new FirestorePermissionError({
            path: announcementsCollection.path,
            operation: 'create',
            requestResourceData: announcementData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Creation Failed',
          description: 'Could not create the announcement.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleSetActive = async (announcementToActivate: Announcement) => {
    if (!firestore || !announcements || announcementToActivate.active) return;
    
    const batch = writeBatch(firestore);

    // Deactivate any currently active announcements
    announcements.forEach(ann => {
      if (ann.active) {
        const annRef = doc(firestore, 'announcements', ann.id);
        batch.update(annRef, { active: false });
      }
    });

    // Activate the new one
    const newActiveRef = doc(firestore, 'announcements', announcementToActivate.id);
    batch.update(newActiveRef, { active: true });

    try {
      await batch.commit();
      toast({
        title: 'Active Announcement Updated',
        description: 'The new announcement is now live.',
      });
    } catch (error) {
       console.error('Error setting active announcement:', error);
        const permissionError = new FirestorePermissionError({
            path: `announcements (batch operation)`,
            operation: 'update',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not set the active announcement.',
        });
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!firestore) return;
    const annRef = doc(firestore, 'announcements', announcementId);
    
    try {
        await deleteDoc(annRef);
        toast({
            title: 'Announcement Deleted',
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        const permissionError = new FirestorePermissionError({
            path: annRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: 'Could not delete the announcement.',
        });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Announcements</h1>
        <p className="text-muted-foreground">Create and manage site-wide announcements for customers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create New Announcement</CardTitle>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddAnnouncement)}>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter announcement message..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Announcement
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Existing Announcements</CardTitle>
              <CardDescription>Only one announcement can be active at a time.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements?.map((ann) => (
                      <TableRow key={ann.id}>
                        <TableCell className="max-w-xs">
                          <p className="truncate">{ann.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {ann.createdAt ? format((ann.createdAt as any).toDate(), 'PP') : 'N/A'}
                          </p>
                        </TableCell>
                        <TableCell>
                          {ann.active ? (
                            <Badge><CheckCircle className="mr-1 h-3 w-3" /> Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetActive(ann)}
                            disabled={ann.active}
                          >
                            Set Active
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(ann.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
               {!isLoading && (!announcements || announcements.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                      <Megaphone className="mx-auto h-12 w-12" />
                      <p className="mt-4">No announcements found.</p>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
