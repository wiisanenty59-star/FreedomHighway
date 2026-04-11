import { useListForumCategories, useGetForumStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { MessageSquare, Users, FileText, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Forum() {
  const { data: categories, isLoading: categoriesLoading } = useListForumCategories();
  const { data: stats, isLoading: statsLoading } = useGetForumStats();

  return (
    <div className="container py-8 max-w-6xl space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-mono font-bold text-primary uppercase tracking-tighter flex items-center gap-3">
            <MessageSquare className="w-8 h-8" /> Comms Channel
          </h1>
          <p className="text-muted-foreground mt-2">Encrypted discussion boards for operatives.</p>
        </div>
        <Button asChild className="font-mono">
          <Link href="/forum/new">New Transmission</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card border border-card-border overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-mono font-bold uppercase tracking-wider text-sm">Main Boards</h2>
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
              ) : categories?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No communication channels established.
                </div>
              ) : (
                categories?.map(category => (
                  <div key={category.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex-1 flex gap-4">
                      <div className="w-12 h-12 bg-muted flex items-center justify-center border border-border shrink-0 text-primary">
                        <MessageSquare className="w-6 h-6" />
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
                        <span className="font-mono">{category.threadCount || 0} Threads</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="font-mono">{category.postCount || 0} Posts</span>
                      </div>
                    </div>
                    
                    {category.lastThreadTitle && (
                      <div className="hidden md:block w-64 text-sm shrink-0 border-l border-border pl-4">
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Latest Intel</p>
                        <p className="truncate font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                          {category.lastThreadTitle}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {category.lastThreadAt ? new Date(category.lastThreadAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-card-border p-4">
            <h2 className="font-mono font-bold uppercase tracking-wider text-sm border-b border-border pb-2 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" /> Network Stats
            </h2>
            
            {statsLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted w-full" />
                <div className="h-4 bg-muted w-3/4" />
                <div className="h-4 bg-muted w-5/6" />
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><FileText className="w-3 h-3" /> Total Threads</span>
                  <span className="font-mono text-primary font-bold">{stats?.totalThreads || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><MessageSquare className="w-3 h-3" /> Total Posts</span>
                  <span className="font-mono text-primary font-bold">{stats?.totalPosts || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><Users className="w-3 h-3" /> Operatives</span>
                  <span className="font-mono text-primary font-bold">{stats?.totalMembers || 0}</span>
                </div>
                {stats?.newestMember && (
                  <div className="pt-3 mt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Newest Operative</p>
                    <Link href={`/profile/${stats.newestMember}`} className="font-mono text-primary hover:underline">
                      {stats.newestMember}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
