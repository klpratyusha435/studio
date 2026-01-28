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

  // This effect SYNCHRONIZES the app's session state with the auth/firestore state
  useEffect(() => {
    if (isAuthLoading) {
      return; // Do nothing until auth is resolved
    }

    if (!firebaseUser) {
      setSession(null);
      hasRedirected.current = false; // Reset redirect flag on logout
      return;
    }
    
    // Handle Admin user
    if (firebaseUser.email === 'admin@admin.com') {
      setSession({
        uid: firebaseUser.uid,
        name: 'Admin',
        email: firebaseUser.email,
        role: 'Admin',
        loyaltyPoints: 0,
        createdAt: serverTimestamp()
      });
      return;
    }

    // For regular users, wait for their profile to load
    if (isProfileLoading) {
      return;
    }

    if (userProfile) {
      // If profile exists, create the session
      setSession({ uid: firebaseUser.uid, ...userProfile });
    } else {
      // Self-healing: Auth user exists, but Firestore profile doesn't. Create a default.
      console.warn(`Profile for user ${firebaseUser.uid} not found. Creating default Customer profile.`);
      const defaultProfile: Omit<UserProfile, 'createdAt'> = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
          email: firebaseUser.email!,
          role: 'Customer',
          loyaltyPoints: 0,
      };
      const newUserRef = doc(firestore, 'users', firebaseUser.uid);
      
      setDoc(newUserRef, { ...defaultProfile, createdAt: serverTimestamp() })
          .then(() => {
              // After creation, the useDoc hook will refetch and update userProfile,
              // which will cause this effect to run again and set the session correctly on the next render.
          })
          .catch(err => {
              console.error("Failed to create default user profile, logging out.", err);
              signOut(getAuth());
          });
    }

  }, [firebaseUser, userProfile, isAuthLoading, isProfileLoading, firestore]);

  // This separate effect handles REDIRECTION based on the synchronized session state
  useEffect(() => {
    // Don't redirect until loading is complete, if we're not on the login page, or if we've already redirected
    if (isLoading || pathname !== '/' || hasRedirected.current) {
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
        default:
          // Fallback, though should not be reached with proper role management
          targetPath = '/c/home';
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
