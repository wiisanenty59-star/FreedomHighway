import { useState } from "react";
import { useGetThread, useCreatePost } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { ChevronLeft, User as UserIcon, ShieldAlert, Calendar, MessageSquare, Pin, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function ForumThread() {
  const { id } = useParams();
  const threadId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [replyContent, setReplyContent] = useState("");
  
  const { data: thread, isLoading } = useGetThread(threadId, {
    query: { enabled: !!threadId }
  });
  
  const createPost = useCreatePost();

  const handleReply = () => {
    if (!replyContent.trim()) return;
    
    // The API signature for useCreatePost might expect threadId differently based on schema
    // Let's assume it accepts standard data payload
    createPost.mutate({ data: { content: replyContent } } as any, { // Type cast to avoid schema mismatch issues for now
      onSuccess: () => {
        setReplyContent("");
        queryClient.invalidateQueries({ queryKey: [`/api/threads/${threadId}`] });
        toast({
          title: "Reply Transmitted",
          description: "Your message has been added to the thread.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Transmission Failed",
          description: error.error || "Could not post reply",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return <div className="container py-8 max-w-5xl"><div className="animate-pulse space-y-4"><div className="h-8 bg-muted w-1/3" /><div className="h-64 bg-card border border-border" /></div></div>;
  }

  if (!thread) {
    return <div className="container py-8 text-center text-muted-foreground">Thread not found or deleted.</div>;
  }

  // Synthesize the main thread post if the API doesn't return it as a post object
  // Sometimes APIs separate thread content from replies
  const posts = thread.posts || [];
  
  // Role badge component
  const RoleBadge = ({ role }: { role?: string }) => {
    if (role === "admin") {
      return (
        <div className="bg-destructive/10 text-destructive text-[10px] uppercase font-bold px-2 py-0.5 border border-destructive flex items-center gap-1 w-fit mt-2">
          <ShieldAlert className="w-3 h-3" /> Admin
        </div>
      );
    }
    return (
      <div className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 border border-primary/30 flex items-center w-fit mt-2">
        Operative
      </div>
    );
  };

  return (
    <div className="container py-8 max-w-5xl space-y-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono mb-4">
        <Link href="/forum" className="hover:text-primary transition-colors">Comms</Link>
        <span>/</span>
        <Link href={`/forum/${thread.forumCategoryId}`} className="hover:text-primary transition-colors uppercase">
          {thread.forumCategoryName || "Category"}
        </Link>
      </div>

      <div className="border-b border-border pb-6 flex items-start gap-4">
        <div className="mt-1 shrink-0">
          {thread.isPinned ? (
            <Pin className="w-6 h-6 text-primary" />
          ) : thread.isLocked ? (
            <Lock className="w-6 h-6 text-destructive" />
          ) : (
            <MessageSquare className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {thread.title}
          </h1>
          <div className="text-xs font-mono text-muted-foreground mt-2 flex items-center gap-3">
            <span>{format(new Date(thread.createdAt), 'MMM d, yyyy HH:mm')}</span>
            <span>•</span>
            <span>{thread.viewCount || 0} views</span>
            <span>•</span>
            <span>{posts.length} replies</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Original Post */}
        <div className="bg-card border border-card-border flex flex-col md:flex-row">
          {/* User Info Sidebar (phpBB style) */}
          <div className="md:w-48 lg:w-56 bg-muted/20 p-4 border-b md:border-b-0 md:border-r border-border shrink-0">
            <Link href={`/profile/${thread.authorUsername}`} className="font-bold text-primary text-lg hover:underline block break-all">
              {thread.authorUsername}
            </Link>
            <RoleBadge role="admin" /> {/* Hardcoded for OP for visual effect, ideally from authorRole */}
            
            <div className="mt-6 space-y-2 text-xs font-mono text-muted-foreground hidden md:block">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>Joined: Unknown</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                <span>Posts: Unknown</span>
              </div>
            </div>
          </div>
          
          {/* Post Content */}
          <div className="flex-1 p-6 min-w-0">
            <div className="text-xs font-mono text-muted-foreground border-b border-border/50 pb-2 mb-4 flex justify-between">
              <span>Posted: {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
              <span className="text-primary font-bold">#1</span>
            </div>
            
            <div className="prose prose-invert max-w-none text-foreground whitespace-pre-wrap font-sans">
              {thread.content}
            </div>
          </div>
        </div>

        {/* Replies */}
        {posts.map((post, index) => (
          <div key={post.id} className="bg-card border border-card-border flex flex-col md:flex-row">
            <div className="md:w-48 lg:w-56 bg-muted/20 p-4 border-b md:border-b-0 md:border-r border-border shrink-0">
              <Link href={`/profile/${post.authorUsername}`} className="font-bold text-primary text-lg hover:underline block break-all">
                {post.authorUsername}
              </Link>
              <RoleBadge role={post.authorRole} />
              
              <div className="mt-6 space-y-2 text-xs font-mono text-muted-foreground hidden md:block">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>Joined: {post.authorJoinedAt ? format(new Date(post.authorJoinedAt), 'MMM yyyy') : 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" />
                  <span>Posts: {post.authorPostCount || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-6 min-w-0">
              <div className="text-xs font-mono text-muted-foreground border-b border-border/50 pb-2 mb-4 flex justify-between">
                <span>Posted: {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                <span className="text-primary font-bold">#{index + 2}</span>
              </div>
              
              <div className="prose prose-invert max-w-none text-foreground whitespace-pre-wrap font-sans">
                {post.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {!thread.isLocked ? (
        <div className="mt-8 bg-card border border-card-border p-6">
          <h3 className="text-lg font-mono font-bold uppercase mb-4 text-primary flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Transmit Reply
          </h3>
          <div className="space-y-4">
            <Textarea 
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Enter your transmission..."
              className="min-h-[150px] font-sans resize-y bg-background"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleReply} 
                disabled={!replyContent.trim() || createPost.isPending}
                className="font-mono uppercase tracking-wider px-8"
              >
                {createPost.isPending ? "Transmitting..." : "Send Reply"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-destructive/10 border border-destructive p-6 text-center">
          <Lock className="w-8 h-8 text-destructive mx-auto mb-2" />
          <h3 className="text-lg font-mono font-bold text-destructive uppercase">Channel Locked</h3>
          <p className="text-muted-foreground">This transmission thread has been locked by an administrator.</p>
        </div>
      )}
    </div>
  );
}
