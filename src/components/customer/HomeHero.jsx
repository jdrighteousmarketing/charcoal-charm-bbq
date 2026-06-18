import { MapPin, Clock, X, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

export default function HomeHero({ settings }) {
  const [showHours, setShowHours] = useState(false);

  if (!settings) return null;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayHours = settings.business_hours?.find((h) => h.day === today);

  const overlayColor = settings.overlay_color || '#000000';
  const overlayOpacity = settings.overlay_opacity ?? 0.5;

  const backgroundImage =
    settings.hero_image_url ||
    settings.background_image_url ||
    'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=800';

  const address = settings.address || settings.current_location || '';
  const phone = settings.phone || '';

  const openDirections = () => {
    if (!address) return;

    const destination = encodeURIComponent(address);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          window.open(
            `https://www.google.com/maps/dir/${latitude},${longitude}/${destination}`,
            '_blank'
          );
        },
        () => {
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
            '_blank'
          );
        }
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
        '_blank'
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-accent/90 rounded-b-3xl"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      />

      <div
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
      />

      <div className="relative px-6 pt-12 pb-8">
        <div className="flex items-center gap-4 mb-4">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.business_name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
              {settings.business_name?.[0] || '🍔'}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              {settings.business_name || 'Food Truck'}
            </h1>

            {settings.tagline && (
              <p className="text-white/80 text-sm mt-0.5">
                {settings.tagline}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs active:bg-white/30 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{phone}</span>
            </a>
          )}

          {address && (
            <button
              className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs active:bg-white/30 transition-colors"
              onClick={openDirections}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{address}</span>
            </button>
          )}

          {todayHours && (
            <button
              className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs active:bg-white/30 transition-colors"
              onClick={() => setShowHours(true)}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {todayHours.closed
                  ? 'Closed today'
                  : `${formatTime(todayHours.open)} – ${formatTime(todayHours.close)}`}
              </span>
            </button>
          )}
        </div>

        {showHours && settings.business_hours?.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={() => setShowHours(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative w-full max-w-md bg-card border border-border rounded-t-3xl p-6 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Hours of Operation
                </h2>

                <button
                  onClick={() => setShowHours(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {settings.business_hours.map((h) => {
                  const isToday = h.day === today;

                  return (
                    <div
                      key={h.day}
                      className={`flex justify-between items-center py-1.5 px-3 rounded-lg ${
                        isToday ? 'bg-primary/15 border border-primary/30' : ''
                      }`}
                    >
                      <span
                        className={`font-medium text-sm ${
                          isToday ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {h.day}
                      </span>

                      <span
                        className={`text-sm ${
                          h.closed
                            ? 'text-muted-foreground'
                            : isToday
                            ? 'text-primary'
                            : 'text-foreground'
                        }`}
                      >
                        {h.closed
                          ? 'Closed'
                          : `${formatTime(h.open)} – ${formatTime(h.close)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}