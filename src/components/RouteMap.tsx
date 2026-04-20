import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

const pickupIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:30px;height:30px;background:#FFD600;border:1.3px solid #000;box-shadow:1.6px 1.6px 0 #000;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-family:Inter">A</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});
const destIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:30px;height:30px;background:#FF3B3B;color:#fff;border:1.3px solid #000;box-shadow:1.6px 1.6px 0 #000;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-family:Inter">B</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

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

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 1) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
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
  // Central Java center (Semarang area)
  const center = useMemo<[number, number]>(() => [-6.9667, 110.4167], []);
  const allPoints = [pickup, destination].filter(Boolean) as LatLng[];

  return (
    <div className="brutal-lg overflow-hidden bg-card">
      <div className="border-b-[1.3px] border-black bg-primary px-3 py-2 text-xs font-black uppercase tracking-wide">
        Tap peta untuk set {selecting === "pickup" ? "JEMPUT (A)" : "TUJUAN (B)"} · pin bisa di-drag
      </div>
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: "360px", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
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
        {route.length > 1 && (
          <Polyline
            positions={route.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{ color: "#000", weight: 7, opacity: 1 }}
          />
        )}
        {route.length > 1 && (
          <Polyline
            positions={route.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{ color: "#FFD600", weight: 3, opacity: 1 }}
          />
        )}
        <FitBounds points={allPoints} />
      </MapContainer>
    </div>
  );
};

export default RouteMap;
