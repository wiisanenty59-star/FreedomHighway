import { useState } from "react";
import { useListUsers, useUpdateUserStatus, useListLocations, useUpdateLocation } from "@workspace/api-client-react";
import { Shield, Check, X, Users, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { type UpdateUserStatusBodyStatus } from "@workspace/api-client-react";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: locations, isLoading: locationsLoading } = useListLocations();
  
  const updateUserStatus = useUpdateUserStatus();
  const updateLocation = useUpdateLocation();

  const handleUserStatus = (userId: number, status: "approved" | "banned") => {
    updateUserStatus.mutate({ id: userId, data: { status: status as UpdateUserStatusBodyStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        toast({ title: `User ${status}` });
      },
      onError: (err: any) => {
        toast({ title: "Update failed", description: err.error, variant: "destructive" });
      }
    });
  };

  const handleLocationStatus = (locationId: number, status: "approved" | "rejected") => {
    updateLocation.mutate({ id: locationId, data: { status: status as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
        toast({ title: `Location ${status}` });
      },
      onError: (err: any) => {
        toast({ title: "Update failed", description: err.error, variant: "destructive" });
      }
    });
  };

  const pendingUsers = users?.filter(u => u.status === "pending") || [];
  const approvedUsers = users?.filter(u => u.status === "approved") || [];
  const bannedUsers = users?.filter(u => u.status === "banned") || [];
  
  // Note: the API might not return pending locations if useListLocations filters by approved only.
  // We're assuming the admin endpoint returns all. If not, the UI handles empty gracefully.
  const pendingLocations = locations?.filter(l => l.status === "pending") || [];

  return (
    <div className="container py-8 max-w-6xl space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-mono font-bold text-primary uppercase tracking-tighter flex items-center gap-3">
          <Shield className="w-8 h-8" /> Admin Console
        </h1>
        <p className="text-muted-foreground mt-2">Network management and approval queues.</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="users" className="font-mono flex gap-2">
            <Users className="w-4 h-4" /> Users
            {pendingUsers.length > 0 && <Badge variant="destructive" className="ml-1 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-sm text-[10px]">{pendingUsers.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="locations" className="font-mono flex gap-2">
            <MapPin className="w-4 h-4" /> Locations
            {pendingLocations.length > 0 && <Badge variant="destructive" className="ml-1 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-sm text-[10px]">{pendingLocations.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="bg-card border border-card-border overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border font-mono font-bold uppercase text-sm flex items-center justify-between">
              <span>Pending Approvals ({pendingUsers.length})</span>
            </div>
            <div className="divide-y divide-border">
              {pendingUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No pending user applications.</div>
              ) : (
                pendingUsers.map(user => (
                  <div key={user.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-primary">{user.username}</h3>
                      <div className="text-sm text-muted-foreground mt-1 space-y-1">
                        <p>{user.email}</p>
                        {user.location && <p>Location: {user.location}</p>}
                        {user.bio && <p className="italic bg-background p-2 border border-border mt-2">"{user.bio}"</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white" onClick={() => handleUserStatus(user.id, "banned")}>
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button className="bg-chart-2 hover:bg-chart-2/80 text-black" onClick={() => handleUserStatus(user.id, "approved")}>
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-card-border overflow-hidden">
              <div className="bg-muted/50 p-3 border-b border-border font-mono font-bold uppercase text-xs">
                Approved Operatives ({approvedUsers.length})
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {approvedUsers.map(user => (
                  <div key={user.id} className="p-3 flex items-center justify-between text-sm">
                    <span className="font-bold">{user.username}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{user.role}</span>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive/10" onClick={() => handleUserStatus(user.id, "banned")}>
                        Ban
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-card-border overflow-hidden">
              <div className="bg-destructive/10 p-3 border-b border-border font-mono font-bold uppercase text-xs text-destructive">
                Banned Accounts ({bannedUsers.length})
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {bannedUsers.map(user => (
                  <div key={user.id} className="p-3 flex items-center justify-between text-sm opacity-60 hover:opacity-100 transition-opacity">
                    <span className="line-through">{user.username}</span>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-chart-2 hover:bg-chart-2/10" onClick={() => handleUserStatus(user.id, "approved")}>
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <div className="bg-card border border-card-border overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border font-mono font-bold uppercase text-sm flex items-center justify-between">
              <span>Pending Location Submissions ({pendingLocations.length})</span>
            </div>
            <div className="divide-y divide-border">
              {pendingLocations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p>No pending locations.</p>
                </div>
              ) : (
                pendingLocations.map(location => (
                  <div key={location.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-primary">{location.title}</h3>
                      <div className="text-sm text-muted-foreground mt-1 flex gap-4 font-mono text-xs">
                        <span>Submitted by: {location.addedByUsername}</span>
                        <span>Cat: {location.categoryName}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white" onClick={() => handleLocationStatus(location.id, "rejected")}>
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button className="bg-chart-2 hover:bg-chart-2/80 text-black" onClick={() => handleLocationStatus(location.id, "approved")}>
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
