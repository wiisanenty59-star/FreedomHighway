import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister, useValidateInviteCode } from "@workspace/api-client-react";
import { useLocation, Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CheckCircle, AlertCircle, Ticket } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Must be at least 3 characters").max(20, "Max 20 characters"),
  password: z.string().min(8, "Must be at least 8 characters"),
  email: z.string().email("Invalid email address"),
  location: z.string().optional(),
  inviteCode: z.string().optional(),
  joinPurpose: z.string().min(20, "Please give a detailed answer (min 20 characters)"),
  joinReason: z.string().min(20, "Please give a detailed answer (min 20 characters)"),
  joinWhyAccept: z.string().min(20, "Please give a detailed answer (min 20 characters)"),
  exploreExperience: z.string().optional(),
});

const SECTIONS = [
  {
    id: "account",
    label: "01. Credentials",
    description: "Set up your alias and access credentials. Do NOT use your real name.",
  },
  {
    id: "application",
    label: "02. Application",
    description: "These answers will be reviewed by the admin team.",
  },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const [isSuccess, setIsSuccess] = useState(false);
  const [autoApproved, setAutoApproved] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const validateInvite = useValidateInviteCode();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlInviteCode = params.get("invite") ?? "";

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      location: "",
      inviteCode: urlInviteCode,
      joinPurpose: "",
      joinReason: "",
      joinWhyAccept: "",
      exploreExperience: "",
    },
  });

  function checkInvite(code: string) {
    if (!code.trim()) {
      setInviteStatus("idle");
      return;
    }
    validateInvite.mutate({ code }, {
      onSuccess: () => setInviteStatus("valid"),
      onError: () => setInviteStatus("invalid"),
    });
  }

  function onSubmit(values: z.infer<typeof registerSchema>) {
    const data: any = { ...values };
    if (!data.inviteCode) delete data.inviteCode;

    registerMutation.mutate({ data }, {
      onSuccess: (res: any) => {
        const msg: string = res?.message ?? "";
        setAutoApproved(msg.includes("log in now"));
        setIsSuccess(true);
      },
      onError: (error: any) => {
        toast({
          title: "Application failed",
          description: error.error || "Something went wrong",
          variant: "destructive",
        });
      },
    });
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 px-4 bg-background">
        <div className="mx-auto w-full max-w-md">
          <div className="bg-card py-8 px-6 border border-primary text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-primary font-mono uppercase">
              {autoApproved ? "Access Granted" : "Application Submitted"}
            </h2>
            <p className="text-muted-foreground">
              {autoApproved
                ? "Your invite code was valid. You now have full access to HiddenFreeways."
                : "Your application is pending admin review. You will be notified when approved."}
            </p>
            <Button asChild className="w-full font-mono">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto w-full max-w-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-mono font-bold tracking-tighter text-primary uppercase">
            APPLY FOR ACCESS
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            HiddenFreeways is an invite-only urban exploration community.
          </p>
        </div>

        <div className="bg-card border border-card-border p-1 mb-6 text-xs font-mono text-amber-400 flex items-start gap-2 p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>OPSEC NOTICE:</strong> Never register with your real name. Use your urbex identity only. Do not connect your online alias to your real identity.
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-card border border-card-border overflow-hidden">
              <div className="bg-muted/50 p-3 border-b border-border font-mono font-bold uppercase text-xs tracking-wider">
                01. Account Credentials
              </div>
              <div className="p-6 space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urbex Alias / Handle <span className="text-destructive">*</span></FormLabel>
                      <FormDescription className="text-xs">Your community identity. Never your real name.</FormDescription>
                      <FormControl>
                        <Input placeholder="e.g. Ghost_Rail, VoidMapper" {...field} className="font-mono" />
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
                      <FormLabel>Contact Email <span className="text-destructive">*</span></FormLabel>
                      <FormDescription className="text-xs">Use a burner if you prefer — for account recovery only.</FormDescription>
                      <FormControl>
                        <Input type="email" placeholder="contact@email.com" {...field} />
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
                      <FormLabel>Password <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Min 8 characters" {...field} />
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
                      <FormLabel>General Region (Optional)</FormLabel>
                      <FormDescription className="text-xs">City or state — helps match you with local explorers.</FormDescription>
                      <FormControl>
                        <Input placeholder="e.g. Midwest, Detroit area" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" /> Invite Code (Optional)
                      </FormLabel>
                      <FormDescription className="text-xs">Have a code from a member? Enter it for instant access.</FormDescription>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="e.g. A1B2C3D4E5"
                            {...field}
                            className="font-mono uppercase"
                            onChange={(e) => {
                              field.onChange(e);
                              setInviteStatus("idle");
                            }}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => checkInvite(field.value ?? "")}
                          disabled={validateInvite.isPending}
                        >
                          Verify
                        </Button>
                      </div>
                      {inviteStatus === "valid" && (
                        <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3" /> Valid invite — you'll be approved instantly
                        </p>
                      )}
                      {inviteStatus === "invalid" && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" /> Invalid or expired invite code
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-card border border-card-border overflow-hidden">
              <div className="bg-muted/50 p-3 border-b border-border font-mono font-bold uppercase text-xs tracking-wider">
                02. Application Questions
              </div>
              <div className="p-6 space-y-6">
                <p className="text-xs text-muted-foreground border-l-2 border-primary pl-3">
                  These answers are reviewed by the admin team. Be honest and detailed — lazy or vague answers will be rejected.
                </p>

                <FormField
                  control={form.control}
                  name="joinPurpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What is your purpose within this community? <span className="text-destructive">*</span></FormLabel>
                      <FormDescription className="text-xs">
                        Are you here to share intel, find crew, document history, etc.?
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="I want to contribute location data and connect with other explorers in my region..."
                          className="resize-none min-h-[90px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joinReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why do you want to join HiddenFreeways? <span className="text-destructive">*</span></FormLabel>
                      <FormDescription className="text-xs">
                        What drew you to this specific community?
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="I've been exploring for years but want a trusted private network where I can share spots safely..."
                          className="resize-none min-h-[90px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joinWhyAccept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Why should we accept you? <span className="text-destructive">*</span></FormLabel>
                      <FormDescription className="text-xs">
                        What do you bring to the community? Are you trustworthy? Do you follow urbex etiquette?
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="I have 4 years of experience, I never damage or disclose active spots publicly, I understand TOKTWD..."
                          className="resize-none min-h-[90px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exploreExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe your exploration experience (Optional)</FormLabel>
                      <FormDescription className="text-xs">
                        Types of locations explored, years active, solo or crew, etc.
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="5 years exploring abandoned industrial sites, hospitals, and rail tunnels across the Midwest..."
                          className="resize-none min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-mono uppercase tracking-wider"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Submitting Application..." : "Submit Application"}
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
  );
}
