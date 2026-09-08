import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OnboardingTopics from './pages/OnboardingTopics';
import OnboardingSources from './pages/OnboardingSources';
import Dashboard from './pages/Dashboard';
import ArticleDetail from './pages/ArticleDetail';
import Settings from './pages/Settings';
import SourceManager from './pages/SourceManager';

function App() {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  
  // Minimal protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent-blue/30 selection:text-white">
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
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
