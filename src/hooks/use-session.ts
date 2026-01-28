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
  const auth = getAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const hasRedirected = useRef(false);

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This effect synchronizes the session state and performs validation.
  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    if (!firebaseUser) {
      setSession(null);
      setIsLoading(false);
      hasRedirected.current = false;
      return;
    }

    const attemptedRole = sessionStorage.getItem(LOGIN_ROLE_KEY) as Role | null;
    const isAdminEmail = firebaseUser.email === 'admin@admin.com';

    // This logic runs for every auth state change, including direct logins and session persistence.
    const validateAndSetSession = async () => {
      // ---- ADMIN VALIDATION ----
      if (isAdminEmail) {
        if (attemptedRole && attemptedRole !== 'Admin') {
          toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid role selected for the admin account.' });
          signOut(auth);
          return;
        }
        // Valid admin login or session persistence
        setSession({ uid: firebaseUser.uid, name: 'Admin', email: firebaseUser.email, role: 'Admin', loyaltyPoints: 0, createdAt: serverTimestamp() });
        setIsLoading(false);
        return;
      }
      
      // ---- USER VALIDATION ----
      const userProfileRef = doc(firestore, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userProfileRef);

      if (docSnap.exists()) {
        const storedProfile = docSnap.data() as UserProfile;
        // If it was a direct login attempt, verify the selected role.
        if (attemptedRole && attemptedRole !== storedProfile.role) {
          toast({ variant: 'destructive', title: 'Role Mismatch', description: `You selected ${attemptedRole}, but your account is a ${storedProfile.role}.` });
          signOut(auth);
          return;
        }
        // Success: Roles match or it's a session refresh.
        setSession({ uid: firebaseUser.uid, ...storedProfile });
        setIsLoading(false);
      } else {
        // This is a critical error: user in Auth but not Firestore.
        toast({ variant: 'destructive', title: 'Login Failed', description: 'Your user profile was not found. Please contact support.' });
        signOut(auth);
      }
    };

    validateAndSetSession();

    // Clean up the temporary role storage after validation attempt.
    if (attemptedRole) {
      sessionStorage.removeItem(LOGIN_ROLE_KEY);
    }
  }, [firebaseUser, isAuthLoading, firestore, auth, toast]);

  // This effect handles redirection after the session state is finalized.
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
    await signOut(auth);
    setSession(null);
    setIsLoading(false);
    hasRedirected.current = false;
    sessionStorage.removeItem(LOGIN_ROLE_KEY); // Clean up on logout too
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
  // Store the role for onAuthStateChanged to pick up for validation.
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
