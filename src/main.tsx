import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import ApplyForm from './components/recruitment/ApplyForm';
import ConfirmationPage from './components/recruitment/ConfirmationPage';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import ResetPassword from './components/recruitment/ResetPassword';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
  {/* Routes publiques */}
  <Route path="/apply/:id" element={<ApplyForm />} />
  <Route path="/confirmation" element={<ConfirmationPage />} />

  <Route path="/reset-password" element={<ResetPassword />} />

  
  <Route path="/*" element={<App />} />
</Routes>
      </Router>
    </AuthProvider>
  </StrictMode>
);