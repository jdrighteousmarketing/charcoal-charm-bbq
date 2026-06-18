import { useState } from 'react';
import { QrCode, ScanLine } from 'lucide-react';
import QRScanner from '@/components/admin/QRScanner';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

function parseShortPitStopQR(code) {
  const raw = code?.toString().trim();

  if (!raw) {
    throw new Error('Empty QR code');
  }

  if (raw.startsWith('PS|')) {
    const parts = raw.split('|');

    if (parts.length < 8) {
      throw new Error('Short QR code is missing information');
    }

    const [
      ,
      customerCode,
      customerName,
      subtotal,
      taxAmount,
      total,
      pointsToEarn,
      itemText,
    ] = parts;

    const items = itemText
      ? itemText
          .split(',')
          .filter(Boolean)
          .map((itemChunk, index) => {
            const [name, quantity, price] = itemChunk.split('~');

            return {
              id: `qr_item_${index}`,
              name: decodeURIComponent(name || 'Item'),
              quantity: Number(quantity || 1),
              price: Number(price || 0),
            };
          })
      : [];

    return {
      customerCode: decodeURIComponent(customerCode || 'PIT-CUSTOMER'),
      customerName: decodeURIComponent(customerName || 'Customer'),
      subtotal: Number(subtotal || 0),
      taxAmount: Number(taxAmount || 0),
      total: Number(total || 0),
      pointsToEarn: Number(pointsToEarn || 0),
      items,
    };
  }

  const parsed = JSON.parse(raw);

  if (parsed?.type === 'pitstop_reward_checkout') {
    return {
      customerCode: parsed.customerCode || parsed.customerId || 'PIT-CUSTOMER',
      customerName: parsed.customerName || 'Customer',
      customerEmail: parsed.customerEmail || '',
      subtotal: Number(parsed.subtotal || 0),
      taxRate: Number(parsed.taxRate || 0),
      taxAmount: Number(parsed.taxAmount || 0),
      total: Number(parsed.total || 0),
      pointsToEarn: Number(parsed.pointsToEarn || 0),
      items: parsed.items || [],
    };
  }

  if (parsed?.t === 'ps_checkout') {
    return {
      customerCode: parsed.code || parsed.cid || 'PIT-CUSTOMER',
      customerName: parsed.name || 'Customer',
      subtotal: Number(parsed.sub || 0),
      taxAmount: Number(parsed.tax || 0),
      total: Number(parsed.total || 0),
      pointsToEarn: Number(parsed.pts || 0),
      items: (parsed.items || []).map((item, index) => ({
        id: `qr_item_${index}`,
        name: item.n || 'Item',
        quantity: Number(item.q || 1),
        price: Number(item.p || 0),
      })),
    };
  }

  throw new Error('Unsupported QR format');
}

export default function ScannerPage() {
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScan = async (code) => {
    setScanning(false);
    setLoading(true);

    try {
      const parsed = parseShortPitStopQR(code);

      if (!parsed.customerCode || parsed.pointsToEarn === undefined) {
        toast.error('Checkout QR code is missing customer or points information.');
        return;
      }

      const checkoutData = {
        ...parsed,
        scannedAt: new Date().toISOString(),
      };

      localStorage.setItem('pitStopScannedCheckout', JSON.stringify(checkoutData));

      toast.success('Checkout QR scanned successfully!');

      navigate('/admin/checkout-review', {
        state: { checkoutData },
        replace: true,
      });
    } catch (error) {
      console.error(error);
      toast.error('Invalid QR code. Please scan the customer checkout QR.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">
          Rewards Checkout Scanner
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Scan a customer checkout QR code to award points.
        </p>
      </div>

      <div className="max-w-sm">
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <QrCode className="w-9 h-9 text-primary" />
          </div>

          <div className="text-center">
            <h2 className="font-display font-bold text-lg">Scan Checkout QR</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Scan the customer&apos;s cart QR code, review the order, then tap
              Complete.
            </p>
          </div>

          <button
            type="button"
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
            onClick={() => setScanning(true)}
            disabled={loading}
          >
            <ScanLine className="w-5 h-5" />
            <span>{loading ? 'Reading QR...' : 'Open Scanner'}</span>
          </button>
        </div>
      </div>

      {scanning && (
        <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />
      )}
    </div>
  );
}