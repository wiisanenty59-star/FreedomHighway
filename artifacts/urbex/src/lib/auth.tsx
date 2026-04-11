import { createContext, useContext, ReactNode, useEffect } from "react";
import { useGetCurrentUser, type User } from "@workspace/api-client-react";
import { useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useGetCurrentUser({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function ProtectedRoute({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  useEffect(() => {
    if (!isLoading && user && requireAdmin && user.role !== "admin") {
      setLocation("/");
    }
  }, [isLoading, user, requireAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-card-border p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-primary">Account Pending</h2>
          <p className="text-muted-foreground">
            Your application is currently being reviewed by our administrators. You will be granted access once approved.
          </p>
          <p className="text-xs text-muted-foreground mt-8">HiddenFreeways</p>
        </div>
      </div>
    );
  }

  if (user.status === "banned") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-destructive p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Account Banned</h2>
          <p className="text-muted-foreground">Your account has been suspended from the community.</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
