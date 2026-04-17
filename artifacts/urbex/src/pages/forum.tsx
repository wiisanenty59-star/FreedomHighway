import { useListForumCategories, useGetForumStats, useListAdmins } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import {
  MessageSquare, Users, FileText, Clock, Shield, BookOpen, Ticket,
  Building2, Paintbrush2, MountainSnow, Train, Warehouse, Swords,
  TreePine, Skull, Landmark, School, ChurchIcon, Tent, MapPin,
  FlaskConical, Inbox
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const LOCATION_TYPE_SLUGS = new Set([
  "abandoned-buildings", "graffiti", "caves", "tunnels", "rooftops",
  "industrial", "military", "hospitals-forum", "transit-forum",
  "ghost-towns-forum", "amusement-parks-forum",
]);

const ICON_MAP: Record<string, React.ReactNode> = {
  "shield-alert": <Shield className="w-5 h-5" />,
  "book-open": <BookOpen className="w-5 h-5" />,
  "abandoned-buildings": <Building2 className="w-5 h-5" />,
  graffiti: <Paintbrush2 className="w-5 h-5" />,
  caves: <MountainSnow className="w-5 h-5" />,
  tunnels: <TreePine className="w-5 h-5" />,
  rooftops: <Landmark className="w-5 h-5" />,
  industrial: <Warehouse className="w-5 h-5" />,
  military: <Swords className="w-5 h-5" />,
  "hospitals-forum": <FlaskConical className="w-5 h-5" />,
  "transit-forum": <Train className="w-5 h-5" />,
  "ghost-towns-forum": <Skull className="w-5 h-5" />,
  "amusement-parks-forum": <Tent className="w-5 h-5" />,
  default: <MessageSquare className="w-5 h-5" />,
};

function CategoryIcon({ slug, icon }: { slug?: string; icon?: string }) {
  if (slug && ICON_MAP[slug]) return ICON_MAP[slug];
  if (icon && ICON_MAP[icon]) return ICON_MAP[icon];
  return ICON_MAP.default;
}

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  threadCount?: number;
  postCount?: number;
  lastThreadTitle?: string;
  lastThreadAt?: string;
};

function CategoryRow({ category, accent }: { category: Category; accent?: boolean }) {
  return (
    <div className={`p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center ${accent ? "bg-primary/5" : ""}`}>
      <div className="flex-1 flex gap-4">
        <div className={`w-11 h-11 flex items-center justify-center border shrink-0 ${accent ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-primary"}`}>
          <CategoryIcon slug={category.slug} icon={category.icon} />
        </div>
        <div>
          <Link href={`/forum/${category.slug}`} className="text-base font-bold hover:text-primary hover:underline transition-colors block">
            {category.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
        </div>
      </div>

      <div className="flex sm:flex-col gap-4 sm:gap-0.5 text-xs text-muted-foreground sm:text-right shrink-0 border-t sm:border-t-0 border-border pt-3 sm:pt-0 mt-3 sm:mt-0">
        <div className="flex items-center gap-1 justify-end">
          <FileText className="w-3 h-3" />
          <span className="font-mono">{category.threadCount || 0} threads</span>
        </div>
        <div className="flex items-center gap-1 justify-end">
          <MessageSquare className="w-3 h-3" />
          <span className="font-mono">{category.postCount || 0} posts</span>
        </div>
        {category.lastThreadTitle && (
          <div className="hidden md:flex items-center gap-1 justify-end text-xs mt-1">
            <Clock className="w-3 h-3" />
            <span className="truncate max-w-[140px]">{category.lastThreadTitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BoardSection({ title, categories, accent }: { title: string; categories: Category[]; accent?: boolean }) {
  if (categories.length === 0) return null;
  return (
    <div className="bg-card border border-card-border overflow-hidden">
      <div className={`p-3 border-b border-border flex items-center gap-2 ${accent ? "bg-primary/10 border-primary/30" : "bg-muted/50"}`}>
        <h2 className={`font-mono font-bold uppercase tracking-wider text-xs ${accent ? "text-primary" : ""}`}>{title}</h2>
      </div>
      <div className="divide-y divide-border">
        {categories.map(cat => (
          <CategoryRow key={cat.id} category={cat} accent={accent} />
        ))}
      </div>
    </div>
  );
}

export default function Forum() {
  const { user } = useAuth();
  const { data: categories, isLoading: categoriesLoading } = useListForumCategories();
  const { data: stats, isLoading: statsLoading } = useGetForumStats();
  const { data: admins, isLoading: adminsLoading } = useListAdmins();

  const rulesCategory = categories?.find(c => c.slug === "rules-guidelines");
  const submissionsCategory = categories?.find(c => c.slug === "location-submissions");
  const locationTypeBoards = categories?.filter(c => LOCATION_TYPE_SLUGS.has(c.slug)) ?? [];
  const communityBoards = categories?.filter(
    c => c.slug !== "rules-guidelines" && c.slug !== "location-submissions" && !LOCATION_TYPE_SLUGS.has(c.slug)
  ) ?? [];

  return (
    <div className="container py-8 max-w-6xl space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-mono font-bold text-primary uppercase tracking-tighter flex items-center gap-3">
            <MessageSquare className="w-8 h-8" /> Forum
          </h1>
          <p className="text-muted-foreground mt-2">Community boards for HiddenFreeways operatives.</p>
        </div>
        <Button asChild className="font-mono">
          <Link href="/forum/new">+ New Thread</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-4">
          {categoriesLoading ? (
            <div className="bg-card border border-card-border p-8 animate-pulse space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-11 h-11 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted w-1/3" />
                    <div className="h-3 bg-muted w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {rulesCategory && (
                <div className="bg-card border border-primary/40 overflow-hidden">
                  <div className="bg-primary/10 p-3 border-b border-primary/30 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span className="font-mono font-bold uppercase text-xs text-primary tracking-wider">📌 Pinned — Read First</span>
                  </div>
                  <div className="p-4 hover:bg-muted/30 transition-colors flex gap-4 items-center">
                    <div className="w-11 h-11 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-primary">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <Link href={`/forum/${rulesCategory.slug}`} className="text-base font-bold hover:text-primary transition-colors block">
                        {rulesCategory.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{rulesCategory.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right shrink-0 hidden sm:block">
                      <div className="flex items-center gap-1 justify-end">
                        <FileText className="w-3 h-3" />
                        <span className="font-mono">{rulesCategory.threadCount || 0} threads</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {submissionsCategory && (
                <div className="bg-card border border-amber-500/40 overflow-hidden">
                  <div className="bg-amber-500/10 p-3 border-b border-amber-500/30 flex items-center gap-2">
                    <Inbox className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono font-bold uppercase text-xs text-amber-400 tracking-wider">📍 Location Submissions — Moderated</span>
                  </div>
                  <div className="p-4 hover:bg-muted/30 transition-colors flex gap-4 items-center">
                    <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <Link href={`/forum/${submissionsCategory.slug}`} className="text-base font-bold hover:text-primary transition-colors block">
                        {submissionsCategory.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{submissionsCategory.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground shrink-0 hidden sm:flex">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span className="font-mono">{submissionsCategory.threadCount || 0} pending</span>
                      </div>
                      <Button asChild size="sm" className="font-mono text-xs h-7 px-3">
                        <Link href={`/forum/new?category=${submissionsCategory.id}`}>Submit Spot</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <BoardSection title="Location Type Boards" categories={locationTypeBoards} />
              <BoardSection title="Community Boards" categories={communityBoards} />
            </>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-card border border-card-border p-4">
            <h2 className="font-mono font-bold uppercase tracking-wider text-xs border-b border-border pb-2 mb-4 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" /> Network Stats
            </h2>
            {statsLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted w-full" />
                <div className="h-4 bg-muted w-3/4" />
                <div className="h-4 bg-muted w-5/6" />
              </div>
            ) : (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Threads</span>
                  <span className="font-mono text-primary font-bold">{stats?.totalThreads || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Posts</span>
                  <span className="font-mono text-primary font-bold">{stats?.totalPosts || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Members</span>
                  <span className="font-mono text-primary font-bold">{stats?.totalMembers || 0}</span>
                </div>
                {stats?.newestMember && (
                  <div className="pt-2 mt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Newest Member</p>
                    <Link href={`/profile/${stats.newestMember}`} className="font-mono text-primary hover:underline text-sm">
                      {stats.newestMember}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-card border border-card-border p-4">
            <h2 className="font-mono font-bold uppercase tracking-wider text-xs border-b border-border pb-2 mb-4 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" /> Admin Team
            </h2>
            {adminsLoading ? (
              <div className="space-y-2 animate-pulse"><div className="h-4 bg-muted w-2/3" /></div>
            ) : admins?.length === 0 ? (
              <p className="text-xs text-muted-foreground">No admins listed.</p>
            ) : (
              <div className="space-y-2">
                {admins?.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between">
                    <Link href={`/profile/${admin.username}`} className="font-mono text-sm text-primary hover:underline">
                      {admin.username}
                    </Link>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary font-mono">ADMIN</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {user?.canSendInvites && (
            <div className="bg-card border border-primary/30 p-4">
              <h2 className="font-mono font-bold uppercase tracking-wider text-xs border-b border-border pb-2 mb-3 flex items-center gap-2 text-primary">
                <Ticket className="w-3.5 h-3.5" /> Invite System
              </h2>
              <p className="text-xs text-muted-foreground mb-3">You've earned invite privileges. Help grow the community.</p>
              <Link href="/invites" className="text-xs font-mono text-primary hover:underline">Manage invites →</Link>
            </div>
          )}

          <div className="bg-card border border-card-border p-4">
            <h2 className="font-mono font-bold uppercase tracking-wider text-xs border-b border-border pb-2 mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" /> Quick Links
            </h2>
            <div className="space-y-1.5 text-xs font-mono">
              <Link href="/forum/rules-guidelines" className="block text-muted-foreground hover:text-primary transition-colors">📌 Rules & Guidelines</Link>
              <Link href="/forum/location-submissions" className="block text-muted-foreground hover:text-primary transition-colors">📍 Submit a Spot</Link>
              <Link href="/map" className="block text-muted-foreground hover:text-primary transition-colors">🗺 Location Map</Link>
              <Link href={`/profile/${user?.username}`} className="block text-muted-foreground hover:text-primary transition-colors">👤 My Profile</Link>
              {user?.canSendInvites && (
                <Link href="/invites" className="block text-muted-foreground hover:text-primary transition-colors">🎫 Invite a Friend</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
