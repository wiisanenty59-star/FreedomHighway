import { useListThreads, useListForumCategories } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { MessageSquare, Pin, Lock, User, Clock, ChevronLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function ForumCategory() {
  const { categorySlug } = useParams();
  
  const { data: categories } = useListForumCategories();
  const category = categories?.find(c => c.slug === categorySlug);
  
  const { data: threads, isLoading } = useListThreads(
    { categoryId: category?.id },
    { query: { enabled: !!category?.id } }
  );

  return (
    <div className="container py-8 max-w-6xl space-y-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono mb-4">
        <Link href="/forum" className="hover:text-primary flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Comms Channel
        </Link>
        <span>/</span>
        <span className="text-foreground uppercase">{category?.name || 'Loading...'}</span>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-mono font-bold text-primary uppercase tracking-tighter">
            {category?.name || 'Loading...'}
          </h1>
          <p className="text-muted-foreground mt-2">{category?.description}</p>
        </div>
        <Button asChild className="font-mono">
          <Link href={`/forum/new?category=${category?.id}`}>New Transmission</Link>
        </Button>
      </div>

      <div className="bg-card border border-card-border overflow-hidden">
        <div className="bg-muted/50 p-3 border-b border-border hidden sm:grid grid-cols-12 gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <div className="col-span-7 pl-2">Subject</div>
          <div className="col-span-2 text-center">Replies</div>
          <div className="col-span-3 text-right pr-2">Latest Intel</div>
        </div>
        
        <div className="divide-y divide-border">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="h-6 bg-muted w-2/3" />
              </div>
            ))
          ) : threads?.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No transmissions in this channel yet.</p>
            </div>
          ) : (
            threads?.map(thread => (
              <div key={thread.id} className="p-4 hover:bg-muted/30 transition-colors grid grid-cols-1 sm:grid-cols-12 gap-4 items-center group">
                <div className="sm:col-span-7 flex items-start gap-3">
                  <div className="mt-1 shrink-0">
                    {thread.isPinned ? (
                      <Pin className="w-4 h-4 text-primary" />
                    ) : thread.isLocked ? (
                      <Lock className="w-4 h-4 text-destructive" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div>
                    <Link href={`/forum/thread/${thread.id}`} className="text-base font-bold text-foreground hover:text-primary transition-colors block mb-1">
                      {thread.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <User className="w-3 h-3" />
                      <Link href={`/profile/${thread.authorUsername}`} className="hover:text-primary transition-colors">
                        {thread.authorUsername}
                      </Link>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:block sm:col-span-2 text-center font-mono text-sm text-muted-foreground">
                  {thread.postCount || 0}
                </div>
                
                <div className="sm:col-span-3 sm:text-right text-xs text-muted-foreground border-t sm:border-t-0 border-border pt-3 sm:pt-0 mt-2 sm:mt-0 flex flex-col sm:items-end justify-center">
                  <span className="flex items-center gap-1 sm:justify-end mb-1">
                    <User className="w-3 h-3" />
                    {thread.lastPostUsername || thread.authorUsername}
                  </span>
                  <span className="flex items-center gap-1 sm:justify-end">
                    <Clock className="w-3 h-3" />
                    {thread.lastPostAt ? formatDistanceToNow(new Date(thread.lastPostAt), { addSuffix: true }) : formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
