'use client';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import styles from './PlaceMap.module.css';

/**
 * Client component — renders a Google Map centered on the place's coordinates.
 * Returns null if lat/lng is unavailable.
 */
export default function PlaceMap({ latitude, longitude, name }) {
  if (latitude == null || longitude == null) return null;

  const center = { lat: latitude, lng: longitude };

  return (
    <div className={styles.wrap}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={16}
          gestureHandling="cooperative"
          disableDefaultUI
        >
          <Marker position={center} title={name} />
        </Map>
      </APIProvider>
    </div>
  );
}
