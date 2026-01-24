'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import type { Cafe } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const cafeEditSchema = z.object({
  name: z.string().min(3, { message: 'Cafe name must be at least 3 characters.' }),
  locationTag: z.enum(['hostel', 'gate', 'academic_block', 'quarters'], {
    required_error: 'Please select a location tag.',
  }),
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Please enter a valid time in HH:MM format.',
  }),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Please enter a valid time in HH:MM format.',
  }),
  avgPrepTimeMins: z.coerce.number().min(1, { message: 'Prep time must be at least 1 minute.' }),
  isOpen: z.boolean(),
  approved: z.boolean(),
  isDisabled: z.boolean(),
});

type CafeEditFormValues = z.infer<typeof cafeEditSchema>;

export default function EditCafePage() {
  const router = useRouter();
  const params = useParams();
  const cafeId = params.cafeId as string;
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cafeRef = useMemoFirebase(
    () => (firestore && cafeId ? doc(firestore, 'cafes', cafeId) : null),
    [firestore, cafeId]
  );
  const { data: cafe, isLoading: isLoadingCafe } = useDoc<Cafe>(cafeRef);

  const form = useForm<CafeEditFormValues>({
    resolver: zodResolver(cafeEditSchema),
  });

  useEffect(() => {
    if (cafe) {
      form.reset({
        name: cafe.name,
        locationTag: cafe.locationTag,
        openingTime: cafe.openingTime,
        closingTime: cafe.closingTime,
        avgPrepTimeMins: cafe.avgPrepTimeMins,
        isOpen: cafe.isOpen,
        approved: cafe.approved,
        isDisabled: cafe.isDisabled,
      });
    }
  }, [cafe, form]);

  const onSubmit = (data: CafeEditFormValues) => {
    if (!cafeRef) return;

    setIsSubmitting(true);
    
    updateDoc(cafeRef, data)
      .then(() => {
        toast({
          title: 'Cafe Updated',
          description: `${data.name} has been successfully updated.`,
        });
        router.push('/a/cafes');
      })
      .catch((error) => {
        console.error('Error updating cafe: ', error);
        const permissionError = new FirestorePermissionError({
          path: cafeRef.path,
          operation: 'update',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not update the cafe. Please try again.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  
  if (isLoadingCafe) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-10 w-1/4" />
              <Card className="max-w-2xl">
                  <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                  <CardContent className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                  </CardContent>
              </Card>
          </div>
      )
  }
  
  if (!cafe) {
      return (
          <div>
              <h1 className="text-xl">Cafe not found.</h1>
              <Button variant="ghost" asChild>
                  <Link href="/a/cafes"><ArrowLeft className="mr-2 h-4 w-4" />Back to cafes</Link>
              </Button>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4 -ml-4">
            <Link href="/a/cafes"><ArrowLeft className="mr-2 h-4 w-4" />Back to Cafe List</Link>
        </Button>
        <h1 className="text-3xl font-headline font-bold">Edit Cafe</h1>
        <p className="text-muted-foreground">Modify the details for {cafe.name}.</p>
      </div>
      <Card className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cafe Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. The Daily Grind" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Tag</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hostel">Hostel Zone</SelectItem>
                        <SelectItem value="gate">Main Gate</SelectItem>
                        <SelectItem value="academic_block">Academic Block</SelectItem>
                        <SelectItem value="quarters">Residential Quarters</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="openingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="closingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Closing Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                  control={form.control}
                  name="avgPrepTimeMins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Average Prep Time (minutes)</FormLabel>
                      <FormControl>
                         <Input type="number" placeholder="e.g. 15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator />

                <div className="space-y-4">
                    <FormField
                    control={form.control}
                    name="isOpen"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Open for Business</FormLabel>
                                <FormDescription>Is the cafe currently open?</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="approved"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Approved</FormLabel>
                                <FormDescription>Is this cafe approved to be on the platform?</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="isDisabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                             <div className="space-y-0.5">
                                <FormLabel>Disabled</FormLabel>
                                <FormDescription>Is this cafe temporarily disabled?</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                </div>

            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                 <Button type="button" variant="ghost" asChild>
                    <Link href="/a/cafes">Cancel</Link>
                 </Button>
                <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
