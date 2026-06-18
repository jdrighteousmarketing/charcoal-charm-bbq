import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import CartSheet from './CartSheet';
import PageTransition from '@/components/PageTransition';

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <CartSheet />
      </div>
      <div className="max-w-lg mx-auto pb-24">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>
      <BottomNav />
    </div>
  );
}