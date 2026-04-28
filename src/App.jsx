import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AppLayout from './components/layout/AppLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loading — ogni pagina è un chunk separato
const Home             = lazy(() => import('./pages/Home'));
const HeroCompare      = lazy(() => import('./pages/HeroCompare'));
const BusinessOffers   = lazy(() => import('./pages/BusinessOffers'));
const VehicleDetail    = lazy(() => import('./pages/VehicleDetail'));
const FleetSolutions   = lazy(() => import('./pages/FleetSolutions'));
const GreenMobility    = lazy(() => import('./pages/GreenMobility'));
const Contact          = lazy(() => import('./pages/Contact'));
const PrivateOffers    = lazy(() => import('./pages/PrivateOffers'));
const WorkWithUs       = lazy(() => import('./pages/WorkWithUs'));
const CommercialOffers = lazy(() => import('./pages/CommercialOffers'));
const News             = lazy(() => import('./pages/News'));
const NewsDetail       = lazy(() => import('./pages/NewsDetail'));
const Usato            = lazy(() => import('./pages/Usato'));
const MotoOffers       = lazy(() => import('./pages/MotoOffers'));
const PrivacyPolicy    = lazy(() => import('./pages/PrivacyPolicy'));
const TerminiCondizioni = lazy(() => import('./pages/TerminiCondizioni'));
const Login            = lazy(() => import('./pages/Login'));
const AdminDashboard      = lazy(() => import('./pages/AdminDashboard'));
const AdminLeads          = lazy(() => import('./pages/AdminLeads'));
const AgenteDashboard     = lazy(() => import('./pages/AgenteDashboard'));
const AgenteMateriali     = lazy(() => import('./pages/AgenteMateriali'));
const BackofficeDashboard = lazy(() => import('./pages/BackofficeDashboard'));
const PraticaDetail       = lazy(() => import('./pages/PraticaDetail'));
const MiaPratica          = lazy(() => import('./pages/MiaPratica'));
const CmsDashboard        = lazy(() => import('./pages/CmsDashboard'));
const PageNotFound        = lazy(() => import('./lib/PageNotFound'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-electric/20 border-t-electric rounded-full animate-spin" />
  </div>
);

const AppRoutes = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Login — standalone, nessun layout ── */}
        <Route path="/login"          element={<Login />} />
        <Route path="/partner/accedi" element={<Login context="partner" />} />
        <Route path="/accedi"         element={<Login context="cliente" />} />

        {/* ── Sito pubblico ── */}
        <Route element={<AppLayout />}>
          <Route path="/"                     element={<Home />} />
          <Route path="/hero-compare"         element={<HeroCompare />} />
          <Route path="/offers"               element={<BusinessOffers />} />
          <Route path="/vehicle/:make/:model" element={<VehicleDetail />} />
          <Route path="/fleet"                element={<FleetSolutions />} />
          <Route path="/green"                element={<GreenMobility />} />
          <Route path="/contact"              element={<Contact />} />
          <Route path="/private-offers"       element={<PrivateOffers />} />
          <Route path="/careers"              element={<WorkWithUs />} />
          <Route path="/commercial"           element={<CommercialOffers />} />
          <Route path="/moto"                 element={<MotoOffers />} />
          <Route path="/usato"                element={<Usato />} />
          <Route path="/news"                 element={<News />} />
          <Route path="/news/:slug"           element={<NewsDetail />} />
          <Route path="/privacy"              element={<PrivacyPolicy />} />
          <Route path="/termini"              element={<TerminiCondizioni />} />
        </Route>

        {/* ── Area Admin ── */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin"             element={<AdminDashboard />} />
            <Route path="/admin/pratica/:id" element={<PraticaDetail />} />
            <Route path="/admin/leads"       element={<AdminLeads />} />
          </Route>
        </Route>

        {/* ── CMS — admin + cms ── */}
        <Route element={<ProtectedRoute roles={['admin', 'cms']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/cms" element={<CmsDashboard />} />
          </Route>
        </Route>

        {/* ── Area Backoffice ── */}
        <Route element={<ProtectedRoute roles={['backoffice', 'admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/backoffice"              element={<BackofficeDashboard />} />
            <Route path="/backoffice/pratica/:id"  element={<PraticaDetail />} />
          </Route>
        </Route>

        {/* ── Area Agente/Partner ── */}
        <Route element={<ProtectedRoute roles={['agente']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/agente"                element={<AgenteDashboard />} />
            <Route path="/agente/pratica/:id"    element={<PraticaDetail />} />
            <Route path="/agente/materiali"      element={<AgenteMateriali />} />
          </Route>
        </Route>

        {/* ── Area Cliente ── */}
        <Route element={<ProtectedRoute roles={['cliente', 'agente', 'backoffice', 'admin']} redirectTo="/accedi" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/mia-pratica" element={<MiaPratica />} />
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
