import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useEffect } from 'react';
import { useState } from 'react';
import { Search, Cake } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function EmployeeCustomerDirectory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user && user.role === 'owner_admin' || user?.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['employeeCustomers'],
    queryFn: () => base44.entities.CustomerProfile.list(),
    initialData: [],
  });

  const filteredCustomers = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(s) ||
           (c.email || '').toLowerCase().includes(s) ||
           (c.phone || '').toLowerCase().includes(s) ||
           (c.customer_id_code || '').toLowerCase().includes(s);
  });

  const upcomingBirthdays = customers
    .filter(c => c.birthday)
    .map(c => {
      const [year, month, day] = c.birthday.split('-').map(Number);
      const now = new Date();
      const thisYear = new Date(now.getFullYear(), month - 1, day);
      if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
      return { ...c, nextBirthday: thisYear, daysUntil: Math.ceil((thisYear - now) / (1000 * 60 * 60 * 24)) };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Customer Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">{customers.length} total customers</p>
        </div>
      </div>

      {/* Upcoming birthdays - view only, no send button */}
      {upcomingBirthdays.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cake className="w-4 h-4 text-pink-500" /> Upcoming Birthdays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {upcomingBirthdays.map(c => (
                <div key={c.id} className="min-w-[180px] bg-pink-50 dark:bg-pink-950/20 rounded-xl p-3 border border-pink-200/50 dark:border-pink-800/30 flex flex-col">
                  <p className="text-sm font-medium truncate text-gray-900 dark:text-pink-100">{c.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-600 dark:text-pink-200 mt-1">{(() => { const [y, m, d] = c.birthday.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); })()}</p>
                  <Badge className="mt-2 text-[10px] bg-pink-500/10 text-pink-600 w-fit">{c.daysUntil === 0 ? 'Today!' : `${c.daysUntil}d`}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, email, phone, or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Customer list */}
      <div className="space-y-2">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-card rounded-xl border animate-pulse" />)
        ) : filteredCustomers.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No customers found</CardContent></Card>
        ) : (
          filteredCustomers.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(c => (
            <Card key={c.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {(c.name || c.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{c.points_balance || 0} pts</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Joined {new Date(c.created_date).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}