'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from '@/components/ui/form';
import type { MenuItem } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const menuItemSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  isVeg: z.boolean(),
  isAvailable: z.boolean(),
  isPopular: z.boolean(),
});

export type MenuItemFormValues = z.infer<typeof menuItemSchema>;

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MenuItemFormValues) => void;
  isSaving: boolean;
  menuItem?: MenuItem | null;
}

export function MenuItemDialog({ open, onOpenChange, onSubmit, isSaving, menuItem }: MenuItemDialogProps) {
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      price: 0,
      isVeg: false,
      isAvailable: true,
      isPopular: false,
    },
  });
  
  React.useEffect(() => {
    if (open) {
      if (menuItem) {
        form.reset({
          name: menuItem.name,
          price: menuItem.price,
          isVeg: menuItem.isVeg,
          isAvailable: menuItem.isAvailable,
          isPopular: menuItem.isPopular,
        });
      } else {
        form.reset({
          name: '',
          price: 0,
          isVeg: false,
          isAvailable: true,
          isPopular: false,
        });
      }
    }
  }, [menuItem, form, open]);

  const dialogTitle = menuItem ? 'Edit Menu Item' : 'Add New Item';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Cappuccino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g. 150.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="isVeg"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel>Vegetarian</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="isPopular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <FormLabel>Popular</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
            </div>
             <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel>Available for Sale</FormLabel>
                   <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
                </DialogClose>
              <Button type="submit" disabled={!form.formState.isValid || isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
