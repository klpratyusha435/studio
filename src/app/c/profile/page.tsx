'use client';

import { useSession, useLogout } from '@/hooks/use-session';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin, Trash2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfileLocations, type SavedLocation } from '@/hooks/use-profile-locations';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const locationSchema = z.object({
  type: z.string().min(1, 'Please select a location type.'),
  label: z.string().min(3, 'Label must be at least 3 characters.'),
});

type LocationFormValues = z.infer<typeof locationSchema>;

export default function ProfilePage() {
  const { session } = useSession();
  const { locations, addLocation, removeLocation } = useProfileLocations();
  const { toast } = useToast();
  const logout = useLogout();

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
  });

  const handleAddLocation = (data: LocationFormValues) => {
    addLocation(data);
    toast({
      title: 'Location Saved',
      description: `${data.label} has been added to your saved locations.`,
    });
    form.reset({ type: '', label: '' });
  };
  
  const handleRemoveLocation = (location: SavedLocation) => {
    removeLocation(location);
    toast({
        title: 'Location Removed',
        description: `${location.label} has been removed.`,
        variant: 'destructive'
    });
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and saved locations.</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {session && (
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage
                  src={`https://api.dicebear.com/8.x/initials/svg?seed=${session.name}`}
                  alt={session.name}
                />
                <AvatarFallback>{session.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{session.name}</CardTitle>
              <CardDescription>{session.role}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline">
                <User className="mr-2" />
                Edit Profile
              </Button>
              <Button variant="destructive" onClick={logout}>
                <LogOut className="mr-2" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Saved Delivery Locations</CardTitle>
            <CardDescription>
              Manage your frequently used delivery spots for faster checkouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {locations.length > 0 ? (
              <div className="space-y-2">
                {locations.map((loc, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{loc.label}</p>
                        <p className="text-sm text-muted-foreground capitalize">{loc.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveLocation(loc)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">You have no saved locations.</p>
            )}
          </CardContent>
          <CardFooter>
            <form onSubmit={form.handleSubmit(handleAddLocation)} className="w-full space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <div>
                        <Label>Location Type</Label>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
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
                  {form.formState.errors.type && <p className="text-sm font-medium text-destructive">{form.formState.errors.type.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <div>
                    <Label>Room / Office / Landmark</Label>
                    <Input {...form.register('label')} placeholder="e.g. Hostel B, Room 203" />
                  </div>
                   {form.formState.errors.label && <p className="text-sm font-medium text-destructive">{form.formState.errors.label.message}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full">Add New Location</Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
