'use client'

import React, { useRef, useEffect, useCallback, memo } from 'react'
import * as maptilersdk from '@maptiler/sdk'

// Import CSS
import '@maptiler/sdk/dist/maptiler-sdk.css';

// --- KEY CONFIRMATION ---
const API_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "nM4hlBSA3Tfmb5SGC3Sv";

interface MapViewerProps {
  center?: { lng: number; lat: number }
  zoom?: number
  style?: string
  className?: string
  height?: string
  width?: string
  markers?: Array<{ lng: number; lat: number; popup?: string; color?: string }>
  onMapLoad?: (map: maptilersdk.Map) => void
  onMapClick?: (coordinates: { lng: number; lat: number }) => void
  interactive?: boolean
}

const MapViewer = memo(function MapViewer({
  center = { lng: 101.6869, lat: 3.1390 }, 
  zoom = 14,
  style = 'streets-v2',
  className = '',
  height = '100%',
  width = '100%',
  markers = [],
  onMapLoad,
  onMapClick,
  interactive = true,
}: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maptilersdk.Map | null>(null)
  const markersRef = useRef<maptilersdk.Marker[]>([])
  const isInitialized = useRef(false)

  // 1. SET GLOBAL CONFIG IMMEDIATELY
  try {
      maptilersdk.config.apiKey = API_KEY;
  } catch (e) { 
      // Ignore config errors if already set
  }

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []
  }, [])

  const addMarkers = useCallback((mapInstance: maptilersdk.Map) => {
    if (!mapInstance) return;
    clearMarkers()
    markers.forEach((markerData) => {
      const marker = new maptilersdk.Marker({ color: markerData.color || '#3B82F6' })
        .setLngLat([markerData.lng, markerData.lat])
        .addTo(mapInstance)

      if (markerData.popup) {
        const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(markerData.popup)
        marker.setPopup(popup)
      }
      markersRef.current.push(marker)
    })
  }, [markers, clearMarkers])

  useEffect(() => {
    if (map.current || !mapContainer.current || isInitialized.current) return;
    isInitialized.current = true;

    // Create an abort controller for cleanup
    const controller = new AbortController();

    try {
      // console.log("🗺️ MapViewer: Creating Map Instance");
      
      maptilersdk.config.apiKey = API_KEY;
      const styleUrl = `https://api.maptiler.com/maps/${style}/style.json?key=${API_KEY}`;

      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [center.lng, center.lat],
        zoom: zoom,
        interactive: interactive,
        geolocate: maptilersdk.GeolocationType.COUNTRY,
        
        // --- FIX: TRANSFORM REQUEST WITH ABORT SIGNAL SUPPORT ---
        transformRequest: (url, resourceType) => {
           if (url.includes('key=&')) {
               return { url: url.replace('key=&', `key=${API_KEY}&`) };
           }
           if (url.includes('api.maptiler.com') && !url.includes('key=')) {
               const joiner = url.includes('?') ? '&' : '?';
               return { url: url + joiner + `key=${API_KEY}` };
           }
           return { url };
        }
      })

      map.current.on('load', () => {
        if (controller.signal.aborted) return; // Stop if unmounted
        console.log("✅ Map Loaded Successfully");
        if (map.current && onMapLoad) onMapLoad(map.current)
        if (markers.length > 0 && map.current) {
          console.log(`🗺️ Adding ${markers.length} markers`);
          addMarkers(map.current);
        }
        isInitialized.current = false;
      })

      // Error handling to catch and silence the "aborted" errors
      map.current.on('error', (e) => {
          if (e.error && (e.error.message.includes('aborted') || e.error.status === 0)) {
              // Ignore abort errors, they are normal during navigation/re-renders
              return;
          }
          console.warn('Map Warning:', e.error);
      });

      if (onMapClick) {
        map.current.on('click', (e) => {
          onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat })
        })
      }
    } catch (error) {
      console.error('❌ Error initializing map:', error)
      isInitialized.current = false;
    }

    // Cleanup function
    return () => {
        controller.abort(); // Cancel pending requests
        // Optional: Destroy map on unmount to free memory and stop requests
        /* if (map.current) {
            map.current.remove();
            map.current = null;
            isInitialized.current = false;
        }
        */
    }
  }, []) 

  useEffect(() => {
    if (!map.current) return;
    const c = map.current.getCenter();
    const dist = Math.sqrt(Math.pow(c.lng - center.lng, 2) + Math.pow(c.lat - center.lat, 2));
    if (dist > 0.0001) {
        try { map.current.flyTo({ center: [center.lng, center.lat], zoom: zoom, duration: 1000 }) } catch (e) {}
    }
  }, [center.lng, center.lat, zoom])

  useEffect(() => {
    if (map.current) addMarkers(map.current)
  }, [markers, addMarkers])

  return (
    <div className={`map-wrap ${className} rounded-3xl overflow-hidden relative`} style={{ height, width }}>
      <div ref={mapContainer} className="map w-full h-full rounded-3xl overflow-hidden" style={{ height: '100%', width: '100%', boxShadow: 'none' }} />
    </div>
  )
})

export default MapViewer