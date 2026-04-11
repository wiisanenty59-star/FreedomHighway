import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().optional(),
  location: z.string().optional(),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      bio: "",
      location: "",
    },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate({ data: values }, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: (error: any) => {
        toast({
          title: "Application failed",
          description: error.error || "Something went wrong",
          variant: "destructive",
        });
      }
    });
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-card py-8 px-4 border border-primary sm:px-10 text-center space-y-4">
            <h2 className="text-2xl font-bold text-primary font-mono uppercase">Application Submitted</h2>
            <p className="text-muted-foreground">Your application is pending admin approval. This is an invite-only community.</p>
            <div className="pt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Return to Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-mono font-bold tracking-tighter text-primary uppercase">
          APPLY FOR ACCESS
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          UrbEx Explorer is an invite-only community.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 border border-card-border sm:px-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alias / Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your alias" {...field} className="font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Contact email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why do you want to join? (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell us about your exploration experience..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full font-mono uppercase tracking-wider" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
