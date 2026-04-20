import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// Pin-shaped marker (jarum) using SVG
const makePinIcon = (label: "A" | "B", color: string, textColor = "#000") => {
  const svg = `
    <svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2 C8 2 2 9 2 18 C2 30 18 46 18 46 C18 46 34 30 34 18 C34 9 28 2 18 2 Z"
            fill="${color}" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="18" cy="18" r="9" fill="#fff" stroke="#000" stroke-width="1.5"/>
      <text x="18" y="22" font-family="Inter, sans-serif" font-size="12" font-weight="900"
            text-anchor="middle" fill="${textColor}">${label}</text>
    </svg>`;
  return new L.DivIcon({
    className: "",
    html: `<div style="filter: drop-shadow(1.6px 2px 0 rgba(0,0,0,0.35));">${svg}</div>`,
    iconSize: [36, 48],
    iconAnchor: [18, 46],
    popupAnchor: [0, -40],
  });
};

const pickupIcon = makePinIcon("A", "#FFD600");
const destIcon = makePinIcon("B", "#FF3B3B", "#000");

export type LatLng = { lat: number; lng: number };

type Props = {
  pickup: LatLng | null;
  destination: LatLng | null;
  route: LatLng[];
  selecting: "pickup" | "destination";
  onMapClick: (latlng: LatLng) => void;
  onPickupDrag: (l: LatLng) => void;
  onDestinationDrag: (l: LatLng) => void;
};

function ClickHandler({ onClick }: { onClick: (l: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FitBounds({ points, route }: { points: LatLng[]; route: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    // ensure tiles render correctly after layout
    setTimeout(() => map.invalidateSize(), 50);
  }, [map]);
  useEffect(() => {
    const all = route.length > 1 ? route : points;
    if (all.length < 1) return;
    if (all.length === 1) {
      map.setView([all[0].lat, all[0].lng], 15, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(all.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, route, map]);
  return null;
}

const RouteMap = ({
  pickup,
  destination,
  route,
  selecting,
  onMapClick,
  onPickupDrag,
  onDestinationDrag,
}: Props) => {
  // Defer mount to next tick — avoids react-leaflet v4 useEffect-null in StrictMode
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const center = useMemo<[number, number]>(() => [-6.9667, 110.4167], []);
  const allPoints = [pickup, destination].filter(Boolean) as LatLng[];

  return (
    <div className="brutal-lg overflow-hidden bg-card">
      <div className="border-b-[1.3px] border-black bg-primary px-3 py-2 text-[11px] sm:text-xs font-black uppercase tracking-wide">
        Tap peta untuk set {selecting === "pickup" ? "JEMPUT (A)" : "TUJUAN (B)"} · pin bisa di-drag
      </div>
      <div style={{ height: "380px", width: "100%" }}>
        {mounted && (
          <MapContainer
            center={center}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <ClickHandler onClick={onMapClick} />
            {pickup && (
              <Marker
                position={[pickup.lat, pickup.lng]}
                icon={pickupIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const ll = e.target.getLatLng();
                    onPickupDrag({ lat: ll.lat, lng: ll.lng });
                  },
                }}
              />
            )}
            {destination && (
              <Marker
                position={[destination.lat, destination.lng]}
                icon={destIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const ll = e.target.getLatLng();
                    onDestinationDrag({ lat: ll.lat, lng: ll.lng });
                  },
                }}
              />
            )}
            {/* Road-following route from OSRM (black outline + yellow inner) */}
            {route.length > 1 && (
              <Polyline
                positions={route.map((p) => [p.lat, p.lng] as [number, number])}
                pathOptions={{ color: "#000", weight: 8, opacity: 1, lineCap: "round", lineJoin: "round" }}
              />
            )}
            {route.length > 1 && (
              <Polyline
                positions={route.map((p) => [p.lat, p.lng] as [number, number])}
                pathOptions={{ color: "#FFD600", weight: 4, opacity: 1, lineCap: "round", lineJoin: "round" }}
              />
            )}
            <FitBounds points={allPoints} route={route} />
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default RouteMap;
