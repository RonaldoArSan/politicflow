'use client';

import React, { useState } from 'react';
import { Bell, Search, Menu, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { SearchDialog } from '@/components/search/search-dialog';

interface TopBarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  onMenuClick: () => void;
}

export function TopBar({ title, breadcrumbs, onMenuClick }: TopBarProps) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchClick = () => {
    setSearchOpen(true);
  };

  return (
    <>
      <header className="h-16 border-b border-border/50 bg-surface-card/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-surface-hover text-text-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          {breadcrumbs ? (
            <nav className="flex items-center gap-1.5 text-xs font-semibold">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3 h-3 text-text-muted" />}
                  <span className={cn(
                    i === breadcrumbs.length - 1 
                      ? "text-accent font-bold" 
                      : "text-text-muted uppercase tracking-wider"
                  )}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          ) : title ? (
            <h2 className="text-lg font-bold font-headline text-text-primary">{title}</h2>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={handleSearchClick}
            className="hidden md:flex items-center gap-2 bg-surface-hover rounded-lg px-3 py-2 w-64 group hover:bg-surface-hover/80 transition-all"
          >
            <Search className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
            <span className="text-sm text-text-muted flex-1 text-left">Buscar...</span>
            <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-border px-1.5 text-[10px] font-medium text-text-muted">
              ⌘K
            </kbd>
          </button>

          {/* Search button for mobile */}
          <button
            onClick={handleSearchClick}
            className="md:hidden p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-surface-card" />
          </button>

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold ml-1">
            {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'PF'}
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
