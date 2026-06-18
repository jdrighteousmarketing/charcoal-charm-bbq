import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export function useBusinessSettings() {
  return useQuery({
    queryKey: ['businessSettings'],
    queryFn: async () => {
      const settings = await base44.entities.BusinessSettings.list();
      return settings[0] || null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}