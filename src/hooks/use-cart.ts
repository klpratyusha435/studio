"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Cart, CartItem, MenuItem, Order } from '@/lib/types';
import { useToast } from './use-toast';

const CART_KEY = 'xleats-cart';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  addToCart: (item: MenuItem, cafe: {id: string, name: string}) => void;
  clearCartAndAddToCart: (item: MenuItem, cafe: { id: string; name: string }) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  reorder: (order: Order) => void;
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
    // This flag will track if an item was successfully added, so we can show a toast.
    let itemAdded = false;

    setCart(prevCart => {
      const newCartItem: CartItem = { 
        id: item.id,
        name: item.name,
        price: item.price,
        isVeg: item.isVeg,
        quantity: 1 
      };
      
      // Only proceed if the cart is empty or the cafe is the same.
      if (!prevCart || prevCart.cafeId === cafe.id) {
        itemAdded = true; // Mark that we are adding the item.
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
      
      // If cafes don't match, log an error and don't modify the cart.
      console.error("Attempted to add item from a different cafe without confirmation.");
      return prevCart; 
    });

    // Call toast outside of the setCart updater function.
    if (itemAdded) {
      toast({
          title: "Item Added",
          description: `${item.name} has been added to your cart.`,
      });
    }
  }, [toast]);
  
  const clearCartAndAddToCart = useCallback((item: MenuItem, cafe: {id: string, name: string}) => {
    const newCartItem: CartItem = { 
        id: item.id,
        name: item.name,
        price: item.price,
        isVeg: item.isVeg,
        quantity: 1 
    };
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
        if (newItems.length === 0) return null;
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
  
  const reorder = useCallback((order: Order) => {
    if (!order) return;

    const newCartItems: CartItem[] = order.items.map(orderItem => ({
        id: orderItem.itemId,
        name: orderItem.name,
        price: orderItem.price,
        isVeg: orderItem.isVeg,
        quantity: orderItem.quantity,
    }));

    const newCart: Cart = {
        cafeId: order.cafeId,
        cafeName: order.cafeName,
        items: newCartItems,
        specialInstructions: order.specialInstructions || '',
    };

    setCart(newCart);
    toast({
        title: "Cart Updated",
        description: `Items from a previous order at ${order.cafeName} have been added to your cart.`,
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

  const value: CartContextType = {
    cart,
    isLoading,
    addToCart,
    clearCartAndAddToCart,
    updateItemQuantity,
    removeItem,
    clearCart,
    reorder,
    setSpecialInstructions,
    getCartTotal,
    getCartItemCount,
  };

  return React.createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
