import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useCustomerProfile } from '@/hooks/useCustomerProfile';
import { toast } from 'sonner';

export default function AddToCartButton({ menuItem }) {
  const { data: customerProfile, isLoading } = useCustomerProfile();
  const { addToCart, isAdding } = useCart(customerProfile?.id);

  if (isLoading || !customerProfile) {
    return null;
  }

  const handleAddToCart = () => {
    console.log('Add to cart clicked:', menuItem.name);
    addToCart(menuItem, {
      onSuccess: () => {
        toast.success(`${menuItem.name} added to cart!`);
      },
      onError: (error) => {
        console.error('Failed to add to cart:', error);
        toast.error('Failed to add item');
      }
    });
  };

  const isDisabled = menuItem.is_sold_out || !menuItem.is_available;

  return (
    <Button
      size="sm"
      variant="default"
      className="w-full gap-1 text-xs h-8"
      onClick={handleAddToCart}
      disabled={isDisabled || isAdding}
    >
      {isAdding ? (
        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Plus className="w-3 h-3" />
      )}
      {isDisabled ? 'Unavailable' : 'Add to Cart'}
    </Button>
  );
}