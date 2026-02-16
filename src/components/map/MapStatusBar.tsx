import { useMapState } from '@/context/MapContext';
import { Droplets, Activity, AlertTriangle, Wrench } from 'lucide-react';

const MapStatusBar = () => {
  const { filteredAssets, assets, isRegistering } = useMapState();

  const stats = {
    total: assets.length,
    active: assets.filter(a => a.status === 'active').length,
    faulty: assets.filter(a => a.status === 'faulty').length,
    maintenance: assets.filter(a => a.status === 'under_maintenance').length,
  };

  return (
    <div className="h-10 bg-card/80 backdrop-blur-sm border-t border-border flex items-center px-4 gap-6 text-[11px] font-mono">
      <div className="flex items-center gap-1.5 text-primary">
        <Droplets className="w-3.5 h-3.5" />
        <span className="text-foreground font-semibold">FlowiusManage</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-success" />
        <span className="text-muted-foreground">Active:</span>
        <span className="text-success font-semibold">{stats.active}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <AlertTriangle className="w-3 h-3 text-destructive" />
        <span className="text-muted-foreground">Faulty:</span>
        <span className="text-destructive font-semibold">{stats.faulty}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Wrench className="w-3 h-3 text-warning" />
        <span className="text-muted-foreground">Maintenance:</span>
        <span className="text-warning font-semibold">{stats.maintenance}</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <span className="text-muted-foreground">
        Showing <span className="text-foreground font-semibold">{filteredAssets.length}</span> of {stats.total} assets
      </span>

      {isRegistering && (
        <>
          <div className="h-4 w-px bg-border" />
          <span className="text-warning animate-pulse-glow">● REGISTRATION MODE</span>
        </>
      )}

      <span className="ml-auto text-muted-foreground/50">v1.0.0</span>
    </div>
  );
};

export default MapStatusBar;
