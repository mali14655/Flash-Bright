import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './context/LanguageContext';
import { BreadcrumbProvider } from './context/BreadcrumbContext';
import Landing from './pages/Landing';
import Services from './pages/Services';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminCompanyDetails from './pages/AdminCompanyDetails';
import PartnerDashboard from './pages/PartnerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import PublicServiceDetails from './pages/PublicServiceDetails';

function App() {
  const { checkAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <LanguageProvider>
      <BrowserRouter>
        <BreadcrumbProvider>
          <Toaster position="top-right" />
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to={`/${user?.role || 'customer'}`} /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to={`/${user?.role || 'customer'}`} /> : <Register />}
          />
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/service/:id" element={<PublicServiceDetails />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/companies/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCompanyDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner"
          element={
            <ProtectedRoute allowedRoles={['partner']}>
              <PartnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BreadcrumbProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;

