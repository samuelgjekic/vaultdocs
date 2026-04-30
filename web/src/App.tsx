import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import "nprogress/nprogress.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemeStore } from "@/store/theme";
import { useAuthStore } from "@/store/auth";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Setup from "./pages/Setup";
import SpacePage from "./pages/SpacePage";

import SpaceSettingsLayout from "./pages/space-settings/SpaceSettingsLayout";
import GeneralSettings from "./pages/space-settings/GeneralSettings";
import CustomizationSettings from "./pages/space-settings/CustomizationSettings";
import MembersSettings from "./pages/space-settings/MembersSettings";
import DangerSettings from "./pages/space-settings/DangerSettings";

import UserSettingsLayout from "./pages/user-settings/UserSettingsLayout";
import AccountSettings from "./pages/user-settings/AccountSettings";
import AppearanceSettings from "./pages/user-settings/AppearanceSettings";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } },
});

function ThemeBoot() {
  const apply = useThemeStore((s) => s.apply);
  useEffect(() => { apply(); }, [apply]);
  return null;
}

function AuthBoot() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const hasBootstrapped = useAuthStore((s) => s.hasBootstrapped);
  useEffect(() => {
    if (!hasBootstrapped) fetchMe();
  }, [hasBootstrapped, fetchMe]);
  return null;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user?.is_admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeBoot />
      <AuthBoot />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/~/settings" element={<UserSettingsLayout />}>
            <Route index element={<Navigate to="account" replace />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="appearance" element={<AppearanceSettings />} />
          </Route>

          <Route path="/~/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="/:orgSlug/:spaceSlug/~/settings" element={<SpaceSettingsLayout />}>
            <Route index element={<GeneralSettings />} />
            <Route path="customization" element={<CustomizationSettings />} />
            <Route path="members" element={<MembersSettings />} />
            <Route path="danger" element={<DangerSettings />} />
          </Route>

          <Route path="/:orgSlug/:spaceSlug/*" element={<SpacePage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
