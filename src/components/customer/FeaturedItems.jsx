import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ImageModal from '@/components/customer/ImageModal';
import AddToCartButton from '@/components/customer/AddToCartButton';

export default function FeaturedItems() {
  const items = [
    {
      id: "demo-1",
      name: "Pit Stop Burger",
      description: "Classic burger with cheese, lettuce, tomato, and house sauce.",
      price: 8.99,
      image_url: "",
      is_available: true,
      is_featured: true,
    },
    {
      id: "demo-2",
      name: "Loaded Fries",
      description: "Crispy fries topped with cheese, bacon, and ranch.",
      price: 5.99,
      image_url: "",
      is_available: true,
      is_featured: true,
    },
    {
      id: "demo-3",
      name: "Chicken Basket",
      description: "Golden chicken strips served with fries.",
      price: 9.99,
      image_url: "",
      is_available: true,
      is_featured: true,
    },
  ];

  const [imageOpen, setImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  if (items.length === 0) return null;

  return (
    <div className="px-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-display font-bold">Today's Specials</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="min-w-[200px] snap-start"
          >
            <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
              {item.image_url ? (
                <div
                  className="relative h-32 cursor-pointer"
                  onClick={() => {
                    setSelectedImage(item.image_url);
                    setImageOpen(true);
                  }}
                >
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                    <Star className="w-3 h-3 mr-0.5" /> Featured
                  </Badge>
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl">
                  🍔
                </div>
              )}

              <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>

                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                )}

                <p className="text-primary font-bold text-sm mt-2">${item.price?.toFixed(2)}</p>

                <div className="mt-2">
                  <AddToCartButton menuItem={item} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <ImageModal
        imageUrl={selectedImage}
        open={imageOpen}
        onOpenChange={setImageOpen}
      />
    </div>
  );
}