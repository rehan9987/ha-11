import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BookOpen, Plus, Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Books = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  
  const [formData, setFormData] = useState({
    book_id: '',
    title: '',
    author: '',
    genre: '',
    available_copies: '',
    total_copies: '',
    shelf_location: 'A1'
  });

  useEffect(() => {
    fetchBooks();
    fetchGenres();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [books, searchTerm, selectedGenre]);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API}/books`);
      setBooks(response.data);
      setFilteredBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await axios.get(`${API}/books/genres`);
      setGenres(response.data.genres || []);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const filterBooks = () => {
    let filtered = [...books];
    
    if (searchTerm) {
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(book => book.genre === selectedGenre);
    }
    
    setFilteredBooks(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/books`, formData);
      toast.success('Book added successfully!');
      setIsDialogOpen(false);
      fetchBooks();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add book');
    }
  };

  const resetForm = () => {
    setFormData({
      book_id: '',
      title: '',
      author: '',
      genre: '',
      available_copies: '',
      total_copies: '',
      shelf_location: 'A1'
    });
  };

  const downloadCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredBooks);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Books');
    XLSX.writeFile(wb, `library_books_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Books exported successfully!');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="books-page">
      <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Space Grotesk, sans-serif'}}>Books Collection</CardTitle>
            <div className="flex gap-3">
              <Button onClick={downloadCSV} variant="outline" className="border-teal-200 hover:bg-teal-50" data-testid="download-books-btn">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg" data-testid="add-book-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Book
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" data-testid="add-book-dialog">
                  <DialogHeader>
                    <DialogTitle>Add New Book</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="book_id">Book ID</Label>
                        <Input id="book_id" placeholder="B001" value={formData.book_id} onChange={(e) => setFormData({...formData, book_id: e.target.value})} required data-testid="book-id-input" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" placeholder="Book Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required data-testid="book-title-input" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="author">Author</Label>
                        <Input id="author" placeholder="Author Name" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} required data-testid="book-author-input" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="genre">Genre</Label>
                        <Input id="genre" placeholder="Genre" value={formData.genre} onChange={(e) => setFormData({...formData, genre: e.target.value})} required data-testid="book-genre-input" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total_copies">Total Copies</Label>
                        <Input id="total_copies" type="number" placeholder="10" value={formData.total_copies} onChange={(e) => setFormData({...formData, total_copies: e.target.value})} required data-testid="book-total-copies-input" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="available_copies">Available Copies</Label>
                        <Input id="available_copies" type="number" placeholder="10" value={formData.available_copies} onChange={(e) => setFormData({...formData, available_copies: e.target.value})} required data-testid="book-available-copies-input" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shelf_location">Shelf Location</Label>
                        <Input id="shelf_location" placeholder="A1" value={formData.shelf_location} onChange={(e) => setFormData({...formData, shelf_location: e.target.value})} data-testid="book-shelf-input" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white" data-testid="submit-book-btn">Add Book</Button>
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
                  placeholder="Search by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-books-input"
                />
              </div>
            </div>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-[200px]" data-testid="genre-filter-select">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => (
              <Card key={book.book_id} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:shadow-lg transition-all duration-300" data-testid={`book-card-${book.book_id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-2.5 rounded-lg shadow-md">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-base mb-1 truncate" style={{fontFamily: 'Space Grotesk, sans-serif'}} data-testid={`book-title-${book.book_id}`}>{book.title}</h3>
                      <p className="text-sm text-slate-500 mb-2" data-testid={`book-author-${book.book_id}`}>{book.author}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full" data-testid={`book-genre-${book.book_id}`}>{book.genre}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{book.shelf_location}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Available:</span>
                        <span className={`font-semibold ${book.available_copies > 0 ? 'text-green-600' : 'text-red-600'}`} data-testid={`book-available-${book.book_id}`}>
                          {book.available_copies}/{book.total_copies}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No books found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Books;