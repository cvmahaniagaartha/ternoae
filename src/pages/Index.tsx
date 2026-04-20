import { useCallback, useEffect, useMemo, useState } from "react";
import RouteMap, { LatLng } from "@/components/RouteMap";
import LocationSearch from "@/components/LocationSearch";
import QRISModal from "@/components/QRISModal";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const BASE_FARE = 5000;
const PRICE_PER_KM = 2000;
const WHATSAPP_NUMBER = "6285155145788"; // 085155145788 in international format

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// Central Java bounds (rough)
const JATENG_BOUNDS = { minLat: -8.3, maxLat: -5.7, minLng: 108.55, maxLng: 111.7 };
const isInJateng = (l: LatLng) =>
  l.lat >= JATENG_BOUNDS.minLat &&
  l.lat <= JATENG_BOUNDS.maxLat &&
  l.lng >= JATENG_BOUNDS.minLng &&
  l.lng <= JATENG_BOUNDS.maxLng;

const Index = () => {
  const [pickup, setPickup] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [pickupLabel, setPickupLabel] = useState("");
  const [destLabel, setDestLabel] = useState("");
  const [selecting, setSelecting] = useState<"pickup" | "destination">("pickup");
  const [route, setRoute] = useState<LatLng[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "tunai">("qris");

  // QRIS modal state
  const [qrisOpen, setQrisOpen] = useState(false);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [qrisString, setQrisString] = useState<string | null>(null);
  const [qrisError, setQrisError] = useState<string | null>(null);

  // SEO
  useEffect(() => {
    document.title = "TernoAE — Antar Jemput Cepat Jawa Tengah";
    const desc =
      "Pesan antar jemput online se-Jawa Tengah dengan TernoAE. Pencarian desa, GPS, harga otomatis & bayar QRIS.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.origin + "/");
  }, []);

  const reverseGeocode = useCallback(async (p: LatLng): Promise<string> => {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${p.lat}&lon=${p.lng}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await r.json();
      return data.display_name || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
    } catch {
      return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
    }
  }, []);

  const checkJateng = (l: LatLng): boolean => {
    if (!isInJateng(l)) {
      toast({
        title: "Di luar Jawa Tengah",
        description: "Layanan TernoAE hanya tersedia di area Jawa Tengah.",
      });
      return false;
    }
    return true;
  };

  const handleMapClick = useCallback(
    async (l: LatLng) => {
      if (!checkJateng(l)) return;
      if (selecting === "pickup") {
        setPickup(l);
        setPickupLabel("Memuat alamat…");
        setSelecting("destination");
        setPickupLabel(await reverseGeocode(l));
      } else {
        setDestination(l);
        setDestLabel("Memuat alamat…");
        setDestLabel(await reverseGeocode(l));
      }
    },
    [selecting, reverseGeocode]
  );

  const handlePickupDrag = useCallback(
    async (l: LatLng) => {
      if (!checkJateng(l)) return;
      setPickup(l);
      setPickupLabel("Memuat alamat…");
      setPickupLabel(await reverseGeocode(l));
    },
    [reverseGeocode]
  );

  const handleDestinationDrag = useCallback(
    async (l: LatLng) => {
      if (!checkJateng(l)) return;
      setDestination(l);
      setDestLabel("Memuat alamat…");
      setDestLabel(await reverseGeocode(l));
    },
    [reverseGeocode]
  );

  const useGPS = (target: "pickup" | "destination") => {
    if (!("geolocation" in navigator)) {
      toast({ title: "GPS tidak didukung browser ini" });
      return;
    }
    toast({ title: "Mengambil lokasi GPS…" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const l = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (!checkJateng(l)) return;
        const label = await reverseGeocode(l);
        if (target === "pickup") {
          setPickup(l);
          setPickupLabel(label);
        } else {
          setDestination(l);
          setDestLabel(label);
        }
      },
      () => toast({ title: "Tidak bisa mengambil lokasi GPS" }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Fetch route
  useEffect(() => {
    if (!pickup || !destination) return;
    const ctrl = new AbortController();
    const fetchRoute = async () => {
      setLoading(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        if (data?.routes?.[0]) {
          const r = data.routes[0];
          const coords: LatLng[] = r.geometry.coordinates.map((c: [number, number]) => ({
            lat: c[1],
            lng: c[0],
          }));
          setRoute(coords);
          setDistanceKm(r.distance / 1000);
          setDurationMin(r.duration / 60);
        } else {
          toast({ title: "Rute tidak ditemukan", description: "Coba titik lain." });
        }
      } catch (e: any) {
        if (e.name !== "AbortError") {
          toast({ title: "Gagal memuat rute", description: "Periksa koneksi internet." });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
    return () => ctrl.abort();
  }, [pickup, destination]);

  const price = useMemo(() => {
    if (distanceKm == null) return null;
    return Math.round(BASE_FARE + distanceKm * PRICE_PER_KM);
  }, [distanceKm]);

  const reset = () => {
    setPickup(null);
    setDestination(null);
    setPickupLabel("");
    setDestLabel("");
    setRoute([]);
    setDistanceKm(null);
    setDurationMin(null);
    setSelecting("pickup");
  };

  const buildWhatsAppMessage = () => {
    const lines = [
      "🛵 *Pesanan TernoAE*",
      "",
      `👤 Nama: ${name}`,
      `📞 HP: ${phone}`,
      "",
      `📍 *Jemput (A):*`,
      pickupLabel,
      `   (${pickup?.lat.toFixed(6)}, ${pickup?.lng.toFixed(6)})`,
      "",
      `🎯 *Tujuan (B):*`,
      destLabel,
      `   (${destination?.lat.toFixed(6)}, ${destination?.lng.toFixed(6)})`,
      "",
      `📏 Jarak: ${distanceKm?.toFixed(2)} km`,
      `⏱ Estimasi: ~${durationMin ? Math.round(durationMin) : "-"} menit`,
      `💰 Total: ${price != null ? formatIDR(price) : "-"}`,
      `💳 Pembayaran: ${paymentMethod === "qris" ? "QRIS (sudah di-generate)" : "TUNAI (bayar di tempat)"}`,
    ];
    return lines.join("\n");
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !destination || price == null) {
      toast({ title: "Lengkapi titik jemput & tujuan dulu" });
      return;
    }
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Isi nama & nomor HP" });
      return;
    }

    if (paymentMethod === "tunai") {
      openWhatsApp();
      toast({ title: "Pesanan dikirim", description: "Lanjut konfirmasi via WhatsApp." });
      return;
    }

    // QRIS → buka modal & generate
    setQrisOpen(true);
    setQrisLoading(true);
    setQrisError(null);
    setQrisString(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-qris", {
        body: { amount: price },
      });
      if (error) throw new Error(error.message);
      if (!data?.qris_string) throw new Error("QRIS tidak diterima");
      setQrisString(data.qris_string);
    } catch (err: any) {
      setQrisError(err.message || "Gagal membuat QRIS");
    } finally {
      setQrisLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b-[1.3px] border-black bg-primary">
        <div className="container flex items-center justify-between py-3 sm:py-4">
          <a href="/" className="flex items-center gap-2">
            <span className="brutal inline-flex h-9 w-9 items-center justify-center bg-secondary text-primary font-black text-base">
              T
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tight">TernoAE</span>
          </a>
          <span className="brutal bg-background px-2 py-1 text-[10px] sm:text-xs font-bold uppercase">
            Jawa Tengah
          </span>
        </div>
      </header>

      <main className="container py-4 sm:py-8 space-y-5 sm:space-y-8">
        {/* Hero */}
        <section>
          <div className="brutal-lg bg-background p-4 sm:p-7">
            <h1 className="text-2xl sm:text-4xl font-black leading-tight">
              Antar jemput cepat <span className="bg-primary px-2 rounded-md">se-Jawa Tengah</span>.
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base font-medium text-muted-foreground">
              Cari nama desa/lokasi, pakai GPS, atau geser pin di peta. Harga otomatis & bayar QRIS.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] sm:text-xs font-bold">
              <span className="brutal-sm bg-primary px-2 py-1">Tarif {formatIDR(BASE_FARE)}</span>
              <span className="brutal-sm bg-accent text-accent-foreground px-2 py-1">
                {formatIDR(PRICE_PER_KM)} / KM
              </span>
              <span className="brutal-sm bg-background px-2 py-1">QRIS Dinamis</span>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <section className="grid gap-5 lg:grid-cols-[1fr_400px]">
          {/* Map + selectors */}
          <div className="space-y-3">
            <RouteMap
              pickup={pickup}
              destination={destination}
              route={route}
              selecting={selecting}
              onMapClick={handleMapClick}
              onPickupDrag={handlePickupDrag}
              onDestinationDrag={handleDestinationDrag}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelecting("pickup")}
                className={`brutal-btn flex-1 sm:flex-none px-3 py-2 text-xs font-black uppercase ${
                  selecting === "pickup" ? "bg-primary" : "bg-background"
                }`}
              >
                Set Jemput (A)
              </button>
              <button
                type="button"
                onClick={() => setSelecting("destination")}
                className={`brutal-btn flex-1 sm:flex-none px-3 py-2 text-xs font-black uppercase ${
                  selecting === "destination" ? "bg-accent text-accent-foreground" : "bg-background"
                }`}
              >
                Set Tujuan (B)
              </button>
              <button
                type="button"
                onClick={reset}
                className="brutal-btn ml-auto bg-secondary px-3 py-2 text-xs font-black uppercase text-secondary-foreground"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Order form */}
          <form onSubmit={submitOrder} className="space-y-4">
            <div className="brutal-lg bg-background p-4 space-y-3">
              <LocationSearch
                label="Titik Jemput (A)"
                placeholder="Cari desa / lokasi di Jateng…"
                value={pickupLabel}
                onChange={setPickupLabel}
                onSelect={(loc, lbl) => {
                  setPickup(loc);
                  setPickupLabel(lbl);
                  setSelecting("destination");
                }}
                onUseGPS={() => useGPS("pickup")}
                accent="primary"
              />
              <LocationSearch
                label="Tujuan (B)"
                placeholder="Cari desa / lokasi tujuan…"
                value={destLabel}
                onChange={setDestLabel}
                onSelect={(loc, lbl) => {
                  setDestination(loc);
                  setDestLabel(lbl);
                }}
                onUseGPS={() => useGPS("destination")}
                accent="accent"
              />
            </div>

            {/* Estimation card */}
            <div className="brutal-lg bg-primary p-4">
              <h2 className="text-xs font-black uppercase">Estimasi Harga</h2>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <div className="text-3xl font-black leading-none">
                    {loading ? "…" : price != null ? formatIDR(price) : "—"}
                  </div>
                  <div className="mt-1 text-xs font-bold">
                    {distanceKm != null ? `${distanceKm.toFixed(2)} km` : "0 km"}
                    {durationMin != null && ` · ~${Math.round(durationMin)} mnt`}
                  </div>
                </div>
                <div className="brutal-sm bg-background px-2 py-1 text-[10px] font-black uppercase text-right">
                  {formatIDR(BASE_FARE)}<br />+ {formatIDR(PRICE_PER_KM)}/km
                </div>
              </div>
            </div>

            <div className="brutal-lg bg-background p-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-black uppercase">Nama</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap"
                  className="brutal w-full bg-background px-3 py-2 text-sm font-medium outline-none focus:bg-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase">No. HP</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="brutal w-full bg-background px-3 py-2 text-sm font-medium outline-none focus:bg-primary/30"
                />
              </div>
            </div>

            {/* Payment method */}
            <div className="brutal-lg bg-background p-3 flex items-center gap-3">
              <label htmlFor="pay" className="text-xs font-black uppercase shrink-0">
                Pembayaran
              </label>
              <select
                id="pay"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as "qris" | "tunai")}
                className="brutal ml-auto bg-background px-3 py-2 text-xs font-black uppercase outline-none focus:bg-primary/30"
              >
                <option value="qris">QRIS</option>
                <option value="tunai">Tunai</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || price == null}
              className="brutal-btn w-full bg-accent px-4 py-4 text-base font-black uppercase tracking-wide text-accent-foreground disabled:opacity-60"
            >
              {loading
                ? "Menghitung…"
                : paymentMethod === "qris"
                ? "Pesan & Bayar QRIS"
                : "Pesan & Kirim WhatsApp"}
            </button>
          </form>
        </section>

        <footer className="border-t-[1.3px] border-black pt-4 text-center text-xs font-bold">
          © {new Date().getFullYear()} TernoAE · Jawa Tengah
        </footer>
      </main>

      <QRISModal
        open={qrisOpen}
        onClose={() => setQrisOpen(false)}
        qrisString={qrisString}
        amount={price ?? 0}
        loading={qrisLoading}
        error={qrisError}
        onContinueToWhatsApp={openWhatsApp}
      />
    </div>
  );
};

export default Index;
