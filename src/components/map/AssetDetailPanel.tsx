import { useMapState } from '@/context/MapContext';
import { ASSET_TYPE_CONFIG, STATUS_CONFIG, CONDITION_OPTIONS, Asset, AssetStatus, MaintenanceRecord } from '@/types/assets';
import { X, MapPin, Calendar, Wrench, Activity, Package, AlertTriangle, Edit, Link } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type ActiveDialog = 'none' | 'maintenance' | 'fault' | 'edit' | 'inventory';

const AssetDetailPanel = () => {
  const { selectedAsset, showDetailPanel, selectAsset, updateAsset } = useMapState();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>('none');

  if (!showDetailPanel || !selectedAsset) return null;

  const asset = selectedAsset;
  const typeConfig = ASSET_TYPE_CONFIG[asset.type];
  const statusConfig = STATUS_CONFIG[asset.status];

  const closeDialog = () => setActiveDialog('none');

  const handleLogMaintenance = (record: MaintenanceRecord) => {
    updateAsset(asset.id, {
      maintenanceHistory: [record, ...asset.maintenanceHistory],
      lastMaintenance: record.date,
    });
    toast.success('Maintenance record logged');
    closeDialog();
  };

  const handleReportFault = (description: string) => {
    const record: MaintenanceRecord = {
      id: `MH-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'corrective',
      description,
      technician: 'Current User',
      status: 'pending',
    };
    updateAsset(asset.id, {
      status: 'faulty' as AssetStatus,
      condition: 'poor',
      maintenanceHistory: [record, ...asset.maintenanceHistory],
    });
    toast.success('Fault reported — asset marked as faulty');
    closeDialog();
  };

  const handleEditAsset = (updates: Partial<Asset>) => {
    updateAsset(asset.id, updates);
    toast.success('Asset updated');
    closeDialog();
  };

  const handleLinkInventory = (materials: { name: string; quantity: number; unit: string }[]) => {
    if (asset.maintenanceHistory.length > 0) {
      const latest = { ...asset.maintenanceHistory[0], materialsUsed: [...(asset.maintenanceHistory[0].materialsUsed || []), ...materials] };
      updateAsset(asset.id, {
        maintenanceHistory: [latest, ...asset.maintenanceHistory.slice(1)],
      });
    } else {
      const record: MaintenanceRecord = {
        id: `MH-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'preventive',
        description: 'Inventory linked',
        technician: 'Current User',
        status: 'completed',
        materialsUsed: materials,
      };
      updateAsset(asset.id, { maintenanceHistory: [record] });
    }
    toast.success('Inventory linked to asset');
    closeDialog();
  };

  return (
    <div className="w-96 h-full bg-card border-l border-border flex flex-col overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ background: statusConfig.color }} />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{statusConfig.label}</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground truncate">{asset.name}</h3>
            <p className="text-[11px] font-mono text-primary">{asset.code}</p>
          </div>
          <button onClick={() => { selectAsset(null); closeDialog(); }} className="p-1 rounded hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Type & Location */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center">
              <MapPin className="w-3 h-3 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Type</p>
              <p className="text-xs text-foreground">{typeConfig.label}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Asset ID" value={asset.id} mono />
            <InfoField label="Condition" value={asset.condition} />
            <InfoField label="Latitude" value={asset.coordinates.lat.toFixed(6)} mono />
            <InfoField label="Longitude" value={asset.coordinates.lng.toFixed(6)} mono />
            {asset.capacity && <InfoField label="Capacity" value={asset.capacity} />}
            {asset.diameter && <InfoField label="Diameter" value={asset.diameter} />}
            {asset.material && <InfoField label="Material" value={asset.material} />}
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-foreground">Timeline</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Installed" value={asset.installationDate} />
            <InfoField label="Last Maintenance" value={asset.lastMaintenance || 'N/A'} />
          </div>
        </div>

        {/* Maintenance History */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-foreground">Maintenance History</span>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">{asset.maintenanceHistory.length}</span>
          </div>
          {asset.maintenanceHistory.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">No maintenance records</p>
          ) : (
            <div className="space-y-2">
              {asset.maintenanceHistory.map(record => (
                <div key={record.id} className="p-2 rounded bg-secondary/40 border border-border/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{record.date}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      record.status === 'completed' ? 'bg-success/15 text-success' :
                      record.status === 'in_progress' ? 'bg-warning/15 text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground">{record.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">By: {record.technician}</p>
                  {record.materialsUsed && record.materialsUsed.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-border/30">
                      <div className="flex items-center gap-1 mb-1">
                        <Package className="w-2.5 h-2.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Materials Used</span>
                      </div>
                      {record.materialsUsed.map((m, i) => (
                        <p key={i} className="text-[10px] font-mono text-foreground/70">
                          {m.quantity} {m.unit} — {m.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-foreground">Quick Actions</span>
          </div>

          {activeDialog === 'none' && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setActiveDialog('maintenance')} className="py-2 px-3 rounded-md bg-secondary text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1.5">
                <Wrench className="w-3 h-3" /> Log Maintenance
              </button>
              <button onClick={() => setActiveDialog('fault')} className="py-2 px-3 rounded-md bg-secondary text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> Report Fault
              </button>
              <button onClick={() => setActiveDialog('inventory')} className="py-2 px-3 rounded-md bg-secondary text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1.5">
                <Link className="w-3 h-3" /> Link Inventory
              </button>
              <button onClick={() => setActiveDialog('edit')} className="py-2 px-3 rounded-md bg-secondary text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1.5">
                <Edit className="w-3 h-3" /> Edit Asset
              </button>
            </div>
          )}

          {activeDialog === 'maintenance' && (
            <MaintenanceForm onSubmit={handleLogMaintenance} onCancel={closeDialog} />
          )}
          {activeDialog === 'fault' && (
            <FaultForm onSubmit={handleReportFault} onCancel={closeDialog} />
          )}
          {activeDialog === 'edit' && (
            <EditAssetForm asset={asset} onSubmit={handleEditAsset} onCancel={closeDialog} />
          )}
          {activeDialog === 'inventory' && (
            <InventoryForm onSubmit={handleLinkInventory} onCancel={closeDialog} />
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Sub-forms ── */

const FormActions = ({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) => (
  <div className="flex gap-2 mt-3">
    <button type="button" onClick={onCancel} className="flex-1 py-1.5 rounded-md bg-secondary text-xs text-secondary-foreground hover:bg-secondary/80 transition-colors">
      Cancel
    </button>
    <button type="submit" className="flex-1 py-1.5 rounded-md bg-primary text-xs text-primary-foreground hover:bg-primary/90 transition-colors">
      {submitLabel}
    </button>
  </div>
);

const inputClass = "w-full h-7 px-2 text-xs bg-secondary border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";
const selectClass = inputClass;
const labelClass = "text-[10px] text-muted-foreground mb-0.5 block";

const MaintenanceForm = ({ onSubmit, onCancel }: { onSubmit: (r: MaintenanceRecord) => void; onCancel: () => void }) => {
  const [type, setType] = useState<'preventive' | 'corrective'>('preventive');
  const [desc, setDesc] = useState('');
  const [tech, setTech] = useState('');
  const [status, setStatus] = useState<'completed' | 'in_progress' | 'pending'>('completed');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;
    onSubmit({
      id: `MH-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type,
      description: desc,
      technician: tech || 'Unknown',
      status,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-2 p-3 rounded-md bg-secondary/30 border border-border/50">
      <p className="text-[11px] font-semibold text-foreground">Log Maintenance</p>
      <div>
        <label className={labelClass}>Type</label>
        <select value={type} onChange={e => setType(e.target.value as any)} className={selectClass}>
          <option value="preventive">Preventive</option>
          <option value="corrective">Corrective</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Description *</label>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was done?" className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>Technician</label>
        <input value={tech} onChange={e => setTech(e.target.value)} placeholder="Name" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as any)} className={selectClass}>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <FormActions onCancel={onCancel} submitLabel="Log Record" />
    </form>
  );
};

const FaultForm = ({ onSubmit, onCancel }: { onSubmit: (desc: string) => void; onCancel: () => void }) => {
  const [desc, setDesc] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;
    onSubmit(desc);
  };
  return (
    <form onSubmit={submit} className="space-y-2 p-3 rounded-md bg-destructive/5 border border-destructive/20">
      <p className="text-[11px] font-semibold text-destructive">Report Fault</p>
      <p className="text-[10px] text-muted-foreground">This will mark the asset as faulty and create a corrective maintenance ticket.</p>
      <div>
        <label className={labelClass}>Fault Description *</label>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe the issue..." className={inputClass} required />
      </div>
      <FormActions onCancel={onCancel} submitLabel="Report Fault" />
    </form>
  );
};

const EditAssetForm = ({ asset, onSubmit, onCancel }: { asset: Asset; onSubmit: (u: Partial<Asset>) => void; onCancel: () => void }) => {
  const [name, setName] = useState(asset.name);
  const [status, setStatus] = useState(asset.status);
  const [condition, setCondition] = useState(asset.condition);
  const [capacity, setCapacity] = useState(asset.capacity || '');
  const [material, setMaterial] = useState(asset.material || '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, status, condition, capacity: capacity || undefined, material: material || undefined });
  };

  return (
    <form onSubmit={submit} className="space-y-2 p-3 rounded-md bg-secondary/30 border border-border/50">
      <p className="text-[11px] font-semibold text-foreground">Edit Asset</p>
      <div>
        <label className={labelClass}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as AssetStatus)} className={selectClass}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Condition</label>
        <select value={condition} onChange={e => setCondition(e.target.value as any)} className={selectClass}>
          {CONDITION_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>Capacity</label>
          <input value={capacity} onChange={e => setCapacity(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Material</label>
          <input value={material} onChange={e => setMaterial(e.target.value)} className={inputClass} />
        </div>
      </div>
      <FormActions onCancel={onCancel} submitLabel="Save Changes" />
    </form>
  );
};

const InventoryForm = ({ onSubmit, onCancel }: { onSubmit: (m: { name: string; quantity: number; unit: string }[]) => void; onCancel: () => void }) => {
  const [items, setItems] = useState([{ name: '', quantity: 1, unit: 'units' }]);

  const addRow = () => setItems([...items, { name: '', quantity: 1, unit: 'units' }]);
  const updateRow = (i: number, field: string, value: string | number) => {
    const updated = [...items];
    (updated[i] as any)[field] = value;
    setItems(updated);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = items.filter(i => i.name.trim());
    if (!valid.length) return;
    onSubmit(valid);
  };

  return (
    <form onSubmit={submit} className="space-y-2 p-3 rounded-md bg-secondary/30 border border-border/50">
      <p className="text-[11px] font-semibold text-foreground">Link Inventory</p>
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-[1fr_50px_60px] gap-1.5">
          <input value={item.name} onChange={e => updateRow(i, 'name', e.target.value)} placeholder="Material name" className={inputClass} />
          <input type="number" min={1} value={item.quantity} onChange={e => updateRow(i, 'quantity', parseInt(e.target.value) || 1)} className={inputClass} />
          <input value={item.unit} onChange={e => updateRow(i, 'unit', e.target.value)} placeholder="unit" className={inputClass} />
        </div>
      ))}
      <button type="button" onClick={addRow} className="text-[10px] text-primary hover:underline">+ Add item</button>
      <FormActions onCancel={onCancel} submitLabel="Link Materials" />
    </form>
  );
};

const InfoField = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
    <p className={`text-xs text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
  </div>
);

export default AssetDetailPanel;
