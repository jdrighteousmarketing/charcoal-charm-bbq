import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ImageModal from './ImageModal';
import AddToCartButton from './AddToCartButton';

export default function MenuItemCard({ item, index }) {
  const [imageOpen, setImageOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex gap-3 bg-card rounded-2xl border border-border p-3 hover:shadow-md transition-shadow"
      >
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            onClick={() => setImageOpen(true)}
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
            🍽️
          </div>
        )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm truncate">{item.name}</h3>
          {item.is_sold_out && (
            <Badge variant="destructive" className="text-[10px] flex-shrink-0">
              Sold Out
            </Badge>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <p className={`font-bold text-sm mt-1.5 ${item.is_sold_out ? 'text-muted-foreground line-through' : 'text-primary'}`}>
          ${item.price?.toFixed(2)}
        </p>
        <div className="mt-2">
          <AddToCartButton menuItem={item} />
        </div>
      </div>
    </motion.div>
      <ImageModal 
        imageUrl={item.image_url} 
        open={imageOpen} 
        onOpenChange={setImageOpen} 
      />
    </>
  );
}