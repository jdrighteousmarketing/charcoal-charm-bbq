import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);
  const onScanRef = useRef(onScan);

  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scannerId = 'qr-scanner-region';
    let mounted = true;
    let scanner = null;

    async function stopScanner() {
      const currentScanner = scannerRef.current;

      if (!currentScanner) return;

      try {
        await currentScanner.stop();
      } catch {
        // Scanner may already be stopped.
      }

      try {
        await currentScanner.clear();
      } catch {
        // Scanner may already be cleared.
      }

      scannerRef.current = null;
    }

    async function startScanner() {
      try {
        scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (scannedRef.current) return;

            scannedRef.current = true;
            setFinished(true);

            await stopScanner();

            setTimeout(() => {
              onScanRef.current(decodedText);
            }, 150);
          },
          () => {}
        );

        if (mounted) {
          setStarting(false);
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setStarting(false);
          setError('Camera could not start. Check camera permission and try again.');
        }
      }
    }

    const timer = setTimeout(startScanner, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const handleClose = async () => {
    const currentScanner = scannerRef.current;

    if (currentScanner) {
      try {
        await currentScanner.stop();
      } catch {
        // Scanner may already be stopped.
      }

      try {
        await currentScanner.clear();
      } catch {
        // Scanner may already be cleared.
      }

      scannerRef.current = null;
    }

    setFinished(true);
    onClose();
  };

  if (finished) return null;

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={handleClose}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      <p className="text-white font-display font-bold text-lg mb-2">
        Scan Customer QR Code
      </p>

      <p className="text-white/60 text-sm mb-6 text-center">
        Point camera at the customer&apos;s rewards checkout QR code.
      </p>

      <div className="relative w-[320px] max-w-[90vw] h-[320px] max-h-[90vw] rounded-2xl overflow-hidden bg-zinc-900 border border-white/20">
        <div
          id="qr-scanner-region"
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />

        {starting && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm">
            Starting camera...
          </div>
        )}

        {!error && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-5 left-5 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-5 right-5 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-5 left-5 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-5 right-5 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 text-white p-5 text-center text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}