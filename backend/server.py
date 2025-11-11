from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import pandas as pd
import numpy as np
from io import BytesIO
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configuration
FINE_CONFIG = {
    "grace_period_days": 5,
    "tiers": [
        {"days_start": 1, "days_end": 7, "rate_per_day": 2},
        {"days_start": 8, "days_end": 14, "rate_per_day": 5},
        {"days_start": 15, "days_end": None, "rate_per_day": 10}
    ]
}

# Models
class Book(BaseModel):
    model_config = ConfigDict(extra="ignore")
    book_id: str
    title: str
    author: str
    genre: str
    available_copies: int
    total_copies: int
    shelf_location: Optional[str] = "A1"

class BookCreate(BaseModel):
    book_id: str
    title: str
    author: str
    genre: str
    available_copies: int
    total_copies: int
    shelf_location: Optional[str] = "A1"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    email: str
    phone: str
    department: Optional[str] = "General"
    semester: Optional[str] = "N/A"

class UserCreate(BaseModel):
    user_id: str
    name: str
    email: str
    phone: str
    department: Optional[str] = "General"
    semester: Optional[str] = "N/A"

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str
    book_id: str
    user_id: str
    issue_date: str
    return_date: Optional[str] = None
    due_date: str
    status: str
    fine_amount: float = 0.0

class TransactionCreate(BaseModel):
    book_id: str
    user_id: str
    borrow_days: int = 7

class TransactionReturn(BaseModel):
    transaction_id: str

# Helper Functions
def calculate_fine(due_date_str: str, return_date_str: Optional[str], grace_period: int = 5) -> float:
    """Calculate fine based on tiered policy with grace period"""
    due_date = datetime.fromisoformat(due_date_str).replace(tzinfo=None)
    
    if return_date_str and return_date_str.strip():
        return_date = datetime.fromisoformat(return_date_str).replace(tzinfo=None)
    else:
        return_date = datetime.now(timezone.utc).replace(tzinfo=None)
    
    if return_date <= due_date:
        return 0.0
    
    overdue_days = (return_date - due_date).days
    
    if overdue_days <= grace_period:
        return 0.0
    
    chargeable_days = overdue_days - grace_period
    total_fine = 0.0
    
    for tier in FINE_CONFIG["tiers"]:
        start = tier["days_start"]
        end = tier["days_end"] if tier["days_end"] else float('inf')
        rate = tier["rate_per_day"]
        
        if chargeable_days >= start:
            if chargeable_days <= end:
                days_in_tier = chargeable_days - start + 1
                total_fine += days_in_tier * rate
                break
            else:
                days_in_tier = end - start + 1
                total_fine += days_in_tier * rate
    
    return round(total_fine, 2)

async def import_initial_data():
    """Import data from CSV URLs into MongoDB"""
    books_url = "https://customer-assets.emergentagent.com/job_5edf4d13-8af0-4ee5-a665-c1ddf41e0200/artifacts/d40kxosw_Datasets%20-%20books.csv.csv"
    users_url = "https://customer-assets.emergentagent.com/job_5edf4d13-8af0-4ee5-a665-c1ddf41e0200/artifacts/n8l5t7yt_Datasets%20-%20users.csv.csv"
    transactions_url = "https://customer-assets.emergentagent.com/job_5edf4d13-8af0-4ee5-a665-c1ddf41e0200/artifacts/a8soib4o_Datasets%20-%20transactions.csv.csv"
    
    try:
        async with httpx.AsyncClient() as client_http:
            # Import Books
            books_count = await db.books.count_documents({})
            if books_count == 0:
                response = await client_http.get(books_url)
                books_df = pd.read_csv(BytesIO(response.content))
                books_df['shelf_location'] = 'A1'
                books_data = books_df.to_dict('records')
                if books_data:
                    await db.books.insert_many(books_data)
                    logger.info(f"Imported {len(books_data)} books")
            
            # Import Users with departments
            users_count = await db.users.count_documents({})
            if users_count == 0:
                response = await client_http.get(users_url)
                users_df = pd.read_csv(BytesIO(response.content))
                departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'MBA', 'Arts']
                semesters = ['1', '2', '3', '4', '5', '6', '7', '8']
                users_df['department'] = np.random.choice(departments, len(users_df))
                users_df['semester'] = np.random.choice(semesters, len(users_df))
                # Convert phone to string
                users_df['phone'] = users_df['phone'].astype(str)
                users_data = users_df.to_dict('records')
                if users_data:
                    await db.users.insert_many(users_data)
                    logger.info(f"Imported {len(users_data)} users")
            
            # Import Transactions
            trans_count = await db.transactions.count_documents({})
            if trans_count == 0:
                response = await client_http.get(transactions_url)
                trans_df = pd.read_csv(BytesIO(response.content))
                trans_df['status'] = trans_df['return_date'].apply(
                    lambda x: 'returned' if pd.notna(x) and str(x).strip() else 'issued'
                )
                trans_df['fine_amount'] = trans_df.apply(
                    lambda row: calculate_fine(
                        row['due_date'],
                        str(row['return_date']) if pd.notna(row['return_date']) else None,
                        FINE_CONFIG['grace_period_days']
                    ), axis=1
                )
                trans_df = trans_df.replace({np.nan: None})
                trans_data = trans_df.to_dict('records')
                if trans_data:
                    await db.transactions.insert_many(trans_data)
                    logger.info(f"Imported {len(trans_data)} transactions")
    
    except Exception as e:
        logger.error(f"Error importing data: {e}")

# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "Digital Library Access Tracker API"}

@api_router.post("/init-data")
async def initialize_data():
    await import_initial_data()
    return {"message": "Data import initiated"}

# Books
@api_router.get("/books", response_model=List[Book])
async def get_books(genre: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if genre:
        query["genre"] = genre
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"author": {"$regex": search, "$options": "i"}}
        ]
    books = await db.books.find(query, {"_id": 0}).to_list(1000)
    return books

@api_router.post("/books", response_model=Book)
async def create_book(book: BookCreate):
    existing = await db.books.find_one({"book_id": book.book_id})
    if existing:
        raise HTTPException(status_code=400, detail="Book ID already exists")
    
    book_dict = book.model_dump()
    await db.books.insert_one(book_dict)
    return book

@api_router.put("/books/{book_id}")
async def update_book(book_id: str, book: BookCreate):
    result = await db.books.update_one(
        {"book_id": book_id},
        {"$set": book.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    return {"message": "Book updated successfully"}

@api_router.get("/books/genres")
async def get_genres():
    genres = await db.books.distinct("genre")
    return {"genres": sorted(genres)}

# Users
@api_router.get("/users", response_model=List[User])
async def get_users(department: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if department:
        query["department"] = department
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    users = await db.users.find(query, {"_id": 0}).to_list(1000)
    return users

@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    existing = await db.users.find_one({"user_id": user.user_id})
    if existing:
        raise HTTPException(status_code=400, detail="User ID already exists")
    
    user_dict = user.model_dump()
    await db.users.insert_one(user_dict)
    return user

@api_router.get("/users/departments")
async def get_departments():
    departments = await db.users.distinct("department")
    return {"departments": sorted(departments) if departments else []}

# Transactions
@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(status: Optional[str] = None, user_id: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if user_id:
        query["user_id"] = user_id
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(1000)
    return transactions

@api_router.post("/transactions/issue")
async def issue_book(transaction: TransactionCreate):
    book = await db.books.find_one({"book_id": transaction.book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book["available_copies"] <= 0:
        raise HTTPException(status_code=400, detail="Book not available")
    
    user = await db.users.find_one({"user_id": transaction.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    issue_date = datetime.now(timezone.utc)
    due_date = issue_date + timedelta(days=transaction.borrow_days)
    
    trans_id = f"T{int(datetime.now().timestamp())}"
    
    new_transaction = {
        "transaction_id": trans_id,
        "book_id": transaction.book_id,
        "user_id": transaction.user_id,
        "issue_date": issue_date.isoformat(),
        "return_date": None,
        "due_date": due_date.isoformat(),
        "status": "issued",
        "fine_amount": 0.0
    }
    
    await db.transactions.insert_one(new_transaction)
    await db.books.update_one(
        {"book_id": transaction.book_id},
        {"$inc": {"available_copies": -1}}
    )
    
    return {"message": "Book issued successfully", "transaction_id": trans_id}

@api_router.post("/transactions/return")
async def return_book(return_data: TransactionReturn):
    transaction = await db.transactions.find_one({"transaction_id": return_data.transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction["status"] == "returned":
        raise HTTPException(status_code=400, detail="Book already returned")
    
    return_date = datetime.now(timezone.utc)
    fine = calculate_fine(
        transaction["due_date"],
        return_date.isoformat(),
        FINE_CONFIG["grace_period_days"]
    )
    
    await db.transactions.update_one(
        {"transaction_id": return_data.transaction_id},
        {"$set": {
            "return_date": return_date.isoformat(),
            "status": "returned",
            "fine_amount": fine
        }}
    )
    
    await db.books.update_one(
        {"book_id": transaction["book_id"]},
        {"$inc": {"available_copies": 1}}
    )
    
    return {"message": "Book returned successfully", "fine_amount": fine}

# Analytics
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    books = await db.books.find({}, {"_id": 0}).to_list(1000)
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    trans_df = pd.DataFrame(transactions)
    
    total_books = len(books)
    total_users = len(users)
    total_transactions = len(transactions)
    
    issued_count = len(trans_df[trans_df['status'] == 'issued']) if not trans_df.empty else 0
    
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    overdue_count = 0
    total_fines = 0.0
    
    if not trans_df.empty:
        for _, row in trans_df.iterrows():
            if row['status'] == 'issued':
                due_date = datetime.fromisoformat(row['due_date']).replace(tzinfo=None)
                if now > due_date:
                    overdue_count += 1
            total_fines += float(row.get('fine_amount', 0))
    
    avg_borrow_duration = 0
    if not trans_df.empty and 'issue_date' in trans_df.columns:
        trans_df['issue_date'] = pd.to_datetime(trans_df['issue_date'])
        trans_df['return_date'] = pd.to_datetime(trans_df['return_date'], errors='coerce')
        returned = trans_df[trans_df['status'] == 'returned'].copy()
        if not returned.empty:
            returned['duration'] = (returned['return_date'] - returned['issue_date']).dt.days
            avg_borrow_duration = float(returned['duration'].mean())
    
    return {
        "total_books": total_books,
        "total_users": total_users,
        "total_transactions": total_transactions,
        "active_loans": issued_count,
        "overdue_books": overdue_count,
        "total_fines": round(total_fines, 2),
        "avg_borrow_duration": round(avg_borrow_duration, 1)
    }

@api_router.get("/analytics/top-borrowers")
async def get_top_borrowers(limit: int = 10):
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    trans_df = pd.DataFrame(transactions)
    users_df = pd.DataFrame(users)
    
    if trans_df.empty:
        return []
    
    borrower_stats = trans_df.groupby('user_id').agg({
        'transaction_id': 'count',
        'fine_amount': 'sum'
    }).reset_index()
    
    borrower_stats.columns = ['user_id', 'loan_count', 'total_fines']
    borrower_stats = borrower_stats.merge(users_df[['user_id', 'name', 'email', 'department']], on='user_id', how='left')
    borrower_stats = borrower_stats.sort_values('loan_count', ascending=False).head(limit)
    
    return borrower_stats.to_dict('records')

@api_router.get("/analytics/top-books")
async def get_top_books(limit: int = 10):
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    books = await db.books.find({}, {"_id": 0}).to_list(1000)
    
    trans_df = pd.DataFrame(transactions)
    books_df = pd.DataFrame(books)
    
    if trans_df.empty:
        return []
    
    book_stats = trans_df.groupby('book_id').size().reset_index(name='borrow_count')
    book_stats = book_stats.merge(books_df[['book_id', 'title', 'author', 'genre']], on='book_id', how='left')
    book_stats = book_stats.sort_values('borrow_count', ascending=False).head(limit)
    
    return book_stats.to_dict('records')

@api_router.get("/analytics/genre-distribution")
async def get_genre_distribution():
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    books = await db.books.find({}, {"_id": 0}).to_list(1000)
    
    trans_df = pd.DataFrame(transactions)
    books_df = pd.DataFrame(books)
    
    if trans_df.empty or books_df.empty:
        return []
    
    trans_with_books = trans_df.merge(books_df[['book_id', 'genre']], on='book_id', how='left')
    genre_stats = trans_with_books.groupby('genre').size().reset_index(name='count')
    genre_stats = genre_stats.sort_values('count', ascending=False)
    
    return genre_stats.to_dict('records')

@api_router.get("/analytics/overdue-list")
async def get_overdue_list():
    transactions = await db.transactions.find({"status": "issued"}, {"_id": 0}).to_list(10000)
    books = await db.books.find({}, {"_id": 0}).to_list(1000)
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    trans_df = pd.DataFrame(transactions)
    books_df = pd.DataFrame(books)
    users_df = pd.DataFrame(users)
    
    if trans_df.empty:
        return []
    
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    overdue_list = []
    
    for _, row in trans_df.iterrows():
        due_date = datetime.fromisoformat(row['due_date']).replace(tzinfo=None)
        if now > due_date:
            overdue_days = (now - due_date).days
            fine = calculate_fine(row['due_date'], None, FINE_CONFIG['grace_period_days'])
            
            book = books_df[books_df['book_id'] == row['book_id']].iloc[0].to_dict() if not books_df[books_df['book_id'] == row['book_id']].empty else {}
            user = users_df[users_df['user_id'] == row['user_id']].iloc[0].to_dict() if not users_df[users_df['user_id'] == row['user_id']].empty else {}
            
            overdue_list.append({
                'transaction_id': row['transaction_id'],
                'user_id': row['user_id'],
                'user_name': user.get('name', 'N/A'),
                'user_email': user.get('email', 'N/A'),
                'book_id': row['book_id'],
                'book_title': book.get('title', 'N/A'),
                'issue_date': row['issue_date'],
                'due_date': row['due_date'],
                'overdue_days': overdue_days,
                'fine_amount': fine
            })
    
    return sorted(overdue_list, key=lambda x: x['overdue_days'], reverse=True)

# Reports
@api_router.post("/reports/generate")
async def generate_weekly_report():
    """Generate Excel report with multiple sheets"""
    try:
        # Fetch all data
        transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
        books = await db.books.find({}, {"_id": 0}).to_list(1000)
        users = await db.users.find({}, {"_id": 0}).to_list(1000)
        
        trans_df = pd.DataFrame(transactions)
        books_df = pd.DataFrame(books)
        users_df = pd.DataFrame(users)
        
        # Create Excel writer
        output = BytesIO()
        writer = pd.ExcelWriter(output, engine='openpyxl')
        
        # Sheet 1: Top Borrowers
        if not trans_df.empty:
            borrower_stats = trans_df.groupby('user_id').agg({
                'transaction_id': 'count',
                'fine_amount': 'sum'
            }).reset_index()
            borrower_stats.columns = ['user_id', 'loan_count', 'total_fines']
            borrower_stats = borrower_stats.merge(
                users_df[['user_id', 'name', 'email', 'department']], 
                on='user_id', 
                how='left'
            )
            borrower_stats = borrower_stats.sort_values('loan_count', ascending=False).head(20)
            borrower_stats.to_excel(writer, sheet_name='Top Borrowers', index=False)
        
        # Sheet 2: Overdue List
        overdue_data = await get_overdue_list()
        if overdue_data:
            overdue_df = pd.DataFrame(overdue_data)
            overdue_df.to_excel(writer, sheet_name='Overdue List', index=False)
        
        # Sheet 3: Fine Totals
        if not trans_df.empty:
            total_fines = trans_df['fine_amount'].sum()
            
            # By department
            trans_with_users = trans_df.merge(users_df[['user_id', 'department']], on='user_id', how='left')
            dept_fines = trans_with_users.groupby('department')['fine_amount'].sum().reset_index()
            dept_fines.columns = ['Department', 'Total Fines']
            
            # By genre
            trans_with_books = trans_df.merge(books_df[['book_id', 'genre']], on='book_id', how='left')
            genre_fines = trans_with_books.groupby('genre')['fine_amount'].sum().reset_index()
            genre_fines.columns = ['Genre', 'Total Fines']
            
            # Summary
            summary_df = pd.DataFrame({
                'Metric': ['Total Fines Collected', 'Total Transactions', 'Average Fine per Transaction'],
                'Value': [f"₹{total_fines:.2f}", len(trans_df), f"₹{total_fines/len(trans_df):.2f}" if len(trans_df) > 0 else "₹0.00"]
            })
            
            summary_df.to_excel(writer, sheet_name='Fine Summary', index=False, startrow=0)
            dept_fines.to_excel(writer, sheet_name='Fine Summary', index=False, startrow=len(summary_df)+3)
            genre_fines.to_excel(writer, sheet_name='Fine Summary', index=False, startrow=len(summary_df)+len(dept_fines)+6)
        
        writer.close()
        output.seek(0)
        
        # Convert to base64 for frontend
        import base64
        file_content = output.read()
        base64_content = base64.b64encode(file_content).decode('utf-8')
        
        return {
            "success": True,
            "filename": f"library_report_{datetime.now().strftime('%Y-%m-%d')}.xlsx",
            "content": base64_content
        }
    
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await import_initial_data()
    logger.info("Application started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()