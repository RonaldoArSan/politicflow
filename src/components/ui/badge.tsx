import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-primary text-white',
    secondary: 'border-transparent bg-surface-hover text-text-primary',
    destructive: 'border-transparent bg-danger text-white',
    outline: 'text-text-primary border-border',
    success: 'border-transparent bg-success/10 text-success',
    warning: 'border-transparent bg-warning/10 text-warning',
    info: 'border-transparent bg-info/10 text-info',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
