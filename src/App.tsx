import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Users } from '@/pages/Users';
import { UserDetail } from '@/pages/UserDetail';
import { Groups } from '@/pages/Groups';
import { GroupDetail } from '@/pages/GroupDetail';
import { Goals } from '@/pages/Goals';
import { GoalDetail } from '@/pages/GoalDetail';
import { Transactions } from '@/pages/Transactions';
import { Plans } from '@/pages/Plans';
import { Subscriptions } from '@/pages/Subscriptions';
import { Invitations } from '@/pages/Invitations';
import { NotFound } from '@/pages/NotFound';
import { Toaster } from 'sonner';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="goals" element={<Goals />} />
            <Route path="goals/:id" element={<GoalDetail />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="plans" element={<Plans />} />
            <Route path="invitations" element={<Invitations />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
