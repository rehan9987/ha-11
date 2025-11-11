import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RefreshCw, ArrowUpCircle, ArrowDownCircle, Download, Search, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [issueFormData, setIssueFormData] = useState({
    book_id: '',
    user_id: '',
    borrow_days: '7'
  });

  const [returnFormData, setReturnFormData] = useState({
    transaction_id: ''
  });

  useEffect(() => {
    fetchTransactions();
    fetchBooks();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, statusFilter, searchTerm]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/transactions`);
      setTransactions(response.data);
      setFilteredTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API}/books`);
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.book_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTransactions(filtered);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/transactions/issue`, issueFormData);
      toast.success('Book issued successfully!');
      setIsIssueDialogOpen(false);
      fetchTransactions();
      fetchBooks();
      resetIssueForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to issue book');
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/transactions/return`, returnFormData);
      toast.success(`Book returned! Fine: ₹${response.data.fine_amount}`);
      setIsReturnDialogOpen(false);
      fetchTransactions();
      fetchBooks();
      resetReturnForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to return book');
    }
  };

  const resetIssueForm = () => {
    setIssueFormData({ book_id: '', user_id: '', borrow_days: '7' });
  };

  const resetReturnForm = () => {
    setReturnFormData({ transaction_id: '' });
  };

  const downloadCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTransactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `library_transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Transactions exported successfully!');
  };

  const getBookTitle = (bookId) => {
    const book = books.find(b => b.book_id === bookId);
    return book ? book.title : bookId;
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.user_id === userId);
    return user ? user.name : userId;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="transactions-page">
      <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Transactions</CardTitle>
            <div className="flex gap-3">
              <Button onClick={downloadCSV} variant="outline" className="border-teal-200 hover:bg-teal-50" data-testid="download-transactions-btn">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-amber-200 hover:bg-amber-50 text-amber-700" data-testid="return-book-btn">
                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                    Return Book
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="return-book-dialog">
                  <DialogHeader>
                    <DialogTitle>Return Book</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleReturnSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="return_transaction_id">Transaction ID</Label>
                      <Input id="return_transaction_id" placeholder="T001" value={returnFormData.transaction_id} onChange={(e) => setReturnFormData({...returnFormData, transaction_id: e.target.value})} required data-testid="return-transaction-id-input" />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" data-testid="submit-return-btn">Return Book</Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg" data-testid="issue-book-btn">
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Issue Book
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="issue-book-dialog">
                  <DialogHeader>
                    <DialogTitle>Issue Book</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleIssueSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="book_id">Book ID</Label>
                      <Select value={issueFormData.book_id} onValueChange={(value) => setIssueFormData({...issueFormData, book_id: value})}>
                        <SelectTrigger data-testid="issue-book-select">
                          <SelectValue placeholder="Select Book" />
                        </SelectTrigger>
                        <SelectContent>
                          {books.filter(b => b.available_copies > 0).map((book) => (
                            <SelectItem key={book.book_id} value={book.book_id}>
                              {book.title} ({book.book_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user_id">User ID</Label>
                      <Select value={issueFormData.user_id} onValueChange={(value) => setIssueFormData({...issueFormData, user_id: value})}>
                        <SelectTrigger data-testid="issue-user-select">
                          <SelectValue placeholder="Select User" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.name} ({user.user_id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="borrow_days">Borrow Days</Label>
                      <Input id="borrow_days" type="number" placeholder="7" value={issueFormData.borrow_days} onChange={(e) => setIssueFormData({...issueFormData, borrow_days: e.target.value})} required data-testid="borrow-days-input" />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white" data-testid="submit-issue-btn">Issue Book</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-transactions-input"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" data-testid="status-filter-select">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <Card key={transaction.transaction_id} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:shadow-md transition-all" data-testid={`transaction-card-${transaction.transaction_id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-800" data-testid={`transaction-id-${transaction.transaction_id}`}>{transaction.transaction_id}</span>
                        <Badge variant={transaction.status === 'issued' ? 'default' : 'secondary'} data-testid={`transaction-status-${transaction.transaction_id}`}>
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500 mb-1">Book</p>
                          <p className="font-medium text-slate-800 truncate" data-testid={`transaction-book-${transaction.transaction_id}`}>{getBookTitle(transaction.book_id)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-1">User</p>
                          <p className="font-medium text-slate-800 truncate" data-testid={`transaction-user-${transaction.transaction_id}`}>{getUserName(transaction.user_id)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-1">Issue Date</p>
                          <p className="font-medium text-slate-800" data-testid={`transaction-issue-date-${transaction.transaction_id}`}>{new Date(transaction.issue_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-1">Due Date</p>
                          <p className="font-medium text-slate-800" data-testid={`transaction-due-date-${transaction.transaction_id}`}>{new Date(transaction.due_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 text-sm mb-1">Fine</p>
                      <p className={`text-xl font-bold ${transaction.fine_amount > 0 ? 'text-red-600' : 'text-green-600'}`} data-testid={`transaction-fine-${transaction.transaction_id}`}>
                        ₹{transaction.fine_amount || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <RefreshCw className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;