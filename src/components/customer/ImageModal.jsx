import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function ImageModal({ imageUrl, open, onOpenChange }) {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-[90vw] p-0 border-0 bg-transparent shadow-none">
        <div className="relative">
          <img
            src={imageUrl}
            alt="Full size"
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}