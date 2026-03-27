import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProfileProvider, useProfile } from "./contexts/ProfileContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import ProfileSelect from "./pages/ProfileSelect";

function GameRouter() {
  const { activeProfile, switchingProfile } = useProfile();

  // Show profile select if no active profile or user is switching
  if (!activeProfile || switchingProfile) {
    return <ProfileSelect />;
  }

  return <Home />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <ProfileProvider>
          <TooltipProvider>
            <Toaster />
            <GameRouter />
          </TooltipProvider>
        </ProfileProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
