import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import ClientManagement from './components/ClientManagement';
import ServiceManagement from './components/ServiceManagement';
import StockManagement from './components/StockManagement';
import QuoteManagement from './components/QuoteManagement';
import Schedule from './components/Schedule';
import POS from './components/POS';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
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
            <Route path="/services" element={
              <ProtectedRoute>
                <Layout>
                  <ServiceManagement />
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
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;