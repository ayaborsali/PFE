import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-emerald-600"></div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default App;
