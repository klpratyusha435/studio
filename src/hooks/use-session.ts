'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useAuth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getAuth,
  type Auth,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, type Firestore } from 'firebase/firestore';
import type { Session, UserProfile, Role } from '@/lib/types';
import { useToast } from './use-toast';

const LOGIN_ROLE_KEY = 'xleats-login-role';

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect for synchronizing session state with auth & firestore
  useEffect(() => {
    setIsLoading(true);
    if (isAuthLoading) {
      return;
    }

    if (!firebaseUser) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    // A user is authenticated, start the validation process.
    // Clear any previous session to prevent using stale data.
    setSession(null);

    const validateAndSetSession = async () => {
      const attemptedRole = sessionStorage.getItem(LOGIN_ROLE_KEY) as Role | null;
      const isAdminEmail = firebaseUser.email === 'admin@admin.com';

      // ---- ADMIN VALIDATION ----
      if (isAdminEmail) {
        // If the email is the admin email, we immediately grant admin access,
        // regardless of what role was selected on the login/signup form.
        setSession({ uid: firebaseUser.uid, name: 'Admin', email: firebaseUser.email!, role: 'Admin', loyaltyPoints: 0, createdAt: serverTimestamp() });
        if (attemptedRole) sessionStorage.removeItem(LOGIN_ROLE_KEY);
        setIsLoading(false);
        return;
      }
      
      // ---- USER VALIDATION ----
      const userProfileRef = doc(firestore, 'users', firebaseUser.uid);
      try {
        const docSnap = await getDoc(userProfileRef);

        if (docSnap.exists()) {
          const storedProfile = docSnap.data() as UserProfile;
          if (attemptedRole && attemptedRole !== storedProfile.role) {
            toast({ variant: 'destructive', title: 'Role Mismatch', description: `You selected ${attemptedRole}, but this account is registered as a ${storedProfile.role}.` });
            await signOut(auth);
          } else {
            setSession({ uid: firebaseUser.uid, ...storedProfile });
          }
        } else {
          toast({ variant: 'destructive', title: 'Login Failed', description: 'Your user profile was not found. Please register first or try again shortly.' });
          await signOut(auth);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({ variant: 'destructive', title: 'Login Error', description: 'Could not verify your user profile.' });
        await signOut(auth);
      } finally {
        if (attemptedRole) sessionStorage.removeItem(LOGIN_ROLE_KEY);
        setIsLoading(false);
      }
    };

    validateAndSetSession();
    
  }, [firebaseUser, isAuthLoading, firestore, auth, toast]);

  // Effect for handling redirection from the login page
  useEffect(() => {
    // Only redirect if we are on the homepage, not loading, but have a session.
    if (!isLoading && session && pathname === '/') {
      let targetPath = '';
      switch (session.role) {
        case 'Admin': targetPath = '/a/dashboard'; break;
        case 'Vendor': targetPath = '/v/dashboard'; break;
        case 'Customer': targetPath = '/c/dashboard'; break;
      }
      if (targetPath) {
        router.replace(targetPath);
      }
    }
  }, [session, isLoading, router, pathname]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setSession(null);
    setIsLoading(false);
    sessionStorage.removeItem(LOGIN_ROLE_KEY);
    router.replace('/');
  }, [auth, router]);

  return React.createElement(SessionContext.Provider, { value: { session, isLoading, logout } }, children);
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export async function emailPasswordSignIn(auth: Auth, email: string, password: string, role: Role) {
  sessionStorage.setItem(LOGIN_ROLE_KEY, role);
  return signInWithEmailAndPassword(auth, email, password);
}

export async function emailPasswordRegister(
  firestore: Firestore,
  email: string,
  password: string,
  name: string,
  role: Role,
  vendorDetails?: { cafeId: string; cafeName: string }
) {
  const auth = getAuth();
  // Store role for post-signup validation
  sessionStorage.setItem(LOGIN_ROLE_KEY, role);
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userProfile: Omit<UserProfile, 'createdAt'> = {
    name,
    email: user.email!,
    role,
    loyaltyPoints: 0,
  };

  if (role === 'Vendor' && vendorDetails) {
    userProfile.cafeId = vendorDetails.cafeId;
    userProfile.cafeName = vendorDetails.cafeName;
  }

  const userProfileRef = doc(firestore, 'users', user.uid);
  await setDoc(userProfileRef, {
    ...userProfile,
    createdAt: serverTimestamp(),
  });

  return userCredential;
}

export function useLogout() {
  const { logout: sessionLogout } = useSession();
  const { toast } = useToast();

  const logout = useCallback(async () => {
    await sessionLogout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  }, [sessionLogout, toast]);

  return logout;
}
