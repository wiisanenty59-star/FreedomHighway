import { useAuth } from "@/lib/auth";
import { useGetRecentLocations, useGetForumStats, useGetLocationStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MapPin, MessageSquare, Users, Shield, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user } = useAuth();
  
  const { data: recentLocations, isLoading: locationsLoading } = useGetRecentLocations();
  const { data: forumStats, isLoading: forumStatsLoading } = useGetForumStats();
  const { data: locationStats, isLoading: locationStatsLoading } = useGetLocationStats();

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
    <div className="container py-8 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-mono font-bold text-primary uppercase tracking-tighter">Command Center</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.username}. Access granted.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="font-mono">
            <Link href="/locations/new">Add Location</Link>
          </Button>
          <Button asChild className="font-mono">
            <Link href="/forum/new">New Thread</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Column */}
        <div className="space-y-6">
          <div className="bg-card border border-card-border p-4">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="font-mono font-bold text-lg uppercase">Network Status</h2>
            </div>
            
            {forumStatsLoading || locationStatsLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted w-full" />
                <div className="h-4 bg-muted w-3/4" />
                <div className="h-4 bg-muted w-5/6" />
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><MapPin className="w-3 h-3" /> Known Locations</span>
                  <span className="font-mono text-primary font-bold">{locationStats?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><MessageSquare className="w-3 h-3" /> Active Threads</span>
                  <span className="font-mono text-primary font-bold">{forumStats?.totalThreads || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><Users className="w-3 h-3" /> Operatives</span>
                  <span className="font-mono text-primary font-bold">{forumStats?.totalMembers || 0}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2"><Shield className="w-3 h-3" /> Clearance Level</span>
                  <span className="font-mono text-primary font-bold uppercase">{user?.role}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-card-border p-4 flex flex-col items-center justify-center text-center gap-4 py-8">
            <MapPin className="w-8 h-8 text-muted-foreground" />
            <div>
              <h3 className="font-mono font-bold text-lg mb-1">Explore Map</h3>
              <p className="text-sm text-muted-foreground mb-4">Access the global grid of discovered locations.</p>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/map">Open Map</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-card-border">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="font-mono font-bold text-lg uppercase">Recently Discovered</h2>
              </div>
              <Link href="/locations" className="text-xs font-mono text-primary hover:underline uppercase">View All</Link>
            </div>
            
            <div className="divide-y divide-border">
              {locationsLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-4 flex gap-4 animate-pulse">
                    <div className="w-16 h-16 bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted w-1/3" />
                      <div className="h-3 bg-muted w-1/4" />
                    </div>
                  </div>
                ))
              ) : recentLocations?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No locations discovered yet.
                </div>
              ) : (
                recentLocations?.slice(0, 5).map(location => (
                  <Link key={location.id} href={`/locations/${location.id}`} className="flex gap-4 p-4 hover:bg-muted/50 transition-colors group">
                    <div className="w-16 h-16 bg-muted shrink-0 relative overflow-hidden border border-border">
                      {location.imageUrl ? (
                        <img src={location.imageUrl} alt={location.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <MapPin className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">{location.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {location.state || 'Unknown'}</span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className={`w-3 h-3 ${getRiskColor(location.riskLevel)}`} />
                          <span className={`uppercase ${getRiskColor(location.riskLevel)}`}>{location.riskLevel} Risk</span>
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end justify-center text-xs text-muted-foreground">
                      <span className="px-2 py-1 bg-muted font-mono">{location.categoryName}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
