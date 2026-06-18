import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PromotionsManagement() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const { data: promotions = [] } = useQuery({
    queryKey: ['adminPromosList'],
    queryFn: () => base44.entities.Promotion.list(),
    initialData: [],
  });

  const createPromo = useMutation({
    mutationFn: (data) => base44.entities.Promotion.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminPromosList'] }); setDialog(false); toast.success('Promotion created!'); },
  });
  const updatePromo = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Promotion.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminPromosList'] }); setDialog(false); toast.success('Promotion updated!'); },
  });
  const deletePromo = useMutation({
    mutationFn: (id) => base44.entities.Promotion.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminPromosList'] }); toast.success('Promotion deleted'); },
  });

  const openDialog = (promo = null) => {
    setEditing(promo);
    setForm(promo ? { ...promo } : {
      title: '', description: '', image_url: '', promo_code: '', discount_type: 'percentage',
      discount_value: '', start_date: '', end_date: '', is_active: true, promotion_type: 'promotion',
    });
    setDialog(true);
  };

  const handleSave = () => {
    const data = { ...form, discount_value: parseFloat(form.discount_value) || 0 };
    if (editing) {
      updatePromo.mutate({ id: editing.id, data });
    } else {
      createPromo.mutate(data);
    }
  };

  const typeLabels = { promotion: 'Promotion', coupon: 'Coupon', limited_time: 'Limited Time' };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Promotions Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Create and manage promotions, coupons, and limited-time offers</p>
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="w-4 h-4" /> Add Promotion
        </Button>
      </div>

      <div className="space-y-2">
        {promotions.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No promotions yet</CardContent></Card>
        ) : (
          promotions.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(promo => (
            <Card key={promo.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{promo.title}</h3>
                    <Badge variant="outline" className="text-[10px]">{typeLabels[promo.promotion_type] || 'Promotion'}</Badge>
                    {!promo.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    {promo.promo_code && <span>Code: {promo.promo_code}</span>}
                    {promo.start_date && <span>From: {promo.start_date}</span>}
                    {promo.end_date && <span>Until: {promo.end_date}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(promo)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePromo.mutate(promo.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Promotion' : 'Add Promotion'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div><Label>Image URL</Label><Input value={form.image_url || ''} onChange={e => setForm({ ...form, image_url: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.promotion_type || 'promotion'} onValueChange={v => setForm({ ...form, promotion_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="coupon">Coupon</SelectItem>
                  <SelectItem value="limited_time">Limited Time Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Promo Code</Label><Input value={form.promo_code || ''} onChange={e => setForm({ ...form, promo_code: e.target.value })} className="mt-1" placeholder="e.g. SAVE20" /></div>
            <div>
              <Label>Discount Type</Label>
              <Select value={form.discount_type || 'percentage'} onValueChange={v => setForm({ ...form, discount_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                  <SelectItem value="bogo">Buy One Get One</SelectItem>
                  <SelectItem value="free_item">Free Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Discount Value</Label><Input type="number" value={form.discount_value || ''} onChange={e => setForm({ ...form, discount_value: e.target.value })} className="mt-1" /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} className="mt-1" /></div>
            <div><Label>End Date</Label><Input type="date" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} className="mt-1" /></div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.is_active ?? true} onCheckedChange={v => setForm({ ...form, is_active: v })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title || createPromo.isPending || updatePromo.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}