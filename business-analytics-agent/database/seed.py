import os
import sys
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text

# Database path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "business_analytics.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

def test_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ SQLite Connected!")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def create_tables():
    print("📋 Creating tables...")
    with engine.connect() as conn:
        conn.execute(text(
            "DROP TABLE IF EXISTS sales"
        ))
        conn.execute(text(
            "DROP TABLE IF EXISTS products"
        ))
        conn.execute(text(
            "DROP TABLE IF EXISTS customers"
        ))
        conn.execute(text(
            "DROP TABLE IF EXISTS alerts"
        ))
        conn.execute(text(
            "DROP TABLE IF EXISTS users"
        ))
        conn.execute(text("""
            CREATE TABLE customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                city TEXT,
                country TEXT DEFAULT 'India',
                segment TEXT DEFAULT 'SMB',
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("""
            CREATE TABLE products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                category TEXT DEFAULT 'General',
                stock INTEGER DEFAULT 100,
                description TEXT,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("""
            CREATE TABLE sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER,
                product_id INTEGER,
                amount REAL NOT NULL,
                quantity INTEGER DEFAULT 1,
                discount REAL DEFAULT 0,
                sale_date TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'completed',
                payment_method TEXT DEFAULT 'online'
            )
        """))
        conn.execute(text("""
            CREATE TABLE alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                priority TEXT DEFAULT 'medium',
                status TEXT DEFAULT 'unread',
                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.execute(text("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'analyst',
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
    print("✅ All tables created!")

def insert_customers(conn):
    customers = [
        ("Arjun Kumar", "arjun@techcorp.com",
         "+91-9876543210", "Chennai", "Enterprise"),
        ("Priya Sharma", "priya@startup.in",
         "+91-9876543211", "Mumbai", "SMB"),
        ("Rahul Verma", "rahul@business.com",
         "+91-9876543212", "Delhi", "Enterprise"),
        ("Anita Singh", "anita@company.in",
         "+91-9876543213", "Bangalore", "SMB"),
        ("Vijay Patel", "vijay@trade.com",
         "+91-9876543214", "Ahmedabad", "Startup"),
        ("Sunita Rao", "sunita@finance.in",
         "+91-9876543215", "Hyderabad", "Enterprise"),
        ("Kiran Nair", "kiran@retail.com",
         "+91-9876543216", "Kochi", "SMB"),
        ("Deepak Joshi", "deepak@services.in",
         "+91-9876543217", "Pune", "Startup"),
        ("Meena Pillai", "meena@ecommerce.com",
         "+91-9876543218", "Chennai", "SMB"),
        ("Suresh Gupta", "suresh@logistics.in",
         "+91-9876543219", "Delhi", "Enterprise"),
        ("Lakshmi Das", "lakshmi@health.com",
         "+91-9876543220", "Kolkata", "SMB"),
        ("Arun Mishra", "arun@education.in",
         "+91-9876543221", "Lucknow", "Startup"),
        ("Kavya Reddy", "kavya@media.com",
         "+91-9876543222", "Hyderabad", "SMB"),
        ("Ramesh Iyer", "ramesh@manufacturing.in",
         "+91-9876543223", "Coimbatore", "Enterprise"),
        ("Pooja Tiwari", "pooja@consulting.com",
         "+91-9876543224", "Mumbai", "SMB"),
    ]
    for name, email, phone, city, segment in customers:
        conn.execute(text("""
            INSERT OR IGNORE INTO customers
                (name, email, phone, city, segment)
            VALUES
                (:name, :email, :phone, :city, :segment)
        """), {
            "name": name,
            "email": email,
            "phone": phone,
            "city": city,
            "segment": segment
        })
    conn.commit()
    print(f"✅ {len(customers)} customers inserted")

def insert_products(conn):
    products = [
        ("Enterprise Analytics Suite",
         2999.00, "Software", 50),
        ("Business Intelligence Pro",
         1999.00, "Software", 75),
        ("Data Dashboard Starter",
         499.00, "Software", 200),
        ("AI Forecasting Module",
         3499.00, "AI Tools", 30),
        ("CRM Integration Pack",
         799.00, "Integration", 100),
        ("Sales Analytics Tool",
         1299.00, "Software", 80),
        ("HR Management System",
         1499.00, "Software", 60),
        ("Inventory Tracker Pro",
         699.00, "Operations", 120),
        ("Financial Reports Module",
         899.00, "Finance", 90),
        ("Customer Insights AI",
         2499.00, "AI Tools", 40),
    ]
    for name, price, category, stock in products:
        conn.execute(text("""
            INSERT INTO products
                (name, price, category, stock)
            VALUES
                (:name, :price, :category, :stock)
        """), {
            "name": name,
            "price": price,
            "category": category,
            "stock": stock
        })
    conn.commit()
    print(f"✅ {len(products)} products inserted")

def insert_sales(conn):
    base_date = datetime.now() - timedelta(days=180)
    count = 0
    for i in range(50):
        customer_id = random.randint(1, 15)
        product_id = random.randint(1, 10)
        quantity = random.randint(1, 5)
        price_row = conn.execute(text(
            "SELECT price FROM products WHERE id=:id"
        ), {"id": product_id}).fetchone()
        if price_row:
            amount = round(
                float(price_row[0]) *
                quantity *
                random.uniform(0.85, 1.0), 2
            )
            sale_date = base_date + timedelta(
                days=random.randint(0, 180)
            )
            conn.execute(text("""
                INSERT INTO sales
                    (customer_id, product_id,
                     amount, quantity, sale_date)
                VALUES
                    (:cid, :pid, :amt, :qty, :dt)
            """), {
                "cid": customer_id,
                "pid": product_id,
                "amt": amount,
                "qty": quantity,
                "dt": sale_date
            })
            count += 1
    conn.commit()
    print(f"✅ {count} sales inserted")

def insert_alerts(conn):
    alerts = [
        ("Revenue Target Achieved",
         "Q3 revenue target achieved at 94.2%",
         "success", "high"),
        ("Churn Risk Detected",
         "ML model detected 3 high risk customers",
         "warning", "high"),
        ("New AI Forecast Ready",
         "Q4 forecast generated successfully",
         "info", "medium"),
        ("Database Backup Complete",
         "Backup completed successfully",
         "success", "low"),
        ("Upsell Opportunity",
         "5 customers eligible for Enterprise upgrade",
         "info", "medium"),
    ]
    for title, message, atype, priority in alerts:
        conn.execute(text("""
            INSERT INTO alerts
                (title, message, type, priority)
            VALUES
                (:t, :m, :at, :p)
        """), {
            "t": title,
            "m": message,
            "at": atype,
            "p": priority
        })
    conn.commit()
    print("✅ 5 alerts inserted")

def insert_admin(conn):
    conn.execute(text("""
        INSERT OR IGNORE INTO users
            (name, email, password, role)
        VALUES
            ('Admin', 'admin@business.com',
             'admin123', 'admin')
    """))
    conn.commit()
    print("✅ Admin user created")

def verify(conn):
    c = conn.execute(
        text("SELECT COUNT(*) FROM customers")
    ).scalar()
    p = conn.execute(
        text("SELECT COUNT(*) FROM products")
    ).scalar()
    s = conn.execute(
        text("SELECT COUNT(*) FROM sales")
    ).scalar()
    r = conn.execute(
        text("SELECT SUM(amount) FROM sales")
    ).scalar()
    print("\n🎉 DATABASE COMPLETE!")
    print("=" * 35)
    print(f"✅ Customers : {c}")
    print(f"✅ Products  : {p}")
    print(f"✅ Sales     : {s}")
    print(f"✅ Revenue   : ${float(r or 0):,.2f}")
    print("=" * 35)
    print("🚀 Now run: uvicorn main:app --reload")

def main():
    print("🌱 Starting database seed...")
    if not test_connection():
        return
    create_tables()
    with engine.connect() as conn:
        insert_customers(conn)
        insert_products(conn)
        insert_sales(conn)
        insert_alerts(conn)
        insert_admin(conn)
        verify(conn)

if __name__ == "__main__":
    main()