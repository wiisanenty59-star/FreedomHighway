import { useGetLocation } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { MapPin, AlertTriangle, Calendar, User, Eye, Map, ShieldAlert, FileText, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function LocationDetail() {
  const { id } = useParams();
  const { data: location, isLoading } = useGetLocation(Number(id), {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return <div className="container py-8"><div className="animate-pulse h-96 bg-card border border-border" /></div>;
  }

  if (!location) {
    return <div className="container py-8 text-center text-muted-foreground">Location not found.</div>;
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-chart-2 border-chart-2 bg-chart-2/10";
      case "medium": return "text-chart-3 border-chart-3 bg-chart-3/10";
      case "high": return "text-chart-4 border-chart-4 bg-chart-4/10";
      case "extreme": return "text-chart-5 border-chart-5 bg-chart-5/10";
      default: return "text-muted-foreground border-border bg-muted";
    }
  };

  return (
    <div className="container py-8 space-y-6 max-w-5xl">
      <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono mb-4">
        <Link href="/locations" className="hover:text-primary flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Database
        </Link>
        <span>/</span>
        <span>{location.categoryName}</span>
        <span>/</span>
        <span className="text-foreground">LOC-{location.id.toString().padStart(4, '0')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Images & Map */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-card-border overflow-hidden">
            {location.imageUrl ? (
              <div className="aspect-[16/9] w-full">
                <img src={location.imageUrl} alt={location.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[16/9] w-full flex items-center justify-center bg-muted">
                <MapPin className="w-12 h-12 text-muted-foreground opacity-50" />
              </div>
            )}
          </div>

          <div className="bg-card border border-card-border p-6 space-y-6">
            <div>
              <h2 className="text-xl font-mono font-bold uppercase border-b border-border pb-2 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Report Details
              </h2>
              <div className="prose prose-invert max-w-none text-muted-foreground">
                {location.description ? (
                  <p className="whitespace-pre-wrap">{location.description}</p>
                ) : (
                  <p className="italic">No description provided for this location.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Access Notes
                </h3>
                <div className="bg-background p-4 border border-border text-sm">
                  {location.accessNotes || "Unknown access conditions."}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Known Hazards
                </h3>
                <div className="bg-background p-4 border border-border text-sm">
                  {location.hazards || "Unknown hazards."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Details */}
        <div className="space-y-6">
          <div className="bg-card border border-card-border p-6">
            <h1 className="text-2xl font-bold mb-2">{location.title}</h1>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="outline" className="font-mono bg-background">
                {location.categoryName}
              </Badge>
              <Badge variant="outline" className={`font-mono font-bold uppercase ${getRiskColor(location.riskLevel)}`}>
                {location.riskLevel} Risk
              </Badge>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3 border-b border-border pb-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-muted-foreground">{location.state}, {location.country || 'USA'}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium">Added By</div>
                  <Link href={`/profile/${location.addedByUsername}`} className="text-primary hover:underline">
                    {location.addedByUsername || 'Unknown'}
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3 border-b border-border pb-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium">Discovered</div>
                  <div className="text-muted-foreground">
                    {format(new Date(location.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium">Intel Views</div>
                  <div className="text-muted-foreground font-mono">{location.viewCount || 0}</div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button asChild className="w-full font-mono uppercase tracking-wider">
                <Link href={`/map?lat=${location.latitude}&lng=${location.longitude}`}>
                  <Map className="w-4 h-4 mr-2" /> View on Map
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
