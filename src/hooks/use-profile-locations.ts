"use client";

import React, { createContext, useContext, useCallback, type ReactNode } from 'react';
import { collection, doc, addDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useSession } from './use-session';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { SavedLocation } from '@/lib/types';
import { useToast } from './use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface ProfileLocationsContextType {
  locations: SavedLocation[];
  addLocation: (location: Omit<SavedLocation, 'id' | 'createdAt'>) => void;
  removeLocation: (locationId: string) => void;
  isLoading: boolean;
}

const ProfileLocationsContext = createContext<ProfileLocationsContextType | undefined>(undefined);

export function ProfileLocationsProvider({ children }: { children: ReactNode }) {
    const { session, isLoading: isSessionLoading } = useSession();
    const firestore = useFirestore();
    const { toast } = useToast();

    const locationsQuery = useMemoFirebase(() => {
        if (!firestore || !session?.uid) {
            return null;
        }
        return query(
            collection(firestore, 'users', session.uid, 'locations'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, session?.uid]);

    const { data: locations, isLoading: isLocationsLoading } = useCollection<SavedLocation>(locationsQuery);

    const addLocation = useCallback((location: Omit<SavedLocation, 'id' | 'createdAt'>) => {
        if (!firestore || !session?.uid) return;

        const locationsCollection = collection(firestore, 'users', session.uid, 'locations');
        const locationData = {
            ...location,
            createdAt: serverTimestamp(),
        };

        addDoc(locationsCollection, locationData)
        .catch(error => {
            console.error('Error adding location:', error);
            const permissionError = new FirestorePermissionError({
                path: locationsCollection.path,
                operation: 'create',
                requestResourceData: locationData,
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save the location.',
            });
        });
    }, [firestore, session?.uid, toast]);

    const removeLocation = useCallback((locationId: string) => {
        if (!firestore || !session?.uid) return;

        const locationRef = doc(firestore, 'users', session.uid, 'locations', locationId);
        deleteDoc(locationRef)
        .catch(error => {
            console.error('Error removing location:', error);
            const permissionError = new FirestorePermissionError({
                path: locationRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Remove Failed',
                description: 'Could not remove the location.',
            });
        });
    }, [firestore, session?.uid, toast]);
    
    const isLoading = isSessionLoading || isLocationsLoading;

    const value = { 
        locations: locations || [], 
        addLocation, 
        removeLocation, 
        isLoading 
    };

    return React.createElement(ProfileLocationsContext.Provider, { value }, children);
}

export function useProfileLocations() {
    const context = useContext(ProfileLocationsContext);
    if (context === undefined) {
        throw new Error('useProfileLocations must be used within a ProfileLocationsProvider');
    }
    return context;
}
