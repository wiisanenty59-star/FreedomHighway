import { useState, useEffect, useMemo, useRef } from "react";
import { useListLocations, useListCategories } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Layers, Filter, Plus, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
};

function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function MapPage() {
  const [, setLocation] = useLocation();
  const [mapMode, setMapMode] = useState<"street" | "satellite">("street");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const { data: locations, isLoading: locationsLoading } = useListLocations();
  const { data: categories } = useListCategories();

  const filteredLocations = useMemo(() => {
    if (!locations) return [];
    if (!selectedCategory) return locations;
    return locations.filter(loc => loc.categoryId === selectedCategory);
  }, [locations, selectedCategory]);

  const handleMapClick = (latlng: L.LatLng) => {
    // Navigate to new location form with coordinates
    setLocation(`/locations/new?lat=${latlng.lat}&lng=${latlng.lng}`);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-chart-2";
      case "medium": return "text-chart-3";
      case "high": return "text-chart-4";
      case "extreme": return "text-chart-5";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full flex flex-col md:flex-row">
      {/* Sidebar - hidden on mobile, standard on desktop */}
      <div className="hidden md:flex w-80 flex-col bg-card border-r border-border h-full z-10 shadow-xl overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="font-mono font-bold text-lg text-primary uppercase flex items-center gap-2">
            <Crosshair className="w-5 h-5" /> Grid Control
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Select point to transmit new coordinates</p>
        </div>

        <div className="p-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">View Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={mapMode === "street" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setMapMode("street")}
                className="font-mono text-xs"
              >
                Street
              </Button>
              <Button 
                variant={mapMode === "satellite" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setMapMode("satellite")}
                className="font-mono text-xs"
              >
                Satellite
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Filters</h3>
            <div className="space-y-2">
              <Button
                variant={selectedCategory === null ? "secondary" : "ghost"}
                className="w-full justify-start font-mono text-sm h-8"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {categories?.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                  className="w-full justify-start font-mono text-sm h-8"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: cat.color || '#f59e0b' }} 
                  />
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <Button className="w-full font-mono uppercase tracking-wider" onClick={() => setLocation("/locations/new")}>
              <Plus className="w-4 h-4 mr-2" /> Add Location
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile controls overlay */}
      <div className="md:hidden absolute top-4 left-4 right-4 z-[1000] flex justify-between pointer-events-none">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="secondary" className="pointer-events-auto shadow-md border border-border">
              <Filter className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh] bg-card">
            <SheetHeader>
              <SheetTitle className="font-mono text-primary uppercase text-left">Map Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">View Mode</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={mapMode === "street" ? "default" : "outline"} 
                    onClick={() => setMapMode("street")}
                  >
                    Street
                  </Button>
                  <Button 
                    variant={mapMode === "satellite" ? "default" : "outline"} 
                    onClick={() => setMapMode("satellite")}
                  >
                    Satellite
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={selectedCategory === null ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Badge>
                  {categories?.map(cat => (
                    <Badge
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <Button 
          size="icon" 
          variant="default" 
          className="pointer-events-auto shadow-md"
          onClick={() => setLocation("/locations/new")}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Map Area */}
      <div className="flex-1 h-full relative bg-black">
        {typeof window !== 'undefined' && (
          <MapContainer 
            center={[39.8283, -98.5795]} // Center of US
            zoom={4} 
            className="w-full h-full z-0"
            zoomControl={false} // Hide default zoom control
          >
            {mapMode === "street" ? (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="map-tiles-dark" // We'd add CSS filter to make it dark, but standard for now
              />
            ) : (
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            )}
            
            <MapEvents onMapClick={handleMapClick} />
            
            {!locationsLoading && filteredLocations.map(location => (
              <Marker 
                key={location.id} 
                position={[location.latitude, location.longitude]}
                icon={createCustomIcon(location.categoryColor || '#f59e0b')}
              >
                <Popup className="urbex-popup">
                  <div className="p-1 min-w-[200px]">
                    {location.imageUrl && (
                      <div className="w-full h-24 mb-2 bg-muted overflow-hidden border border-border">
                        <img src={location.imageUrl} alt={location.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-bold text-base truncate">{location.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground my-1">
                      <span>{location.state}</span>
                      <span>•</span>
                      <span className={`uppercase font-bold ${getRiskColor(location.riskLevel)}`}>{location.riskLevel} Risk</span>
                    </div>
                    <div className="mt-3">
                      <Button 
                        size="sm" 
                        className="w-full font-mono text-xs h-7"
                        onClick={() => setLocation(`/locations/${location.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <style dangerouslySetContent={{__html: `
        .map-tiles-dark {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .urbex-popup .leaflet-popup-content-wrapper {
          background-color: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .urbex-popup .leaflet-popup-tip {
          background-color: hsl(var(--card));
          border-left: 1px solid hsl(var(--border));
          border-top: 1px solid hsl(var(--border));
        }
        .leaflet-container {
          background-color: #000;
          font-family: var(--app-font-sans);
        }
        .leaflet-control-attribution {
          background-color: rgba(0,0,0,0.7) !important;
          color: #aaa !important;
          border-radius: 0 !important;
        }
        .leaflet-control-attribution a {
          color: hsl(var(--primary)) !important;
        }
      `}} />
    </div>
  );
}
