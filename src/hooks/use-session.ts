"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getAuth
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
    if (userProfile) {
      // Profile found, create the session.
      setSession({
        uid: firebaseUser.uid,
        ...userProfile,
      });
    } else {
      // This is the critical case: user authenticated with Firebase, but no corresponding
      // profile document in Firestore. This is an invalid state for our app.
      // To prevent the user from being stuck, we should log them out.
      console.error(`Inconsistent state: User ${firebaseUser.uid} authenticated but no profile found. Logging out.`);
      signOut(getAuth());
      // The onAuthStateChanged listener will fire again, and this whole effect will run again
      // with firebaseUser = null, which will correctly set the session to null.
    }
  }, [firebaseUser, userProfile, isAuthLoading, isProfileLoading]);

  const logout = useCallback(async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      setSession(null);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }, []);
  
  const isLoading = isAuthLoading || (!!firebaseUser && isProfileLoading);

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
export async function emailPasswordSignIn(firestore: Firestore, email: string, password: string) {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // After successful auth, immediately check for the Firestore profile.
    const userProfileRef = doc(firestore, 'users', user.uid);
    const userProfileSnap = await getDoc(userProfileRef);

    if (!userProfileSnap.exists()) {
        // If profile doesn't exist, this is an invalid login for our app.
        // Sign the user out and throw an error to be caught by the login form.
        await signOut(auth);
        throw new Error("User profile not found. Please register first.");
    }
    
    return userCredential;
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
