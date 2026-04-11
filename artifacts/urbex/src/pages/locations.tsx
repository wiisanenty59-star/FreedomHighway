import { useState } from "react";
import { useListLocations, useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, AlertTriangle, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Locations() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  
  const { data: locations, isLoading } = useListLocations({ 
    search: search.length > 2 ? search : undefined,
    categoryId
  });
  
  const { data: categories } = useListCategories();

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
    <div className="container py-8 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-mono font-bold text-primary uppercase tracking-tighter">Location Database</h1>
          <p className="text-muted-foreground mt-1">Browse and filter discovered coordinates.</p>
        </div>
        <Button asChild className="font-mono w-full md:w-auto">
          <Link href="/locations/new">Add Location</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-card-border p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search locations..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono"
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={categoryId?.toString() || "all"} onValueChange={(v) => setCategoryId(v === "all" ? undefined : parseInt(v))}>
            <SelectTrigger className="font-mono">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map(cat => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border h-72 animate-pulse" />
          ))}
        </div>
      ) : locations?.length === 0 ? (
        <div className="bg-card border border-card-border p-12 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No coordinates found</h3>
          <p className="text-muted-foreground">Adjust your filters or add a new location to the database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations?.map(location => (
            <Link key={location.id} href={`/locations/${location.id}`} className="group block bg-card border border-card-border overflow-hidden hover:border-primary transition-colors flex flex-col h-full">
              <div className="relative h-48 bg-muted overflow-hidden">
                {location.imageUrl ? (
                  <img 
                    src={location.imageUrl} 
                    alt={location.title} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <MapPin className="w-8 h-8 opacity-50" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-border font-mono rounded-none">
                    {location.categoryName}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-xl font-bold truncate group-hover:text-primary transition-colors">{location.title}</h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{location.state || 'Unknown Location'}</span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <AlertTriangle className={`w-4 h-4 ${getRiskColor(location.riskLevel)}`} />
                    <span className={`uppercase font-bold ${getRiskColor(location.riskLevel)}`}>{location.riskLevel}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    ID: {location.id.toString().padStart(4, '0')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
