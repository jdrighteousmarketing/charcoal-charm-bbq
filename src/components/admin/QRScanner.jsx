import { useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);
  const onScanRef = useRef(onScan);

  const scannerId = useMemo(
    () => `qr-scanner-region-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    []
  );

  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let mounted = true;
    scannedRef.current = false;

    async function stopScanner() {
      const scanner = scannerRef.current;

      if (!scanner) return;

      try {
        if (scanner.getState && scanner.getState() === 2) {
          await scanner.stop();
        } else {
          await scanner.stop();
        }
      } catch {
        // Already stopped or not running.
      }

      try {
        await scanner.clear();
      } catch {
        // Already cleared.
      }

      scannerRef.current = null;
    }

    async function startScanner() {
      try {
        const scannerElement = document.getElementById(scannerId);

        if (!scannerElement) {
          throw new Error('Scanner region not ready.');
        }

        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
          throw new Error('No camera found.');
        }

        const backCamera =
          cameras.find((camera) =>
            camera.label?.toLowerCase().includes('back')
          ) ||
          cameras.find((camera) =>
            camera.label?.toLowerCase().includes('rear')
          ) ||
          cameras[cameras.length - 1];

        await scanner.start(
          backCamera?.id ? { deviceId: { exact: backCamera.id } } : { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          async (decodedText) => {
            if (scannedRef.current) return;

            scannedRef.current = true;

            await stopScanner();

            setTimeout(() => {
              onScanRef.current(decodedText);
            }, 150);
          },
          () => {
            // Ignore normal scan misses.
          }
        );

        if (mounted) {
          setStarting(false);
          setError('');
        }
      } catch (err) {
        console.error('QR scanner start error:', err);

        if (mounted) {
          setStarting(false);
          setError(
            'Camera could not start. Close this window, allow camera permission, and try again.'
          );
        }
      }
    }

    const timer = setTimeout(startScanner, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [scannerId]);

  const handleClose = async () => {
    const scanner = scannerRef.current;

    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // Already stopped.
      }

      try {
        await scanner.clear();
      } catch {
        // Already cleared.
      }

      scannerRef.current = null;
    }

    scannedRef.current = false;
    onClose();
  };

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

      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
          <Camera className="w-7 h-7 text-white" />
        </div>

        <p className="text-white font-display font-bold text-lg">
          Scan Customer QR Code
        </p>

        <p className="text-white/60 text-sm mt-1">
          Point camera at the customer&apos;s rewards checkout QR code.
        </p>
      </div>

      <div className="relative w-[320px] max-w-[90vw] h-[320px] max-h-[90vw] rounded-2xl overflow-hidden bg-zinc-900 border border-white/20">
        <div
          id={scannerId}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />

        {starting && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-sm">
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
          <div className="absolute inset-0 flex items-center justify-center bg-black text-white p-5 text-center text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}