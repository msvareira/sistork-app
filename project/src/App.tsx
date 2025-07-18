import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import ClientManagement from './components/ClientManagement';
import StockManagement from './components/StockManagement';
import QuoteManagement from './components/QuoteManagement';
import Schedule from './components/Schedule';
import POS from './components/POS';
import PDV from './pages/PDV';
import AccountsReceivable from './pages/AccountsReceivable';
import AccountsPayable from './pages/AccountsPayable';
import CashFlow from './pages/CashFlow';
import Reports from './pages/Reports';
import ApiTestComponent from './components/ApiTestComponent';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/api-test-public" element={<ApiTestComponent />} />
              <Route path="/" element={
                <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute>
                <Layout>
                  <ClientManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/stock" element={
              <ProtectedRoute>
                <Layout>
                  <StockManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/quotes" element={
              <ProtectedRoute>
                <Layout>
                  <QuoteManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/schedule" element={
              <ProtectedRoute>
                <Layout>
                  <Schedule />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/pos" element={
              <ProtectedRoute>
                <Layout>
                  <POS />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/pdv" element={
              <ProtectedRoute>
                <PDV />
              </ProtectedRoute>
            } />
            <Route path="/accounts-receivable" element={
              <ProtectedRoute>
                <Layout>
                  <AccountsReceivable />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/accounts-payable" element={
              <ProtectedRoute>
                <Layout>
                  <AccountsPayable />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/cash-flow" element={
              <ProtectedRoute>
                <Layout>
                  <CashFlow />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/api-test" element={
              <ProtectedRoute>
                <Layout>
                  <ApiTestComponent />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  </ToastProvider>
  );
}

export default App;