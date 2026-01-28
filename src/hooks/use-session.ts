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
import { doc, setDoc, getDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { Session, UserProfile, Role } from '@/lib/types';
import { useToast } from './use-toast';

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);


/**
 * Creates a user profile in Firestore if one does not already exist.
 * This is a self-healing mechanism to prevent inconsistent states.
 */
async function createProfileIfNotExists(db: Firestore, user: User) {
    const userProfileRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userProfileRef);

    if (!docSnap.exists()) {
        console.log(`Profile for user ${user.uid} not found. Creating a new one.`);
        const newUserProfile: Omit<UserProfile, 'createdAt'> = {
            name: user.displayName || user.email?.split('@')[0] || 'New User',
            email: user.email!,
            role: 'Customer', // All auto-created profiles default to Customer
            loyaltyPoints: 0,
        };
        await setDoc(userProfileRef, {
            ...newUserProfile,
            createdAt: serverTimestamp(),
        });
    }
}


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

  // Effect for self-healing: creates a profile if an authenticated user is missing one.
  useEffect(() => {
    if (firebaseUser && !isAuthLoading && !isProfileLoading && !userProfile && firestore) {
      // This is the "inconsistent state". An authenticated user has no profile.
      // Instead of logging out, we create one.
      createProfileIfNotExists(firestore, firebaseUser).catch(err => {
        console.error("Failed to auto-create user profile:", err);
        // If creation fails (e.g., permissions), we must log out to prevent being stuck.
        signOut(getAuth());
      });
    }
  }, [firebaseUser, isAuthLoading, isProfileLoading, userProfile, firestore]);

  // Effect to construct the final session object once all data is available.
  useEffect(() => {
    if (firebaseUser && userProfile) {
      setSession({
        uid: firebaseUser.uid,
        ...userProfile,
      });
    } else {
      setSession(null);
    }
  }, [firebaseUser, userProfile]);

  const isLoading = isAuthLoading || (!!firebaseUser && isProfileLoading && !userProfile);
  
  // Effect to handle redirection after a session is successfully established.
  useEffect(() => {
    // Wait until loading is fully complete.
    if (isLoading) return;

    // If we have a session and are on the root/login page, redirect.
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
          // Fallback for any unknown roles
          router.replace('/c/home');
          break;
      }
    }
  }, [session, isLoading, pathname, router]);

  const logout = useCallback(async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      setSession(null); // Explicitly clear our session state
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
  // This setDoc creates the profile immediately after auth creation.
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
