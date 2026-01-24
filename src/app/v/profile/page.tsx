'use client';

import { useSession } from '@/hooks/use-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Building } from 'lucide-react';
import { LogoutButton } from '@/components/LogoutButton';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { session } = useSession();

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold">Your Profile</h1>
        <p className="text-muted-foreground">Manage your vendor account settings.</p>
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
              <CardDescription>{session.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Building className="h-5 w-5" />
                    <p className="font-medium text-lg">{session.cafeName}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
                    <Button variant="outline" disabled>
                        <User className="mr-2" />
                        Edit Profile (soon)
                    </Button>
                    <LogoutButton />
                </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
