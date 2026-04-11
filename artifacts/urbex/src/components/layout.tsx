import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Map, MapPin, MessageSquare, Shield, LogOut, User as UserIcon, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  const NavLinks = () => (
    <>
      <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
        <Map className="w-4 h-4" /> Dashboard
      </Link>
      <Link href="/map" className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
        <MapPin className="w-4 h-4" /> Map
      </Link>
      <Link href="/locations" className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
        <MapPin className="w-4 h-4" /> Locations
      </Link>
      <Link href="/forum" className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
        <MessageSquare className="w-4 h-4" /> Forum
      </Link>
      {user?.role === "admin" && (
        <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors text-primary">
          <Shield className="w-4 h-4" /> Admin
        </Link>
      )}
    </>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="container flex h-14 items-center px-4">
          <div className="md:hidden mr-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-card border-r-border p-0">
                <div className="p-4 border-b border-border">
                  <Link href="/" className="flex items-center gap-2 font-mono font-bold text-lg text-primary tracking-tighter uppercase">
                    HIDDEN<span className="text-foreground">FREEWAYS</span>
                  </Link>
                </div>
                <div className="flex flex-col py-4">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <Link href="/" className="hidden md:flex items-center gap-2 font-mono font-bold text-xl text-primary tracking-tighter uppercase mr-8">
            HIDDEN<span className="text-foreground">FREEWAYS</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-1 flex-1">
            <NavLinks />
          </nav>
          
          <div className="flex items-center gap-2 ml-auto">
            {user ? (
              <div className="flex items-center gap-4">
                <Link href={`/profile/${user.username}`} className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t border-border bg-card py-6 mt-auto">
        <div className="container px-4 text-center text-xs font-mono text-muted-foreground">
          <p>HiddenFreeways // UNDERGROUND COMMUNITY</p>
        </div>
      </footer>
    </div>
  );
}
