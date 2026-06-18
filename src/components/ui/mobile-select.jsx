import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function MobileSelect({ 
  value, 
  onValueChange, 
  options, 
  placeholder = 'Select...',
  className,
  triggerClassName,
  label 
}) {
  const [open, setOpen] = React.useState(false);
  const selectedLabel = options.find(opt => opt.value === value)?.label;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full h-12 justify-between px-4',
            triggerClassName
          )}
        >
          <span className={cn('text-sm', !selectedLabel && 'text-muted-foreground')}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] pb-8">
        {label && (
          <h3 className="text-base font-semibold mb-4 px-1">{label}</h3>
        )}
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[60vh]">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onValueChange?.(option.value);
                setOpen(false);
              }}
              className={cn(
                'w-full text-left px-4 py-4 rounded-xl transition-colors',
                'min-h-[52px] flex items-center',
                value === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <span className="text-base font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}