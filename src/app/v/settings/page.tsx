'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from '@/hooks/use-session';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Cafe } from '@/lib/types';
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Loader2, Clock } from 'lucide-react';

const settingsSchema = z.object({
  avgPrepTimeMins: z.coerce.number().min(1, "Prep time must be at least 1 minute.").max(120, "Prep time cannot exceed 120 minutes."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function VendorSettingsPage() {
  const { session, isLoading: isSessionLoading } = useSession();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const cafeRef = useMemoFirebase(
    () => (firestore && session?.cafeId ? doc(firestore, 'cafes', session.cafeId) : null),
    [firestore, session?.cafeId]
  );
  const { data: cafe, isLoading: isCafeLoading, error } = useDoc<Cafe>(cafeRef);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: {
        avgPrepTimeMins: cafe?.avgPrepTimeMins || 0,
    }
  });
  
  const handleToggleOpen = (isOpen: boolean) => {
    if (!cafeRef) return;

    const updateData = { isOpen };
    updateDoc(cafeRef, updateData)
      .then(() => {
        toast({
          title: `Cafe is now ${isOpen ? 'Open' : 'Closed'}`,
          description: `Customers will now see your cafe as ${isOpen ? 'open for business' : 'temporarily closed'}.`,
        });
      })
      .catch((error) => {
        console.error("Error updating cafe status:", error);
        const permissionError = new FirestorePermissionError({
          path: cafeRef.path,
          operation: 'update',
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not update cafe status.',
        });
      });
  };
  
  const handlePrepTimeSubmit = (data: SettingsFormValues) => {
      if (!cafeRef) return;
      setIsSaving(true);
      const updateData = { avgPrepTimeMins: data.avgPrepTimeMins };

      updateDoc(cafeRef, updateData)
        .then(() => {
            toast({
                title: 'Preparation Time Updated',
                description: `Average prep time set to ${data.avgPrepTimeMins} minutes.`,
            });
        })
        .catch((error) => {
             console.error("Error updating prep time:", error);
            const permissionError = new FirestorePermissionError({
                path: cafeRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the prep time.',
            });
        })
        .finally(() => {
            setIsSaving(false);
        });
  }

  const isLoading = isSessionLoading || isCafeLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Cafe Settings</h1>
        <p className="text-muted-foreground">Manage your cafe's operational details.</p>
      </div>

      {isLoading ? (
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
      ) : cafe && (
         <div className="max-w-2xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Operating Status</CardTitle>
                    <CardDescription>Control whether your cafe appears open to customers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <Label htmlFor="is-open-switch" className="flex flex-col space-y-1">
                            <span>Open for Business</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Turn this off to temporarily hide your cafe from customers.
                            </span>
                        </Label>
                        <Switch
                            id="is-open-switch"
                            checked={cafe.isOpen}
                            onCheckedChange={handleToggleOpen}
                            aria-label="Toggle cafe open status"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preparation & Hours</CardTitle>
                     <CardDescription>Set customer expectations for order prep times.</CardDescription>
                </CardHeader>
                 <form onSubmit={form.handleSubmit(handlePrepTimeSubmit)}>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                             <Label htmlFor="avgPrepTimeMins">Average Prep Time (minutes)</Label>
                             <Input
                                id="avgPrepTimeMins"
                                type="number"
                                {...form.register('avgPrepTimeMins')}
                             />
                              {form.formState.errors.avgPrepTimeMins && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.avgPrepTimeMins.message}</p>
                            )}
                         </div>
                         <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
                            <Label>Stated Business Hours (Read-only)</Label>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 shrink-0" />
                                <span>{cafe.openingTime} – {cafe.closingTime}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">To change your official hours, please contact an administrator.</p>
                         </div>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Prep Time
                         </Button>
                    </CardFooter>
                 </form>
            </Card>
         </div>
      )}
    </div>
  );
}
