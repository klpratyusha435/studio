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

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) return null;
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!firebaseUser) {
      setSession(null);
    } else if (userProfile) {
      setSession({
        uid: firebaseUser.uid,
        ...userProfile
      });
    }
  }, [firebaseUser, userProfile, isAuthLoading]);

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
export async function emailPasswordSignIn(email: string, password: string) {
    const auth = getAuth();
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
