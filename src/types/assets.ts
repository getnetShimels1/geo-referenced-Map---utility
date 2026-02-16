export type AssetStatus = 'active' | 'faulty' | 'under_maintenance' | 'inactive';

export type PointAssetType = 
  | 'water_source' 
  | 'reservoir' 
  | 'pump' 
  | 'valve' 
  | 'junction' 
  | 'bulk_meter' 
  | 'treatment_unit';

export type LinearAssetType = 'transmission_pipe' | 'distribution_pipe';

export type PolygonAssetType = 'treatment_plant' | 'storage_compound' | 'service_zone';

export type AssetType = PointAssetType | LinearAssetType | PolygonAssetType;

export type GeometryType = 'point' | 'line' | 'polygon';

export interface AssetCoordinate {
  lat: number;
  lng: number;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'preventive' | 'corrective';
  description: string;
  technician: string;
  status: 'completed' | 'pending' | 'in_progress';
  materialsUsed?: { name: string; quantity: number; unit: string }[];
}

export interface Asset {
  id: string;
  name: string;
  code: string;
  type: AssetType;
  geometryType: GeometryType;
  status: AssetStatus;
  coordinates: AssetCoordinate;
  lineCoordinates?: AssetCoordinate[];
  polygonCoordinates?: AssetCoordinate[];
  installationDate: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  capacity?: string;
  diameter?: string;
  material?: string;
  lastMaintenance?: string;
  maintenanceHistory: MaintenanceRecord[];
  photos?: string[];
  notes?: string;
}

export const ASSET_TYPE_CONFIG: Record<AssetType, { 
  label: string; 
  icon: string; 
  colorVar: string;
  geometryType: GeometryType;
  category: 'point' | 'linear' | 'polygon';
}> = {
  water_source: { label: 'Water Source', icon: 'Droplets', colorVar: '--asset-source', geometryType: 'point', category: 'point' },
  reservoir: { label: 'Reservoir', icon: 'Container', colorVar: '--asset-reservoir', geometryType: 'point', category: 'point' },
  pump: { label: 'Pump', icon: 'Zap', colorVar: '--asset-pump', geometryType: 'point', category: 'point' },
  valve: { label: 'Valve', icon: 'Settings', colorVar: '--asset-valve', geometryType: 'point', category: 'point' },
  junction: { label: 'Junction', icon: 'GitFork', colorVar: '--asset-junction', geometryType: 'point', category: 'point' },
  bulk_meter: { label: 'Bulk Meter', icon: 'Gauge', colorVar: '--asset-meter', geometryType: 'point', category: 'point' },
  treatment_unit: { label: 'Treatment Unit', icon: 'FlaskConical', colorVar: '--asset-treatment', geometryType: 'point', category: 'point' },
  transmission_pipe: { label: 'Transmission Pipe', icon: 'ArrowRight', colorVar: '--asset-pipe', geometryType: 'line', category: 'linear' },
  distribution_pipe: { label: 'Distribution Pipe', icon: 'GitBranch', colorVar: '--asset-pipe', geometryType: 'line', category: 'linear' },
  treatment_plant: { label: 'Treatment Plant', icon: 'Factory', colorVar: '--asset-treatment', geometryType: 'polygon', category: 'polygon' },
  storage_compound: { label: 'Storage Compound', icon: 'Warehouse', colorVar: '--asset-reservoir', geometryType: 'polygon', category: 'polygon' },
  service_zone: { label: 'Service Zone', icon: 'MapPin', colorVar: '--asset-source', geometryType: 'polygon', category: 'polygon' },
};

export const STATUS_CONFIG: Record<AssetStatus, { label: string; dotClass: string; color: string }> = {
  active: { label: 'Active', dotClass: 'status-dot-active', color: 'hsl(152, 60%, 42%)' },
  faulty: { label: 'Faulty', dotClass: 'status-dot-faulty', color: 'hsl(0, 72%, 55%)' },
  under_maintenance: { label: 'Under Maintenance', dotClass: 'status-dot-maintenance', color: 'hsl(38, 92%, 50%)' },
  inactive: { label: 'Inactive', dotClass: 'status-dot-inactive', color: 'hsl(215, 12%, 45%)' },
};

export const CONDITION_OPTIONS = ['excellent', 'good', 'fair', 'poor', 'critical'] as const;
