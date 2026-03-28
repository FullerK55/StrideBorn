import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProfileProvider, useProfile } from "./contexts/ProfileContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";

function GameRouter() {
  const { session, loading: authLoading } = useAuth();
  const { activeProfile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a1a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'VT323', monospace", color: "#FFD700",
        fontSize: 20, letterSpacing: 2,
      }}>
        LOADING...
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  if (!activeProfile) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a1a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'VT323', monospace", color: "#FFD700",
        fontSize: 20, letterSpacing: 2,
      }}>
        SYNCING SAVE...
      </div>
    );
  }

  return <Home />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <ProfileProvider>
            <TooltipProvider>
              <Toaster />
              <GameRouter />
            </TooltipProvider>
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
