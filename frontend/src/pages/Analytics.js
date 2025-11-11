import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#f59e0b', '#6366f1'];

const Analytics = () => {
  const [topBorrowers, setTopBorrowers] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [genreDistribution, setGenreDistribution] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [borrowersRes, booksRes, genreRes, overdueRes] = await Promise.all([
        axios.get(`${API}/analytics/top-borrowers?limit=10`),
        axios.get(`${API}/analytics/top-books?limit=10`),
        axios.get(`${API}/analytics/genre-distribution`),
        axios.get(`${API}/analytics/overdue-list`)
      ]);
      
      setTopBorrowers(borrowersRes.data);
      setTopBooks(booksRes.data);
      setGenreDistribution(genreRes.data);
      setOverdueList(overdueRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const downloadBorrowersCSV = () => {
    const ws = XLSX.utils.json_to_sheet(topBorrowers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Top Borrowers');
    XLSX.writeFile(wb, `top_borrowers_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Top borrowers exported!');
  };

  const downloadBooksCSV = () => {
    const ws = XLSX.utils.json_to_sheet(topBooks);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Top Books');
    XLSX.writeFile(wb, `top_books_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Top books exported!');
  };

  const downloadOverdueCSV = () => {
    const ws = XLSX.utils.json_to_sheet(overdueList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Overdue Books');
    XLSX.writeFile(wb, `overdue_books_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Overdue list exported!');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="analytics-page">
      {/* Genre Distribution Pie Chart */}
      <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-800" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Genre Distribution</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genreDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ genre, percent }) => `${genre}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="genre"
              >
                {genreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Borrowers Leaderboard */}
      <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              <Trophy className="w-5 h-5 text-amber-500" />
              Top Borrowers
            </CardTitle>
            <Button onClick={downloadBorrowersCSV} variant="outline" size="sm" className="border-teal-200 hover:bg-teal-50" data-testid="download-borrowers-btn">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topBorrowers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 12}} angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="loan_count" fill="#14b8a6" name="Loans" />
              <Bar dataKey="total_fines" fill="#f97316" name="Fines (₹)" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {topBorrowers.slice(0, 5).map((borrower, index) => (
              <div key={borrower.user_id} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-teal-50 rounded-lg" data-testid={`borrower-${index}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-teal-500'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800" data-testid={`borrower-name-${index}`}>{borrower.name}</p>
                    <p className="text-sm text-slate-500">{borrower.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-teal-600" data-testid={`borrower-loans-${index}`}>{borrower.loan_count} loans</p>
                  <p className="text-sm text-slate-500">₹{borrower.total_fines} fines</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Books */}
      <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Most Borrowed Books
            </CardTitle>
            <Button onClick={downloadBooksCSV} variant="outline" size="sm" className="border-teal-200 hover:bg-teal-50" data-testid="download-books-btn">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topBooks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" />
              <YAxis dataKey="title" type="category" tick={{fontSize: 12}} width={150} />
              <Tooltip />
              <Bar dataKey="borrow_count" fill="#3b82f6" name="Times Borrowed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Overdue List */}
      <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              <AlertCircle className="w-5 h-5 text-red-500" />
              Overdue Books
            </CardTitle>
            <Button onClick={downloadOverdueCSV} variant="outline" size="sm" className="border-red-200 hover:bg-red-50" data-testid="download-overdue-btn">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {overdueList.length > 0 ? (
            <div className="space-y-3">
              {overdueList.map((item, index) => (
                <div key={item.transaction_id} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200" data-testid={`overdue-${index}`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 mb-1" data-testid={`overdue-book-${index}`}>{item.book_title}</p>
                      <p className="text-sm text-slate-600" data-testid={`overdue-user-${index}`}>Borrowed by: {item.user_name}</p>
                      <p className="text-sm text-slate-500">Due: {new Date(item.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600" data-testid={`overdue-days-${index}`}>{item.overdue_days}d</p>
                      <p className="text-sm text-slate-500">overdue</p>
                      <p className="text-sm font-semibold text-red-600">₹{item.fine_amount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <p className="text-slate-500">No overdue books!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;