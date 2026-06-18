import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NativeHeader({ 
  title, 
  backTo, 
  onClose, 
  actions,
  className 
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn(
      'sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border',
      'h-14 flex items-center justify-between px-4',
      className
    )}>
      <div className="flex items-center gap-2 w-12">
        {backTo && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-11 w-11 -ml-2"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-11 w-11 -ml-2"
          >
            <X className="w-6 h-6" />
          </Button>
        )}
      </div>

      <h1 className="text-base font-display font-bold flex-1 text-center">
        {title}
      </h1>

      <div className="flex items-center gap-2 w-12 justify-end">
        {actions}
      </div>
    </div>
  );
}