import type { Cafe } from '@/lib/types';

const allCafes = [
  { id: 'cafe-1', name: 'The Daily Grind', approved: true, isDisabled: false },
  { id: 'cafe-2', name: 'Java Junction', approved: true, isDisabled: false },
  { id: 'cafe-3', name: 'Brew & Bites', approved: false, isDisabled: false },
  { id: 'cafe-4', name: 'The Roasting Room', approved: true, isDisabled: false },
  { id: 'cafe-5', name: 'Espresso Express', approved: true, isDisabled: true },
];

export const getApprovedCafes = async (): Promise<Cafe[]> => {
  // In a real app, this would be a Firestore query.
  // We simulate the async nature of a DB call.
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return allCafes
    .filter(cafe => cafe.approved && !cafe.isDisabled)
    .map(({ id, name }) => ({ id, name }));
};
