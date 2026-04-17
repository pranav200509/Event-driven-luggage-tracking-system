import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  active: boolean;
  onToggle: (next: boolean) => void;
}

const BarcodeScanner = ({ onDetected, active, onToggle }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastCodeRef = useRef<{ code: string; ts: number }>({ code: "", ts: 0 });
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!active) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      return;
    }

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();
    setStarting(true);
    setError(null);

    (async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (!result) return;
            const code = result.getText().trim().toUpperCase();
            const now = Date.now();
            // Debounce duplicate fires within 1.5s
            if (
              code === lastCodeRef.current.code &&
              now - lastCodeRef.current.ts < 1500
            ) {
              return;
            }
            lastCodeRef.current = { code, ts: now };
            onDetected(code);
          }
        );
        if (cancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Camera unavailable";
        setError(msg);
      } finally {
        setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [active, onDetected]);

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-[4/3] sm:aspect-video bg-black rounded-lg overflow-hidden border border-border">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/90">
            <div className="text-center">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Camera off</p>
            </div>
          </div>
        )}
        {active && starting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        {active && !starting && (
          <>
            {/* Alignment guide */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-[80%] h-[35%] border-2 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                <div className="w-full h-px bg-red-500/80 mt-[calc(50%-1px)] animate-pulse" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2 text-center">
              <span className="inline-block text-xs text-white bg-black/60 px-2 py-1 rounded">
                Align barcode within the box
              </span>
            </div>
          </>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="button"
        variant={active ? "secondary" : "default"}
        onClick={() => onToggle(!active)}
        className="w-full"
      >
        {active ? (
          <>
            <CameraOff className="mr-2 h-4 w-4" /> Stop Camera
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" /> Start Camera Scanner
          </>
        )}
      </Button>
    </div>
  );
};

export default BarcodeScanner;
