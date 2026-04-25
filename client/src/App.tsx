import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Pacientes from "./pages/Pacientes";
import Agenda from "./pages/Agenda";
import Dentistas from "./pages/Dentistas";
import Procedimentos from "./pages/Procedimentos";
import Financeiro from "./pages/Financeiro";
import Convenios from "./pages/Convenios";
import Estoque from "./pages/Estoque";
import Prontuario from "./pages/Prontuario";
import Prontuarios from "./pages/Prontuarios";
import Orcamentista from "./pages/Orcamentista";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Atendente from "./pages/Atendente";
import Proteses from "./pages/Proteses";
import AnaliseIA from "./pages/AnaliseIA";
import QRCheckin from "./pages/QRCheckin";
import PainelTV from "./pages/PainelTV";
import Notificacoes from "./pages/Notificacoes";
import AreaDentista from "./pages/AreaDentista";
import AreaOrtodontista from "./pages/AreaOrtodontista";
import AreaImplantodontista from "./pages/AreaImplantodontista";
import AreaProtesista from "./pages/AreaProtesista";
import AreaBucoMaxilo from "./pages/AreaBucoMaxilo";
import AreaOdontopediatria from "./pages/AreaOdontopediatria";
import Permissoes from "./pages/Permissoes";
import GestaoPermissoes from "./pages/GestaoPermissoes";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import AdminDashboard from "./pages/AdminDashboard";
import Perfil from "./pages/Perfil";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import PatientCheckin from "./pages/PatientCheckin";
import DentricsIA from "./pages/DentricsIA";
import SmileDesign from "./pages/SmileDesign";
import SmileDesignReports from "./pages/SmileDesignReports";
import ReturnAlerts from "./pages/ReturnAlerts";
import Visualizador3D from "./pages/Visualizador3D";
import Orcamentos from "./pages/Orcamentos";
import ValidarDocumento from "./pages/ValidarDocumento";
import Inadimplente from "./pages/Inadimplente";
import { MapaGanho } from "./pages/MapaGanho";
import ConfiguracaoComissoes from "./pages/ConfiguracaoComissoes";

// Componente wrapper para rotas protegidas
function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function Router() {
  return (
    <Switch>
      {/* Auth Pages - Públicas */}
      <Route path="/login" component={Login} />
      <Route path="/registro" component={Registro} />
      
      {/* Página Pública de Check-in para Pacientes */}
      <Route path="/checkin" component={PatientCheckin} />
      
      {/* Página Pública de Validação de Documentos */}
      <Route path="/validar-documento/:token" component={ValidarDocumento} />
      
      {/* Página de Inadimplência - Assinatura expirada */}
      <Route path="/inadimplente" component={Inadimplente} />
      
      {/* Admin Area - Protegida */}
      <Route path="/admin">
        <Protected><AdminDashboard /></Protected>
      </Route>
      
      {/* User Profile - Protegida */}
      <Route path="/perfil">
        <Protected><Perfil /></Protected>
      </Route>
      
      {/* Gestão de Usuários - Protegida */}
      <Route path="/gestao-usuarios">
        <Protected><GestaoUsuarios /></Protected>
      </Route>
      
      {/* Main Dashboard - Protegida */}
      <Route path="/">
        <Protected><Home /></Protected>
      </Route>
      
      {/* Patient Management - Protegidas */}
      <Route path="/pacientes">
        <Protected><Pacientes /></Protected>
      </Route>
      <Route path="/prontuarios">
        <Protected><Prontuarios /></Protected>
      </Route>
      <Route path="/prontuario/:id">
        <Protected><Prontuario /></Protected>
      </Route>
      
      {/* Scheduling - Protegida */}
      <Route path="/agenda">
        <Protected><Agenda /></Protected>
      </Route>
      
      {/* Staff Management - Protegida */}
      <Route path="/dentistas">
        <Protected><Dentistas /></Protected>
      </Route>
      
      {/* Clinical - Protegidas */}
      <Route path="/procedimentos">
        <Protected><Procedimentos /></Protected>
      </Route>
      <Route path="/orcamentista">
        <Protected><Orcamentista /></Protected>
      </Route>
      <Route path="/proteses">
        <Protected><Proteses /></Protected>
      </Route>
      <Route path="/analise-ia">
        <Protected><AnaliseIA /></Protected>
      </Route>
      <Route path="/dentrics-ia">
        <Protected><DentricsIA /></Protected>
      </Route>
      <Route path="/smile-design">
        <Protected><SmileDesign /></Protected>
      </Route>
      <Route path="/smile-design-reports">
        <Protected><SmileDesignReports /></Protected>
      </Route>
      <Route path="/alertas-retorno">
        <Protected><ReturnAlerts /></Protected>
      </Route>
      
      {/* Financial - Protegidas */}
      <Route path="/financeiro">
        <Protected><Financeiro /></Protected>
      </Route>
      <Route path="/convenios">
        <Protected><Convenios /></Protected>
      </Route>
      <Route path="/estoque">
        <Protected><Estoque /></Protected>
      </Route>
      
      {/* Reports & Settings - Protegidas */}
      <Route path="/relatorios">
        <Protected><Relatorios /></Protected>
      </Route>
      <Route path="/mapa-ganho">
        <Protected><MapaGanho /></Protected>
      </Route>
      <Route path="/configuracao-comissoes">
        <Protected><ConfiguracaoComissoes /></Protected>
      </Route>
      <Route path="/configuracoes">
        <Protected><Configuracoes /></Protected>
      </Route>
      
      {/* Queue & Check-in - Protegidas */}
      <Route path="/atendente">
        <Protected><Atendente /></Protected>
      </Route>
      <Route path="/qr-checkin">
        <Protected><QRCheckin /></Protected>
      </Route>
      
      {/* Notifications - Protegida */}
      <Route path="/notificacoes">
        <Protected><Notificacoes /></Protected>
      </Route>
      
      {/* Specialized Areas - Protegidas */}
      <Route path="/area-dentista">
        <Protected><AreaDentista /></Protected>
      </Route>
      <Route path="/area-ortodontista">
        <Protected><AreaOrtodontista /></Protected>
      </Route>
      <Route path="/area-implantodontista">
        <Protected><AreaImplantodontista /></Protected>
      </Route>
      <Route path="/area-protesista">
        <Protected><AreaProtesista /></Protected>
      </Route>
      <Route path="/area-bucomaxilo">
        <Protected><AreaBucoMaxilo /></Protected>
      </Route>
      <Route path="/area-odontopediatria">
        <Protected><AreaOdontopediatria /></Protected>
      </Route>
      
      {/* Permissions - Protegida */}
      <Route path="/permissoes">
        <Protected><Permissoes /></Protected>
      </Route>
      
      {/* Gestão de Permissões por Cargo - Protegida */}
      <Route path="/gestao-permissoes">
        <Protected><GestaoPermissoes /></Protected>
      </Route>
      
      {/* TV Panel - Pública (para exibição em TVs) */}
      <Route path="/painel-tv" component={PainelTV} />
      
      {/* Visualizador 3D - Protegida */}
      <Route path="/visualizador-3d">
        <Protected><Visualizador3D /></Protected>
      </Route>
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
