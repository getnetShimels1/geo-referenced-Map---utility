import { MapProvider } from '@/context/MapContext';
import GISMap from '@/components/map/GISMap';
import MapSidebar from '@/components/map/MapSidebar';
import AssetDetailPanel from '@/components/map/AssetDetailPanel';
import MapStatusBar from '@/components/map/MapStatusBar';

const Index = () => {
  return (
    <MapProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        <div className="flex flex-1 min-h-0">
          <MapSidebar />
          <div className="flex-1 relative">
            <GISMap />
          </div>
          <AssetDetailPanel />
        </div>
        <MapStatusBar />
      </div>
    </MapProvider>
  );
};

export default Index;
