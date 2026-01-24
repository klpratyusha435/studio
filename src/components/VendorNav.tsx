'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListOrdered, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';

const navItems = [
  { href: '/v/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/v/orders', label: 'Orders', icon: ListOrdered },
  { href: '/v/menu', label: 'Menu', icon: Utensils },
];

export function VendorNav() {
  const pathname = usePathname();
  const { session } = useSession();

  return (
    <aside className="hidden md:flex flex-col gap-2 p-4 border-r bg-card w-60 print:hidden">
      <div className="font-semibold text-lg p-2">{session?.cafeName}</div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                isActive && 'bg-muted text-primary'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
