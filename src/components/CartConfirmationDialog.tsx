"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";

interface CartConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  newCafeName?: string;
  currentCafeName?: string;
}

export function CartConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  newCafeName,
  currentCafeName,
}: CartConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start a New Cart?</AlertDialogTitle>
          <AlertDialogDescription>
            Your cart contains items from{" "}
            <span className="font-bold">{currentCafeName}</span>. You can only
            order from one cafe at a time.
            <br />
            <br />
            Would you like to clear your current cart and add this item from{" "}
            <span className="font-bold">{newCafeName}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} asChild>
            <Button>Start New Cart</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
