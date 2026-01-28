'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useRef } from 'react';
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
  const hasRedirected = useRef(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) {
      return null;
    }
    // Admin user is a special case and does not have a profile document
    if (firebaseUser.email === 'admin@admin.com') {
      return null;
    }
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to synchronize session state from Firebase Auth and Firestore
  useEffect(() => {
    // If Firebase Auth is still loading, the overall session is loading.
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    // If there's no authenticated user, the session is null and not loading.
    if (!firebaseUser) {
      setSession(null);
      setIsLoading(false);
      hasRedirected.current = false;
      return;
    }

    // Handle the special case for the admin user.
    if (firebaseUser.email === 'admin@admin.com') {
      setSession({
        uid: firebaseUser.uid,
        name: 'Admin',
        email: firebaseUser.email,
        role: 'Admin',
        loyaltyPoints: 0,
        createdAt: serverTimestamp() // Placeholder
      });
      setIsLoading(false);
      return;
    }
    
    // Check if the user is brand new (to handle profile creation delay)
    const isNewUser = firebaseUser.metadata.creationTime === firebaseUser.metadata.lastSignInTime;

    // For regular users, we need to wait for their profile to load.
    if (isProfileLoading && isNewUser) {
      setIsLoading(true);
      return; // Wait for profile to load for new users
    }

    // Once profile is loaded (or if it's an existing user), create the session.
    if (userProfile) {
      setSession({ uid: firebaseUser.uid, ...userProfile });
      setIsLoading(false);
    } else if (!isProfileLoading && !userProfile) {
      // This is a critical error state: user exists in Auth but not Firestore.
      // This shouldn't happen in normal flow but could if a doc is deleted manually.
      console.error(`Inconsistent state: User ${firebaseUser.uid} authenticated but no profile found. Logging out.`);
      signOut(getAuth());
      setSession(null);
      setIsLoading(false);
    }

  }, [firebaseUser, userProfile, isAuthLoading, isProfileLoading]);

  // Effect to handle redirection after session is resolved.
  useEffect(() => {
    // Don't redirect if still loading, already redirected, or not on the main page.
    if (isLoading || hasRedirected.current || pathname !== '/') {
      return;
    }
    
    if (session) {
      let targetPath = '';
      switch (session.role) {
        case 'Admin':
          targetPath = '/a/dashboard';
          break;
        case 'Vendor':
          targetPath = '/v/dashboard';
          break;
        case 'Customer':
          targetPath = '/c/dashboard';
          break;
      }
      
      if (targetPath) {
        hasRedirected.current = true;
        router.replace(targetPath);
      }
    }
  }, [session, isLoading, pathname, router]);

  const logout = useCallback(async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      setSession(null);
      setIsLoading(false);
      hasRedirected.current = false;
      router.replace('/');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  }, [router]);

  return React.createElement(SessionContext.Provider, { value: { session, isLoading, logout } }, children);
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

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
