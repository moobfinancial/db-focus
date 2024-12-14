import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import PrivateRoute from '@/components/PrivateRoute';
import DashboardLayout from '@/components/DashboardLayout';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import NotFound from '@/pages/NotFound';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Assistants from '@/pages/Assistants';
import PhoneNumber from '@/pages/PhoneNumber';
import CallLogs from '@/pages/CallLogs';
import SMS from '@/pages/SMS';
import VoiceLibrary from '@/pages/VoiceLibrary';
import ContactList from '@/pages/ContactList';
import Campaigns from '@/pages/Campaigns';
import GoalTemplate from '@/pages/GoalTemplate';
import TransparencyLevels from '@/pages/TransparencyLevels';
import Whisper from '@/pages/Whisper';
import Billing from '@/pages/Billing';
import Account from '@/pages/Account';
import Resources from '@/pages/Resources';
import Help from '@/pages/Help';
import Logout from '@/pages/Logout';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          
          {/* Auth routes */}
          <Route path="/auth">
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="assistants" element={<Assistants />} />
            <Route path="phone" element={<PhoneNumber />} />
            <Route path="logs" element={<CallLogs />} />
            <Route path="sms" element={<SMS />} />
            <Route path="voice" element={<VoiceLibrary />} />
            <Route path="contacts" element={<ContactList />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="goals" element={<GoalTemplate />} />
            <Route path="transparency" element={<TransparencyLevels />} />
            <Route path="whisper" element={<Whisper />} />
            <Route path="billing" element={<Billing />} />
            <Route path="account" element={<Account />} />
            <Route path="resources" element={<Resources />} />
            <Route path="help" element={<Help />} />
            <Route path="logout" element={<Logout />} />
          </Route>

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}