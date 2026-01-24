"use client";
import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface SavedLocation {
  type: string;
  label: string;
}

const LOCATIONS_KEY = 'xleats-locations';

interface ProfileLocationsContextType {
  locations: SavedLocation[];
  addLocation: (location: SavedLocation) => void;
  removeLocation: (location: SavedLocation) => void;
  isLoading: boolean;
}

const ProfileLocationsContext = createContext<ProfileLocationsContextType | undefined>(undefined);

export function ProfileLocationsProvider({ children }: { children: ReactNode }) {
    const [locations, setLocations] = useState<SavedLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedLocations = localStorage.getItem(LOCATIONS_KEY);
            if (storedLocations) {
                setLocations(JSON.parse(storedLocations));
            }
        } catch (error) {
            console.error("Failed to parse locations from localStorage", error);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (!isLoading) {
            try {
                localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
            } catch (error) {
                console.error("Failed to save locations to localStorage", error);
            }
        }
    }, [locations, isLoading]);

    const addLocation = useCallback((location: SavedLocation) => {
        setLocations(prevLocations => {
            // Avoid duplicates
            if (prevLocations.some(l => l.label.toLowerCase() === location.label.toLowerCase() && l.type === location.type)) {
                return prevLocations;
            }
            return [...prevLocations, location];
        });
    }, []);

    const removeLocation = useCallback((locationToRemove: SavedLocation) => {
        setLocations(prevLocations => prevLocations.filter(l => l.label !== locationToRemove.label || l.type !== locationToRemove.type));
    }, []);
    
    const value = { locations, addLocation, removeLocation, isLoading };

    return React.createElement(ProfileLocationsContext.Provider, { value }, children);
}

export function useProfileLocations() {
    const context = useContext(ProfileLocationsContext);
    if (context === undefined) {
        throw new Error('useProfileLocations must be used within a ProfileLocationsProvider');
    }
    return context;
}
