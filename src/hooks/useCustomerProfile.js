import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

const RESTAURANT_ID = 'pit_stop_mobile';

export function useCustomerProfile() {
  return useQuery({
    queryKey: ['customerProfile'],
    queryFn: async () => {
      const savedUser = JSON.parse(
        localStorage.getItem('pitstop_demo_user') || '{}'
      );

      if (!savedUser?.loggedIn) {
        return null;
      }

      const customerCode =
        savedUser.customer_code ||
        savedUser.customer_id_code ||
        '';

      if (!customerCode) {
        return {
          id: 'demo-profile-1',
          user_id: 'demo-user-1',
          name: savedUser.name || 'Customer',
          email: savedUser.email || 'customer@pitstop.com',
          phone: savedUser.phone || '',
          birthday: savedUser.birthday || '',
          address: savedUser.address || '',
          points_balance: 0,
          total_points_earned: 0,
          customer_id_code: 'PIT-12345',
          customer_code: 'PIT-12345',
        };
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('customer_code', customerCode)
        .single();

      if (error || !data) {
        console.error('Could not load customer profile:', error);

        return {
          id: 'demo-profile-1',
          user_id: 'demo-user-1',
          name: savedUser.name || 'Customer',
          email: savedUser.email || 'customer@pitstop.com',
          phone: savedUser.phone || '',
          birthday: savedUser.birthday || '',
          address: savedUser.address || '',
          points_balance: Number(savedUser.points_balance || 0),
          total_points_earned: Number(savedUser.total_points_earned || 0),
          customer_id_code: customerCode,
          customer_code: customerCode,
        };
      }

      const profile = {
        id: data.id,
        user_id: data.id,
        name: data.name || savedUser.name || 'Customer',
        email: data.email || savedUser.email || 'customer@pitstop.com',
        phone: data.phone || '',
        birthday: data.birthday || '',
        address: data.address || '',
        points_balance: Number(data.points_balance || 0),
        total_points_earned: Number(data.lifetime_points || 0),
        lifetime_spend: Number(data.lifetime_spend || 0),
        visit_count: Number(data.visit_count || 0),
        customer_id_code: data.customer_code || customerCode,
        customer_code: data.customer_code || customerCode,
      };

      localStorage.setItem(
        'pitstop_demo_user',
        JSON.stringify({
          ...savedUser,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          birthday: profile.birthday,
          address: profile.address,
          points_balance: profile.points_balance,
          total_points_earned: profile.total_points_earned,
          lifetime_points: profile.total_points_earned,
          customer_id_code: profile.customer_id_code,
          customer_code: profile.customer_code,
          role: savedUser.role || 'user',
          loggedIn: true,
        })
      );

      return profile;
    },
    staleTime: 1000 * 30,
  });
}