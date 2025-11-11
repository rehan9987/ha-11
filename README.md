# Campus Library - Digital Access Tracker

A comprehensive full-stack library management system designed for campus utility, built with **FastAPI**, **React**, and **MongoDB**. This system tracks books, users, transactions, calculates fines with tiered policy, and generates detailed Excel reports.

## Features

### 📊 Dashboard
- Real-time statistics (Total Books, Users, Transactions, Active Loans, Overdue Books, Total Fines)
- Quick stats with overdue rate and average fine per transaction
- Fine policy display with 5-day grace period
- Tiered fine calculation: ₹2/day (1-7 days), ₹5/day (8-14 days), ₹10/day (15+ days)

### 📚 Books Management
- View all books with genre filtering and search
- Add new books with complete details
- Real-time availability tracking
- Export books data to Excel
- 50 pre-loaded books across multiple genres

### 👥 Users Management
- Manage 100+ users with department and semester info
- Search and filter by department
- Add new users with complete contact details
- Export users data to Excel

### 🔄 Transactions
- Issue books with customizable borrow duration
- Return books with automatic fine calculation
- Track all transactions with status (issued/returned)
- Filter by status and search
- Export transaction history to Excel

### 📈 Analytics
- **Genre Distribution Pie Chart** - Visual representation of borrowed books by genre
- **Top Borrowers Leaderboard** - Ranked list with loan count and total fines
- **Most Borrowed Books** - Bar chart showing popularity
- **Overdue List** - Comprehensive list of overdue books with fine calculations
- Downloadable reports for each analytics section

### 📄 Reports
- Generate comprehensive Excel reports with multiple sheets:
  - **Top Borrowers** - User rankings by loans and fines
  - **Overdue List** - All overdue items with details
  - **Fine Summary** - Total fines by department and genre
- On-demand generation with real-time data

## Technology Stack

**Backend**: FastAPI, Motor, Pandas, NumPy, OpenPyXL  
**Frontend**: React 19, Recharts, Shadcn/UI, Tailwind CSS  
**Database**: MongoDB

## Quick Start

The application auto-imports data on first run. Simply access:
**https://bookmetrics.preview.emergentagent.com**

## API Endpoints

- `GET /api/dashboard/stats` - Dashboard KPIs
- `GET /api/books` - List books
- `POST /api/books` - Add book
- `GET /api/users` - List users
- `POST /api/transactions/issue` - Issue book
- `POST /api/transactions/return` - Return book
- `GET /api/analytics/top-borrowers` - Top borrowers
- `POST /api/reports/generate` - Generate Excel report

## Fine Policy

**Grace Period**: 5 days  
**Tiers**: ₹2/day (1-7), ₹5/day (8-14), ₹10/day (15+)

Built with ❤️ for Campus Libraries
