import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage            from './pages/HomePage';
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import ServicesPage        from './pages/ServicesPage';
import ServiceDetailPage   from './pages/ServiceDetailPage';
import ResidentsPage       from './pages/ResidentsPage';
import NewcomersPage       from './pages/NewcomersPage';
import GuideProfilePage    from './pages/GuideProfilePage';
import CommunityPage       from './pages/CommunityPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import ChatPage            from './pages/ChatPage';
import NotificationsPage   from './pages/NotificationsPage';
import RecentActivityPage  from './pages/RecentActivityPage';
import MyBookingsPage      from './pages/MyBookingsPage';
import ProfilePage         from './pages/ProfilePage';
import SettingsPage        from './pages/SettingsPage';
import HelpPage            from './pages/HelpPage';
import AboutPage           from './pages/AboutPage';
import ContactPage         from './pages/ContactPage';
import CareersPage         from './pages/CareersPage';
import PrivacyPage         from './pages/PrivacyPage';
import TermsPage           from './pages/TermsPage';
import RefundPage          from './pages/RefundPage';

import NewcomerDashboard   from './pages/dashboard/NewcomerDashboard';
import ResidentDashboard   from './pages/dashboard/ResidentDashboard';
import ProviderDashboard   from './pages/dashboard/ProviderDashboard';
import AdminDashboard      from './pages/dashboard/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            {/* Auth pages — standalone, no navbar/footer */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<Layout />}>
              {/* Public */}
              <Route path="/"                element={<HomePage />} />
              <Route path="/services"        element={<ServicesPage />} />
              <Route path="/services/:id"    element={<ServiceDetailPage />} />
              <Route path="/residents"       element={<ResidentsPage />} />
              <Route path="/newcomers"       element={<NewcomersPage />} />
              <Route path="/guides/:id"      element={<GuideProfilePage />} />
              <Route path="/community"       element={<CommunityPage />} />
              <Route path="/community/:id"   element={<CommunityDetailPage />} />

              {/* Footer pages */}
              <Route path="/about"           element={<AboutPage />} />
              <Route path="/contact"         element={<ContactPage />} />
              <Route path="/careers"         element={<CareersPage />} />
              <Route path="/help"            element={<HelpPage />} />
              <Route path="/privacy"         element={<PrivacyPage />} />
              <Route path="/terms"           element={<TermsPage />} />
              <Route path="/refund"          element={<RefundPage />} />

              {/* Protected */}
              <Route path="/chat"            element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/notifications"   element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/activity"        element={<ProtectedRoute><RecentActivityPage /></ProtectedRoute>} />
              <Route path="/bookings"        element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
              <Route path="/profile"         element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/settings"        element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Dashboards */}
              <Route path="/dashboard/newcomer" element={<ProtectedRoute roles={['newcomer']}><NewcomerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/resident" element={<ProtectedRoute roles={['resident']}><ResidentDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/provider" element={<ProtectedRoute roles={['provider']}><ProviderDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/admin"    element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            </Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
