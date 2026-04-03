'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    // Initial theme detection
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    // Toggle based on the CURRENT state of the document
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (theme === null) return <div className="w-10 h-10" />;

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative p-2 rounded-lg transition-all duration-300 overflow-hidden group",
        "bg-surface-hover text-text-secondary hover:text-accent shadow-sm"
      )}
      aria-label="Alternar tema"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun 
          className={cn(
            "w-5 h-5 transition-all duration-500 absolute",
            theme === 'dark' ? "translate-y-8 opacity-0 rotate-90" : "translate-y-0 opacity-100 rotate-0"
          )} 
        />
        <Moon 
          className={cn(
            "w-5 h-5 transition-all duration-500 absolute",
            theme === 'light' ? "-translate-y-8 opacity-0 -rotate-90" : "translate-y-0 opacity-100 rotate-0"
          )} 
        />
      </div>
      
      {/* Background glow effect on hover */}
      <span className="absolute inset-0 bg-accent/5 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-lg" />
    </button>
  );
}
