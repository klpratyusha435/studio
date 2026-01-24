'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Coffee, User, Building, ShieldCheck, Loader2 } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';

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
import { useSession, emailPasswordSignIn, emailPasswordRegister } from '@/hooks/use-session';
import type { Role, Cafe } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const registerSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    role: z.enum(['Customer', 'Vendor'], { required_error: 'You must select a role.' }),
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
type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterForm() {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: '', email: '', password: '', role: 'Customer' },
    });

    const selectedRole = form.watch('role');

    const cafesQuery = useMemoFirebase(() => {
        if (selectedRole === 'Vendor' && firestore) {
            return query(
                collection(firestore, 'cafes'),
                where('approved', '==', true),
                where('isDisabled', '==', false)
            );
        }
        return null;
    }, [selectedRole, firestore]);

    const { data: cafes, isLoading: isLoadingCafes } = useCollection<Cafe>(cafesQuery);

    const onSubmit = async (data: RegisterFormValues) => {
        setIsSubmitting(true);
        try {
            const cafe = cafes?.find(c => c.id === data.cafeId);
            await emailPasswordRegister(
                data.email,
                data.password,
                data.name,
                data.role,
                cafe ? { cafeId: cafe.id, cafeName: cafe.name } : undefined
            );
            // The useSession hook will detect the new user and the layout will redirect.
            toast({
                title: "Registration Successful",
                description: "Welcome! You are now being redirected.",
            });
        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: error.message || 'An unknown error occurred.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
         <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="name-register">Name</Label>
              <Input id="name-register" placeholder="Enter your name" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-sm font-medium text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-register">Email</Label>
              <Input id="email-register" placeholder="you@example.com" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-sm font-medium text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-register">Password</Label>
              <Input id="password-register" type="password" placeholder="••••••••" {...form.register('password')} />
              {form.formState.errors.password && <p className="text-sm font-medium text-destructive">{form.formState.errors.password.message}</p>}
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
                    className="grid grid-cols-2 gap-4"
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
                        {cafes?.map((cafe) => (
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Sign Up
            </Button>
          </CardFooter>
        </form>
    )
}

function LoginForm() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsSubmitting(true);
        try {
            if (data.email === 'admin' && data.password === 'password') {
                // This will sign into a pre-configured admin account in Firebase.
                // Ensure 'admin@admin.com' with 'password' exists.
                await emailPasswordSignIn('admin@admin.com', 'password');
            } else {
                await emailPasswordSignIn(data.email, data.password);
            }
            toast({ title: 'Login Successful', description: "You are now being redirected." });
        } catch (error: any) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'Invalid credentials. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email-login">Email or Username</Label>
                    <Input id="email-login" placeholder="you@example.com" {...form.register('email')} />
                    {form.formState.errors.email && <p className="text-sm font-medium text-destructive">{form.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password-login">Password</Label>
                    <Input id="password-login" type="password" placeholder="••••••••" {...form.register('password')} />
                    {form.formState.errors.password && <p className="text-sm font-medium text-destructive">{form.formState.errors.password.message}</p>}
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    Sign In
                </Button>
            </CardFooter>
        </form>
    );
}

export default function LoginPage() {
    const { session, isLoading } = useSession();
    const router = useRouter();

    // If session is loaded and exists, redirect to appropriate dashboard
    useEffect(() => {
        if (!isLoading && session) {
            switch (session.role) {
                case 'Admin': router.replace('/a/dashboard'); break;
                case 'Customer': router.replace('/c/dashboard'); break;
                case 'Vendor': router.replace('/v/dashboard'); break;
                default: router.replace('/');
            }
        }
    }, [session, isLoading, router]);


    // While loading session, show a loader to prevent flicker
    if (isLoading || session) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </main>
        )
    }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/40">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
        </TabsList>
        <Card className="shadow-2xl">
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-2 mb-2">
                    <Coffee className="h-8 w-8 text-primary" />
                    <CardTitle className="font-headline text-4xl">CampusCafe</CardTitle>
                </div>
                <CardDescription>Welcome! Please sign in or create an account.</CardDescription>
            </CardHeader>
            <TabsContent value="login">
                <LoginForm />
            </TabsContent>
            <TabsContent value="register">
                <RegisterForm />
            </TabsContent>
        </Card>
      </Tabs>
    </main>
  );
}
