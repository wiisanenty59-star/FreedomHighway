import { useListMyInvites, useCreateInvite, useGetInviteEligibility } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, CheckCircle, Lock, Copy, Clock } from "lucide-react";

const REGISTER_BASE = typeof window !== "undefined" ? `${window.location.origin}/register` : "/register";

export default function Invites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: eligibility, isLoading: eligLoading } = useGetInviteEligibility();
  const { data: invites, isLoading: invitesLoading } = useListMyInvites();
  const createInvite = useCreateInvite();

  function handleCreate() {
    createInvite.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
        toast({ title: "Invite code created!" });
      },
      onError: (err: any) => {
        toast({ title: "Failed", description: err.error, variant: "destructive" });
      },
    });
  }

  function copyInviteLink(code: string) {
    const url = `${REGISTER_BASE}?invite=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Invite link copied!" });
  }

  const eligible = eligibility?.eligible ?? false;
  const postCount = eligibility?.postCount ?? 0;
  const locationCount = eligibility?.locationCount ?? 0;
  const requiredPosts = eligibility?.requiredPosts ?? 10;
  const requiredLocations = eligibility?.requiredLocations ?? 2;

  const unusedInvites = invites?.filter(i => !i.usedById && new Date(i.expiresAt) > new Date()) ?? [];
  const usedInvites = invites?.filter(i => i.usedById) ?? [];
  const expiredInvites = invites?.filter(i => !i.usedById && new Date(i.expiresAt) <= new Date()) ?? [];

  return (
    <div className="container py-8 max-w-3xl space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-mono font-bold text-primary uppercase tracking-tighter flex items-center gap-3">
          <Ticket className="w-8 h-8" /> Invite System
        </h1>
        <p className="text-muted-foreground mt-2">
          Earn invite privileges by contributing to the community. Each invite grants instant access to a trusted contact.
        </p>
      </div>

      <div className="bg-card border border-card-border p-6 space-y-5">
        <h2 className="font-mono font-bold uppercase tracking-wider text-sm border-b border-border pb-2">
          Your Eligibility
        </h2>

        {eligLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted w-full" />
            <div className="h-4 bg-muted w-3/4" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-mono">Forum Posts</span>
                  {postCount >= requiredPosts ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-end gap-1">
                  <span className={`text-2xl font-bold font-mono ${postCount >= requiredPosts ? "text-green-500" : "text-primary"}`}>
                    {postCount}
                  </span>
                  <span className="text-muted-foreground text-sm mb-0.5">/ {requiredPosts} required</span>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (postCount / requiredPosts) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-background border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground font-mono">Hidden Spots</span>
                  {locationCount >= requiredLocations ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-end gap-1">
                  <span className={`text-2xl font-bold font-mono ${locationCount >= requiredLocations ? "text-green-500" : "text-primary"}`}>
                    {locationCount}
                  </span>
                  <span className="text-muted-foreground text-sm mb-0.5">/ {requiredLocations} required</span>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (locationCount / requiredLocations) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {eligible ? (
              <div className="bg-green-950/30 border border-green-800/50 p-3 text-sm text-green-400 font-mono flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                You've earned invite privileges. You can have up to 3 active invite codes at once.
              </div>
            ) : (
              <div className="bg-muted/30 border border-border p-3 text-sm text-muted-foreground font-mono">
                You need {Math.max(0, requiredPosts - postCount)} more posts and {Math.max(0, requiredLocations - locationCount)} more hidden spots to unlock invites.
              </div>
            )}

            <Button
              onClick={handleCreate}
              disabled={!eligible || createInvite.isPending || unusedInvites.length >= 3}
              className="font-mono"
            >
              {createInvite.isPending ? "Generating..." : "Generate Invite Code"}
            </Button>
            {unusedInvites.length >= 3 && (
              <p className="text-xs text-muted-foreground">You already have 3 unused codes. Use or wait for them to expire first.</p>
            )}
          </>
        )}
      </div>

      {unusedInvites.length > 0 && (
        <div className="bg-card border border-card-border overflow-hidden">
          <div className="bg-muted/50 p-3 border-b border-border font-mono font-bold uppercase text-xs tracking-wider">
            Active Invite Codes ({unusedInvites.length})
          </div>
          <div className="divide-y divide-border">
            {unusedInvites.map(invite => (
              <div key={invite.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="font-mono font-bold text-primary text-lg tracking-widest">{invite.code}</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={() => copyInviteLink(invite.code)}
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy Link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {usedInvites.length > 0 && (
        <div className="bg-card border border-card-border overflow-hidden">
          <div className="bg-muted/50 p-3 border-b border-border font-mono font-bold uppercase text-xs tracking-wider text-muted-foreground">
            Used Invites ({usedInvites.length})
          </div>
          <div className="divide-y divide-border">
            {usedInvites.map(invite => (
              <div key={invite.id} className="p-4 flex items-center justify-between gap-4 opacity-60">
                <span className="font-mono text-sm tracking-widest line-through">{invite.code}</span>
                <Badge variant="secondary" className="text-xs font-mono">Used {invite.usedAt ? new Date(invite.usedAt).toLocaleDateString() : ""}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-card-border p-4 text-xs text-muted-foreground space-y-1 font-mono">
        <p className="font-bold text-foreground uppercase tracking-wider mb-2">Invite Rules</p>
        <p>• Invite codes expire after 14 days if unused</p>
        <p>• You are responsible for who you invite — their behavior reflects on you</p>
        <p>• Max 3 active unused codes at any time</p>
        <p>• Invite a bad actor and your privileges will be revoked</p>
        <p>• Admins can revoke any invite at any time</p>
      </div>
    </div>
  );
}
