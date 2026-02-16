import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Asset, AssetType, AssetStatus } from '@/types/assets';
import { mockAssets } from '@/data/mockAssets';

interface Filters {
  types: AssetType[];
  statuses: AssetStatus[];
  search: string;
}

interface MapState {
  assets: Asset[];
  selectedAsset: Asset | null;
  filters: Filters;
  isRegistering: boolean;
  showDetailPanel: boolean;
  visibleLayers: AssetType[];
  selectAsset: (asset: Asset | null) => void;
  setFilters: (filters: Partial<Filters>) => void;
  toggleLayer: (type: AssetType) => void;
  setIsRegistering: (v: boolean) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  filteredAssets: Asset[];
}

const MapContext = createContext<MapState | null>(null);

export const useMapState = () => {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMapState must be used within MapProvider');
  return ctx;
};

const ALL_TYPES: AssetType[] = [
  'water_source', 'reservoir', 'pump', 'valve', 'junction',
  'bulk_meter', 'treatment_unit', 'transmission_pipe', 'distribution_pipe',
  'treatment_plant', 'storage_compound', 'service_zone',
];

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<AssetType[]>(ALL_TYPES);
  const [filters, setFiltersState] = useState<Filters>({ types: [], statuses: [], search: '' });

  const selectAsset = useCallback((asset: Asset | null) => {
    setSelectedAsset(asset);
    setShowDetailPanel(!!asset);
  }, []);

  const setFilters = useCallback((partial: Partial<Filters>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
  }, []);

  const toggleLayer = useCallback((type: AssetType) => {
    setVisibleLayers(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const addAsset = useCallback((asset: Asset) => {
    setAssets(prev => [...prev, asset]);
    setIsRegistering(false);
  }, []);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    setSelectedAsset(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
  }, []);

  const filteredAssets = assets.filter(a => {
    if (!visibleLayers.includes(a.type)) return false;
    if (filters.types.length && !filters.types.includes(a.type)) return false;
    if (filters.statuses.length && !filters.statuses.includes(a.status)) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      return a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s) || a.id.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <MapContext.Provider value={{
      assets, selectedAsset, filters, isRegistering, showDetailPanel, visibleLayers,
      selectAsset, setFilters, toggleLayer, setIsRegistering, addAsset, updateAsset, filteredAssets,
    }}>
      {children}
    </MapContext.Provider>
  );
};
