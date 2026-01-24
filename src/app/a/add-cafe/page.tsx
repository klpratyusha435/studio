'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const cafeSchema = z.object({
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
});

type CafeFormValues = z.infer<typeof cafeSchema>;

export default function AddCafePage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CafeFormValues>({
    resolver: zodResolver(cafeSchema),
    defaultValues: {
      name: '',
      openingTime: '09:00',
      closingTime: '17:00',
      avgPrepTimeMins: 15,
    },
  });

  const onSubmit = (data: CafeFormValues) => {
    if (!firestore) return;

    setIsSubmitting(true);

    const cafeData = {
      ...data,
      isOpen: false,
      approved: false,
      isDisabled: false,
      createdAt: serverTimestamp(),
    };
    
    const cafesCollection = collection(firestore, 'cafes');

    addDoc(cafesCollection, cafeData)
      .then(() => {
        toast({
          title: 'Cafe Created!',
          description: `${data.name} has been successfully created.`,
        });
        router.push('/a/cafes');
      })
      .catch((error) => {
        console.error('Error creating cafe: ', error);
        const permissionError = new FirestorePermissionError({
          path: cafesCollection.path,
          operation: 'create',
          requestResourceData: cafeData,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
          variant: 'destructive',
          title: 'Creation Failed',
          description: 'Could not create the cafe. Please try again.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Add New Cafe</h1>
        <p className="text-muted-foreground">Create a new cafe profile on the platform.</p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Cafe Details</CardTitle>
          <CardDescription>Fill out the form below to add a new cafe.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label>Cafe Name</Label>
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
                    <Label>Location Tag</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Label>Opening Time</Label>
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
                      <Label>Closing Time</Label>
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
                      <Label>Average Prep Time (minutes)</Label>
                      <FormControl>
                         <Input type="number" placeholder="e.g. 15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                 <Button type="button" variant="ghost" asChild>
                    <Link href="/a/cafes">Cancel</Link>
                 </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Cafe
                </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
