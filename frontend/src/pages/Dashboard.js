import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, TrendingUp, AlertCircle, Clock, DollarSign, Activity } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Books',
      value: stats?.total_books || 0,
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      testId: 'total-books-stat'
    },
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      testId: 'total-users-stat'
    },
    {
      title: 'Total Transactions',
      value: stats?.total_transactions || 0,
      icon: Activity,
      color: 'from-green-500 to-emerald-500',
      testId: 'total-transactions-stat'
    },
    {
      title: 'Active Loans',
      value: stats?.active_loans || 0,
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-500',
      testId: 'active-loans-stat'
    },
    {
      title: 'Overdue Books',
      value: stats?.overdue_books || 0,
      icon: AlertCircle,
      color: 'from-red-500 to-rose-500',
      testId: 'overdue-books-stat'
    },
    {
      title: 'Total Fines',
      value: `₹${stats?.total_fines || 0}`,
      icon: DollarSign,
      color: 'from-teal-500 to-blue-600',
      testId: 'total-fines-stat'
    },
    {
      title: 'Avg Borrow Duration',
      value: `${stats?.avg_borrow_duration || 0} days`,
      icon: Clock,
      color: 'from-indigo-500 to-violet-500',
      testId: 'avg-duration-stat'
    }
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" data-testid={stat.testId}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 font-medium" style={{fontFamily: 'Inter, sans-serif'}}>{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-800" style={{fontFamily: 'Space Grotesk, sans-serif'}} data-testid={`${stat.testId}-value`}>{stat.value}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Fine Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-200">
              <p className="text-sm text-slate-600 mb-2"><strong>Grace Period:</strong> 5 days</p>
              <div className="space-y-1.5 text-sm text-slate-600">
                <p>• Days 1-7: ₹2 per day</p>
                <p>• Days 8-14: ₹5 per day</p>
                <p>• Days 15+: ₹10 per day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Overdue Rate</span>
              <span className="font-semibold text-slate-800">
                {stats?.active_loans > 0 
                  ? `${((stats?.overdue_books / stats?.active_loans) * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Avg Fine per Transaction</span>
              <span className="font-semibold text-slate-800">
                ₹{stats?.total_transactions > 0 
                  ? (stats?.total_fines / stats?.total_transactions).toFixed(2)
                  : '0.00'
                }
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600">Books in Circulation</span>
              <span className="font-semibold text-slate-800">
                {((stats?.active_loans / stats?.total_books) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;