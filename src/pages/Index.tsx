import { useCallback, useEffect, useMemo, useState } from "react";
import RouteMap, { LatLng } from "@/components/RouteMap";
import { toast } from "@/hooks/use-toast";

const BASE_FARE = 5000;
const PRICE_PER_KM = 2000;

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

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

  // SEO
  useEffect(() => {
    document.title = "TernoAE — Antar Jemput Cepat di Jepara";
    const desc = "Pesan antar jemput online di Jepara dengan TernoAE. Hitung jarak & harga otomatis berdasar rute jalan.";
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

  const handleMapClick = useCallback(
    async (l: LatLng) => {
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

  // Fetch route when both points exist
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

  const submitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !destination || price == null) {
      toast({ title: "Lengkapi titik jemput & tujuan dulu" });
      return;
    }
    if (!name || !phone) {
      toast({ title: "Isi nama & nomor HP" });
      return;
    }
    toast({
      title: "Pesanan diterima! 🎉",
      description: `${name}, driver akan menghubungi ${phone}. Total ${formatIDR(price)}.`,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b-[1.3px] border-black bg-primary">
        <div className="container flex items-center justify-between py-4">
          <a href="/" className="flex items-center gap-2">
            <span className="brutal inline-flex h-10 w-10 items-center justify-center bg-secondary text-primary font-black text-lg">
              T
            </span>
            <span className="text-2xl font-black tracking-tight">TernoAE</span>
          </a>
          <span className="hidden sm:inline brutal bg-background px-3 py-1 text-xs font-bold uppercase">
            Jepara · Antar Jemput
          </span>
        </div>
      </header>

      <main className="container py-6 sm:py-10">
        {/* Hero */}
        <section className="mb-6 sm:mb-10">
          <div className="brutal-lg bg-background p-5 sm:p-8">
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">
              Antar jemput cepat <span className="bg-primary px-2">di Jepara</span>.
            </h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base font-medium text-muted-foreground">
              Pilih titik jemput & tujuan langsung di peta. Harga & jarak dihitung otomatis berdasar rute jalan.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="brutal bg-primary px-2 py-1">Tarif dasar {formatIDR(BASE_FARE)}</span>
              <span className="brutal bg-accent text-accent-foreground px-2 py-1">
                {formatIDR(PRICE_PER_KM)} / KM
              </span>
              <span className="brutal bg-background px-2 py-1">Real-road routing (OSRM)</span>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Map */}
          <div>
            <RouteMap
              pickup={pickup}
              destination={destination}
              route={route}
              selecting={selecting}
              onMapClick={handleMapClick}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelecting("pickup")}
                className={`brutal-btn px-3 py-2 text-xs font-black uppercase ${
                  selecting === "pickup" ? "bg-primary" : "bg-background"
                }`}
              >
                Set Jemput (A)
              </button>
              <button
                type="button"
                onClick={() => setSelecting("destination")}
                className={`brutal-btn px-3 py-2 text-xs font-black uppercase ${
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
            <div className="brutal-lg bg-background p-4">
              <label className="mb-1 block text-xs font-black uppercase">Titik Jemput (A)</label>
              <input
                type="text"
                value={pickupLabel}
                onChange={(e) => setPickupLabel(e.target.value)}
                placeholder="Tap peta untuk pilih titik jemput"
                className="brutal w-full bg-background px-3 py-2 text-sm font-medium outline-none focus:bg-primary/30"
              />
              <label className="mb-1 mt-3 block text-xs font-black uppercase">Tujuan (B)</label>
              <input
                type="text"
                value={destLabel}
                onChange={(e) => setDestLabel(e.target.value)}
                placeholder="Tap peta untuk pilih tujuan"
                className="brutal w-full bg-background px-3 py-2 text-sm font-medium outline-none focus:bg-accent/30"
              />
            </div>

            {/* Estimation card */}
            <div className="brutal-lg bg-primary p-4">
              <h2 className="text-xs font-black uppercase">Estimasi Harga</h2>
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black leading-none">
                    {loading ? "…" : price != null ? formatIDR(price) : "—"}
                  </div>
                  <div className="mt-1 text-xs font-bold">
                    {distanceKm != null ? `${distanceKm.toFixed(2)} km` : "0 km"}
                    {durationMin != null && ` · ~${Math.round(durationMin)} mnt`}
                  </div>
                </div>
                <div className="brutal bg-background px-2 py-1 text-[10px] font-black uppercase">
                  {formatIDR(BASE_FARE)} + {formatIDR(PRICE_PER_KM)}/km
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

            <button
              type="submit"
              disabled={loading || price == null}
              className="brutal-btn w-full bg-accent px-4 py-4 text-base font-black uppercase tracking-wide text-accent-foreground disabled:opacity-60"
            >
              {loading ? "Menghitung…" : "Pesan Sekarang"}
            </button>
          </form>
        </section>

        <footer className="mt-12 border-t-[1.3px] border-black pt-4 text-center text-xs font-bold">
          © {new Date().getFullYear()} TernoAE · Jepara
        </footer>
      </main>
    </div>
  );
};

export default Index;
