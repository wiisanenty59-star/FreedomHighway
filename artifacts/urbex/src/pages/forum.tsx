import { useListForumCategories, useGetForumStats, useListAdmins } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { MessageSquare, Users, FileText, Clock, Shield, BookOpen, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, React.ReactNode> = {
  "shield-alert": <Shield className="w-6 h-6" />,
  "book-open": <BookOpen className="w-6 h-6" />,
  default: <MessageSquare className="w-6 h-6" />,
};

function CategoryIcon({ icon }: { icon?: string }) {
  if (!icon) return ICON_MAP.default;
  return ICON_MAP[icon] ?? ICON_MAP.default;
}

export default function Forum() {
  const { user } = useAuth();
  const { data: categories, isLoading: categoriesLoading } = useListForumCategories();
  const { data: stats, isLoading: statsLoading } = useGetForumStats();
  const { data: admins, isLoading: adminsLoading } = useListAdmins();

  const rulesCategory = categories?.find(c => c.slug === "rules-guidelines");
  const otherCategories = categories?.filter(c => c.slug !== "rules-guidelines") ?? [];

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
          {rulesCategory && (
            <div className="bg-card border border-primary/40 overflow-hidden">
              <div className="bg-primary/10 p-3 border-b border-primary/30 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-mono font-bold uppercase text-sm text-primary tracking-wider">📌 Pinned</span>
              </div>
              <div className="p-4 hover:bg-muted/30 transition-colors flex gap-4 items-center">
                <div className="w-12 h-12 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <Link href={`/forum/${rulesCategory.slug}`} className="text-lg font-bold hover:text-primary transition-colors block">
                    {rulesCategory.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">{rulesCategory.description}</p>
                </div>
                <div className="text-sm text-muted-foreground text-right shrink-0 hidden sm:block">
                  <div className="flex items-center gap-1.5 justify-end">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="font-mono">{rulesCategory.threadCount || 0} Threads</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border border-card-border overflow-hidden">
            <div className="bg-muted/50 p-3 border-b border-border">
              <h2 className="font-mono font-bold uppercase tracking-wider text-sm">Community Boards</h2>
            </div>

            <div className="divide-y divide-border">
              {categoriesLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="p-4 flex gap-4 animate-pulse">
                    <div className="w-12 h-12 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted w-1/3" />
                      <div className="h-4 bg-muted w-2/3" />
                    </div>
                  </div>
                ))
              ) : otherCategories.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No boards yet.</div>
              ) : (
                otherCategories.map(category => (
                  <div key={category.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex-1 flex gap-4">
                      <div className="w-12 h-12 bg-muted flex items-center justify-center border border-border shrink-0 text-primary">
                        <CategoryIcon icon={category.icon} />
                      </div>
                      <div>
                        <Link href={`/forum/${category.slug}`} className="text-lg font-bold hover:text-primary hover:underline transition-colors block">
                          {category.name}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-4 sm:gap-1 text-sm text-muted-foreground sm:text-right shrink-0 border-t sm:border-t-0 border-border pt-3 sm:pt-0 mt-3 sm:mt-0">
                      <div className="flex items-center gap-1.5 justify-end">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="font-mono">{category.threadCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="font-mono">{category.postCount || 0}</span>
                      </div>
                    </div>

                    {category.lastThreadTitle && (
                      <div className="hidden md:block w-56 text-sm shrink-0 border-l border-border pl-4">
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Latest</p>
                        <p className="truncate font-medium">{category.lastThreadTitle}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {category.lastThreadAt ? new Date(category.lastThreadAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
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
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted w-2/3" />
                <div className="h-4 bg-muted w-1/2" />
              </div>
            ) : admins?.length === 0 ? (
              <p className="text-xs text-muted-foreground">No admins listed.</p>
            ) : (
              <div className="space-y-2">
                {admins?.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between">
                    <Link
                      href={`/profile/${admin.username}`}
                      className="font-mono text-sm text-primary hover:underline"
                    >
                      {admin.username}
                    </Link>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary font-mono">
                      ADMIN
                    </Badge>
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
              <p className="text-xs text-muted-foreground mb-3">
                You've earned invite privileges. Help grow the community.
              </p>
              <Link href="/invites" className="text-xs font-mono text-primary hover:underline">
                Manage your invites →
              </Link>
            </div>
          )}

          <div className="bg-card border border-card-border p-4">
            <h2 className="font-mono font-bold uppercase tracking-wider text-xs border-b border-border pb-2 mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-primary" /> Quick Links
            </h2>
            <div className="space-y-1.5 text-xs font-mono">
              <Link href="/forum/rules-guidelines" className="block text-muted-foreground hover:text-primary transition-colors">
                📌 Rules & Guidelines
              </Link>
              <Link href="/map" className="block text-muted-foreground hover:text-primary transition-colors">
                🗺 Location Map
              </Link>
              <Link href="/locations/new" className="block text-muted-foreground hover:text-primary transition-colors">
                📍 Submit a Spot
              </Link>
              <Link href={`/profile/${user?.username}`} className="block text-muted-foreground hover:text-primary transition-colors">
                👤 My Profile
              </Link>
              {user?.canSendInvites && (
                <Link href="/invites" className="block text-muted-foreground hover:text-primary transition-colors">
                  🎫 Invite a Friend
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
