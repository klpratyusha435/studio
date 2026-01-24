"use client";

import { useSession } from '@/hooks/use-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, UserCheck, BarChart, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { seedDatabase } from '@/lib/seed';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { session } = useSession();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSeed = async () => {
    try {
      await seedDatabase(firestore);
      toast({
        title: "Database Seeded",
        description: "Your Firestore database has been populated with initial data.",
      });
    } catch (error) {
      console.error("Error seeding database:", error);
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: "Could not seed the database. Check the console for errors.",
      });
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-headline font-bold">Administrator Panel</h2>
        <p className="text-muted-foreground">System-wide management and analytics. Welcome, {session?.name}.</p>
      </div>

       <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manage Cafes</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Approve & Edit</div>
            <p className="text-xs text-muted-foreground">
              Onboard new vendors and manage cafe details.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Management</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Oversee Roles</div>
            <p className="text-xs text-muted-foreground">
              View user activity and manage permissions.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Analytics</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View Trends</div>
            <p className="text-xs text-muted-foreground">
              Monitor overall sales and user engagement.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="font-headline">Your Admin Hub</CardTitle>
            <CardDescription>This is your control panel for CampusCafe. More features coming soon!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p>From here you'll be able to approve new vendor applications, disable cafes, view platform-wide statistics, and manage user roles.</p>
            <div>
              <Button onClick={handleSeed}>
                <Database className="mr-2 h-4 w-4" />
                Seed Database
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Populate the database with initial cafes, menu items, and announcements.
              </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
