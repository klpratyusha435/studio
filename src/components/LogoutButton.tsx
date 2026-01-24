"use client";

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const { logout } = useSession();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
