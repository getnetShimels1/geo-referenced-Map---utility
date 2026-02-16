import { useMapState } from '@/context/MapContext';
import { ASSET_TYPE_CONFIG, STATUS_CONFIG, AssetType, AssetStatus } from '@/types/assets';
import { Search, X, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const MapSidebar = () => {
  const { filters, setFilters, visibleLayers, toggleLayer, filteredAssets, selectAsset, isRegistering, setIsRegistering } = useMapState();
  const [layersOpen, setLayersOpen] = useState(true);
  const [assetsOpen, setAssetsOpen] = useState(true);

  const pointTypes: AssetType[] = ['water_source', 'reservoir', 'pump', 'valve', 'junction', 'bulk_meter', 'treatment_unit'];
  const linearTypes: AssetType[] = ['transmission_pipe', 'distribution_pipe'];

  const statusCounts = filteredAssets.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-80 h-full bg-card border-r border-border flex flex-col overflow-hidden animate-slide-in-left">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">FlowiusManage</h2>
            <p className="text-[10px] font-mono text-muted-foreground">GIS Infrastructure</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets..."
            value={filters.search}
            onChange={e => setFilters({ search: e.target.value })}
            className="w-full h-8 pl-8 pr-8 text-xs bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {filters.search && (
            <button onClick={() => setFilters({ search: '' })} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="p-3 border-b border-border grid grid-cols-2 gap-2">
        {(Object.entries(STATUS_CONFIG) as [AssetStatus, typeof STATUS_CONFIG[AssetStatus]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => {
              const has = filters.statuses.includes(key);
              setFilters({ statuses: has ? filters.statuses.filter(s => s !== key) : [...filters.statuses, key] });
            }}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] font-mono transition-colors ${
              filters.statuses.includes(key) ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className={`status-dot ${cfg.dotClass}`} />
            <span>{cfg.label}</span>
            <span className="ml-auto font-semibold">{statusCounts[key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Layers */}
      <div className="flex-1 overflow-y-auto">
        <button onClick={() => setLayersOpen(!layersOpen)} className="w-full flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
          {layersOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Layers
        </button>
        {layersOpen && (
          <div className="px-3 pb-2 space-y-0.5">
            <p className="text-[10px] text-muted-foreground px-1 mb-1">Point Assets</p>
            {pointTypes.map(type => {
              const cfg = ASSET_TYPE_CONFIG[type];
              const count = filteredAssets.filter(a => a.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => toggleLayer(type)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                    visibleLayers.includes(type) ? 'text-foreground bg-secondary/50' : 'text-muted-foreground/50'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full transition-opacity ${!visibleLayers.includes(type) ? 'opacity-30' : ''}`}
                    style={{ background: `hsl(var(${cfg.colorVar}))` }} />
                  <span className="flex-1 text-left">{cfg.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{count}</span>
                </button>
              );
            })}
            <p className="text-[10px] text-muted-foreground px-1 mt-2 mb-1">Linear Assets</p>
            {linearTypes.map(type => {
              const cfg = ASSET_TYPE_CONFIG[type];
              const count = filteredAssets.filter(a => a.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => toggleLayer(type)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                    visibleLayers.includes(type) ? 'text-foreground bg-secondary/50' : 'text-muted-foreground/50'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full transition-opacity ${!visibleLayers.includes(type) ? 'opacity-30' : ''}`}
                    style={{ background: `hsl(var(${cfg.colorVar}))` }} />
                  <span className="flex-1 text-left">{cfg.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Asset List */}
        <button onClick={() => setAssetsOpen(!assetsOpen)} className="w-full flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground border-t border-border">
          {assetsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Assets ({filteredAssets.length})
        </button>
        {assetsOpen && (
          <div className="px-2 pb-2 space-y-0.5">
            {filteredAssets.map(asset => (
              <button
                key={asset.id}
                onClick={() => selectAsset(asset)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded text-xs hover:bg-secondary/60 transition-colors group"
              >
                <span className={`status-dot ${STATUS_CONFIG[asset.status].dotClass}`} />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-foreground truncate text-[11px]">{asset.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{asset.code}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{ASSET_TYPE_CONFIG[asset.type].label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Register Button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className={`w-full py-2 rounded-md text-xs font-semibold transition-all ${
            isRegistering
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground glow-primary'
          }`}
        >
          {isRegistering ? 'Cancel Registration' : '+ Register New Asset'}
        </button>
        {isRegistering && (
          <p className="text-[10px] text-warning text-center mt-1.5 animate-pulse-glow">
            Click on the map to place an asset
          </p>
        )}
      </div>
    </div>
  );
};

export default MapSidebar;