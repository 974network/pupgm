
import React, { useState, useEffect } from 'react';
import { User, Property, Transaction } from './types';
import { StorageService } from './services/storage';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Properties from './components/Properties';
import Transactions from './components/Transactions';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'properties' | 'transactions'>('dashboard');
  const [loading, setLoading] = useState(true);

  // Persistence check on mount
  useEffect(() => {
    const savedSession = StorageService.getSession();
    if (savedSession) {
      setUser(savedSession);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    StorageService.setSession(userData);
  };

  const handleLogout = () => {
    setUser(null);
    StorageService.setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {activeTab === 'dashboard' && <Dashboard user={user} />}
      {activeTab === 'properties' && <Properties user={user} />}
      {activeTab === 'transactions' && <Transactions user={user} />}
    </Layout>
  );
};

export default App;
