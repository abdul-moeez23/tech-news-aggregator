import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OnboardingTopics from './pages/OnboardingTopics';
import OnboardingSources from './pages/OnboardingSources';
import Dashboard from './pages/Dashboard';
import ArticleDetail from './pages/ArticleDetail';
import Settings from './pages/Settings';
import SourceManager from './pages/SourceManager';

// Declared at module scope so it is never re-created during App's render cycle.
function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent-blue/30 selection:text-white">
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Onboarding Flow */}
        <Route path="/onboarding/topics" element={<ProtectedRoute><OnboardingTopics /></ProtectedRoute>} />
        <Route path="/onboarding/sources" element={<ProtectedRoute><OnboardingSources /></ProtectedRoute>} />
        
        {/* Main App */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/article/:id" element={<ProtectedRoute><ArticleDetail /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/sources" element={<ProtectedRoute><SourceManager /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
