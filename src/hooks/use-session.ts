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
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
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

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) return null;
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (isAuthLoading) {
      // Still waiting for the initial auth state from Firebase.
      return;
    }

    if (!firebaseUser) {
      // User is not authenticated with Firebase, so there is no session.
      setSession(null);
      return;
    }

    // At this point, we have a firebaseUser. We need to wait for their profile.
    if (isProfileLoading) {
      return;
    }

    // Now we have the result of the profile fetch.
    const metadata = firebaseUser.metadata;
    // For a newly created user, creationTime and lastSignInTime are identical.
    // This allows us to differentiate a new user sign-up from an inconsistent state.
    const isNewUser =
      metadata.creationTime &&
      metadata.lastSignInTime &&
      metadata.creationTime === metadata.lastSignInTime;

    if (userProfile) {
      // Profile found, create the session.
      setSession({
        uid: firebaseUser.uid,
        ...userProfile,
      });
    } else if (isNewUser) {
      // This is a new user registration. The profile document is being created.
      // We do nothing and wait for the `useDoc` hook to receive the new profile.
    } else {
      // This is an existing user with a missing profile. This is an invalid state.
      console.error(`Inconsistent state: User ${firebaseUser.uid} authenticated but no profile found. Logging out.`);
      signOut(getAuth());
    }
  }, [firebaseUser, userProfile, isAuthLoading, isProfileLoading]);

  const isLoading = isAuthLoading || (!!firebaseUser && isProfileLoading);
  
  useEffect(() => {
    if (isLoading) return;

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
