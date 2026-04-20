import { useEffect, useRef, useState } from "react";
import type { LatLng } from "./RouteMap";

export type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (loc: LatLng, label: string) => void;
  onUseGPS?: () => void;
  accent?: "primary" | "accent";
};

// Central Java approx bounding box: west, south, east, north
const JATENG_VIEWBOX = "108.55,-8.30,111.70,-5.70";

const LocationSearch = ({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  onUseGPS,
  accent = "primary",
}: Props) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const search = (q: string) => {
    if (!q || q.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", q);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    url.searchParams.set("countrycodes", "id");
    url.searchParams.set("viewbox", JATENG_VIEWBOX);
    url.searchParams.set("bounded", "1");

    fetch(url.toString(), { headers: { Accept: "application/json" } })
      .then((r) => r.json())
      .then((data: SearchResult[]) => {
        setResults(data || []);
        setOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  const handleChange = (v: string) => {
    onChange(v);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => search(v), 350);
  };

  const focusBg = accent === "primary" ? "focus:bg-primary/30" : "focus:bg-accent/20";

  return (
    <div ref={wrapRef} className="relative">
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-xs font-black uppercase">{label}</label>
        {onUseGPS && (
          <button
            type="button"
            onClick={onUseGPS}
            className="brutal-sm bg-background px-2 py-0.5 text-[10px] font-black uppercase hover:bg-primary"
          >
            📍 GPS
          </button>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder={placeholder}
        className={`brutal w-full bg-background px-3 py-2 text-sm font-medium outline-none ${focusBg}`}
      />
      {open && (loading || results.length > 0) && (
        <div className="brutal absolute z-[1000] mt-1 max-h-64 w-full overflow-y-auto bg-background">
          {loading && (
            <div className="px-3 py-2 text-xs font-bold text-muted-foreground">Mencari…</div>
          )}
          {!loading &&
            results.map((r, i) => (
              <button
                key={`${r.lat}-${r.lon}-${i}`}
                type="button"
                onClick={() => {
                  onSelect({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) }, r.display_name);
                  setOpen(false);
                }}
                className="block w-full border-b border-black/10 px-3 py-2 text-left text-xs font-medium hover:bg-primary/30"
              >
                {r.display_name}
              </button>
            ))}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs font-bold text-muted-foreground">Tidak ditemukan</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
