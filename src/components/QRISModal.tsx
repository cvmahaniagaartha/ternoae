import { QRCodeSVG } from "qrcode.react";

type Props = {
  open: boolean;
  onClose: () => void;
  qrisString: string | null;
  amount: number;
  loading: boolean;
  error: string | null;
  onContinueToWhatsApp: () => void;
};

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const QRISModal = ({ open, onClose, qrisString, amount, loading, error, onContinueToWhatsApp }: Props) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/60 p-3"
      onClick={onClose}
    >
      <div
        className="brutal-lg w-full max-w-sm bg-background p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-black uppercase">Bayar dengan QRIS</h3>
            <p className="text-xs font-bold text-muted-foreground">
              Total: <span className="text-foreground">{formatIDR(amount)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="brutal-sm bg-background px-2 py-1 text-xs font-black"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center brutal bg-background p-4">
          {loading && <div className="py-12 text-sm font-bold">Membuat QRIS…</div>}
          {!loading && error && (
            <div className="py-8 text-sm font-bold text-destructive">{error}</div>
          )}
          {!loading && !error && qrisString && (
            <QRCodeSVG value={qrisString} size={240} level="M" includeMargin={false} />
          )}
        </div>

        <p className="mt-3 text-center text-[11px] font-bold text-muted-foreground">
          Scan dengan apa pun aplikasi e-wallet / m-banking yang mendukung QRIS.
        </p>

        <button
          type="button"
          disabled={loading || !!error || !qrisString}
          onClick={onContinueToWhatsApp}
          className="brutal-btn mt-4 w-full bg-primary px-4 py-3 text-sm font-black uppercase disabled:opacity-60"
        >
          Lanjut Konfirmasi via WhatsApp
        </button>
      </div>
    </div>
  );
};

export default QRISModal;
