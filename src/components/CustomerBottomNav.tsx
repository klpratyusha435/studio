'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListOrdered, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/c/home', label: 'Home', icon: Home },
  { href: '/c/orders', label: 'Orders', icon: ListOrdered },
  { href: '/c/profile', label: 'Profile', icon: User },
];

export function CustomerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-10 md:hidden print:hidden">
      <div className="flex justify-around items-center h-full">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href === '/c/orders' && pathname.startsWith('/c/order/'));
          return (
            <Link key={href} href={href} className="flex flex-col items-center justify-center text-muted-foreground w-full h-full">
              <Icon className={cn('h-6 w-6 mb-1', isActive && 'text-primary')} />
              <span className={cn('text-xs', isActive && 'text-primary font-bold')}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
