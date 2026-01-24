'use client';
import { collection, doc, writeBatch, serverTimestamp, Firestore } from 'firebase/firestore';
import type { Cafe, MenuItem, Announcement } from './types';

const cafesToSeed: Omit<Cafe, 'id' | 'createdAt'>[] = [
    {
        name: 'The Daily Grind',
        locationTag: 'academic_block',
        isOpen: true,
        openingTime: '07:00',
        closingTime: '19:00',
        avgPrepTimeMins: 10,
        approved: true,
        isDisabled: false,
    },
    {
        name: 'Java Junction',
        locationTag: 'gate',
        isOpen: true,
        openingTime: '09:00',
        closingTime: '22:00',
        avgPrepTimeMins: 15,
        approved: true,
        isDisabled: false,
    },
    {
        name: 'Brew & Bites',
        locationTag: 'hostel',
        isOpen: false,
        openingTime: '10:00',
        closingTime: '20:00',
        avgPrepTimeMins: 12,
        approved: true,
        isDisabled: false,
    }
];

const menuItemsToSeed: Omit<MenuItem, 'id' | 'updatedAt' | 'cafeId'>[] = [
    { name: 'Espresso', price: 2.50, isVeg: true, isAvailable: true, isPopular: true },
    { name: 'Cappuccino', price: 3.50, isVeg: true, isAvailable: true, isPopular: true },
    { name: 'Latte', price: 4.00, isVeg: true, isAvailable: true, isPopular: false },
    { name: 'Chicken Sandwich', price: 5.50, isVeg: false, isAvailable: true, isPopular: true },
    { name: 'Veggie Wrap', price: 4.50, isVeg: true, isAvailable: true, isPopular: false },
    { name: 'Croissant', price: 2.75, isVeg: true, isAvailable: false, isPopular: false },
];

const announcementToSeed: Omit<Announcement, 'id' | 'createdAt'> = {
    message: 'Welcome to CampusCafe! All cafes are now open for the new semester.',
    active: true,
};

export const seedDatabase = async (db: Firestore) => {
    const batch = writeBatch(db);

    // Seed Cafes and their Menu Items
    cafesToSeed.forEach(cafeData => {
        const cafeRef = doc(collection(db, 'cafes'));
        batch.set(cafeRef, {
            ...cafeData,
            createdAt: serverTimestamp(),
        });

        menuItemsToSeed.forEach(itemData => {
            const itemRef = doc(collection(db, `cafes/${cafeRef.id}/menuItems`));
            batch.set(itemRef, {
                ...itemData,
                updatedAt: serverTimestamp(),
            });
        });
    });

    // Seed Announcement
    const announcementRef = doc(collection(db, 'announcements'));
    batch.set(announcementRef, {
        ...announcementToSeed,
        createdAt: serverTimestamp(),
    });
    
    console.log("Seeding database...");
    await batch.commit();
    console.log("Database seeded successfully!");
};
