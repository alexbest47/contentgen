import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Auth from "@/pages/Auth";

import Programs from "@/pages/Programs";
import ProgramDetail from "@/pages/ProgramDetail";
import ManagePrograms from "@/pages/ManagePrograms";
import ManageProgramDetail from "@/pages/ManageProgramDetail";
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
import EmailSettings from "@/pages/EmailSettings";
import EmailBuilderList from "@/pages/EmailBuilderList";
import EmailBuilder from "@/pages/EmailBuilder";
import SelectContentForLetter from "@/pages/SelectContentForLetter";
import EmailChainList from "@/pages/EmailChainList";
import EmailChainDetail from "@/pages/EmailChainDetail";
import BotChainDetail from "@/pages/BotChainDetail";
import BotMessageDetail from "@/pages/BotMessageDetail";
import ChainTemplates from "@/pages/ChainTemplates";
import CreateDiagnostic from "@/pages/CreateDiagnostic";
import DiagnosticDetail from "@/pages/DiagnosticDetail";
import Diagnostics from "@/pages/Diagnostics";
import OfferTypeManagement from "@/pages/OfferTypeManagement";
import CaseManagement from "@/pages/CaseManagement";
import Objections from "@/pages/Objections";
import ObjectionsHub from "@/pages/ObjectionsHub";
import TopicTree from "@/pages/TopicTree";
import EmailTemplates from "@/pages/EmailTemplates";
import PdfMaterials from "@/pages/PdfMaterials";
import PdfMaterialView from "@/pages/PdfMaterialView";
import TaskQueue from "@/pages/TaskQueue";
import PostCarouselList from "@/pages/PostCarouselList";
import BannerLibrary from "@/pages/BannerLibrary";
import LandingList from "@/pages/LandingList";
import LandingEditor from "@/pages/LandingEditor";
// LandingPreview removed — ZIP export moved to LandingEditor
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
              <Route path="/" element={<Navigate to="/queue" replace />} />
              <Route path="/queue" element={<TaskQueue />} />
              <Route path="/post" element={<PostCarouselList format="post" />} />
              <Route path="/carousel" element={<PostCarouselList format="carousel" />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/:programId" element={<ProgramDetail />} />
              <Route path="/programs/:programId/offers/:offerType" element={<OfferTypeDetail />} />
              <Route path="/programs/:programId/offers/:offerType/:offerId" element={<OfferDetail />} />
              <Route path="/programs/:programId/offers/:offerType/:offerId/projects/:projectId" element={<ProjectDetail />} />
              <Route path="/programs/:programId/offers/:offerType/:offerId/projects/:projectId/content/:contentType" element={<ContentDetail />} />
              <Route path="/tags" element={<ProtectedRoute adminOnly><Tags /></ProtectedRoute>} />
              <Route path="/descriptions" element={<ProtectedRoute adminOnly><Descriptions /></ProtectedRoute>} />
              <Route path="/archive" element={<ProtectedRoute adminOnly><Archive /></ProtectedRoute>} />
              <Route path="/email-builder" element={<EmailBuilderList />} />
              <Route path="/email-builder/select-content/:letterId" element={<SelectContentForLetter />} />
              <Route path="/email-builder/:letterId" element={<EmailBuilder />} />
              <Route path="/email-chains" element={<EmailChainList />} />
              <Route path="/email-chains/:chainId" element={<EmailChainDetail />} />
              <Route path="/bot-chains/:chainId" element={<BotChainDetail />} />
              <Route path="/bot-chains/:chainId/messages/:messageId" element={<BotMessageDetail />} />
              <Route path="/landings" element={<LandingList />} />
              <Route path="/landings/:landingId" element={<LandingEditor />} />
              <Route path="/chain-templates" element={<ProtectedRoute adminOnly><ChainTemplates /></ProtectedRoute>} />
              <Route path="/diagnostics" element={<ProtectedRoute adminOnly><Diagnostics /></ProtectedRoute>} />
              <Route path="/create-diagnostic" element={<ProtectedRoute adminOnly><CreateDiagnostic /></ProtectedRoute>} />
              <Route path="/diagnostics/:diagnosticId" element={<ProtectedRoute adminOnly><DiagnosticDetail /></ProtectedRoute>} />
              <Route path="/offers/:offerType" element={<ProtectedRoute adminOnly><OfferTypeManagement /></ProtectedRoute>} />
              <Route path="/pdf-materials" element={<ProtectedRoute adminOnly><PdfMaterials /></ProtectedRoute>} />
              <Route path="/pdf-materials/:id" element={<ProtectedRoute adminOnly><PdfMaterialView /></ProtectedRoute>} />
              <Route path="/banner-library" element={<ProtectedRoute adminOnly><BannerLibrary /></ProtectedRoute>} />
              <Route path="/cases" element={<ProtectedRoute adminOnly><CaseManagement /></ProtectedRoute>} />
              <Route path="/manage-programs" element={<ProtectedRoute adminOnly><ManagePrograms /></ProtectedRoute>} />
              <Route path="/manage-programs/:programId" element={<ProtectedRoute adminOnly><ManageProgramDetail /></ProtectedRoute>} />
              <Route path="/objections" element={<ProtectedRoute adminOnly><ObjectionsHub /></ProtectedRoute>} />
              <Route path="/programs/:programId/objections" element={<ProtectedRoute adminOnly><Objections /></ProtectedRoute>} />
              <Route path="/topics" element={<ProtectedRoute adminOnly><TopicTree /></ProtectedRoute>} />
              <Route path="/email-templates" element={<ProtectedRoute adminOnly><EmailTemplates /></ProtectedRoute>} />
              <Route path="/prompts" element={<ProtectedRoute adminOnly><Prompts /></ProtectedRoute>} />
              <Route path="/prompt-variables" element={<ProtectedRoute adminOnly><PromptVariables /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute adminOnly><UsersAdmin /></ProtectedRoute>} />
              <Route path="/email-settings" element={<ProtectedRoute adminOnly><EmailSettings /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
