"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Coffee, User, Building, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSession } from '@/hooks/use-session';
import type { Cafe, Role } from '@/lib/types';
import { getApprovedCafes } from '@/lib/cafes';

const loginSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  role: z.enum(['Customer', 'Vendor', 'Admin'], { required_error: 'You must select a role.' }),
  cafeId: z.string().optional(),
}).refine(data => {
  if (data.role === 'Vendor') {
    return !!data.cafeId;
  }
  return true;
}, {
  message: 'Please select a cafe.',
  path: ['cafeId'],
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [isLoadingCafes, setIsLoadingCafes] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: '',
    },
  });

  const selectedRole = form.watch('role');

  useEffect(() => {
    if (selectedRole === 'Vendor') {
      setIsLoadingCafes(true);
      getApprovedCafes()
        .then(setCafes)
        .finally(() => setIsLoadingCafes(false));
    }
  }, [selectedRole]);

  const onSubmit = (data: LoginFormValues) => {
    const cafeName = cafes.find(c => c.id === data.cafeId)?.name;
    login({ ...data, cafeName });

    switch (data.role) {
      case 'Customer':
        router.push('/c/dashboard');
        break;
      case 'Vendor':
        router.push('/v/dashboard');
        break;
      case 'Admin':
        router.push('/a/dashboard');
        break;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Coffee className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-4xl">CampusCafe</CardTitle>
          </div>
          <CardDescription>Welcome! Please sign in to continue.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                {...form.register('name')}
              />
              {form.formState.errors.name && <p className="text-sm font-medium text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-3 gap-4"
                  >
                    <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                      <RadioGroupItem value="Customer" className="sr-only" />
                      <User className="mb-3 h-6 w-6" />
                      Customer
                    </Label>
                    <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                      <RadioGroupItem value="Vendor" className="sr-only" />
                      <Building className="mb-3 h-6 w-6" />
                      Vendor
                    </Label>
                    <Label className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                      <RadioGroupItem value="Admin" className="sr-only" />
                      <ShieldCheck className="mb-3 h-6 w-6" />
                      Admin
                    </Label>
                  </RadioGroup>
                  {form.formState.errors.role && <p className="text-sm font-medium text-destructive">{form.formState.errors.role.message}</p>}
                </div>
              )}
            />

            {selectedRole === 'Vendor' && (
              <Controller
                control={form.control}
                name="cafeId"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="cafe">Cafe</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger disabled={isLoadingCafes}>
                        <SelectValue placeholder={isLoadingCafes ? 'Loading cafes...' : 'Select a cafe'} />
                      </SelectTrigger>
                      <SelectContent>
                        {cafes.map((cafe) => (
                          <SelectItem key={cafe.id} value={cafe.id}>
                            {cafe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.cafeId && <p className="text-sm font-medium text-destructive">{form.formState.errors.cafeId.message}</p>}
                  </div>
                )}
              />
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Enter</Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
