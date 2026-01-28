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
    if (!firestore || !firebaseUser || firebaseUser.email === 'admin@admin.com') {
      return null;
    }
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser]);

  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useDoc<UserProfile>(userProfileRef);

  const [session, setSession] = useState<Session | null>(null);

  const isNewUser = firebaseUser && firebaseUser.metadata.creationTime === firebaseUser.metadata.lastSignInTime;
  // We are truly loading if:
  // 1. Firebase Auth is still determining the user.
  // 2. We have a user, but we are still fetching their Firestore profile.
  // 3. We have a NEW user, but their profile document hasn't appeared in Firestore yet.
  const isLoading = isAuthLoading || isProfileLoading || (isNewUser && !userProfile);

  // This effect synchronizes the session state based on auth and Firestore data.
  useEffect(() => {
    if (isLoading) {
      return; // Do nothing until all data sources are resolved.
    }

    if (!firebaseUser) {
      setSession(null);
      hasRedirected.current = false; // Reset redirect flag on logout
      return;
    }

    // Handle Admin user special case
    if (firebaseUser.email === 'admin@admin.com') {
      setSession({
        uid: firebaseUser.uid,
        name: 'Admin',
        email: firebaseUser.email,
        role: 'Admin',
        loyaltyPoints: 0,
        createdAt: serverTimestamp() // Placeholder
      });
      return;
    }

    // Handle regular users
    if (userProfile) {
      setSession({ uid: firebaseUser.uid, ...userProfile });
    } else {
      // If we are not loading and still have no profile, it's an inconsistent state.
      // This should only happen for an existing user whose profile was deleted, not a new user.
      console.error(`Inconsistent state: User ${firebaseUser.uid} authenticated but no profile found. Logging out.`);
      signOut(getAuth());
    }
  }, [firebaseUser, userProfile, isLoading]);

  // This separate effect handles redirection once the session is definitively set.
  useEffect(() => {
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
