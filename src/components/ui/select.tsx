'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

const Select = ({
  children,
  value,
  onValueChange,
  defaultValue
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}) => {
  const [internalOpen, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');

  const val = value !== undefined ? value : internalValue;
  const onChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value: val, onValueChange: onChange, open: internalOpen, setOpen }}>
      <div className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface-card px-3 py-2 text-sm ring-offset-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => context.setOpen(!context.open)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = ({ placeholder, className }: { placeholder?: string; className?: string }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');

  // This is a bit tricky without knowing all item labels. 
  // For simplicity, we just show the value or placeholder.
  return <span className={cn('truncate', className)}>{context.value || placeholder}</span>;
};

const SelectContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');

  if (!context.open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => context.setOpen(false)} />
      <div
        className={cn(
          'absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface-card p-1 shadow-md animate-in fade-in zoom-in-95',
          className
        )}
      >
        {children}
      </div>
    </>
  );
};

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');

  const isSelected = context.value === value;

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-surface-hover focus:bg-surface-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        isSelected && 'bg-surface-hover font-medium',
        className
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
