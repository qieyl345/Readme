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
  loadingComponent?: React.ReactNode
}

const MapViewerOptimized = memo(function MapViewer({
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
  loadingComponent = (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-2"></div>
        <p className="text-slate-500 text-sm">Loading map...</p>
      </div>
    </div>
  ),
}: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maptilersdk.Map | null>(null)
  const markersRef = useRef<maptilersdk.Marker[]>([])
  const isInitialized = useRef(false)
  const isLoading = useRef(true)

  // 1. SET GLOBAL CONFIG IMMEDIATELY
  useEffect(() => {
    try {
      maptilersdk.config.apiKey = API_KEY;
    } catch (e) { 
      // Ignore config errors if already set
    }
  }, [])

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

  // Optimized map initialization with lazy loading
  useEffect(() => {
    if (map.current || !mapContainer.current || isInitialized.current) return;
    isInitialized.current = true;
    isLoading.current = true;

    try {
      maptilersdk.config.apiKey = API_KEY;
      const styleUrl = `https://api.maptiler.com/maps/${style}/style.json?key=${API_KEY}`;

      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [center.lng, center.lat],
        zoom: zoom,
        interactive: interactive,
        geolocate: maptilersdk.GeolocationType.COUNTRY,
        
        // Performance optimizations
        attributionControl: false,
        logoPosition: 'bottom-left',
        preserveDrawingBuffer: false,
        
        // Lazy loading optimizations
        refreshExpiredTiles: false,
        
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
        console.log("✅ Map Loaded Successfully")
        isLoading.current = false;
        if (map.current && onMapLoad) onMapLoad(map.current)
        if (markers.length > 0 && map.current) {
          addMarkers(map.current);
        }
        isInitialized.current = false;
      })

      // Optimized error handling
      map.current.on('error', (e) => {
        if (e.error && (e.error.message.includes('aborted') || e.error.status === 0)) {
          return; // Ignore abort errors
        }
        console.warn('Map Warning:', e.error);
      });

      if (onMapClick && map.current) {
        map.current.on('click', (e) => {
          onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat })
        })
      }
    } catch (error) {
      console.error('❌ Error initializing map:', error)
      isInitialized.current = false;
      isLoading.current = false;
    }

    // Cleanup function
    return () => {
      if (map.current) {
        try {
          map.current.remove();
          map.current = null;
          isInitialized.current = false;
          isLoading.current = false;
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }, []) // Only run once on mount

  // Optimize center/zoom updates
  useEffect(() => {
    if (!map.current || isLoading.current) return;
    
    const c = map.current.getCenter();
    const dist = Math.sqrt(Math.pow(c.lng - center.lng, 2) + Math.pow(c.lat - center.lat, 2));
    if (dist > 0.0001) {
      try { 
        map.current.flyTo({ center: [center.lng, center.lat], zoom: zoom, duration: 800 }) 
      } catch (e) {
        // Ignore flyTo errors
      }
    }
  }, [center.lng, center.lat, zoom])

  // Optimize marker updates
  useEffect(() => {
    if (map.current && !isLoading.current) {
      addMarkers(map.current)
    }
  }, [markers, addMarkers])

  return (
    <div className={`map-wrap ${className} rounded-3xl overflow-hidden relative`} style={{ height, width }}>
      {isLoading.current && loadingComponent}
      <div 
        ref={mapContainer} 
        className={`map w-full h-full rounded-3xl overflow-hidden ${isLoading.current ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`} 
        style={{ height: '100%', width: '100%', boxShadow: 'none' }} 
      />
    </div>
  )
})

export default MapViewerOptimized