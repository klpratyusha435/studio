"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Cart, CartItem, MenuItem, Cafe } from '@/lib/types';
import { useToast } from './use-toast';

const CART_KEY = 'campus-cafe-cart';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  addToCart: (item: MenuItem, cafe: {id: string, name: string}) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setSpecialInstructions: (instructions: string) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_KEY);
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        if (cart) {
          localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } else {
          localStorage.removeItem(CART_KEY);
        }
      } catch (error) {
        console.error("Failed to save cart to localStorage", error);
      }
    }
  }, [cart, isLoading]);

  const addToCart = useCallback((item: MenuItem, cafe: {id: string, name: string}) => {
    setCart(prevCart => {
      // This updater function should be pure.
      const newCartItem: CartItem = { ...item, quantity: 1 };
      
      if (!prevCart || prevCart.cafeId === cafe.id) {
        const existingItem = prevCart?.items.find(i => i.id === item.id);
        
        let newItems: CartItem[];
        if (existingItem) {
          newItems = prevCart.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        } else {
          newItems = [...(prevCart?.items || []), newCartItem];
        }
        
        return {
          cafeId: cafe.id,
          cafeName: cafe.name,
          items: newItems,
          specialInstructions: prevCart?.specialInstructions || '',
        };
      }
      
      // This case is handled by the confirmation dialog in the UI component.
      // If it's reached, we don't update the state.
      console.error("Attempted to add item from a different cafe without confirmation.");
      return prevCart; 
    });

    // The toast (side-effect) is now called outside the state updater.
    // The UI logic in MenuItemCard ensures this function is only called
    // when the item can be added, so it's safe to show the toast.
    toast({
        title: "Item Added",
        description: `${item.name} has been added to your cart.`,
    });
  }, [toast]);
  
  const clearCartAndAddToCart = useCallback((item: MenuItem, cafe: {id: string, name: string}) => {
    const newCartItem: CartItem = { ...item, quantity: 1 };
    setCart({
        cafeId: cafe.id,
        cafeName: cafe.name,
        items: [newCartItem],
        specialInstructions: ''
    });
    toast({
        title: "Cart Cleared & Item Added",
        description: `Your cart has been cleared. ${item.name} is now in your cart.`,
    });
  }, [toast]);


  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    setCart(prevCart => {
      if (!prevCart) return null;
      
      if (quantity <= 0) {
        const newItems = prevCart.items.filter(i => i.id !== itemId);
        if (newItems.length === 0) return null; // Clear cart if no items left
        return { ...prevCart, items: newItems };
      }
      
      const newItems = prevCart.items.map(i => i.id === itemId ? { ...i, quantity } : i);
      return { ...prevCart, items: newItems };
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    updateItemQuantity(itemId, 0);
  }, [updateItemQuantity]);
  
  const clearCart = useCallback(() => {
    setCart(null);
    toast({
        title: "Cart Cleared",
        description: "Your shopping cart has been emptied.",
    });
  }, [toast]);

  const setSpecialInstructions = useCallback((instructions: string) => {
    setCart(prevCart => {
      if (!prevCart) return null;
      return { ...prevCart, specialInstructions: instructions };
    });
  }, []);

  const getCartTotal = useCallback(() => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const getCartItemCount = useCallback(() => {
    if (!cart) return 0;
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const value = {
    cart,
    isLoading,
    addToCart,
    updateItemQuantity,
    removeItem,
    clearCart,
    setSpecialInstructions,
    getCartTotal,
    getCartItemCount,
    // This function is not part of the public context type, but is used by components
    // that have access to the full provider implementation.
    clearCartAndAddToCart, 
  };
  
  // A bit of a hack to expose clearCartAndAddToCart without adding it to the public context type.
  // This is safe because only components within this provider's scope can access it.
  const extendedValue = { ...value, clearCartAndAddToCart };

  return React.createElement(CartContext.Provider, { value: extendedValue }, children);
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
