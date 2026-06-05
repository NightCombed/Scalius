import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePlus, Loader2, Monitor, Scissors, Smartphone, ZoomIn, ZoomOut, X } from "lucide-react";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/imageUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ImageUploadProps {
  bucket: string;
  pathPrefix: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  id?: string;
  aspect?: number;
  /** When true, shows mobile + desktop safe-zone guides (use for banners) */
  showBannerGuides?: boolean;
}

// ── Guide constants ────────────────────────────────────────────────────────────
// These must match the actual CSS in PublicStoreHome.tsx:
//   banner container: h-[140px] mobile / h-[200px] desktop (md+)
//   typical viewport widths: 375px mobile, 1280px desktop
const DESKTOP_RATIO = 1280 / 200; // 6.4
const MOBILE_RATIO  = 375  / 140; // ≈2.679

/**
 * Computes the screen-space positions (px) of:
 *  - the crop box (react-easy-crop always fills the container in one dimension)
 *  - the desktop safe zone (what desktop users will see)
 *  - the mobile safe zone (what mobile users will see)
 */
function computeGuideBoxes(containerW: number, containerH: number, aspect: number) {
  // Crop box: fills container while preserving aspect ratio
  let cropW: number, cropH: number;
  if (containerW / containerH > aspect) {
    cropH = containerH;
    cropW = cropH * aspect;
  } else {
    cropW = containerW;
    cropH = cropW / aspect;
  }
  const cropX = (containerW - cropW) / 2;
  const cropY = (containerH - cropH) / 2;

  // Desktop: if crop is narrower than desktop container → fills width, crops height
  const desktopFrH  = Math.min(1, aspect / DESKTOP_RATIO);
  const desktopH    = cropH * desktopFrH;
  const desktopY    = cropY + (cropH - desktopH) / 2;

  // Mobile: if crop is wider than mobile container → fills height, crops width
  const mobileFrW = Math.min(1, MOBILE_RATIO / aspect);
  const mobileW   = cropW * mobileFrW;
  const mobileX   = cropX + (cropW - mobileW) / 2;

  return {
    cropBox : { x: cropX,   y: cropY,    w: cropW,  h: cropH    },
    desktop : { x: cropX,   y: desktopY, w: cropW,  h: desktopH },
    mobile  : { x: mobileX, y: cropY,    w: mobileW, h: cropH   },
  };
}

/**
 * Returns CSS background properties that simulate `object-cover` for a given
 * crop area percentage and target container size.
 */
function getPreviewBgStyle(
  imageSrc: string,
  croppedAreaPct: { x: number; y: number; width: number; height: number } | null,
  natW: number,
  natH: number,
  containerW: number,
  containerH: number,
): React.CSSProperties {
  if (!croppedAreaPct || !natW || !natH) {
    return { backgroundImage: `url(${imageSrc})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  const cropPxW = (croppedAreaPct.width  / 100) * natW;
  const cropPxH = (croppedAreaPct.height / 100) * natH;
  const cropPxX = (croppedAreaPct.x      / 100) * natW;
  const cropPxY = (croppedAreaPct.y      / 100) * natH;

  // object-cover: use the scale that makes both dimensions >= container
  const scale = Math.max(containerW / cropPxW, containerH / cropPxH);
  const bgW   = natW  * scale;
  const bgH   = natH  * scale;
  // Center the image in the preview container
  const bgX   = -cropPxX * scale + (containerW - cropPxW * scale) / 2;
  const bgY   = -cropPxY * scale + (containerH - cropPxH * scale) / 2;

  return {
    backgroundImage   : `url(${imageSrc})`,
    backgroundSize    : `${bgW}px ${bgH}px`,
    backgroundPosition: `${bgX}px ${bgY}px`,
    backgroundRepeat  : "no-repeat",
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ImageUpload({
  bucket,
  pathPrefix,
  value,
  onChange,
  placeholder = "https://...",
  id,
  aspect = 1,
  showBannerGuides = false,
}: ImageUploadProps) {
  const [uploading,          setUploading]          = useState(false);
  const [showCropper,        setShowCropper]        = useState(false);
  const [imageSrc,           setImageSrc]           = useState<string | null>(null);
  const [crop,               setCrop]               = useState({ x: 0, y: 0 });
  const [zoom,               setZoom]               = useState(1);
  const [croppedAreaPixels,  setCroppedAreaPixels]  = useState<any>(null);
  const [croppedAreaPct,     setCroppedAreaPct]     = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [naturalSize,        setNaturalSize]        = useState<{ width: number; height: number } | null>(null);
  const [fileName,           setFileName]           = useState("");
  const [isFullyOpen,        setIsFullyOpen]        = useState(false);
  const [containerSize,      setContainerSize]      = useState({ w: 0, h: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropAreaRef  = useRef<HTMLDivElement>(null);

  // Delay Cropper render to let dialog open animation finish, then measure container
  useEffect(() => {
    if (showCropper) {
      const t = setTimeout(() => {
        setIsFullyOpen(true);
        if (cropAreaRef.current) {
          const r = cropAreaRef.current.getBoundingClientRect();
          setContainerSize({ w: r.width, h: r.height });
        }
      }, 350);
      return () => clearTimeout(t);
    } else {
      setIsFullyOpen(false);
    }
  }, [showCropper]);

  // Re-measure on window resize while dialog is open
  useEffect(() => {
    if (!showCropper) return;
    const onResize = () => {
      if (cropAreaRef.current) {
        const r = cropAreaRef.current.getBoundingClientRect();
        setContainerSize({ w: r.width, h: r.height });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [showCropper]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result as string);
      setShowCropper(true);
    });
    reader.readAsDataURL(file);
  };

  const onEditUrl = () => {
    if (!value) return;
    setFileName("image-from-url.jpg");
    setImageSrc(value);
    setShowCropper(true);
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
    setCroppedAreaPct(_croppedArea);
  }, []);

  const onMediaLoaded = useCallback(
    (mediaSize: { width: number; height: number; naturalWidth: number; naturalHeight: number }) => {
      setNaturalSize({ width: mediaSize.naturalWidth, height: mediaSize.naturalHeight });
    },
    [],
  );

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    setShowCropper(false);
    try {
      const mimeType     = "image/jpeg";
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, mimeType);
      if (!croppedImage)
        throw new Error("Falha ao processar imagem. Verifique se o link permite acesso externo (CORS).");

      const storagePath = `${pathPrefix}-${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, croppedImage, { contentType: mimeType });
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      onChange(publicUrlData.publicUrl);
      toast.success("Imagem enviada com sucesso!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erro no processamento", { description: err.message });
    } finally {
      setUploading(false);
      setImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Compute guide box positions whenever container size or aspect changes
  const guides =
    showBannerGuides && containerSize.w > 0
      ? computeGuideBoxes(containerSize.w, containerSize.h, aspect)
      : null;

  // Preview container sizes (simulate actual device ratios at a smaller scale)
  const mobilePreviewW  = 188;
  const mobilePreviewH  = Math.round(mobilePreviewW / MOBILE_RATIO);  // ≈70
  const desktopPreviewW = 380;
  const desktopPreviewH = Math.round(desktopPreviewW / DESKTOP_RATIO); // ≈59

  return (
    <div className="space-y-3">
      {/* ── URL input + upload button ── */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <Input
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pr-8 w-full"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-colors"
              title="Limpar link"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={onSelectFile}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Upload de arquivo"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </Button>
        {value && !uploading && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onEditUrl}
            title="Ajustar imagem (Crop)"
          >
            <Scissors className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ── Crop dialog ── */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col" style={{ maxHeight: "90vh" }}>
          {/* ── Fixed header ── */}
          <div className="p-6 pb-0 shrink-0">
            <DialogHeader>
              <DialogTitle>Ajustar Imagem</DialogTitle>
            </DialogHeader>
            {showBannerGuides && (
              <p className="text-xs text-muted-foreground mt-1">
                Posicione o conteúdo importante dentro das zonas indicadas para garantir boa aparência em todos os dispositivos.
              </p>
            )}
          </div>

          {/* ── Cropper with fixed explicit height ──
              react-easy-crop needs the container to have a resolved pixel height
              before mount — flex-1 caused miscalculation during dialog animation. */}
          {/* ── Fixed cropper area ── */}
          <div
            ref={cropAreaRef}
            className="relative bg-black mt-3 shrink-0"
            style={{ height: "min(40vw, 300px)" }}
          >
            {imageSrc && isFullyOpen && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onMediaLoaded={onMediaLoaded}
                restrictPosition={false}
              />
            )}

            {/* ── Banner guide overlay (YouTube-style safe zones) ── */}
            {showBannerGuides && guides && isFullyOpen && (() => {
              const { cropBox, desktop, mobile } = guides;
              // Four "unsafe" corners: outside both mobile AND desktop zones
              const corners = [
                // top-left
                { left: cropBox.x, top: cropBox.y, width: mobile.x - cropBox.x, height: desktop.y - cropBox.y },
                // top-right
                { left: mobile.x + mobile.w, top: cropBox.y, width: (cropBox.x + cropBox.w) - (mobile.x + mobile.w), height: desktop.y - cropBox.y },
                // bottom-left
                { left: cropBox.x, top: desktop.y + desktop.h, width: mobile.x - cropBox.x, height: (cropBox.y + cropBox.h) - (desktop.y + desktop.h) },
                // bottom-right
                { left: mobile.x + mobile.w, top: desktop.y + desktop.h, width: (cropBox.x + cropBox.w) - (mobile.x + mobile.w), height: (cropBox.y + cropBox.h) - (desktop.y + desktop.h) },
              ];
              // "Desktop-only" strips (visible on desktop but cropped on mobile)
              const desktopStrips = [
                // left of mobile, within desktop height band
                { left: cropBox.x, top: desktop.y, width: mobile.x - cropBox.x, height: desktop.h },
                // right of mobile, within desktop height band
                { left: mobile.x + mobile.w, top: desktop.y, width: (cropBox.x + cropBox.w) - (mobile.x + mobile.w), height: desktop.h },
              ];
              // "Mobile-only" strips (visible on mobile but cropped on desktop)
              const mobileStrips = [
                // above desktop band, within mobile width
                { left: mobile.x, top: cropBox.y, width: mobile.w, height: desktop.y - cropBox.y },
                // below desktop band, within mobile width
                { left: mobile.x, top: desktop.y + desktop.h, width: mobile.w, height: (cropBox.y + cropBox.h) - (desktop.y + desktop.h) },
              ];

              return (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Dim the four corners (cut on both devices) */}
                  {corners.map((s, i) => (
                    <div key={`corner-${i}`} className="absolute bg-black/60" style={s} />
                  ))}
                  {/* Light amber tint on desktop-only strips */}
                  {desktopStrips.map((s, i) => (
                    <div key={`ds-${i}`} className="absolute bg-amber-400/10" style={s} />
                  ))}
                  {/* Light blue tint on mobile-only strips */}
                  {mobileStrips.map((s, i) => (
                    <div key={`ms-${i}`} className="absolute bg-blue-400/10" style={s} />
                  ))}

                  {/* Desktop safe-zone border */}
                  <div
                    className="absolute border-2 border-dashed border-amber-400/80"
                    style={{ left: desktop.x, top: desktop.y, width: desktop.w, height: desktop.h }}
                  >
                    <span className="absolute top-1.5 right-2 bg-amber-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Monitor className="h-2.5 w-2.5 inline" /> Desktop
                    </span>
                  </div>

                  {/* Mobile safe-zone border */}
                  <div
                    className="absolute border-2 border-dashed border-blue-400/80"
                    style={{ left: mobile.x, top: mobile.y, width: mobile.w, height: mobile.h }}
                  >
                    <span className="absolute top-1.5 left-2 bg-blue-500/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Smartphone className="h-2.5 w-2.5 inline" /> Celular
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ── Scrollable middle: zoom + previews ── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
            {/* Out-of-bounds warning */}
            {(() => {
              if (!croppedAreaPct) return null;
              const { x, y, width, height } = croppedAreaPct;
              const oob = x < -0.5 || y < -0.5 || x + width > 100.5 || y + height > 100.5;
              if (!oob) return null;
              return (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                  <span className="text-base leading-none mt-0.5">⚠️</span>
                  <span>
                    Parte do recorte está <strong>fora da imagem</strong> — aparecerá branco no banner.
                    Arraste a imagem para dentro da área de corte ou reduza o zoom.
                  </span>
                </div>
              );
            })()}
            {/* Zoom slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium">Zoom</label>
                <span className="text-xs text-muted-foreground">{zoom.toFixed(2)}x</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button" variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setZoom((prev) => Math.max(0.1, prev - 0.05))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <input
                  type="range" value={zoom} min={0.1} max={3} step={0.01}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <Button
                  type="button" variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setZoom((prev) => Math.min(3, prev + 0.05))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

            </div>

            {/* ── Live device previews (banner only) ── */}
            {showBannerGuides && imageSrc && croppedAreaPct && naturalSize && (
              <div className="space-y-2.5 border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pré-visualização por dispositivo
                </p>
                <div className="flex flex-wrap gap-4 items-end">
                  {/* Mobile preview */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-xs text-blue-500 font-semibold">
                      <Smartphone className="h-3 w-3" /> Celular
                    </div>
                    <div
                      className="rounded border-2 border-blue-400/60 overflow-hidden"
                      style={{
                        width : mobilePreviewW,
                        height: mobilePreviewH,
                        ...getPreviewBgStyle(
                          imageSrc, croppedAreaPct,
                          naturalSize.width, naturalSize.height,
                          mobilePreviewW, mobilePreviewH,
                        ),
                      }}
                    />
                    <p className="text-[9px] text-muted-foreground text-center">375 × 140 px</p>
                  </div>

                  {/* Desktop preview */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                      <Monitor className="h-3 w-3" /> Desktop
                    </div>
                    <div
                      className="rounded border-2 border-amber-400/60 overflow-hidden"
                      style={{
                        width : desktopPreviewW,
                        height: desktopPreviewH,
                        ...getPreviewBgStyle(
                          imageSrc, croppedAreaPct,
                          naturalSize.width, naturalSize.height,
                          desktopPreviewW, desktopPreviewH,
                        ),
                      }}
                    />
                    <p className="text-[9px] text-muted-foreground text-center">~1280 × 200 px</p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ── Fixed footer — always visible ── */}
          <div className="shrink-0 border-t border-border bg-background px-6 py-4">
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowCropper(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpload}>Confirmar e Salvar</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thumbnail preview below the input */}
      {value && (
        <div className="mt-2 rounded-md overflow-hidden border border-border inline-block max-w-[200px] max-h-32 bg-muted relative">
          <img
            src={value}
            alt="Preview"
            className="object-contain w-full h-full absolute inset-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            onLoad={(e)  => { (e.target as HTMLImageElement).style.display = "block"; }}
          />
          <div className="w-full h-full min-h-[4rem] flex items-center justify-center text-xs text-muted-foreground opacity-50">
            Preview
          </div>
        </div>
      )}
    </div>
  );
}
