'use client';

import { useSession } from '@/hooks/use-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { LogoutButton } from '@/components/LogoutButton';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { session } = useSession();

  return (
    <div className="container mx-auto p-4 sm:p-8 pb-24">
       <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account settings.</p>
      </div>

      {session && (
        <Card className="max-w-md mx-auto">
            <CardHeader className="items-center text-center">
                 <Avatar className="w-24 h-24 mb-4">
                    <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${session.name}`} alt={session.name} />
                    <AvatarFallback>{session.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{session.name}</CardTitle>
                <CardDescription>{session.role}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                        <User className="mr-2" />
                        <span>Edit Profile</span>
                    </Button>
                     <div className="sm:hidden p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">Account Actions</h3>
                        <LogoutButton />
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

      <div className="mt-8 text-center text-muted-foreground">
        <p>More settings coming soon!</p>
      </div>
    </div>
  );
}
