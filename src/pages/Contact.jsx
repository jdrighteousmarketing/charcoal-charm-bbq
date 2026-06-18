import { Phone, Mail, Globe, MapPin, ArrowLeft, Facebook, Instagram, Clock, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Contact() {
  const settings = {
    business_name: 'The Pit Stop',
    phone: '270-000-0000',
    email: 'orders@pitstopmobile.com',
    website: 'https://pitstopmobile.com',
    facebook_url: 'https://facebook.com',
    instagram_url: 'https://instagram.com',
    address: '123 Main Street, Lebanon, KY 40033',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=123+Main+Street+Lebanon+KY+40033',
    business_hours: [
      { day: 'Monday', hours: '10:00 AM – 8:00 PM' },
      { day: 'Tuesday', hours: '10:00 AM – 8:00 PM' },
      { day: 'Wednesday', hours: '10:00 AM – 8:00 PM' },
      { day: 'Thursday', hours: '10:00 AM – 8:00 PM' },
      { day: 'Friday', hours: '10:00 AM – 9:00 PM' },
      { day: 'Saturday', hours: '11:00 AM – 9:00 PM' },
      { day: 'Sunday', hours: '11:00 AM – 6:00 PM' },
    ],
  };

  const contactItems = [
    {
      icon: Phone,
      label: 'Call Us',
      value: settings.phone,
      href: `tel:${settings.phone}`,
    },
    {
      icon: Mail,
      label: 'Email',
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
    {
      icon: Globe,
      label: 'Website',
      value: settings.website,
      href: settings.website,
    },
    {
      icon: Facebook,
      label: 'Facebook',
      value: 'Visit our Facebook page',
      href: settings.facebook_url,
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: 'Follow us on Instagram',
      href: settings.instagram_url,
    },
  ];

  return (
    <div className="pb-4">
      <div className="px-5 pt-12 pb-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h1 className="text-2xl font-display font-bold">Contact Us</h1>
        <p className="text-sm text-muted-foreground mt-1">
          We&apos;d love to hear from you
        </p>
      </div>

      <div className="px-5 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-accent rounded-3xl p-5 text-white relative overflow-hidden"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -left-4 -bottom-8 w-24 h-24 bg-white/5 rounded-full" />

          <div className="relative">
            <p className="text-xs uppercase tracking-wider text-white/70">
              Welcome to
            </p>
            <h2 className="text-3xl font-display font-bold mt-1">
              {settings.business_name}
            </h2>
            <p className="text-sm text-white/80 mt-2">
              Fresh food, rewards, and fast service.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <a
                href={`tel:${settings.phone}`}
                className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm"
              >
                <Phone className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Call Now</span>
              </a>

              <a
                href={settings.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm"
              >
                <Navigation className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Directions</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-5 mt-5 space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 bg-card rounded-2xl border border-border p-4"
        >
          <div className="p-2.5 rounded-xl bg-primary/10">
            <MapPin className="w-5 h-5 text-primary" />
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Address
            </p>
            <p className="text-sm font-medium">{settings.address}</p>
          </div>
        </motion.div>

        {contactItems.map(({ icon: Icon, label, value, href }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.06 }}
          >
            <a
              href={href}
              target={href.startsWith('tel:') || href.startsWith('mailto:') ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-all"
            >
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            </a>
          </motion.div>
        ))}
      </div>

      <div className="px-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-base font-display font-bold">Business Hours</h2>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="space-y-2">
            {settings.business_hours.map((item) => (
              <div
                key={item.day}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{item.day}</span>
                <span className="font-medium">{item.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}