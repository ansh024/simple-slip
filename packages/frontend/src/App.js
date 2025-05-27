import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import GlobalStyles from './styles/GlobalStyles';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import QuickSlip from './pages/QuickSlip';
import SlipHistory from './pages/SlipHistory';
import SlipDetail from './pages/SlipDetail';
import PriceList from './pages/PriceList';
import PriceBoard from './pages/PriceBoardNew';
import Reports from './pages/Reports';

// PrivateRoute component for protected routes
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading if auth is still being checked
  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <GlobalStyles />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          
          <Route path="/quick-slip" element={
            <PrivateRoute>
              <QuickSlip />
            </PrivateRoute>
          } />
          
          <Route path="/slip/:id" element={
            <PrivateRoute>
              <SlipDetail />
            </PrivateRoute>
          } />
          
          <Route path="/history" element={
            <PrivateRoute>
              <SlipHistory />
            </PrivateRoute>
          } />
          
          <Route path="/price-list" element={
            <PrivateRoute>
              <PriceList />
            </PrivateRoute>
          } />
          
          <Route path="/reports" element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          } />
          
          <Route path="/price-board" element={
            <PrivateRoute>
              <PriceBoard />
            </PrivateRoute>
          } />
          
          {/* Redirect all unknown routes to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
