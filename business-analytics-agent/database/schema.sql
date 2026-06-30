
import sys
import os
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from sqlalchemy import text
from database.db_connect import engine, test_connection
from datetime import datetime, timedelta
import random

def create_tables():
    with engine.connect() as conn:
        # Create customers table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                city TEXT,
                country TEXT DEFAULT 'India',
                segment TEXT DEFAULT 'SMB',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

# Create products table
conn.execute(text("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                category TEXT,
                stock INTEGER DEFAULT 100,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

# Create sales table
conn.execute(text("""
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER,
                product_id INTEGER,
                amount REAL NOT NULL,
                quantity INTEGER DEFAULT 1,
                sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'completed',
                payment_method TEXT DEFAULT 'online'
            )
        """))
        conn.commit()
        print("✅ Tables created!")

def seed_database():
    print("🌱 Starting SQLite database seed...")

    if not test_connection():
        print("❌ Cannot connect!")
        return

    create_tables()

with engine.connect() as conn:
        # Clear existing data
        conn.execute(text("DELETE FROM sales"))
        conn.execute(text("DELETE FROM products"))
        conn.execute(text("DELETE FROM customers"))
        conn.commit()

# Insert Customers
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
                "name": name, "email": email,
                "phone": phone, "city": city,
                "segment": segment
            })
        conn.commit()
        print(f"✅ {len(customers)} customers inserted")

# Insert Products
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
                "name": name, "price": price,
                "category": category, "stock": stock
            })
        conn.commit()
        print(f"✅ {len(products)} products inserted")

# Insert 50 Sales
print("📊 Inserting 50 sales records...")
        base_date = datetime.now() - timedelta(days=180)

        for i in range(50):
            customer_id = random.randint(1, 15)
            product_id = random.randint(1, 10)
            quantity = random.randint(1, 5)

            price_result = conn.execute(text(
                "SELECT price FROM products WHERE id = :id"
            ), {"id": product_id}).fetchone()

            if price_result:
                base_price = float(price_result[0])
                discount = random.uniform(0.85, 1.0)
                amount = round(
                    base_price * quantity * discount, 2
                )
                days_ago = random.randint(0, 180)
                sale_date = base_date + timedelta(
                    days=days_ago
                )

                conn.execute(text("""
                    INSERT INTO sales
                        (customer_id, product_id,
                         amount, quantity, sale_date)
                    VALUES
                        (:cid, :pid, :amount,
                         :qty, :date)
                """), {
                    "cid": customer_id,
                    "pid": product_id,
                    "amount": amount,
                    "qty": quantity,
                    "date": sale_date
                })

        conn.commit()
        print("✅ 50 sales records inserted")

# Verify
print("\n🎉 DATABASE READY!")
    print("=" * 40)
    with engine.connect() as conn:
        c = conn.execute(
            text("SELECT COUNT(*) FROM customers")
        ).scalar()
        p = conn.execute(
            text("SELECT COUNT(*) FROM products")
        ).scalar()
        s = conn.execute(
            text("SELECT COUNT(*) FROM sales")
        ).scalar()
        rev = conn.execute(
            text("SELECT SUM(amount) FROM sales")
        ).scalar()
        print(f"✅ Customers : {c}")
        print(f"✅ Products  : {p}")
        print(f"✅ Sales     : {s}")
        print(f"✅ Revenue   : ${float(rev or 0):,.2f}")
        print("=" * 40)

if __name__ == "__main__":
    seed_database()