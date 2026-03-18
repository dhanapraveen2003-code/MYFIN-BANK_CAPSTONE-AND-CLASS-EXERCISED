import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import CustomerDashboard from './pages/customer/Dashboard';
import TransactionsPage from './pages/customer/Transactions';
import TransferPage from './pages/customer/Transfer';
import InvestmentsPage from './pages/customer/Investments';
import LoanPage from './pages/customer/Loan';
import CustomerChat from './pages/customer/Chat';
import ProfilePage from './pages/customer/Profile';

import AdminDashboard from './pages/admin/Dashboard';
import AdminCustomers from './pages/admin/Customers';
import AdminAccounts from './pages/admin/Accounts';
import AdminLoans from './pages/admin/Loans';
import AdminChat from './pages/admin/Chat';
import AdminBeneficiaries from './pages/admin/Beneficiaries';
import AdminProfile from './pages/admin/Profile';

// Read user once from localStorage — plain function, no hooks
function getStoredUser() {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

function AppRoutes() {
  const [user, setUser] = useState(getStoredUser);

  // Listen for login/logout events from child pages
  useEffect(() => {
    const onStorage = () => setUser(getStoredUser());
    window.addEventListener('storage', onStorage);
    window.addEventListener('auth-change', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('auth-change', onStorage);
    };
  }, []);

  const role = user?.role;

  return (
    <Routes>
      <Route path="/login"          element={<Login onLogin={u => { setUser(u); }} />} />
      <Route path="/register"       element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/dashboard"    element={role === 'CUSTOMER' ? <CustomerDashboard onLogout={() => setUser(null)} /> : <Navigate to="/login" replace />} />
      <Route path="/transactions" element={role === 'CUSTOMER' ? <TransactionsPage />  : <Navigate to="/login" replace />} />
      <Route path="/transfer"     element={role === 'CUSTOMER' ? <TransferPage />      : <Navigate to="/login" replace />} />
      <Route path="/investments"  element={role === 'CUSTOMER' ? <InvestmentsPage />   : <Navigate to="/login" replace />} />
      <Route path="/loans"        element={role === 'CUSTOMER' ? <LoanPage />          : <Navigate to="/login" replace />} />
      <Route path="/chat"         element={role === 'CUSTOMER' ? <CustomerChat />      : <Navigate to="/login" replace />} />
      <Route path="/profile"      element={role === 'CUSTOMER' ? <ProfilePage />       : <Navigate to="/login" replace />} />

      <Route path="/admin/dashboard"     element={role === 'ADMIN' ? <AdminDashboard />     : <Navigate to="/login" replace />} />
      <Route path="/admin/customers"     element={role === 'ADMIN' ? <AdminCustomers />     : <Navigate to="/login" replace />} />
      <Route path="/admin/accounts"      element={role === 'ADMIN' ? <AdminAccounts />      : <Navigate to="/login" replace />} />
      <Route path="/admin/loans"         element={role === 'ADMIN' ? <AdminLoans />         : <Navigate to="/login" replace />} />
      <Route path="/admin/chat"          element={role === 'ADMIN' ? <AdminChat />          : <Navigate to="/login" replace />} />
      <Route path="/admin/profile"       element={role === 'ADMIN' ? <AdminProfile />       : <Navigate to="/login" replace />} />
      <Route path="/admin/beneficiaries" element={role === 'ADMIN' ? <AdminBeneficiaries /> : <Navigate to="/login" replace />} />

      <Route path="/" element={
        !user ? <Navigate to="/login" replace />
          : role === 'ADMIN' ? <Navigate to="/admin/dashboard" replace />
          : <Navigate to="/dashboard" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </AuthProvider>
    </BrowserRouter>
  );
}
