import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { Link } from "react-router-dom";
import { useEffect } from "react";

import L from "leaflet";
import "leaflet/dist/leaflet.css";


delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


function NearbyEventsMap({
  userLocation,
  events,
}) {
  if (!userLocation) {
    return null;
  }

  const userPosition = [
    Number(userLocation.latitude),
    Number(userLocation.longitude),
  ];


  const validEvents = events.filter(
    (event) =>
      event.latitude !== null &&
      event.longitude !== null &&
      !Number.isNaN(Number(event.latitude)) &&
      !Number.isNaN(Number(event.longitude)),
  );


  return (
    <div className="h-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-[400px]">

      <MapContainer
        center={userPosition}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        <FitMapBounds
          userLocation={userLocation}
          events={validEvents}
        />


        {/* User Location */}
        <Marker position={userPosition}>

          <Popup>
            <div>
              <strong>
                Your Location
              </strong>

              <p className="mt-1">
                Current detected location
              </p>
            </div>
          </Popup>

        </Marker>


        {/* Event Markers */}
        {validEvents.map((event) => {
          const position = [
            Number(event.latitude),
            Number(event.longitude),
          ];


          return (
            <Marker
              key={event.id}
              position={position}
            >

              <Popup>

                <div className="min-w-[190px]">

                  <strong className="text-base">
                    {event.title}
                  </strong>


                  {event.venue_name && (
                    <p className="mt-2">
                      {event.venue_name}
                    </p>
                  )}


                  {event.city && (
                    <p>
                      {event.city}
                    </p>
                  )}


                  {event.distance_km !==
                    undefined && (
                    <p className="mt-2 font-semibold">
                      {event.distance_km} km away
                    </p>
                  )}


                  <div className="mt-3 flex flex-col gap-2">

                    <Link
                      to={`/events/${event.id}`}
                      className="rounded-md bg-indigo-700 px-3 py-2 text-center text-sm font-semibold text-white"
                    >
                      View Event
                    </Link>


                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-indigo-700 px-3 py-2 text-center text-sm font-semibold text-indigo-700"
                    >
                      Directions
                    </a>

                  </div>

                </div>

              </Popup>

            </Marker>
          );
        })}

      </MapContainer>

    </div>
  );
}



function FitMapBounds({
  userLocation,
  events,
}) {
  const map = useMap();


  useEffect(() => {
    if (!userLocation) {
      return;
    }


    const locations = [
      [
        Number(userLocation.latitude),
        Number(userLocation.longitude),
      ],

      ...events.map((event) => [
        Number(event.latitude),
        Number(event.longitude),
      ]),
    ];


    if (locations.length === 1) {
      map.setView(
        locations[0],
        13,
      );

      return;
    }


    const bounds =
      L.latLngBounds(locations);


    map.fitBounds(bounds, {
      padding: [40, 40],
    });

  }, [
    map,
    userLocation,
    events,
  ]);


  return null;
}


export default NearbyEventsMap;