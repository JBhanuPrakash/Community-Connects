import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


function EventMap({
  latitude,
  longitude,
  title,
  venue,
  city,
  height = "350px",
}) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return (
      <div className="rounded-2xl bg-slate-100 p-8 text-center text-slate-500">
        Event location is not available.
      </div>
    );
  }

  const position = [lat, lng];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200"
      style={{ height }}
    >
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={position}>
          <Popup>
            <div>
              <strong>
                {title || "Event"}
              </strong>

              {venue && (
                <div>
                  {venue}
                </div>
              )}

              {city && (
                <div>
                  {city}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}


export default EventMap;