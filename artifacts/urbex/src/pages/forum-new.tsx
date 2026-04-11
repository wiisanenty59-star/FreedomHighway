import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateThread, useListForumCategories } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, "Subject must be at least 3 characters").max(100),
  content: z.string().min(10, "Transmission content must be substantial"),
  forumCategoryId: z.coerce.number().min(1, "Select a comms channel"),
});

export default function ForumNew() {
  const [locationPath, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateThread();
  const { data: categories } = useListForumCategories();

  // Get pre-selected category from URL if present
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get('category');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      forumCategoryId: initialCategory ? parseInt(initialCategory) : 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        toast({
          title: "Transmission Sent",
          description: "New thread created successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
        setLocation(`/forum/thread/${data.id}`);
      },
      onError: (error: any) => {
        toast({
          title: "Transmission Failed",
          description: error.error || "Could not create thread",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-mono font-bold text-primary uppercase tracking-tighter flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          New Transmission
        </h1>
        <p className="text-muted-foreground mt-2">Establish a new comms thread.</p>
      </div>

      <div className="bg-card border border-card-border p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="forumCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono uppercase tracking-wider text-muted-foreground">Comms Channel</FormLabel>
                  <Select value={field.value ? field.value.toString() : ""} onValueChange={(v) => field.onChange(parseInt(v))}>
                    <FormControl>
                      <SelectTrigger className="font-mono bg-background">
                        <SelectValue placeholder="Select target channel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono uppercase tracking-wider text-muted-foreground">Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter transmission subject..." {...field} className="font-sans font-bold text-lg bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono uppercase tracking-wider text-muted-foreground">Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your message here..." 
                      className="min-h-[250px] resize-y font-sans bg-background" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-6 border-t border-border flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/forum")} className="font-mono">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="font-mono uppercase tracking-wider px-8">
                {createMutation.isPending ? "Transmitting..." : "Send"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
