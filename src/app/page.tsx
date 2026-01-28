'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UtensilsCrossed, User, Building, ShieldCheck, Loader2 } from 'lucide-react';
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
import { useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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
    const firestore = useFirestore();
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
        form.clearErrors();
        try {
            const cafe = cafes?.find(c => c.id === data.cafeId);
            await emailPasswordRegister(
                firestore,
                data.email,
                data.password,
                data.name,
                data.role,
                cafe ? { cafeId: cafe.id, cafeName: cafe.name } : undefined
            );
            // On success, SessionProvider will handle redirection.
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                form.setError('email', { type: 'manual', message: 'This email is already registered. Please sign in instead.' });
            } else {
                 form.setError('root', { type: 'manual', message: error.message || 'An unexpected error occurred.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Role</FormLabel>
                        <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4 pt-2"
                        >
                            <FormItem>
                                <FormControl>
                                    <RadioGroupItem value="Customer" id="role-customer" className="sr-only" />
                                </FormControl>
                                <label htmlFor="role-customer" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                                    <User className="mb-3 h-6 w-6" />
                                    Customer
                                </label>
                            </FormItem>
                            <FormItem>
                                <FormControl>
                                    <RadioGroupItem value="Vendor" id="role-vendor" className="sr-only" />
                                </FormControl>
                                <label htmlFor="role-vendor" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer">
                                    <Building className="mb-3 h-6 w-6" />
                                    Vendor
                                </label>
                            </FormItem>
                        </RadioGroup>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                {selectedRole === 'Vendor' && (
                <FormField
                    control={form.control}
                    name="cafeId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cafe</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger disabled={isLoadingCafes}>
                                <SelectValue placeholder={isLoadingCafes ? 'Loading cafes...' : 'Select a cafe'} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {cafes?.map((cafe) => (
                            <SelectItem key={cafe.id} value={cafe.id}>
                                {cafe.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                )}
                 {form.formState.errors.root && <FormMessage>{form.formState.errors.root.message}</FormMessage>}
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
                </Button>
            </CardFooter>
            </form>
        </Form>
    )
}

function LoginForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const auth = useAuth();
    
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsSubmitting(true);
        form.clearErrors();
        try {
            await emailPasswordSignIn(auth, data.email, data.password);
            // On success, SessionProvider will handle redirection automatically.
            // The loading spinner on this page will continue until the redirect happens.
        } catch (error: any) {
            console.error(error);
            form.setError("root", { type: "manual", message: 'Invalid credentials. Please try again.' });
            setIsSubmitting(false); // Only stop loading on error. On success, the page will change.
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    {form.formState.errors.root && (
                        <FormMessage className="text-center pt-2">
                            {form.formState.errors.root.message}
                        </FormMessage>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                    </Button>
                </CardFooter>
            </form>
        </Form>
    );
}

export default function LoginPage() {
    const { session, isLoading } = useSession();

    // The user should see a loading state while the session is being determined.
    // If a session exists, the SessionProvider will redirect them.
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
                    <UtensilsCrossed className="h-8 w-8 text-primary" />
                    <CardTitle className="font-headline text-4xl">XLEats</CardTitle>
                </div>
                <CardDescription>Welcome to XLEats! Please sign in or create an account.</CardDescription>
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
