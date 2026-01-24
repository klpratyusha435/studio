"use client";

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { useSession } from '@/hooks/use-session';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function LogoutButton({ className, ...props }: ButtonProps) {
  const { logout } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    })
  };
  
  if (props.variant === 'ghost' && props.size === 'icon') {
     return (
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out" className={className} {...props}>
            <LogOut className="h-5 w-5" />
        </Button>
     )
  }

  return (
    <Button variant="destructive" onClick={handleLogout} className={cn("w-full justify-start sm:w-auto", className)} {...props}>
      <LogOut className="mr-2" />
      <span>Log Out</span>
    </Button>
  );
}
