import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateThread, useListForumCategories, useListCategories } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, MapPin, AlertTriangle, Info } from "lucide-react";

const LOCATION_SUBMISSIONS_SLUG = "location-submissions";

const LOCATION_TYPE_SLUGS = new Set([
  "abandoned-buildings", "graffiti", "caves", "tunnels", "rooftops",
  "industrial", "military", "hospitals-forum", "transit-forum",
  "ghost-towns-forum", "amusement-parks-forum",
]);

const COMMUNITY_BOARD_SLUGS = new Set([
  "general", "location-reports", "gear-equipment", "safety-legal",
  "photography", "new-members",
]);

const riskLevels = ["low", "medium", "high", "extreme"] as const;

const formSchema = z.object({
  title: z.string().min(3, "Subject must be at least 3 characters").max(100),
  forumCategoryId: z.coerce.number().min(1, "Select a board/flair"),
  content: z.string().optional(),
  locName: z.string().optional(),
  locCategory: z.string().optional(),
  locLat: z.coerce.number().optional(),
  locLng: z.coerce.number().optional(),
  locState: z.string().optional(),
  locCountry: z.string().optional(),
  locRisk: z.enum(riskLevels).optional(),
  locDescription: z.string().optional(),
  locAccess: z.string().optional(),
  locHazards: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function buildSubmissionContent(v: FormValues): string {
  return `## Location Submission

**Spot Name / Codename:** ${v.locName}
**Type:** ${v.locCategory}
**Coordinates:** ${v.locLat}, ${v.locLng}
**State/Province:** ${v.locState}
**Country:** ${v.locCountry}
**Risk Level:** ${(v.locRisk ?? "medium").toUpperCase()}

### Description
${v.locDescription}

${v.locAccess ? `### Access Notes\n${v.locAccess}\n\n` : ""}${v.locHazards ? `### Known Hazards\n${v.locHazards}\n\n` : ""}${v.content ? `### Additional Notes\n${v.content}` : ""}`.trim();
}

export default function ForumNew() {
  const [locationPath, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateThread();
  const { data: forumCategories } = useListForumCategories();
  const { data: locationCategories } = useListCategories();

  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category");

  const submissionsCategory = forumCategories?.find(c => c.slug === LOCATION_SUBMISSIONS_SLUG);
  const communityBoards = forumCategories?.filter(c => COMMUNITY_BOARD_SLUGS.has(c.slug)) ?? [];
  const locationBoards = forumCategories?.filter(c => LOCATION_TYPE_SLUGS.has(c.slug)) ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      forumCategoryId: initialCategory ? parseInt(initialCategory) : 0,
      locName: "",
      locCategory: "",
      locLat: 0,
      locLng: 0,
      locState: "",
      locCountry: "USA",
      locRisk: "medium",
      locDescription: "",
      locAccess: "",
      locHazards: "",
    },
  });

  const selectedCategoryId = useWatch({ control: form.control, name: "forumCategoryId" });
  const selectedCat = forumCategories?.find(c => c.id === Number(selectedCategoryId));
  const isSubmission = selectedCat?.slug === LOCATION_SUBMISSIONS_SLUG;

  function onSubmit(values: FormValues) {
    const content = isSubmission ? buildSubmissionContent(values) : (values.content || "");
    const title = isSubmission ? `[SUBMISSION] ${values.locName} — ${values.locState}` : values.title;

    createMutation.mutate(
      { data: { title, content, forumCategoryId: values.forumCategoryId } },
      {
        onSuccess: (data) => {
          toast({ title: "Thread Created", description: isSubmission ? "Your submission is pending mod review." : "New thread posted." });
          queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
          setLocation(`/forum/thread/${data.id}`);
        },
        onError: (error: any) => {
          toast({ title: "Error", description: error.error || "Could not create thread", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-mono font-bold text-primary uppercase tracking-tighter flex items-center gap-2">
          {isSubmission ? <MapPin className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
          {isSubmission ? "Submit a Location" : "New Thread"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isSubmission
            ? "Fill out the form below. A moderator will review and add approved spots to the map."
            : "Select the correct board/flair for your post. Posts in the wrong board will be moved."}
        </p>
      </div>

      <div className="bg-card border border-card-border p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <FormField
              control={form.control}
              name="forumCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono uppercase tracking-wider text-muted-foreground">
                    Board / Flair <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value ? field.value.toString() : ""} onValueChange={(v) => field.onChange(parseInt(v))}>
                    <FormControl>
                      <SelectTrigger className="font-mono bg-background">
                        <SelectValue placeholder="Select the correct board for your post" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {submissionsCategory && (
                        <SelectGroup>
                          <SelectLabel className="text-amber-400 font-mono">📍 Location Submissions</SelectLabel>
                          <SelectItem value={submissionsCategory.id.toString()}>{submissionsCategory.name}</SelectItem>
                        </SelectGroup>
                      )}
                      {locationBoards.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="font-mono">📁 Location Type Boards</SelectLabel>
                          {locationBoards.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      {communityBoards.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="font-mono">💬 Community Boards</SelectLabel>
                          {communityBoards.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSubmission ? (
              <>
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-300 font-mono space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-400 mb-2">
                    <Info className="w-4 h-4" /> Location Submission Guidelines
                  </div>
                  <p>• Do NOT include the exact address or precise pin if OPSEC is a concern. Approximate coordinates only for sensitive spots.</p>
                  <p>• Include only intel you're comfortable sharing with vetted members.</p>
                  <p>• Moderators will verify and add approved spots to the map. This may take a few days.</p>
                </div>

                <div className="space-y-5">
                  <h2 className="text-sm font-mono font-bold uppercase border-b border-border pb-2 text-muted-foreground">Spot Details</h2>

                  <FormField
                    control={form.control}
                    name="locName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spot Name / Codename <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Abandoned Mill #3, The Silo" {...field} className="font-mono" />
                        </FormControl>
                        <FormDescription>Use a codename if you don't want to expose the real name.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="locCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Type <span className="text-destructive">*</span></FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="font-mono">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locationCategories?.map(cat => (
                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="locRisk"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-primary" /> Risk Level <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="font-mono uppercase font-bold">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low" className="text-chart-2 font-bold uppercase">Low Risk</SelectItem>
                              <SelectItem value="medium" className="text-chart-3 font-bold uppercase">Medium Risk</SelectItem>
                              <SelectItem value="high" className="text-chart-4 font-bold uppercase">High Risk</SelectItem>
                              <SelectItem value="extreme" className="text-chart-5 font-bold uppercase">Extreme Risk</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="locDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea placeholder="History, current state, points of interest, what makes it worth visiting..." className="min-h-[100px] resize-y" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-5">
                  <h2 className="text-sm font-mono font-bold uppercase border-b border-border pb-2 text-muted-foreground">Coordinates</h2>
                  <p className="text-xs text-muted-foreground">Use Google Maps / Apple Maps to get coordinates. Right-click on the map → "What's here?"</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="locLat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="number" step="any" placeholder="e.g. 41.8827" {...field} className="font-mono" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="locLng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="number" step="any" placeholder="e.g. -87.6233" {...field} className="font-mono" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="locState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State / Province <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. IL, NY, Ontario" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="locCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="USA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <h2 className="text-sm font-mono font-bold uppercase border-b border-border pb-2 text-muted-foreground">Field Notes (Optional)</h2>

                  <FormField
                    control={form.control}
                    name="locAccess"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="How to get in, security presence, best time to approach..." className="resize-y" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="locHazards"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Known Hazards</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Asbestos, structural instability, squatters, dogs..." className="resize-y border-destructive/50 focus-visible:ring-destructive" {...field} />
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
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Anything else the mod team should know..." className="resize-y" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono uppercase tracking-wider text-muted-foreground">
                        Subject <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter thread subject..." {...field} className="font-sans font-bold text-lg bg-background" />
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
                      <FormLabel className="font-mono uppercase tracking-wider text-muted-foreground">
                        Content <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your post here..."
                          className="min-h-[250px] resize-y font-sans bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="pt-6 border-t border-border flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/forum")} className="font-mono">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="font-mono uppercase tracking-wider px-8">
                {createMutation.isPending ? "Submitting..." : isSubmission ? "Submit for Review" : "Post Thread"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
