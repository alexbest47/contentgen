import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Programs from "@/pages/Programs";
import ProgramDetail from "@/pages/ProgramDetail";
import OfferTypeDetail from "@/pages/OfferTypeDetail";
import OfferDetail from "@/pages/OfferDetail";
import ProjectDetail from "@/pages/ProjectDetail";
import ContentDetail from "@/pages/ContentDetail";
import Prompts from "@/pages/Prompts";
import UsersAdmin from "@/pages/UsersAdmin";
import Tags from "@/pages/Tags";
import Descriptions from "@/pages/Descriptions";
import PromptVariables from "@/pages/PromptVariables";
import Archive from "@/pages/Archive";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Загрузка...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center">Загрузка...</div>;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/:programId" element={<ProgramDetail />} />
              <Route path="/programs/:programId/offers/:offerType" element={<OfferTypeDetail />} />
              <Route path="/programs/:programId/offers/:offerType/:offerId" element={<OfferDetail />} />
              <Route path="/programs/:programId/offers/:offerType/:offerId/projects/:projectId" element={<ProjectDetail />} />
              <Route path="/tags" element={<Tags />} />
              <Route path="/descriptions" element={<Descriptions />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/prompts" element={<ProtectedRoute adminOnly><Prompts /></ProtectedRoute>} />
              <Route path="/prompt-variables" element={<ProtectedRoute adminOnly><PromptVariables /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute adminOnly><UsersAdmin /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
