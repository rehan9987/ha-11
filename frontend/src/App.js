import React, { useState, useEffect } from 'react';
import '@/App.css';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Dashboard from '@/pages/Dashboard';
import Books from '@/pages/Books';
import Users from '@/pages/Users';
import Transactions from '@/pages/Transactions';
import Analytics from '@/pages/Analytics';
import Reports from '@/pages/Reports';
import { Toaster } from '@/components/ui/sonner';
import { BookOpen, Users as UsersIcon, RefreshCw, BarChart3, FileText, LayoutDashboard } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      await axios.post(`${API}/init-data`);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing data:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading Library System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Campus Library</h1>
                <p className="text-sm text-slate-500">Digital Access Tracker</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex bg-white/80 backdrop-blur-lg p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all" data-testid="dashboard-tab">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="books" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all" data-testid="books-tab">
              <BookOpen className="w-4 h-4 mr-2" />
              Books
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all" data-testid="users-tab">
              <UsersIcon className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all" data-testid="transactions-tab">
              <RefreshCw className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all" data-testid="analytics-tab">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2 transition-all" data-testid="reports-tab">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" data-testid="dashboard-content">
            <Dashboard />
          </TabsContent>
          <TabsContent value="books" data-testid="books-content">
            <Books />
          </TabsContent>
          <TabsContent value="users" data-testid="users-content">
            <Users />
          </TabsContent>
          <TabsContent value="transactions" data-testid="transactions-content">
            <Transactions />
          </TabsContent>
          <TabsContent value="analytics" data-testid="analytics-content">
            <Analytics />
          </TabsContent>
          <TabsContent value="reports" data-testid="reports-content">
            <Reports />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;