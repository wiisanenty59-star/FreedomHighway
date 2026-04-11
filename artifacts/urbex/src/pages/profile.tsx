import { useParams } from "wouter";
import { useAuth } from "@/lib/auth";
import { User, Calendar, MapPin, MessageSquare, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  
  // Since we don't have a specific `useGetUserByUsername` hook,
  // we'll display limited info based on what we can gather, or 
  // simulate a profile if it's the current user.
  // In a real app, we'd fetch the specific user profile here.
  
  const isCurrentUser = currentUser?.username === username;
  
  // If it's the current user, we have full data. Otherwise we show a restricted view.
  const profileData = isCurrentUser ? currentUser : { username, role: "member" as const };

  return (
    <div className="container py-12 max-w-4xl">
      <div className="bg-card border border-card-border overflow-hidden">
        {/* Profile Header */}
        <div className="bg-muted p-8 border-b border-border flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left relative overflow-hidden">
          {/* Abstract pattern background element */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
              <path d="M0,0 L100,0 L100,100 Z" />
              <circle cx="80" cy="20" r="10" />
            </svg>
          </div>
          
          <div className="w-32 h-32 bg-background border-2 border-primary flex items-center justify-center shrink-0 z-10">
            <User className="w-16 h-16 text-primary/50" />
          </div>
          
          <div className="flex-1 space-y-2 z-10 pt-2">
            <h1 className="text-4xl font-mono font-bold uppercase tracking-tighter text-foreground">
              {profileData?.username}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-mono text-muted-foreground">
              <span className={`uppercase font-bold ${profileData?.role === 'admin' ? 'text-destructive' : 'text-primary'}`}>
                {profileData?.role === 'admin' ? 'Administrator' : 'Operative'}
              </span>
              {isCurrentUser && currentUser?.joinedAt && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Joined {format(new Date(currentUser.joinedAt), 'MMM yyyy')}
                  </span>
                </>
              )}
            </div>
            
            {isCurrentUser && currentUser?.bio && (
              <p className="mt-4 text-foreground/80 max-w-2xl font-sans text-left">
                "{currentUser.bio}"
              </p>
            )}
            
            {isCurrentUser && currentUser?.location && (
              <div className="flex items-center gap-1.5 text-muted-foreground mt-2 text-sm justify-center md:justify-start">
                <MapPin className="w-4 h-4" /> {currentUser.location}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {isCurrentUser && (
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border bg-background">
            <div className="p-6 border-r border-border text-center">
              <MapPin className="w-6 h-6 text-primary mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-mono font-bold text-foreground">{currentUser.locationCount || 0}</div>
              <div className="text-xs uppercase font-mono text-muted-foreground mt-1">Locations Discovered</div>
            </div>
            <div className="p-6 md:border-r border-border text-center">
              <MessageSquare className="w-6 h-6 text-primary mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-mono font-bold text-foreground">{currentUser.postCount || 0}</div>
              <div className="text-xs uppercase font-mono text-muted-foreground mt-1">Forum Transmissions</div>
            </div>
            <div className="p-6 border-t md:border-t-0 border-r border-border text-center">
              <Activity className="w-6 h-6 text-primary mx-auto mb-2 opacity-80" />
              <div className="text-3xl font-mono font-bold text-foreground">Active</div>
              <div className="text-xs uppercase font-mono text-muted-foreground mt-1">Account Status</div>
            </div>
            <div className="p-6 border-t md:border-t-0 border-border text-center flex flex-col justify-center">
              <span className="text-xs text-muted-foreground mb-1">Clearance Level</span>
              <span className={`font-mono font-bold uppercase tracking-widest ${currentUser.role === 'admin' ? 'text-destructive' : 'text-primary'}`}>
                {currentUser.role === 'admin' ? 'OMEGA' : 'STANDARD'}
              </span>
            </div>
          </div>
        )}

        <div className="p-8 text-center text-muted-foreground font-mono">
          {!isCurrentUser ? (
            <p>Detailed operative intel is restricted to self-view only.</p>
          ) : (
            <div className="max-w-md mx-auto space-y-4">
              <p>Activity history logging is active.</p>
              <div className="p-4 border border-border bg-background text-xs text-left">
                <div className="text-primary mb-2">// RECENT SYSTEM LOGS</div>
                <div className="space-y-1 opacity-70">
                  <p>› Authentication successful from current IP</p>
                  <p>› Access token refreshed</p>
                  <p>› Session established</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
