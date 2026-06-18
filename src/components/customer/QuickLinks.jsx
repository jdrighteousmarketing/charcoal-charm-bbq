import { Link } from 'react-router-dom';
import { UtensilsCrossed, Gift, Tag, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const links = [
  { path: '/menu', icon: UtensilsCrossed, label: 'Menu', color: 'bg-orange-500/10 text-orange-600' },
  { path: '/rewards', icon: Gift, label: 'Rewards', color: 'bg-emerald-500/10 text-emerald-600' },
  { path: '/promotions', icon: Tag, label: 'Deals', color: 'bg-violet-500/10 text-violet-600' },
  { path: '/contact', icon: Phone, label: 'Contact', color: 'bg-sky-500/10 text-sky-600' },
];

export default function QuickLinks() {
  return (
    <div className="grid grid-cols-4 gap-3 px-5">
      {links.map(({ path, icon: Icon, label, color }, i) => (
        <motion.div
          key={path}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Link
            to={path}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border hover:shadow-md transition-all duration-200"
          >
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}