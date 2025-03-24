import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MainPage from "@/pages/MainPage";
import DashboardPage from "@/pages/DashboardPage";
import AdminPage from "@/pages/AdminPage";
import CalendarPage from "@/pages/CalendarPage";
import { AppProvider } from "./contexts/AppContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MainPage} />
      <Route path="/dashboard/:id" component={DashboardPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/calendar/:id" component={CalendarPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router />
        <Toaster />
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
