import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RoleProvider } from "@/contexts/RoleContext";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Forecasting from "@/pages/Forecasting";
import Products from "@/pages/Products";
import Anomalies from "@/pages/Anomalies";
import Pricing from "@/pages/Pricing";
import Insights from "@/pages/Insights";
import Chat from "@/pages/Chat";
import Simulate from "@/pages/Simulate";
import Tutorials from "@/pages/Tutorials";
import AnalystTutorials from "@/pages/AnalystTutorials";
import AnalystVisibility from "@/pages/AnalystVisibility";
import { RouteGuard } from "@/components/RouteGuard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RoleProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout>
          <RouteGuard>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/forecasting" element={<Forecasting />} />
              <Route path="/products" element={<Products />} />
              <Route path="/anomalies" element={<Anomalies />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/simulate" element={<Simulate />} />
              <Route path="/tutorials" element={<Tutorials />} />
              <Route path="/analyst-tutorials" element={<AnalystTutorials />} />
              <Route path="/analyst-visibility" element={<AnalystVisibility />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RouteGuard>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
    </RoleProvider>
  </QueryClientProvider>
);

export default App;
