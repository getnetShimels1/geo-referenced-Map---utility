import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { useMapState } from '@/context/MapContext';
import { ASSET_TYPE_CONFIG, STATUS_CONFIG, Asset } from '@/types/assets';
import { MAP_CENTER, MAP_ZOOM } from '@/data/mockAssets';

const createMarkerIcon = (assetType: string, status: string) => {
  const config = ASSET_TYPE_CONFIG[assetType as keyof typeof ASSET_TYPE_CONFIG];
  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  const color = statusConfig?.color || 'hsl(215, 12%, 45%)';

  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `<div class="custom-marker-icon" style="width:28px;height:28px;background:${color};">
      <span style="font-size:10px;color:white;font-weight:700;font-family:JetBrains Mono,monospace;">${config?.label?.charAt(0) || '?'}</span>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const PIPE_DASH_PATTERNS: Record<string, string | undefined> = {
  transmission_pipe: undefined, // solid
  distribution_pipe: '8 6',
};

const GISMap = () => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const linesRef = useRef<L.LayerGroup | null>(null);
  const { filteredAssets, selectAsset, isRegistering, addAsset } = useMapState();

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [MAP_CENTER.lat, MAP_CENTER.lng],
      zoom: MAP_ZOOM,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const osmLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri',
      maxZoom: 19,
    });

    osmLayer.addTo(map);

    L.control.layers(
      { 'Dark': osmLayer, 'Satellite': satelliteLayer },
      {},
      { position: 'topright' }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle click-to-register
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isRegistering) {
      map.getContainer().style.cursor = 'crosshair';
      const handler = (e: L.LeafletMouseEvent) => {
        const newAsset: Asset = {
          id: `NEW-${Date.now()}`,
          name: 'New Asset',
          code: `AST-${Date.now().toString(36).toUpperCase()}`,
          type: 'water_source',
          geometryType: 'point',
          status: 'active',
          coordinates: { lat: e.latlng.lat, lng: e.latlng.lng },
          installationDate: new Date().toISOString().split('T')[0],
          condition: 'good',
          maintenanceHistory: [],
        };
        addAsset(newAsset);
      };
      map.on('click', handler);
      return () => {
        map.off('click', handler);
        map.getContainer().style.cursor = '';
      };
    } else {
      map.getContainer().style.cursor = '';
    }
  }, [isRegistering, addAsset]);

  // Update markers and lines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous
    if (markersRef.current) map.removeLayer(markersRef.current);
    if (linesRef.current) map.removeLayer(linesRef.current);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });

    const lineGroup = L.layerGroup();

    filteredAssets.forEach(asset => {
      if (asset.geometryType === 'point') {
        const marker = L.marker([asset.coordinates.lat, asset.coordinates.lng], {
          icon: createMarkerIcon(asset.type, asset.status),
        });
        marker.on('click', () => selectAsset(asset));
        marker.bindTooltip(
          `<div style="font-family:JetBrains Mono,monospace;font-size:11px;">
            <strong>${asset.name}</strong><br/>
            <span style="opacity:0.7">${asset.code}</span>
          </div>`,
          { direction: 'top', offset: [0, -14] }
        );
        cluster.addLayer(marker);
      } else if (asset.geometryType === 'line' && asset.lineCoordinates) {
        const statusColor = STATUS_CONFIG[asset.status]?.color || 'hsl(187, 40%, 60%)';
        const dashArray = PIPE_DASH_PATTERNS[asset.type];
        const isTransmission = asset.type === 'transmission_pipe';

        // Outer glow line
        const glowLine = L.polyline(
          asset.lineCoordinates.map(c => [c.lat, c.lng] as L.LatLngTuple),
          {
            color: statusColor,
            weight: isTransmission ? 8 : 5,
            opacity: 0.2,
            dashArray,
          }
        );

        // Main pipe line
        const mainLine = L.polyline(
          asset.lineCoordinates.map(c => [c.lat, c.lng] as L.LatLngTuple),
          {
            color: statusColor,
            weight: isTransmission ? 4 : 3,
            opacity: 0.85,
            dashArray,
            lineCap: 'round',
            lineJoin: 'round',
          }
        );

        mainLine.on('click', () => selectAsset(asset));
        mainLine.bindTooltip(
          `<div style="font-family:JetBrains Mono,monospace;font-size:11px;">
            <strong>${asset.name}</strong><br/>
            <span style="opacity:0.7">${asset.code} · ${asset.diameter || ''} ${asset.material || ''}</span>
          </div>`,
          { sticky: true }
        );

        // Hover effect
        mainLine.on('mouseover', () => {
          mainLine.setStyle({ weight: isTransmission ? 6 : 5, opacity: 1 });
          glowLine.setStyle({ weight: isTransmission ? 12 : 9, opacity: 0.35 });
        });
        mainLine.on('mouseout', () => {
          mainLine.setStyle({ weight: isTransmission ? 4 : 3, opacity: 0.85 });
          glowLine.setStyle({ weight: isTransmission ? 8 : 5, opacity: 0.2 });
        });

        lineGroup.addLayer(glowLine);
        lineGroup.addLayer(mainLine);
      }
    });

    // Add lines first (below markers)
    lineGroup.addTo(map);
    cluster.addTo(map);
    linesRef.current = lineGroup;
    markersRef.current = cluster;
  }, [filteredAssets, selectAsset]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
};

export default GISMap;
