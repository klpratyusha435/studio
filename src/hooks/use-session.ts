'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getAuth,
  type User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { Session, UserProfile, Role } from '@/lib/types';
import { useToast } from './use-toast';

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  // This hook will only run and fetch if firebaseUser is present AND it's not the admin.
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser || firebaseUser.email === 'admin@admin.com') {
      return null;
    }
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser]);

  // isProfileLoading will be false if userProfileRef is null (e.g. for admin).
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const [session, setSession] = useState<Session | null>(null);
  
  //isLoading is true if auth is loading, OR if a non-admin user is logged in but their profile is still loading.
  const isLoading = isAuthLoading || (!!firebaseUser && firebaseUser.email !== 'admin@admin.com' && isProfileLoading);

  // This is the primary effect for handling session creation and validation.
  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for Firebase Auth to be ready.
    }

    if (!firebaseUser) {
      setSession(null); // No authenticated user, so no session.
      return;
    }

    // Handle the special case for the Admin user.
    if (firebaseUser.email === 'admin@admin.com') {
      setSession({
        uid: firebaseUser.uid,
        name: 'Admin',
        email: firebaseUser.email,
        role: 'Admin',
        // Dummy values for properties not applicable to Admin.
        loyaltyPoints: 0,
        createdAt: serverTimestamp() 
      });
      return; // Admin session is set, no need to check Firestore.
    }

    // For all other users, we need to check their Firestore profile.
    if (!isProfileLoading) {
      if (userProfile) {
        // Profile exists, create a regular session.
        setSession({
          uid: firebaseUser.uid,
          ...userProfile,
        });
      } else {
        // Invalid state: User is authenticated but has no Firestore profile.
        // This can happen if a document is deleted manually or a signup process fails.
        // To prevent the app from being in a broken state, log the user out.
        console.error(`Inconsistent state: User ${firebaseUser.uid} authenticated but no Firestore profile found. Logging out.`);
        signOut(getAuth());
        setSession(null);
      }
    }
  }, [firebaseUser, userProfile, isAuthLoading, isProfileLoading]);

  // This effect handles redirecting the user after they have been successfully logged in.
  useEffect(() => {
    if (isLoading) return; // Don't redirect until session status is confirmed.

    // If there's an active session and the user is on the login page, redirect them.
    if (session && pathname === '/') {
      switch (session.role) {
        case 'Admin':
          router.replace('/a/dashboard');
          break;
        case 'Customer':
          router.replace('/c/dashboard');
          break;
        case 'Vendor':
          router.replace('/v/dashboard');
          break;
        default:
          router.replace('/c/home'); // Fallback redirect.
          break;
      }
    }
  }, [session, isLoading, pathname, router]);

  const logout = useCallback(async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      setSession(null);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  }, []);

  return React.createElement(SessionContext.Provider, { value: { session, isLoading, logout } }, children);
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

// Standalone auth functions
export async function emailPasswordSignIn(auth: Auth, email: string, password: string) {
  // This function simply authenticates. The SessionProvider handles profile validation.
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
  // Prevent registration with the reserved admin email.
  if (email.toLowerCase() === 'admin@admin.com') {
      throw new Error("This email address is reserved and cannot be used for registration.");
  }
  
  const auth = getAuth();
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
  // Create the Firestore profile document immediately after auth creation.
  await setDoc(userProfileRef, {
    ...userProfile,
    createdAt: serverTimestamp(),
  });

  return userCredential;
}

export function useLogout() {
  const { logout: sessionLogout } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const logout = useCallback(async () => {
    await sessionLogout();
    router.replace('/');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  }, [sessionLogout, router, toast]);

  return logout;
}
