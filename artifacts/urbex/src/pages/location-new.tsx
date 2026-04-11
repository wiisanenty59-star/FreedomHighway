import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateLocation, useListCategories } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, AlertTriangle } from "lucide-react";
const riskLevels = ["low", "medium", "high", "extreme"] as const;

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Provide a better description"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  categoryId: z.coerce.number().min(1, "Select a category"),
  state: z.string().optional(),
  country: z.string().optional(),
  riskLevel: z.enum(riskLevels),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  accessNotes: z.string().optional(),
  hazards: z.string().optional(),
});

export default function LocationNew() {
  const [locationPath, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateLocation();
  const { data: categories } = useListCategories();

  // Parse query params for initial coordinates if coming from map
  const searchParams = new URLSearchParams(window.location.search);
  const initialLat = searchParams.get('lat');
  const initialLng = searchParams.get('lng');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      latitude: initialLat ? parseFloat(initialLat) : 0,
      longitude: initialLng ? parseFloat(initialLng) : 0,
      categoryId: 0,
      state: "",
      country: "USA",
      riskLevel: "medium",
      imageUrl: "",
      accessNotes: "",
      hazards: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Clean up empty strings
    const payload = {
      ...values,
      imageUrl: values.imageUrl || undefined,
      state: values.state || undefined,
      country: values.country || undefined,
      accessNotes: values.accessNotes || undefined,
      hazards: values.hazards || undefined,
    };

    createMutation.mutate({ data: payload }, {
      onSuccess: (data) => {
        toast({
          title: "Location Transmitted",
          description: "New coordinates added to the database.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
        setLocation(`/locations/${data.id}`);
      },
      onError: (error: any) => {
        toast({
          title: "Transmission Failed",
          description: error.error || "Could not save location",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-mono font-bold text-primary uppercase tracking-tighter flex items-center gap-2">
          <MapPin className="w-8 h-8" />
          Transmit Coordinates
        </h1>
        <p className="text-muted-foreground mt-2">Log a new location into the central database. Provide accurate intel.</p>
      </div>

      <div className="bg-card border border-card-border p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-6">
              <h2 className="text-lg font-mono font-bold uppercase border-b border-border pb-2 text-muted-foreground">Basic Intel</h2>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name / Codename</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Abandoned Silo 4" {...field} className="font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classification</FormLabel>
                      <Select value={field.value ? field.value.toString() : ""} onValueChange={(v) => field.onChange(parseInt(v))}>
                        <FormControl>
                          <SelectTrigger className="font-mono">
                            <SelectValue placeholder="Select type" />
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
                  name="riskLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-primary" /> Risk Level</FormLabel>
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="History, current state, points of interest..." 
                        className="min-h-[120px] resize-y font-sans" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-mono font-bold uppercase border-b border-border pb-2 text-muted-foreground mt-8">Coordinates & Geography</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="39.8283" {...field} className="font-mono bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="-98.5795" {...field} className="font-mono bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Region</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. CA, NY, Ontario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
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

            <div className="space-y-6">
              <h2 className="text-lg font-mono font-bold uppercase border-b border-border pb-2 text-muted-foreground mt-8">Field Notes (Optional)</h2>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intel Image URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://..." {...field} className="font-mono" />
                    </FormControl>
                    <FormDescription>Direct link to an image. Do not use local paths.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Protocol</FormLabel>
                    <FormControl>
                      <Textarea placeholder="How to get in, security presence, best time to approach..." className="resize-y" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hazards"
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
            </div>

            <div className="pt-6 border-t border-border flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setLocation("/locations")} className="font-mono">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="font-mono uppercase tracking-wider px-8">
                {createMutation.isPending ? "Transmitting..." : "Submit Record"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
