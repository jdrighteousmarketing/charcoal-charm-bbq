import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Cake,
  ChevronRight,
  LogOut,
  Clock,
  Gift,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import CustomerQRCode from '@/components/customer/CustomerQRCode';
import NativeHeader from '@/components/customer/NativeHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const RESTAURANT_ID = 'pit_stop_mobile';

export default function Account() {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem('pitstop_demo_user') || '{}');

  const [profile, setProfile] = useState({
    name: savedUser.name || savedUser.email?.split('@')[0] || 'Customer',
    email: savedUser.email || 'customer@pitstop.com',
    phone: savedUser.phone || '',
    birthday: savedUser.birthday || '',
    address: savedUser.address || '',
    customer_id_code:
      savedUser.customer_id_code || savedUser.customer_code || 'PIT-12345',
    points_balance: savedUser.points_balance || 0,
  });

  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const orders = [];

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return;
    }

    localStorage.removeItem('pitstop_demo_user');
    toast.success('Account deleted successfully');
    navigate('/register');
  };

  const startEditing = () => {
    setForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      birthday: profile?.birthday || '',
      address: profile?.address || '',
    });

    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const updatedProfile = {
        ...profile,
        ...form,
      };

      const customerCode = updatedProfile.customer_id_code;

      const { error } = await supabase
        .from('customers')
        .update({
          name: updatedProfile.name,
          phone: updatedProfile.phone || null,
          birthday: updatedProfile.birthday || null,
          address: updatedProfile.address || null,
        })
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('customer_code', customerCode);

      if (error) {
        throw error;
      }

      setProfile(updatedProfile);

      localStorage.setItem(
        'pitstop_demo_user',
        JSON.stringify({
          ...savedUser,
          name: updatedProfile.name,
          email: updatedProfile.email,
          phone: updatedProfile.phone,
          birthday: updatedProfile.birthday,
          address: updatedProfile.address,
          customer_id_code: updatedProfile.customer_id_code,
          customer_code: updatedProfile.customer_id_code,
          points_balance: updatedProfile.points_balance,
          role: savedUser.role || 'user',
          loggedIn: true,
        })
      );

      setEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      console.error(error);
      toast.error('Could not update profile in Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('pitstop_demo_user');
    navigate('/register');
  };

  return (
    <div className="pb-4">
      {editing ? (
        <NativeHeader title="Edit Profile" backTo="/account" />
      ) : (
        <div className="px-5 pt-12 pb-2">
          <h1 className="text-2xl font-display font-bold">My Account</h1>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 mt-4 bg-card rounded-2xl border border-border p-5"
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>

          <div>
            <h2 className="font-display font-bold">
              {profile?.name || 'Customer'}
            </h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 h-11"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 h-11"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Birthday</Label>
              <Input
                type="date"
                value={form.birthday}
                onChange={(e) =>
                  setForm({ ...form, birthday: e.target.value })
                }
                className="mt-1 h-11"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 h-11"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                className="flex-1 h-11"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="flex-1 h-11"
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <InfoRow icon={Mail} label="Email" value={profile?.email} />
            <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
            <InfoRow
              icon={Cake}
              label="Birthday"
              value={
                profile?.birthday
                  ? (() => {
                      const [y, m, d] = profile.birthday.split('-');
                      return new Date(y, m - 1, d).toLocaleDateString();
                    })()
                  : null
              }
            />
            <InfoRow icon={MapPin} label="Address" value={profile?.address} />

            <Button
              variant="outline"
              className="w-full mt-3 h-11"
              onClick={startEditing}
            >
              Edit Profile
            </Button>
          </div>
        )}
      </motion.div>

      <CustomerQRCode customerIdCode={profile?.customer_id_code} />

      <div className="grid grid-cols-2 gap-3 px-5 mt-4">
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <Gift className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-display font-bold">
            {profile?.points_balance || 0}
          </p>
          <p className="text-xs text-muted-foreground">Points</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-display font-bold">{orders.length}</p>
          <p className="text-xs text-muted-foreground">Orders</p>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-2">
        <LinkRow label="Privacy Policy" href="#" />
        <LinkRow label="Terms of Service" href="#" />

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full p-3 bg-card rounded-xl border border-border text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>

        <button
          onClick={handleDeleteAccount}
          className="flex items-center gap-3 w-full p-3 bg-card rounded-xl border border-border text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">Delete Account</span>
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 min-h-[52px]">
      <Icon className="w-5 h-5 text-muted-foreground" />

      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm">{value || '—'}</p>
      </div>
    </div>
  );
}

function LinkRow({ label, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between min-h-[52px] px-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </a>
  );
}